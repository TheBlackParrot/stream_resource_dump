CREATE DATABASE IF NOT EXISTS user_settings;
USE user_settings;

CREATE TABLE IF NOT EXISTS data
(
	id BIGINT
		NOT NULL
		PRIMARY KEY,
	username VARCHAR(25)
		NOT NULL,

	nameFont VARCHAR(64)
		DEFAULT "Manrope",
	nameItalic BOOLEAN
		DEFAULT false,

	nameSize REAL(3,1) UNSIGNED
		DEFAULT 16
		CHECK (nameSize>=14 AND nameSize<=20),
	nameCharSpacing REAL(3,2)
		DEFAULT 1
		CHECK (nameCharSpacing>=-2 AND nameCharSpacing<=2),
	nameWeight SMALLINT UNSIGNED
		DEFAULT 700
		CHECK (nameWeight>=100 AND nameWeight<1000),
	nameExtraWeight REAL(3,2) UNSIGNED
		DEFAULT 1.2
		CHECK (nameExtraWeight<=2.5),

	nameTransform ENUM('none', 'lowercase', 'uppercase')
		DEFAULT 'uppercase',
	nameVariant ENUM('normal', 'small-caps', 'tabular-nums', 'unicase')
		DEFAULT 'normal',

	nameGradientType ENUM('linear', 'radial', 'conic')
		DEFAULT 'linear',
	nameGradientRepeats BOOLEAN
		DEFAULT false,
	nameGradientAngle SMALLINT
		DEFAULT 170
		CHECK (nameGradientAngle>=-360 AND nameGradientAngle<=360),
	nameGradientXPos REAL(5,2)
		DEFAULT 50
		CHECK (nameGradientXPos>=-500 AND nameGradientXPos<=500),
	nameGradientYPos REAL(5,2)
		DEFAULT 50
		CHECK (nameGradientYPos>=-500 AND nameGradientYPos<=500),

	nameColorStops TINYINT UNSIGNED
		DEFAULT 2,

	nameColorStop1_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop1_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop1_percentage>=-50 AND nameColorStop1_percentage<=150),

	nameColorStop2_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop2_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop2_percentage>=-50 AND nameColorStop2_percentage<=150),
	nameColorStop2_isHard BOOLEAN
		DEFAULT false,

	nameColorStop3_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop3_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop3_percentage>=-50 AND nameColorStop3_percentage<=150),
	nameColorStop3_isHard BOOLEAN
		DEFAULT false,

	nameColorStop4_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop4_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop4_percentage>=-50 AND nameColorStop4_percentage<=150),
	nameColorStop4_isHard BOOLEAN
		DEFAULT false,

	nameColorStop5_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop5_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop5_percentage>=-50 AND nameColorStop5_percentage<=150),
	nameColorStop5_isHard BOOLEAN
		DEFAULT false,

	nameColorStop6_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop6_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop6_percentage>=-50 AND nameColorStop6_percentage<=150),
	nameColorStop6_isHard BOOLEAN
		DEFAULT false,

	nameColorStop7_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop7_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop7_percentage>=-50 AND nameColorStop7_percentage<=150),
	nameColorStop7_isHard BOOLEAN
		DEFAULT false,

	nameColorStop8_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop8_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop8_percentage>=-50 AND nameColorStop8_percentage<=150),
	nameColorStop8_isHard BOOLEAN
		DEFAULT false,

	nameColorStop9_color MEDIUMINT UNSIGNED
		DEFAULT 16777215,
	nameColorStop9_percentage REAL(5,2)
		DEFAULT 0
		CHECK (nameColorStop9_percentage>=-50 AND nameColorStop9_percentage<=150),
	nameColorStop9_isHard BOOLEAN
		DEFAULT false,

	namePerspectiveShift TINYINT
		DEFAULT 0
		CHECK (namePerspectiveShift>=-30 AND namePerspectiveShift<=30),

	nameSkew REAL(4,2)
		DEFAULT 0
		CHECK (nameSkew>=-25 AND nameSkew<=25),

	nameGlowEnabled BOOLEAN
		DEFAULT false,
	nameGlowColor INT UNSIGNED
		DEFAULT 4294967295,
	nameGlowAmount TINYINT UNSIGNED
		DEFAULT 2
		CHECK (nameGlowAmount<=4),

	messageFont VARCHAR(64)
		DEFAULT "Manrope",
	messageSize REAL(3,1) UNSIGNED
		DEFAULT 15
		CHECK (messageSize>=13 AND messageSize<=18),
	messageCharSpacing REAL(3,2)
		DEFAULT 0
		CHECK (messageCharSpacing>=-1 AND messageCharSpacing<=1),
	messageLineHeight TINYINT UNSIGNED
		DEFAULT 24
		CHECK (messageLineHeight>=20 AND messageLineHeight<=30),
	messageWeight SMALLINT UNSIGNED
		DEFAULT 700
		CHECK (messageWeight>=100 AND messageWeight<1000),
	messageExtraWeight REAL(3,2) UNSIGNED
		DEFAULT 0
		CHECK (messageExtraWeight<=1),
	messageBoldExtraWeight REAL(3,2) UNSIGNED
		DEFAULT 1.2
		CHECK (messageBoldExtraWeight>=0.7 AND messageBoldExtraWeight<=2),

	messageVariant ENUM('normal', 'tabular-nums')
		DEFAULT 'normal',

	identityFlag1 VARCHAR(40),
	identityFlag2 VARCHAR(40),
	identityFlag3 VARCHAR(40),
	identityFlag4 VARCHAR(40),
	identityFlag5 VARCHAR(40),
	identityFlag6 VARCHAR(40),
	identityFlag7 VARCHAR(40),
	identityFlag8 VARCHAR(40),
	identityFlag9 VARCHAR(40),

	hideBTTVBadge BOOLEAN
		DEFAULT false,

	hideFFZBadge BOOLEAN
		DEFAULT false,

	hide7TVBadge BOOLEAN
		DEFAULT false,
	use7TVPaint BOOLEAN
		DEFAULT true,

	useUsername BOOLEAN
		DEFAULT false,

	showAvatar BOOLEAN
		DEFAULT true,
	avatarBorderRadius TINYINT UNSIGNED
		DEFAULT 50
		CHECK (avatarBorderRadius<=50),

	useDefaultNameSettings BOOLEAN
		DEFAULT true,
	useDefaultMessageSettings BOOLEAN
		DEFAULT true,
	useDefaultAvatarBorderRadius BOOLEAN
		DEFAULT true
);