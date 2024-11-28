<?php

include dirname(dirname(__FILE__)) . '/public/lib/settings.php';
include dirname(dirname(__FILE__)) . "/public/lib/db.php";

function getBeatSaverData($key) {
	if(empty($key)) {
		return null;
	}

	$raw = file_get_contents("https://api.beatsaver.com/maps/id/{$key}");

	if(!json_validate($raw, 8)) {
		die('{ "OK": false, "reason": "Bad BeatSaver response." }');
	}

	return json_decode($raw, true);
}

function checkIfRequestAllowed($requestData, $mapData) {
	if(!$settings['open']) {
		return array(false, "The queue is closed.");
	}

	$limits = $settings['queue'];
	$metadata = $mapData['metadata'];
	$stats = $mapData['stats'];

	if(hexdec($requestData['key']) < $limits['minimumMapKeyNumber']) { return array(false, "This map is too old, it must have a key higher than {$limits['minimumMapKeyNumber']}."); }

	if($metadata['duration'] > $limits['maximumMapDurationSeconds']) { return array(false, "This map is too long."); }
	if($metadata['duration'] < $limits['minimumMapDurationSeconds']) { return array(false, "This map is too short."); }

	if($stats['score'] < $limits['minimumRating']) { return array(false, "This map is rated too poorly by the community, it must have higher than a {$limits['minimumRating']}% rating."); }

	if((int)$db->querySingle("SELECT COUNT(1) FROM queue WHERE mapKey={$mapData['key']}") >= 1) {
		return array(false, "This map is already in the queue.");
	}

	$limit = getQueueRequestLimit($requestData);
	if((int)$db->querySingle("SELECT COUNT(1) FROM queue WHERE requesterID={$requestData['user']}") >= $limit) {
		return array(false, "You can only have {$limit} map" . ($limit == 1 ? "" : "s") . " queued at a time.");
	}

	// TODO: add other filter checks
	return true;
}

?>