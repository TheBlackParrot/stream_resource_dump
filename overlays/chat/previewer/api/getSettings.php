<?php
include 'lib/globals.php';
include 'lib/funcs.php';

header("Content-type: application/json");

if(!isset($_GET['id'])) {
	http_response_code(400);
	die('{"error": "No ID parameter present in GET params"}');
}

if(!ctype_digit($_GET['id'])) {
	http_response_code(400);
	die('{"error": "ID parameter must be numeric"}');
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$mysqli = new mysqli();
$mysqli->options(MYSQLI_OPT_INT_AND_FLOAT_NATIVE, 1);
$mysqli->real_connect('localhost', 'http', null, 'user_settings');

$statement = $mysqli->prepare('SELECT * FROM data WHERE id = ?');
$statement->bind_param('i', $_GET["id"]);
$statement->execute();

$result = $statement->get_result();
$row = $result->fetch_array(MYSQLI_ASSOC);

$statement->free_result();

$mysqli->close();
if($row) {
	echo(json_encode($row));
} else {
	echo("{}");
}

?>