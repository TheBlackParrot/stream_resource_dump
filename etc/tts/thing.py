#! venv/bin/python
import re
import os
import torch
import torchaudio
from IPython.display import Audio
from num2words import num2words
import json
import math
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse
import hashlib
from time import time

settings = None
with open("settings.json", "r") as settingsFile:
    settings = json.load(settingsFile)

device = torch.device('cpu')
torch.set_num_threads(settings["tts"]["cpu_threads"])

if not os.path.isfile(settings["tts"]["model_saveAs"]):
    torch.hub.download_url_to_file(settings["tts"]["model"], settings["tts"]["model_saveAs"])

model = torch.package.PackageImporter(settings["tts"]["model_saveAs"]).load_pickle("tts_models", "model")
model.to(device)

cache = {}

def cleanCache():
    ts = time()
    hashes = [*cache]

    for i in hashes:
        _hash = hashes[i]
        if cache[_hash].timestamp > ts + 300:
            cache.pop(_hash, None)

class MyServer(BaseHTTPRequestHandler):
    def writeAudio(self, audio):
        self.send_response(200)
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", len(audio))
        self.end_headers()
        self.wfile.write(audio)

    def do_GET(self):
        main_url = "http://" + settings["http"]["ip"] + ":" + str(settings["http"]["port"]) + self.path
        url_parts = urllib.parse.urlparse(main_url)
        query_parts = urllib.parse.parse_qs(url_parts.query)

        path_parts = self.path[1:].split("/")[:-1]

        _type = path_parts[0].lower()
        _name = path_parts[1].lower()
        _data = " ".join([urllib.parse.unquote(str(item)) for item in path_parts[2:]]).lower()

        currentTTSData = {
            "say": _data,
            "voice": settings["tts"]["name_voice"] if _type == "name" else settings["tts"]["message_voices"][int.from_bytes(bytes(_name.encode("utf-8")), byteorder='big') % len(settings["tts"]["message_voices"])],
            "pitch": None
        }

        md5hash = hashlib.md5(_data.encode("utf-8")).hexdigest()
        if md5hash in cache:
            print("sending cached data out")
            self.writeAudio(cache[md5hash]["audio"])
            cache.pop(md5hash, None)
            cleanCache()
            return

        dictReplace = None
        with open("dict.json", "r") as dictFile:
            dictReplace = json.load(dictFile)
        ttsStuff = None
        with open("tts_data.json", "r") as ttsStuffFile:
            ttsStuff = json.load(ttsStuffFile)
        faceReplace = None
        with open("faces.json", "r") as facesFile:
            faceReplace = json.load(facesFile)
        symReplace = None
        with open("symbols.json", "r") as symFile:
            symReplace = json.load(symFile)

        if _type == "name":
            if _data in ttsStuff:
                currentTTSData["say"] = ttsStuff[_data]["pronunciation"]
            else:
                number_amount = 0
                name_fixed = ""
                name_parts = []
                for character in _data:
                    try:
                        int(character)
                    except ValueError:
                        name_fixed = name_fixed + character
                    else:
                        if len(name_fixed) > 0:
                            name_parts.append(name_fixed)
                        if number_amount < 4:
                            name_parts.append(num2words(int(character)))
                            number_amount += 1
                        name_fixed = ""
                name_parts.append(name_fixed)

                currentTTSData["say"] = " ".join([str(item) for item in name_parts])
        if _type == "msg":
            for face in faceReplace:
                _data = _data.replace(face, faceReplace[face])

            for sym in symReplace:
                _data = _data.replace(sym, symReplace[sym])

            print(_data)

            all_words = _data.split(' ')
            all_wordsA = []
            all_wordsB = []

            for word in all_words:
                clean = word.replace(",", "").replace("!", "").replace("?", "").replace("...", "").replace("..", "")
                try:
                    float(clean)
                except ValueError:
                    all_wordsA.append(word)
                else:
                    parts = clean.split(".")
                    whole = int(parts[0])
                    print("word is number: %f" % whole)
                    if whole < 0:
                        all_wordsA.append("negative")
                        whole = whole * -1

                    all_wordsA.append(num2words(whole))

                    if len(parts) == 2:
                        if parts[1] != "0":
                            try:
                                fractional = int(str(parts[1]).strip("0"))
                            except ValueError:
                                print("word is not a fractional more than likely")
                            else:
                                all_wordsA.append("point")
                                print(fractional)

                                all_wordsA.append(num2words(fractional))

                    for sym in settings["smallPauseSymbols"]:
                        if word[len(word)-1] == sym:
                            all_wordsA[len(all_wordsA)-1] = all_wordsA[len(all_wordsA)-1] + sym
                    for sym in settings["pauseSymbols"]:
                        if word[len(word)-1] == sym:
                            all_wordsA[len(all_wordsA)-1] = all_wordsA[len(all_wordsA)-1] + sym

            for word in all_wordsA:
                for dash_part in word.split('-'):
                    for sym in symReplace:
                        dash_part = dash_part.replace(sym, "")
                    unmod = dash_part[0:]
                    for sym in settings["silenceSymbols"]:
                        dash_part = dash_part.replace(sym, "")

                    if dash_part in dictReplace:
                        all_wordsB.append(dictReplace[dash_part])
                    else:
                        all_wordsB.append(dash_part)

                    for sym in settings["smallPauseSymbols"]:
                        if sym in unmod:
                            all_wordsB.append('<break strength="medium"/>')
                    for sym in settings["pauseSymbols"]:
                        if sym in unmod:
                            all_wordsB.append('<break strength="strong"/>')

            currentTTSData['say'] = " ".join([str(item) for item in all_wordsB])

            if _name in ttsStuff:
                if "voice" in ttsStuff[_name]:
                    currentTTSData["voice"] = ttsStuff[_name]["voice"]
                if "pitch" in ttsStuff[_name]:
                    currentTTSData["pitch"] = ttsStuff[_name]["pitch"]

        speaker='en_' + str(currentTTSData['voice'])
        print(currentTTSData["say"])
        if currentTTSData['say'] == "":
            print("... nothing to say? wtf")
            return

        pitch = "medium"
        if currentTTSData['pitch'] != None:
            pitch = currentTTSData['pitch']

        audio = model.apply_tts(ssml_text='<speak><prosody pitch="' + pitch + '">' + currentTTSData['say'] + '</prosody></speak>', speaker=speaker, sample_rate=settings["tts"]["sample_rate"])

        audio_out = bytes(Audio(audio, rate=settings["tts"]["sample_rate"]).data)
        cleanCache()
        cache[md5hash] = {
            "audio": audio_out,
            "timestamp": time()
        }
        self.writeAudio(audio_out)

if __name__ == "__main__":        
    webServer = HTTPServer((settings["http"]["ip"], settings["http"]["port"]), MyServer)
    print("Server started http://%s:%s" % (settings["http"]["ip"], settings["http"]["port"]))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")