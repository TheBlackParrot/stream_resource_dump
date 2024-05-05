<?php
$domain = ($_SERVER['HTTP_HOST'] != 'localhost') ? $_SERVER['HTTP_HOST'] : false;
$_keys = json_decode(file_get_contents('/srv/http/customization_keys.json'), true);
$_flags = json_decode(file_get_contents(dirname(__FILE__) . "/flags.json"), true);
$_fonts = json_decode(file_get_contents(dirname(__FILE__) . "/fonts.json"), true);
$root_page = "http://localhost/chat-customizer";
?>