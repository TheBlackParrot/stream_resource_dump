<?php
include 'lib/globals.php';

function callTwitch($access, $endpoint, $data = []) {
	global $_keys;

	$url = 'https://api.twitch.tv/helix/' . $endpoint;

	$options = [
		'http' => [
			'header' => "Authorization: Bearer {$access}\r\nClient-Id: {$_keys['id']}\r\n",
			'method' => 'GET',
			'content' => http_build_query($data),
		]
	];
	$context = stream_context_create($options);

	$response = file_get_contents($url, false, $context);
	$statusCode = intval(explode(" ", $http_response_header[0])[1]);
	if($response === false || $statusCode > 400) {
		if($statusCode === 401) {
			setcookie('access', "", 1, '/', $domain, false);
		}
		return ['error' => 'Request for ' . $endpoint . ' failed.'];
	}

	return json_decode($response, true);
}

function getSettingKeys($mysqli) {
	$result = $mysqli->query("SELECT column_name, column_type FROM information_schema.columns WHERE table_schema = 'user_settings'");

	$out = [];
	while($row = $result->fetch_array(MYSQLI_ASSOC)) {
		switch(substr($row['column_type'], 0, 9)) {
			case "mediumint":
				$type = "i";
				break;

			default:
				switch(substr($row['column_type'], 0, 7)) {
					case 'decimal':
						$type = "d";
						break;
						
					case 'tinyint':
						$type = "i";
						break;

					case 'varchar':
						$type = "s";
						break;

					default:
						switch(substr($row['column_type'], 0, 4)) {
							case 'enum':
								$type = "s";
								break;

							default:
								$type = "i"; // int
								break;
						}
						break;
				}
				break;
		}

		$out[$row['column_name']] = $type;
	}

	$result->free();

	return $out;
}

function getSettings($mysqli, $user) {
	$statement = $mysqli->prepare('SELECT * FROM data WHERE id = ?');
	$statement->bind_param('i', $user["id"]);
	$statement->execute();

	$result = $statement->get_result();

	$out = [];
	$row = $result->fetch_array(MYSQLI_ASSOC);

	$statement->free_result();
	return $row;
}

function saveSetting($mysqli, $user, $validSettings, $setting, $value) {
	$statement = $mysqli->prepare('UPDATE data SET ' . $setting . ' = ? WHERE id = ?');
	$statement->bind_param($validSettings[$setting] . 'i', $value, $user["id"]);
	$statement->execute();
	$rows = $statement->affected_rows;
	$statement->free_result();

	if($rows > 0) {
		return true;
	} else {
		return false;
	}
}

function prepareUser($mysqli, $user) {
	$statement = $mysqli->prepare('INSERT IGNORE INTO data (id, username) VALUES (?, ?)');
	$statement->bind_param("is", $user["id"], $user["login"]);
	$statement->execute();
	$statement->free_result();
}
?>