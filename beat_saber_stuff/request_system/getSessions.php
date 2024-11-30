<?php

define('__ROOTDIR__', dirname(__FILE__));
header("Content-Type: application/json");

include __ROOTDIR__ . "/lib/db.php";

$out = array(
	'OK' => false,
	'message' => 'Script error'
);

$data = array();
$queryObject = $db->query('SELECT * FROM sessions');
while($row = $queryObject->fetchArray()) {
	$data[] = $row['unixTimestamp'];
}

$errCode = $db->lastErrorCode();
if($errCode != 101) {
	$out['message'] = "SQLite error code {$errCode}";
} else {
	$out['OK'] = true;
	$out['message'] = "Success";
	$out['data'] = $data;
};

die(json_encode($out));

?>