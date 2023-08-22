<?php
header('Content-type: application/json');

$output = [
	"status" => "OK"
];

// https://api.beatleader.xyz/map/hash/${map.hash}
function getMapStats() {
	GLOBAL $output;

	if(!isset($_GET['hash'])) {
		$output["status"] = "error";
		$output["message"] = "No map hash given";
		return;
	} else {
		$hash = preg_replace("/[^A-F0-9]/", '', strtoupper($_GET['hash']));
	}

	if(!($hash)) {
		$output["status"] = "error";
		$output["message"] = "One or more required GET parameters came back empty (hash required)";
		return;
	}

	$output["URL"] = 'https://api.beatleader.xyz/map/hash/' . $hash;
}

getMapStats();

if($output["status"] == "error") {
	http_response_code(404);
} else {
	if(isset($output["URL"])) {
		$output["data"] = json_decode(file_get_contents($output["URL"]));
	}
}

echo json_encode($output);
?>