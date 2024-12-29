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

if(!array_key_exists("user", $data)) {
	die('{ "OK": false, "message": "No user ID in JSON data" }');
}
if(!is_numeric($data['user'])) {
	die('{ "OK": false, "message": "User ID is not a number" }');
}

if(!array_key_exists("key", $data)) {
	die('{ "OK": false, "message": "No map key in JSON data" }');
}
if(!ctype_xdigit($data['key'])) {
	die('{ "OK": false, "message": "Map key is not hexadecimal" }');	
}

if(!array_key_exists("flags", $data)) {
	die('{ "OK": false, "message": "No flags object in JSON data" }');
}

if(!array_key_exists("userLevel", $data['flags'])) {
	die('{ "OK": false, "message": "User rank/level not given" }');	
}
if(!is_numeric($data['flags']['userLevel'])) {
	die("{ \"OK\": false, \"message\": \"User rank/level is not a number ({$data['flags']['userLevel']})\" }");	
}
$data['flags']['userLevel'] = max(0, min(4, $data['flags']['userLevel']));

include __ROOTDIR__ . "/lib/db.php";
include __ROOTDIR__ . "/lib/beatsaver.php";

function prepareQueryStatement($requestData, $mapData) {
	global $db;

	$diffData = $mapData['versions'][0];
	$metadata = $mapData['metadata'];

	$outData = array(
		'mapKey' => "" . $mapData['id'] . "",
		'mapHash' => $diffData['hash'],
		'mapTitle' => $metadata['songName'] . (empty($metadata['songSubName']) ? "" : " - " . $metadata['songSubName']),
		'mapArtist' => $metadata['songAuthorName'],
		'mapAuthor' => $metadata['levelAuthorName'],
		'mapDuration' => $metadata['duration'],
		'requesterID' => $requestData['user'],
		'flagIsModAdd' => $requestData['flags']['modadd'],
		'timeAdded' => time(),
	);

	if(array_key_exists('modaddTarget', $requestData['flags'])) {
		$outData['flagModAddTargetID'] = $requestData['flags']['modaddTarget'];
	}

	$vals = array_values($outData);
	for ($i = 0; $i < count($vals); $i++) { 
		if(is_numeric($vals[$i]) && $i != 0) {
			continue;
		}
		$vals[$i] = "'" . $db->escapeString($vals[$i]) . "'";
	}

	return "(" . implode(", ", array_keys($outData)) . ") VALUES (" . implode(", ", $vals) . ")";
}

$mapData = getBeatSaverData($data['key']);
$result = checkIfRequestAllowed($data, $mapData);
if($result[0]) {
	$queryParams = prepareQueryStatement($data, $mapData);
	$query = "INSERT INTO queue {$queryParams}";
	$statement = $db->exec($query);
}

$out = array(
	'OK' => $result[0],
	'message' => $result[1]
);
$errCode = $db->lastErrorCode();
if($errCode) {
	$out['OK'] = false;
	$out['message'] = "SQLite error code {$errCode}";
}
die(json_encode($out));

?>