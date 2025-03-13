<?php

define('__ROOTDIR__', dirname(__FILE__));
header("Content-Type: application/json");

include __ROOTDIR__ . "/lib/db.php";

$out = array(
	'OK' => false,
	'message' => 'Script error'
);

$queryString = "SELECT * FROM sessions ORDER BY unixTimestamp DESC";
if(isset($_GET['limit'])) {
	if(ctype_digit($_GET['limit'])) {
		$queryString .= " LIMIT {$_GET['limit']}";
	} else {
		$queryString .= " LIMIT 5";
	}
} else {
	$queryString .= " LIMIT 5";
}

$data = array();
$queryObject = $db->query($queryString);
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