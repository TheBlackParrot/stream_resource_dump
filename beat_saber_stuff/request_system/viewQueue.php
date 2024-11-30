<?php

define('__ROOTDIR__', dirname(__FILE__));
header("Content-Type: application/json; charset=UTF-8");

include __ROOTDIR__ . "/lib/settings.php";
include __ROOTDIR__ . "/lib/db.php";

// i wanted to do a more elegant programmatic solution here but holy hell i could not figure it out. easy way it is
$unicodeNumbers = array("0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣");

function convertNumberToUnicode($number) {
	global $unicodeNumbers;

	$number = strval($number);
	$out = array();

	for($i = 0; $i < strlen($number); $i++) { 
		$digit = (int)$number[$i];
		$out[] = $unicodeNumbers[$digit];
	}

	return implode("", $out);
}

$entryQueryObject = $db->query("SELECT * FROM queue");
$err = $db->lastErrorCode();
if($err) {
	die('{ "error": "SQLite error code ' . $err . '"}');
}
if($entryQueryObject === false) {
	die('{}');
}

$user = false;
if(isset($_GET['user'])) {
	if(is_numeric($_GET['user'])) {
		$user = (int)$_GET['user'];
	}
}

$entries = array();
$selfEntries = array();
$secondsToNext = 0;
while($entry = $entryQueryObject->fetchArray()) {
	$minutesToNext = ceil(($secondsToNext) / 60);

	if($user) {
		$entry['requesterMatches'] = ($user == $entry['requesterID'] || $user == (array_key_exists("modaddTarget", $entry) ? $entry['modaddTarget'] : -1));

		if($entry['requesterMatches']) {
			$nextTimeMessage = "up next";
			if(count($entries) != 0) {
				$nextTimeMessage = "in ~{$minutesToNext} min";
			}

			$entry['requestUserPosition'] = convertNumberToUnicode(count($entries) + 1) . " ({$entry['mapKey']}, {$nextTimeMessage})";

			$selfEntries[] = $entry;
		}
	}

	$secondsToNext += (int)$entry['mapDuration'] + 60;

	$entries[] = $entry;
}
$entryCount = count($entries);

$out = array(
	'OK' => true,
	'message' => ($entryCount ? "There are currently {$entryCount} map" . ($entryCount == 1 ? "" : "s") . " in the queue." : "No maps have been queued.")
);

$selfEntryCount = count($selfEntries);
if($selfEntryCount) {
	$positions = array_column($selfEntries, "requestUserPosition");
	$out['message'] .= " You are in position" . ($selfEntryCount == 1 ? ": " : "s: ") . implode(", ", $positions);
}

print(json_encode($out));

?>