<?php
include 'lib/globals.php';

if(!isset($_GET['code'])) {
	http_response_code(400);
	die('No auth code is present');
} else {
	if(!ctype_alnum($_GET['code'])) {
		http_response_code(400);
		die('Code parameter should only contain alphanumeric characters');
	}
}

if(!isset($_GET['state'])) {
	http_response_code(400);
	die('No state check is present');
} else {
	if(!ctype_alnum($_GET['state'])) {
		http_response_code(400);
		die('State check parameter should only contain alphanumeric characters');
	}
}

$url = 'https://id.twitch.tv/oauth2/token';
$data = [
	'client_id' => $_keys['id'],
	'client_secret' => $_keys['secret'],
	'code' => $_GET['code'],
	'grant_type' => 'authorization_code',
	'redirect_uri' => $root_page
];
$options = [
	'http' => [
		'header' => 'Content-type: application/x-www-form-urlencoded',
		'method' => 'POST',
		'content' => http_build_query($data),
	]
];
$context = stream_context_create($options);
$authTokens = file_get_contents($url, false, $context);
if($authTokens === false) {
	http_response_code(500);
	die("Failed to get access token");
} else {
	$authTokens = json_decode($authTokens, true);
}

setcookie('access', $authTokens['access_token'], time() + ($authTokens['expires_in']), '/', $domain, false);
header("Location: {$root_page}");
?>