<?php
if(!defined('__ROOTDIR__')) {
	http_response_code(403);
	die();
}

function getBeatSaverData($key, $keyIsHash = false) {
	if(empty($key)) {
		return null;
	}

	$raw = file_get_contents("https://api.beatsaver.com/maps/" . ($keyIsHash ? "hash" : "id") . "/{$key}");

	if(!json_validate($raw)) {
		die('{ "OK": false, "message": "Bad BeatSaver response, this map probably doesn\'t exist." }');
	}

	return json_decode($raw, true);
}

function formatTime($seconds) {
	$minutes = floor($seconds / 60);
	$seconds = str_pad($seconds % 60, 2, "0", STR_PAD_LEFT);

	return "{$minutes}:{$seconds}";
}

function checkIfRequestAllowed($requestData, $mapData) {
	global $settings;
	global $db;

	if($requestData['flags']['modadd']) {
		if((int)$db->querySingle("SELECT COUNT(1) FROM queue WHERE mapKey='{$mapData['id']}'") >= 1) {
			return array(false, "This map is already in the queue.");
		}
		return array(true, "Map {$mapData['id']} added to the queue.");
	}

	if(!$settings['open']) {
		return array(false, "The queue is currently closed.");
	}

	if((int)$db->querySingle("SELECT COUNT(1) FROM blacklist WHERE mapKey='{$mapData['id']}'") >= 1) {
		return array(false, "This map is blacklisted, it cannot be requested.");
	}

	$limits = $settings['queue'];
	
	$metadata = $mapData['metadata'];
	
	$stats = $mapData['stats'];
	$stats['score'] *= 100;

	$uploader = $mapData['uploader'];

	if($limits['minimumMapKeyNumber'] && hexdec($requestData['key']) < $limits['minimumMapKeyNumber']) {
		$readableKey = dechex($limits['minimumMapKeyNumber']);
		return array(false, "This map is too old, it must have a key higher than {$readableKey}.");
	}

	if($limits['verifiedMappersOnly'] && !$uploader['verifiedMapper']) {
		return array(false, "The mapper for this map is not a verified mapper.");
	}

	if($limits['curatedMapsOnly'] && !array_key_exists("curator", $mapData)) {
		return array(false, "This map has not been curated by the BeastSaber curation team.");
	}

	if($limits['rankedScoreSaberMapsOnly'] && !($mapData['ranked'] || $mapData['qualified'])) {
		return array(false, "This map has not been ranked on ScoreSaber. (NOTE: BeatSaver data is being used to determine this)");
	}

	if($limits['rankedBeatLeaderMapsOnly'] && !($mapData['blRanked'] || $mapData['blQualified'])) {
		return array(false, "This map has not been ranked on BeatLeader. (NOTE: BeatSaver data is being used to determine this)");
	}

	$timeFormatted = formatTime($metadata['duration']);
	if($limits['maximumMapDurationSeconds'] && $metadata['duration'] > $limits['maximumMapDurationSeconds']) {
		$limitFormatted = formatTime($limits['maximumMapDurationSeconds']);
		return array(false, "This map is too long. (map is {$timeFormatted} in length, limit is {$limitFormatted})");
	}
	if($limits['minimumMapDurationSeconds'] && $metadata['duration'] < $limits['minimumMapDurationSeconds']) {
		$limitFormatted = formatTime($limits['minimumMapDurationSeconds']);
		return array(false, "This map is too short. (map is {$timeFormatted} in length, limit is {$limitFormatted})");
	}

	if($limits['minimumRating'] && $stats['score'] < $limits['minimumRating']) {
		return array(false, "This map is rated too low ({$stats['score']}%), it must have higher than a {$limits['minimumRating']}% rating.");
	}

	if((int)$db->querySingle("SELECT COUNT(1) FROM queue WHERE mapKey='{$mapData['id']}'") >= 1) {
		return array(false, "This map is already in the queue.");
	}

	$limit = getQueueRequestLimit($requestData);
	if($limit) {
		if((int)$db->querySingle("SELECT COUNT(1) FROM queue WHERE requesterID={$requestData['user']}") >= $limit) {
			return array(false, "You can only have {$limit} map" . ($limit == 1 ? "" : "s") . " queued at a time.");
		}
	}

	return array(true, "Map {$mapData['id']} added to the queue.");
}

?>