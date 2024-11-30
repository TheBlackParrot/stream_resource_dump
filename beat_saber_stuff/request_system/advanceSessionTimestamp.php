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

include __ROOTDIR__ . "/lib/db.php";

$timestamp = time();
$out = array(
	'OK' => false,
	'message' => 'Script error'
);

$db->exec(sprintf(file_get_contents(__ROOTDIR__ . "/lib/session.sql"), $timestamp));
$errCode = $db->lastErrorCode();
if($errCode) {
	$out['message'] = "SQLite error code {$errCode}";
} else {
	$out['OK'] = true;
	$out['message'] = "Successfully started session {$timestamp}";
};

die(json_encode($out));

?>