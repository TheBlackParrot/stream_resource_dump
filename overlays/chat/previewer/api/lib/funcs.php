<?php
include 'lib/globals.php';

function callTwitch($access, $endpoint, $data = []) {
	global $_keys;

	$url = 'https://api.twitch.tv/helix/' . $endpoint;

	$options = [
		'http' => [
			'header' => "Authorization: Bearer {$access}\r\nClient-Id: {$_keys['id']}\r\n",
			'method' => 'GET',
			'content' => http_build_query($data),
		]
	];
	$context = stream_context_create($options);

	$response = file_get_contents($url, false, $context);
	$statusCode = intval(explode(" ", $http_response_header[0])[1]);
	if($response === false || $statusCode > 400) {
		if($statusCode === 401) {
			setcookie('access', "", 1, '/', $domain, false);
		}
		return ['error' => 'Request for ' . $endpoint . ' failed.'];
	}

	return json_decode($response, true);
}

?>