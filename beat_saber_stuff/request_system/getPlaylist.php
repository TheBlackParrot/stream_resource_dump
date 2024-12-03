<?php

define('__ROOTDIR__', dirname(__FILE__));
header("Content-Type: application/json");

include __ROOTDIR__ . "/lib/settings.php";
include __ROOTDIR__ . "/lib/db.php";

if(!isset($_GET['key'])) {
	http_response_code(403);
	die('{ "error" : "No access key provided in GET parameters" }');
}
if(!checkAccessKey($_GET['key'], true)) {
	http_response_code(403);
	die('{ "error" : "Invalid access key" }');
}

$nextEntry = $db->querySingle("SELECT * FROM queue LIMIT 1", true);
$err = $db->lastErrorCode();
if($err) {
	die('{ "error": "SQLite error code ' . $err . '"}');
}
if($nextEntry === false) {
	die('{}');
}

$out = array(
	'playlistTitle' => 'Next Request',
	'playlistAuthor' => '',
	'customData' => array(
		'syncURL' => $settings['rootURL'] . $_SERVER['REQUEST_URI'],
		'ReadOnly' => true
	),
	'songs' => array(),
	'image' => ''
);

if(count($nextEntry)) {
	$db->exec("DELETE FROM queue WHERE timeAdded={$nextEntry['timeAdded']}");
	
	$out['songs'][] = array(
		'key' => $nextEntry['mapKey'],
		'hash' => $nextEntry['mapHash'],
		'songName' => $nextEntry['mapTitle']
	);
}

print(json_encode($out));

?>