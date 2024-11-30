<?php

define('__ROOTDIR__', dirname(__FILE__));
header("Content-Type: application/json");

include __ROOTDIR__ . "/lib/settings.php";
include __ROOTDIR__ . "/lib/db.php";

$nextEntry = $db->querySingle("SELECT * FROM queue LIMIT 1", true);
$err = $db->lastErrorCode();
if($err) {
	die('{ "OK": false, "message": "SQLite error code ' . $err . '"}');
}
if($nextEntry === false) {
	die('{ "OK": false, "message": "Invalid SQLite query" }');
}

if(count($nextEntry)) {
	$out = array(
		'OK' => true,
		'message' => "Up next: [{$nextEntry['mapKey']}] {$nextEntry['mapArtist']} - {$nextEntry['mapTitle']} (mapped by {$nextEntry['mapAuthor']})",
		'userID' => $nextEntry['requesterID']
	);
	// if modadd target, add them here
} else {
	$out = array(
		'OK' => true,
		'message' => 'Nothing has been queued.'
	);
}

print(json_encode($out));

?>