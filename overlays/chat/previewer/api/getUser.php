<?php
include 'lib/globals.php';
include 'lib/funcs.php';

header("Content-type: application/json");

if(!isset($_COOKIE['access'])) {
	http_response_code(400);
	die('{"error": "User has not authenticated"}');
}

if(!ctype_alnum($_COOKIE['access'])) {
	http_response_code(400);
	setcookie('access', "", 1, '/', $domain, false);
	die('{"error": "User used an invalid access token"}');
}

$user = callTwitch($_COOKIE['access'], "users");

if(array_key_exists('data', $user)) {
	$mysqli = new mysqli();
	$mysqli->options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);
	$mysqli->real_connect('localhost', 'http', null, 'user_settings');

	prepareUser($mysqli, $user['data'][0]);

	$data = array('user' => $user['data'][0], 'settings' => getSettings($mysqli, $user['data'][0]));
	echo(json_encode($data));
} else {
	http_response_code(500);
	die('{"error": "User data not returned"}');
}
?>