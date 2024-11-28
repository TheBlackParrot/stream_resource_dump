<?php

$raw = file_get_contents('php://input');
if(!json_validate($raw, 4)) {
	die('{ "OK": false, "reason": "Invalid JSON data." }');
}

$data = json_decode($raw, true);
print_r($data);

if(!array_key_exists("user", $data)) {
	die('{ "OK": false, "reason": "No user ID in JSON data" }');
}
if(!is_numeric($data['user'])) {
	die('{ "OK": false, "reason": "User ID is not a number" }');
}

if(!array_key_exists("key", $data)) {
	die('{ "OK": false, "reason": "No map key in JSON data" }');
}
if(!ctype_xdigit($data['key'])) {
	die('{ "OK": false, "reason": "Map key is not hexadecimal" }');	
}

if(!array_key_exists("flags", $data)) {
	die('{ "OK": false, "reason": "No flags object in JSON data" }');
}
if(!array_key_exists("userLevel", $data['flags'])) {
	die('{ "OK": false, "reason": "User rank/level not given" }');	
}
if(!is_numeric($data['flags']['userLevel'])) {
	die("{ \"OK\": false, \"reason\": \"User rank/level is not a number ({$data['flags']['userLevel']})\" }");	
}
$data['flags']['userLevel'] = max(0, min(4, $data['flags']['userLevel']));

include dirname(dirname(__FILE__)) . "/public/lib/db.php";
include dirname(__FILE__) . "/getBeatSaverData.php";

$mapData = getBeatSaverData($data['key']);
if(checkIfRequestAllowed($data, $mapData)) {
	die('{ "OK": true }');
}

?>