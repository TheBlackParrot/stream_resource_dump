<?php
header('Content-type: application/json');

$output = [
	"status" => "OK"
];

$diffEnums = [
	1 => "Easy",
	3 => "Normal",
	5 => "Hard",
	7 => "Expert",
	9 => "ExpertPlus"
];

// hwat the hell
$contextEnums = [
	'general' => 0,
	'noMods' => 4,
	'noPause' => 8,
	'golf' => 16,
	'sCPM' => 32
];
$context = false;

function getLeaderboardScore() {
	GLOBAL $output;
	GLOBAL $diffEnums;
	GLOBAL $contextEnums;
	GLOBAL $context;

	if(!isset($_GET['playerID'])) {
		$output["status"] = "error";
		$output["message"] = "No playerID given";
		return;
	} else {
		$playerID = preg_replace("/[^A-Za-z0-9_-]/", '', $_GET['playerID']);
	}

	if(!isset($_GET['hash'])) {
		$output["status"] = "error";
		$output["message"] = "No map hash given";
		return;
	} else {
		$hash = preg_replace("/[^A-Fa-f0-9]/", '', strtoupper($_GET['hash']));
	}

	if(!isset($_GET['diff'])) {
		$output["status"] = "error";
		$output["message"] = "No diff given";
		return;
	} else {
		$diffValue = preg_replace("/[^0-9]/", '', $_GET['diff']);

		if(array_key_exists($diffValue, $diffEnums)) {
			$diff = $diffEnums[$diffValue];
		} else {
			$output["status"] = "error";
			$output["message"] = "Diff value not present in enum";
			return;
		}
	}

	if(!isset($_GET['mode'])) {
		$output["status"] = "error";
		$output["message"] = "No mode given";
		return;
	} else {
		$mode = preg_replace("/[^A-Za-z0-9]/", '', $_GET['mode']);
	}

	if(!isset($_GET['context'])) {
		$output["status"] = "error";
		$output["message"] = "No leaderboard context given";
		return;
	} else {
		$context = preg_replace("/[^A-Za-z0-9]/", '', $_GET['context']);
		if(!array_key_exists($context, $contextEnums)) {
			$context = false;
			$output["status"] = "error";
			$output["message"] = "Invalid leaderboard context given";
			return;
		}
	}

	if(!($hash) || !($playerID) || !($diff) || !($mode) || !($context)) {
		$output["status"] = "error";
		$output["message"] = "One or more required GET parameters came back empty (hash, playerID, diff, mode required)";
		return;
	}

	// https://api.beatleader.xyz/score/soni/FFAE173E9292908E2245FA6803815ABFF9D2F24E/ExpertPlus/Standard 
	$output["URL"] = 'https://api.beatleader.xyz/score/' . $context . '/' . $playerID . '/' . $hash . '/' . $diff . '/' . $mode;
}

getLeaderboardScore();

if($output["status"] != "error") {
	if(isset($output["URL"])) {
		$response = @file_get_contents($output["URL"]);
		if($response === false) {
			$jsonData = array('accuracy' => 0);
		} else {
			$jsonData = json_decode($response, true);
		}

		$output["data"] = array(
			'accuracy' => 0,
			'rank' => 0,
			'avatarURL' => '../shared/assets/placeholder.png'
		);

		if(array_key_exists("player", $jsonData)) {
			if(array_key_exists("avatar", $jsonData["player"])) {
				$output["data"]["avatarURL"] = $jsonData["player"]["avatar"];
			}
		}

		if(array_key_exists("accuracy", $jsonData)) {
			$output["data"]["accuracy"] = $jsonData["accuracy"];
		} else {
			$output["status"] = "error";
			$output["message"] = "Accuracy value wasn't present in BeatLeader response";
		}

		if($contextEnums[$context] === 0) {
			if(array_key_exists("rank", $jsonData)) {
				$output["data"]["rank"] = $jsonData["rank"];
			} else {
				$output["status"] = "error";
				$output["message"] = "Rank wasn't present in BeatLeader response";
			}
		} else {
			if(array_key_exists("contextExtensions", $jsonData)) {
				$foundContext = false;

				foreach ($jsonData["contextExtensions"] as $leaderboardContextData) {
					if($leaderboardContextData["context"] === $contextEnums[$context]) {
						$foundContext = true;
						break;
					}
				}

				if(!$foundContext) {
					$output["status"] = "error";
					$output["message"] = "Could not find wanted leaderboard context in BeatLeader response (" . $context . ")";
				} else {
					$output["data"]["accuracy"] = $leaderboardContextData["accuracy"];
					$output["data"]["rank"] = $leaderboardContextData["rank"];
				}
			} else {
				$output["status"] = "error";
				$output["message"] = "No leaderboard contexts present in BeatLeader response";
			}
		}
	}
}

if($output["status"] == "error") {
	http_response_code(404);
}

echo json_encode($output);
?>