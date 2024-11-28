<?php

$settings = array(
	'queue' => array(
		'maximumRequests' => array(
			// user tiers: No Sub, Prime Sub, Tier 1 Sub, Tier 2 Sub, Tier 3 Sub
			'User' => [2, 3, 3, 4, 5],
			
			'VIP' => INF,
			'Moderator' => INF
		),
		'maximumMapDurationSeconds' => 315,
		'minimumMapDurationSeconds' => 40,
		'minimumMapKeyNumber' => 0x9fff,
		'minimumRating' => 70,
		'verifiedMappersOnly' => false,
		'curatedMapsOnly' => false,
		'rankedScoreSaberMapsOnly' => false,
		'rankedBeatLeaderMapsOnly' => false
	),
	'open' => true
);

function getQueueRequestLimit($requestData) {
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