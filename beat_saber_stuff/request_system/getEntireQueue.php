<?php

define('__ROOTDIR__', dirname(__FILE__));
header("Content-Type: application/json");

include __ROOTDIR__ . "/lib/settings.php";
include __ROOTDIR__ . "/lib/db.php";

$allEntries = $db->query("SELECT * FROM queue");
$err = $db->lastErrorCode();
if($err) {
	die('{ "error": "SQLite error code ' . $err . '"}');
}
if($allEntries === false) {
	die('{}');
}

$out = array(
	'playlistTitle' => 'Current Request Queue',
	'playlistAuthor' => '',
	'customData' => array(
		'syncURL' => $settings['rootURL'] . $_SERVER['REQUEST_URI']
	),
	'songs' => array(),
	'image' => ''
);

while($entry = $allEntries->fetchArray()) {
	$out['songs'][] = array(
		'key' => $entry['mapKey'],
		'hash' => $entry['mapHash'],
		'songName' => $entry['mapTitle']
	);
}

print(json_encode($out));

?>