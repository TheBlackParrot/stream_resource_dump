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

if(!array_key_exists("key", $data)) {
	die('{ "OK": false, "message": "No map key in JSON data" }');
}
if(!ctype_xdigit($data['key'])) {
	die('{ "OK": false, "message": "Map key is not hexadecimal" }');	
}

include __ROOTDIR__ . "/lib/db.php";
include __ROOTDIR__ . "/lib/beatsaver.php";

function prepareQueryStatement($mapData) {
	global $db;

	$diffData = $mapData['versions'][0];
	$metadata = $mapData['metadata'];

	$outData = array(
		'mapKey' => $mapData['id'],
		'mapTitle' => $metadata['songName'] . (empty($metadata['songSubName']) ? "" : " - " . $metadata['songSubName']),
		'mapArtist' => $metadata['songAuthorName'],
		'mapAuthor' => $metadata['levelAuthorName'],
		'timeAdded' => time(),
	);

	$vals = array_values($outData);
	for ($i = 0; $i < count($vals); $i++) { 
		if(is_numeric($vals[$i])) {
			continue;
		}
		$vals[$i] = "'" . $db->escapeString($vals[$i]) . "'";
	}

	return "(" . implode(", ", array_keys($outData)) . ") VALUES (" . implode(", ", $vals) . ")";
}

$mapData = getBeatSaverData($data['key']);
$out = array(
	'OK' => false,
	'message' => "Map {$data['key']} does not exist."
);

if(!$mapData) {
	die(json_encode($out));
}

$metadata = $mapData['metadata'];
$queryParams = prepareQueryStatement($mapData);
$query = "INSERT INTO blacklist {$queryParams}";
$statement = $db->exec($query);

$errCode = $db->lastErrorCode();
if($errCode) {
	$out['message'] = "SQLite error code {$errCode}";
} else {
	$out['OK'] = true;
	$out['message'] = "Map {$mapData['id']} is now blacklisted.";
}

die(json_encode($out));

?>