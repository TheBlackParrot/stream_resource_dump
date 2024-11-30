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

$out = array(
	"OK" => false,
	"message" => ""
);

$query = "DELETE FROM queue";
$statement = $db->exec($query);

$errCode = $db->lastErrorCode();
if($errCode) {
	$out['message'] = "SQLite error code {$errCode}";
} else {
	$out['OK'] = true;
	$out['message'] = "Queue has been cleared.";
}

die(json_encode($out));

?>