<?php

$access_key = trim(file_get_contents("/etc/bsr_access_key"));

function checkAccessKey($data, $simple = false) {
	global $access_key;

	if(!$simple) {
		if(!array_key_exists("accessKey", $data)) {
			die('{ "OK": false, "message": "No access key" }');
		}
		if(trim($data['accessKey']) != $access_key) {
			die('{ "OK": false, "message": "Access key is incorrect" }');
		}
	} else {
		if(trim($data) == $access_key) {
			return true;
		}
		return false;
	}
}

$settings = array(
	'queue' => array(
		'maximumRequests' => array(
			// user tiers: No Sub, Tier 1 Sub, Tier 2 Sub, Tier 3 Sub
			'User' => [2, 3, 4, 5],

			'VIP' => INF,
			'Moderator' => INF
		),
		'maximumMapDurationSeconds' => 315,
		'minimumMapDurationSeconds' => 40,
		'minimumMapKeyNumber' => 0x9fff,
		'minimumMapAgeDays' => 7,
		'minimumRating' => 70,
		'verifiedMappersOnly' => false,
		'curatedMapsOnly' => false,
		'rankedScoreSaberMapsOnly' => false,
		'rankedBeatLeaderMapsOnly' => false
	),
	'open' => true,
	'rootURL' => 'http://127.0.0.1',
	'timezone' => 'America/Chicago'
);

function getQueueRequestLimit($requestData) {
	global $settings;

	$limits = $settings['queue']['maximumRequests'];
	$flags = $requestData['flags'];

	if($flags['isModerator']) {
		return $limits['Moderator'];
	}
	if($flags['isVIP']) {
		return $limits['VIP'];
	}

	return $limits['User'][$flags['userLevel']];
}

?>