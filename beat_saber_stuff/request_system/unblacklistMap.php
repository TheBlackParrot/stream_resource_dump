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

$out = array(
	'OK' => false,
	'message' => "Map {$data['key']} is not blacklisted."
);

if((int)$db->querySingle("SELECT COUNT(1) FROM blacklist WHERE mapKey='{$data['key']}'") < 1) {
	die(json_encode($out));
}

$query = "DELETE FROM blacklist WHERE mapKey='{$data['key']}'";
$statement = $db->exec($query);

$errCode = $db->lastErrorCode();
if($errCode) {
	$out['message'] = "SQLite error code {$errCode}";
} else {
	$out['OK'] = true;
	$out['message'] = "Map {$mapData['id']} has been removed from the blacklist.";
}

die(json_encode($out));

?>