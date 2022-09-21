<?php
header('Content-type: application/json');

$output = [
	"status" => "OK"
];

// https://scoresaber.com/api/leaderboard/by-hash/${beatmap.songHash}/scores?difficulty=${diffEnums[beatmap.difficultyEnum]}&search=${whom}&gameMode=${mode}
function getLeaderboard() {
	GLOBAL $output;

	$name = null;
	if(isset($_GET['name'])) {
		$name = preg_replace("/[^A-Za-z0-9 ]/", '', $_GET['name']);
	}

	if(!isset($_GET['hash'])) {
		$output["status"] = "error";
		$output["message"] = "No map hash given";
		return;
	} else {
		$hash = preg_replace("/[^A-F0-9]/", '', strtoupper($_GET['hash']));
	}

	if(!isset($_GET['diff'])) {
		$output["status"] = "error";
		$output["message"] = "No map difficulty given";
		return;		
	} else {
		$diff = preg_replace("/[^0-9]/", '', $_GET['diff']);
	}

	if(!isset($_GET['mode'])) {
		$output["status"] = "error";
		$output["message"] = "No game mode given";
		return;		
	} else {
		$mode = preg_replace("/[^A-Za-z0-9]/", '', $_GET['mode']);

		if($mode == "SoloFreePlay") {
			$mode = "SoloStandard";
		}
	}

	if(!($hash && $diff && $mode)) {
		$output["status"] = "error";
		$output["message"] = "One or more required GET parameters came back empty (hash, diff, mode required)";
		return;
	}

	$output["URL"] = 'https://scoresaber.com/api/leaderboard/by-hash/' . $hash . '/scores?difficulty=' . $diff . ($name ? '&search=' . $name : '') . '&gameMode=' . $mode;
}

getLeaderboard();

if($output["status"] == "error") {
	http_response_code(404);
} else {
	if(isset($output["URL"])) {
		$output["data"] = json_decode(file_get_contents($output["URL"]));
	}
}

echo json_encode($output);
?>