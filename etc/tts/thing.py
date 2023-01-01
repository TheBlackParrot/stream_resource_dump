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

ttsStuff = None
with open("tts_data.json", "r") as ttsStuffFile:
    ttsStuff = json.load(ttsStuffFile)
dictReplace = None
with open("dict.json", "r") as dictFile:
    dictReplace = json.load(dictFile)

hostName = "127.0.0.1"
serverPort = 8080

device = torch.device('cpu')
torch.set_num_threads(12)
local_file = 'model.pt'

if not os.path.isfile(local_file):
    torch.hub.download_url_to_file('https://models.silero.ai/models/tts/en/v3_en.pt',
                                   local_file)  

model = torch.package.PackageImporter(local_file).load_pickle("tts_models", "model")
model.to(device)

sample_rate = 48000

messageVoice = 111
nameVoice = 20

class MyServer(BaseHTTPRequestHandler):
    def do_GET(self):
        main_url = "http://" + hostName + ":" + str(serverPort) + self.path
        url_parts = urllib.parse.urlparse(main_url)
        query_parts = urllib.parse.parse_qs(url_parts.query)

        path_parts = self.path[1:].split("/")[:-1]

        #_type = query_parts['type'][0].lower()
        #_data = query_parts['data'][0].lower()
        _type = path_parts[0].lower()
        _name = path_parts[1].lower()
        _data = " ".join([urllib.parse.unquote(str(item)) for item in path_parts[2:]]).lower()

        currentTTSData = {
            "say": _data,
            "voice": nameVoice if _type == "name" else messageVoice,
            "pitch": None
        }

        if _type == "name":
            if _data in ttsStuff:
                currentTTSData["say"] = ttsStuff[_data]["pronunciation"]
            else:
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
                        name_parts.append(num2words(int(character)))
                        name_fixed = ""
                name_parts.append(name_fixed)

                currentTTSData["say"] = " ".join([str(item) for item in name_parts])
        if _type == "msg":
            #_name = query_parts['name'][0].lower()

            _data = _data.replace(":", " ")
            _data = _data.replace("*", " star ")
            _data = _data.replace("/", " slash ")
            _data = _data.replace("\\", " back slash ")
            _data = _data.replace("@", " at ")
            _data = _data.replace("#", " hashtag ")
            _data = _data.replace("%", " percent ")
            _data = _data.replace("^", " carrot ")
            _data = _data.replace("&", " and ")
            _data = _data.replace("+", " plus ")
            _data = _data.replace("=", " equals ")
            _data = _data.replace("\"", " quote ")
            _data = _data.replace("$", " dollar ")
            _data = _data.replace("£", " pound ")
            _data = _data.replace("€", " euro ")
            _data = _data.replace("¥", " yen ")
            _data = _data.replace("<3", " heart ")
            _data = _data.replace("<", " less than ")
            _data = _data.replace(">", " greater than ")
            _data = _data.replace("[", " left bracket ")
            _data = _data.replace("]", " right bracket ")
            _data = _data.replace("{", " left brace ")
            _data = _data.replace("}", " right brace ")

            all_words = _data.split(' ')
            all_wordsA = []
            all_wordsB = []

            for word in all_words:
                try:
                    float(word.replace(",", ""))
                except ValueError:
                    all_wordsA.append(word)
                else:
                    parts = word.replace(",", "").split(".")
                    whole = int(parts[0])
                    print("word is number: %f" % whole)
                    if whole < 0:
                        all_wordsA.append("negative")
                        whole = whole * -1

                    all_wordsA.append(num2words(whole))

                    if len(parts) == 2:
                        fractional = int(str(parts[1]).strip("0"))
                        all_wordsA.append("point")
                        print(fractional)

                        all_wordsA.append(num2words(fractional))

            for word in all_wordsA:
                for dash_part in word.split('-'):
                    if dash_part in dictReplace:
                        all_wordsB.append(dictReplace[dash_part])
                    else:
                        all_wordsB.append(dash_part)

            currentTTSData['say'] = " ".join([str(item) for item in all_wordsB])

            if _name in ttsStuff:
                if "voice" in ttsStuff[_name]:
                    currentTTSData["voice"] = ttsStuff[_name]["voice"]
                if "pitch" in ttsStuff[_name]:
                    currentTTSData["pitch"] = ttsStuff[_name]["pitch"]

        speaker='en_' + str(currentTTSData['voice'])
        print(currentTTSData["say"])
        if currentTTSData['pitch'] == None:
            audio = model.apply_tts(text=currentTTSData['say'], speaker=speaker, sample_rate=sample_rate)
        else:
            audio = model.apply_tts(ssml_text='<speak><prosody pitch="' + currentTTSData['pitch'] + '">' + currentTTSData['say'] + '</prosody></speak>', speaker=speaker, sample_rate=sample_rate)

        audio_out = bytes(Audio(audio, rate=sample_rate).data)
        self.send_response(200)
        self.send_header("Content-Type", "audio/wav")
        self.send_header("Content-Length", len(audio_out))
        self.end_headers()
        self.wfile.write(audio_out)

if __name__ == "__main__":        
    webServer = HTTPServer((hostName, serverPort), MyServer)
    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")