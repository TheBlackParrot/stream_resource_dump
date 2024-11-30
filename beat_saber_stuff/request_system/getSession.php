<?php

define('__ROOTDIR__', dirname(__FILE__));
header("Content-Type: application/json");

if(!isset($_GET['session'])) {
	die('{ "error": "No session value in GET parameters" }');
}
if(!is_numeric($_GET['session']) && $_GET['session'] != "latest") {
	die('{ "error": "Session value is not a number" }');
} else {
	if($_GET['session'] == "latest") {
		// i want these above checks to trigger first before loading other files
		$session = -1;
	} else {
		$session = (int)$_GET['session'];
	}
}

include __ROOTDIR__ . "/lib/settings.php";
include __ROOTDIR__ . "/lib/db.php";

if($session == -1) {
	$session = (int)$db->querySingle("SELECT * FROM sessions ORDER BY unixTimestamp DESC LIMIT 1");
} else {
	if(!(int)$db->querySingle("SELECT COUNT(1) FROM sessions WHERE unixTimestamp={$session}")) {
		die('{ "error": "Session ' . $session . ' does not exist" }');
	}
}

$allEntries = $db->query("SELECT * FROM session_{$session} ORDER BY timePlayed DESC");
$err = $db->lastErrorCode();
if($err) {
	die('{ "error": "SQLite error code ' . $err . '"}');
}
if($allEntries === false) {
	die('{}');
}

date_default_timezone_set($settings['timezone']);
$formattedTime = date('D, j M Y, G:i T', $session);

$out = array(
	'playlistTitle' => "Session for {$formattedTime}",
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
		'songName' => $entry['mapTitle'],
		'timePlayed' => $entry['timePlayed']
	);
}

print(json_encode($out));

?>