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
	echo(json_encode($user['data'][0]));
} else {
	http_response_code(500);
	die('{"error": "User data not returned"}');
}
?>