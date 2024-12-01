<?php

define('__ROOTDIR__', dirname(__FILE__));
header("Content-Type: application/json");

$raw = file_get_contents('php://input');
if(!json_validate($raw)) {
	die('{ "OK": false, "message": "Invalid JSON data." }');
}

$data = json_decode($raw, true);
include __ROOTDIR__ . "/lib/settings.php";

checkAccessKey($data);

if(!array_key_exists("hash", $data)) {
	die('{ "OK": false, "message": "No map hash in JSON data" }');
}
if(!ctype_xdigit($data['hash'])) {
	die('{ "OK": false, "message": "Map hash is not hexadecimal" }');	
}

include __ROOTDIR__ . "/lib/db.php";
include __ROOTDIR__ . "/lib/beatsaver.php";

$session = (int)$db->querySingle("SELECT unixTimestamp FROM sessions ORDER BY unixTimestamp DESC LIMIT 1");

function prepareQueryStatement($requestData, $mapData) {
	global $db;

	$diffData = $mapData['versions'][0];
	$metadata = $mapData['metadata'];

	$outData = array(
		'mapKey' => $mapData['id'],
		'mapHash' => $diffData['hash'],
		'mapTitle' => $metadata['songName'] . (empty($metadata['songSubName']) ? "" : " - " . $metadata['songSubName']),
		'mapArtist' => $metadata['songAuthorName'],
		'mapAuthor' => $metadata['levelAuthorName'],
		'accuracy' => 0,
		'timePlayed' => time()
	);

	$vals = array_values($outData);
	$keys = array_keys($outData);
	$isStrings = array('accuracy', 'mapKey');

	for ($i = 0; $i < count($vals); $i++) { 
		if(!in_array($keys[$i], $isStrings)) {
			if(is_numeric($vals[$i])) {
				continue;
			}
		} else {
			$vals[$i] = "'" . $vals[$i] . "'";
			continue;
		}

		$vals[$i] = "'" . $db->escapeString($vals[$i]) . "'";
	}

	return array("(" . implode(", ", array_keys($outData)) . ") VALUES (" . implode(", ", $vals) . ")", $outData['timePlayed']);
}

$mapData = getBeatSaverData($data['hash'], true);
if($mapData) {
	$queryParams = prepareQueryStatement($data, $mapData);
	$query = "INSERT INTO session_{$session} {$queryParams[0]}";
	$statement = $db->exec($query);
} else {
	die('{ "OK": false, "message": "Could not find hash ' . $data['hash'] . ' on BeatSaver." }');	
}

$out = array(
	'OK' => true,
	'message' => "Added map {$mapData['id']} to session {$session}",
	'timePlayedValue' => $queryParams[1]
);
$errCode = $db->lastErrorCode();
if($errCode) {
	$out['OK'] = false;
	$out['message'] = "SQLite error code {$errCode}";
}
die(json_encode($out));

?>