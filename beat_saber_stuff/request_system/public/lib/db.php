<?php

if(!isset($db)) {
	$db = new SQLite3(dirname(dirname(__FILE__)) . "/queue.db");
	$db->exec(file_get_contents(dirname(__FILE__) . "/main.sql"));
}

?>