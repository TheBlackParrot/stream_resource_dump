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

if(!array_key_exists("accuracy", $data)) {
	die('{ "OK": false, "message": "No accuracy in JSON data" }');
}
if(!is_numeric($data['accuracy'])) {
	die('{ "OK": false, "message": "Accuracy value is not a number" }');	
}

if(!array_key_exists("hash", $data)) {
	die('{ "OK": false, "message": "No map hash in JSON data" }');
}
if(!ctype_xdigit($data['hash'])) {
	die('{ "OK": false, "message": "Map hash is not hexadecimal" }');	
}
$data['hash'] = strtolower($data['hash']);

include __ROOTDIR__ . "/lib/db.php";

$session = (int)$db->querySingle("SELECT unixTimestamp FROM sessions ORDER BY unixTimestamp DESC LIMIT 1");
$guh = "SELECT timePlayed FROM session_{$session} WHERE mapHash='{$data['hash']}' ORDER BY timePlayed DESC LIMIT 1";
$which = $db->querySingle($guh);

if(!is_null($which)) {
	$query = "UPDATE session_{$session} SET accuracy={$data['accuracy']} WHERE mapHash='{$data['hash']}' AND timePlayed={$which}";
	$statement = $db->exec($query);
}

$out = array(
	'OK' => true,
	'message' => "Updated map's accuracy to {$data['accuracy']}% ({$session}, {$which})",
	'query' => $query,
	'guh' => $guh
);
$errCode = $db->lastErrorCode();
if($errCode) {
	$out['OK'] = false;
	$out['message'] = "SQLite error code {$errCode}";
}
die(json_encode($out));

?>