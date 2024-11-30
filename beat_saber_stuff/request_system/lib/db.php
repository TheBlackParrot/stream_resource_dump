<?php
if(!defined('__ROOTDIR__')) {
	http_response_code(403);
	die();
}

if(!isset($db)) {
	$db = new SQLite3(__ROOTDIR__ . "/lib/queue.db");
	$db->exec(file_get_contents(__ROOTDIR__ . "/lib/main.sql"));
	$db->exec(file_get_contents(__ROOTDIR__ . "/lib/blacklist.sql"));
}

?>