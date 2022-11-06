<?php
setlocale(LC_CTYPE, "en_US.utf8");
header("Content-type: text/plain");

$json = file_get_contents('php://input');
//$json = file_get_contents("./test.json");
$data = json_decode($json, true);

if(!array_key_exists("msg", $data)) {
	http_response_code(404);
	die("No message sent.");
}

$words = explode(" ", $data['msg']);
if(count($words) <= 6) {
	// if there's 6 or less words it's probably not an emote message lmao
	print($data['msg']);
	die();
}

$max = floor(count($words) / 2);

// skipping over repetitive messages, this is purely to find multi-word/emote patterns
// i can just bring in the old filter to check for those, that worked fine. less false flags
for($wordCount = 2; $wordCount <= $max; $wordCount++) { 
	$oldPattern = [];

	for($idx = 0; $idx < count($words); $idx += $wordCount) {
		if(count($words) - $idx < $wordCount) {
			// there's not enough, we can't test
			continue;
		}

		$pattern = [];
		for($x = $idx; $x < $idx + $wordCount; $x++) {
			$pattern[] = $words[$x];
		}

		// oh that's cool PHP can check equality between arrays
		if($pattern == $oldPattern) {
			// say nothing if it catches
			//die("Spam caught with pattern of " . $wordCount . ", \"" . implode(" ", $pattern) . "\"");
			die();
		}

		$oldPattern = $pattern;
	}
}

// ok now go back to the old method to filter out single repeats
$words = explode(" ", $data['msg']);

$oldWord = "";
$out = [];

foreach($words as $word) {
	if($word != $oldWord) {
		$out[] = $word;
	}
	$oldWord = $word;
}

print(implode(" ", $out));
?>