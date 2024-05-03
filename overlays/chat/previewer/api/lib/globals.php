<?php
$domain = ($_SERVER['HTTP_HOST'] != 'localhost') ? $_SERVER['HTTP_HOST'] : false;
$_keys = json_decode(file_get_contents('/srv/http/customization_keys.json'), true);
$root_page = "http://localhost/chat-customization";
?>