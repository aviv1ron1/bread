-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'XXXpasswordXXX'
-- flush privileges;

/****** Object:  Table `Matcon`    Script Date: 04/08/2020 17:26:42 ******/
use `bread`;

CREATE TABLE `matcon`(
	`Id` int AUTO_INCREMENT NOT NULL,
	`UserId` int NOT NULL,
	`Name` varchar(200) NOT NULL,
	`Rating` double NOT NULL,
	`Data` Text NOT NULL,
 CONSTRAINT `PK_Matcon` PRIMARY KEY 
(
	`Id` ASC
)
)
;


/****** Object:  Table `MatconRating`    Script Date: 04/08/2020 17:26:42 ******/


CREATE TABLE `matconrating`(
	`Id` int AUTO_INCREMENT NOT NULL,
	`MatconId` int NOT NULL,
	`UserId` int NOT NULL,
	`Timestamp` datetime NOT NULL,
	`Rating` int NOT NULL,
	`Data` Text NOT NULL,
 CONSTRAINT `PK_MatconRating` PRIMARY KEY 
(
	`Id` ASC
)
)
;
/****** Object:  Table `tag`    Script Date: 04/08/2020 17:26:42 ******/

CREATE TABLE `tag` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `tag` VARCHAR(100) NULL,
  PRIMARY KEY (`id`));


/****** Object:  Table `MatconTag`    Script Date: 04/08/2020 17:26:42 ******/
CREATE TABLE `matcontag`(
	`Id` int AUTO_INCREMENT NOT NULL,
	`MatconId` int NOT NULL,
	`TagId` int NOT NULL,
 CONSTRAINT `PK_MatconTag` PRIMARY KEY 
(
	`Id` ASC
)
)
;
/****** Object:  Table `PreRegister`    Script Date: 04/08/2020 17:26:42 ******/


CREATE TABLE `preregister`(
	`Id` int AUTO_INCREMENT NOT NULL,
	`Email` varchar(320) NOT NULL,
	`Name` varchar(30) NOT NULL,
	`Password` Text NOT NULL,
	`Token` varchar(100) NOT NULL,
	`Timestamp` datetime NOT NULL,
 CONSTRAINT `PK_PreRegister` PRIMARY KEY 
(
	`Id` ASC
)
)
;
/****** Object:  Table `User`    Script Date: 04/08/2020 17:26:42 ******/


CREATE TABLE `user`(
	`Id` int AUTO_INCREMENT NOT NULL,
	`Email` varchar(320) NOT NULL,
	`Data` Text NOT NULL,
 CONSTRAINT `PK_User` PRIMARY KEY 
(
	`Id` ASC
)
)
;
/****** Object:  Table `UserAuth`    Script Date: 04/08/2020 17:26:42 ******/


CREATE TABLE `userauth`(
	`Id` int AUTO_INCREMENT NOT NULL,
	`UserId` int NOT NULL,
	`Token` varchar(100) NOT NULL,
	`Data` Text NOT NULL,
 CONSTRAINT `PK_UserAuth` PRIMARY KEY 
(
	`Id` ASC
)
)
;


ALTER TABLE `matcon` 
ADD CONSTRAINT `matcon_userid_user_id`
  FOREIGN KEY (`UserId`)
  REFERENCES `user` (`Id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE `matconrating` 
ADD CONSTRAINT `matconrating_matconid_matcon_id`
  FOREIGN KEY (`MatconId`)
  REFERENCES `matcon` (`Id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE `matconrating` 
ADD CONSTRAINT `matconrating_matconid_user_id`
  FOREIGN KEY (`UserId`)
  REFERENCES `user` (`Id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE `matcontag` 
ADD CONSTRAINT `matcontag_matconid_matcon_id`
  FOREIGN KEY (`MatconId`)
  REFERENCES `matcon` (`Id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE `matcontag` 
ADD CONSTRAINT `matcontag_tagid_tag_id`
  FOREIGN KEY (`TagId`)
  REFERENCES `tag` (`Id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE `userauth` 
ADD CONSTRAINT `userauth_userid_user_id`
  FOREIGN KEY (`UserId`)
  REFERENCES `user` (`Id`)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;


/****** Object:  StoredProcedure `DeleteOldPreRegisters`    Script Date: 04/08/2020 17:26:42 ******/


DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE  `DeleteOldPreRegisters`
(
	IN ExpirationDays int
)
BEGIN
	DELETE FROM preregister WHERE `Timestamp` < DATE_SUB(NOW(), INTERVAL ExpirationDays DAY);
    
	SELECT ROWCOUNT() as `Deleted`;
END$$
/****** Object:  StoredProcedure `GetMatcon`    Script Date: 04/08/2020 17:26:42 ******/



CREATE DEFINER=`root`@`localhost` PROCEDURE  `GetMatcon`(IN Id int(0))
BEGIN
	SELECT * FROM `matcon` WHERE `Id` = Id;

	SELECT `user`.`Data` FROM `user` INNER JOIN `matcon` ON `matcon`.`UserId` = `user`.`Id` WHERE `matcon`.`Id` = Id;

	SELECT AVG(`matconrating`.`Rating`) AS `Rating`, COUNT(`matconrating`.`Id`) AS `RatingCount` FROM `matconrating` WHERE `matconrating`.`MatconId` = Id;

	SELECT `tag`.`Id`, `tag`.`Tag` FROM `matcontag` INNER JOIN `tag` on `matcontag`.`TagId` = `tag`.`Id`WHERE `matcontag`.`MatconId` = Id;
END$$

/****** Object:  StoredProcedure `AddReview`    Script Date: 04/08/2020 17:26:42 ******/



CREATE DEFINER=`root`@`localhost` PROCEDURE  `AddReview`(
	IN MatconId int,
    IN Rating int,
    IN UserId int,
    IN `Data` Text
)
BEGIN
	DELETE FROM `matconrating` WHERE `MatconId` = MatconId AND `UserId` = UserId;

	INSERT INTO `matconrating` VALUES (MatconId, UserId, NOW(), Rating, `Data`);

	UPDATE `matcon` SET `Rating` = (SELECT AVG(Cast(`matconrating`.`Rating` as Float)) FROM `matconrating` WHERE `MatconId` = MatconId);
END$$

/****** Object:  StoredProcedure `DeleteReview`    Script Date: 04/08/2020 17:26:42 ******/


CREATE DEFINER=`root`@`localhost` PROCEDURE  `DeleteReview`(
	IN Id int
)
BEGIN
	DECLARE MatconId INT;

	SET MatconId = (SELECT `MatconId` FROM `matconrating` WHERE `Id` = Id);

	DELETE FROM `matconrating` WHERE `Id` = Id;

	UPDATE `matcon` SET `Rating` = IFNULL((SELECT AVG(Cast(`matconrating`.`Rating` as Float)) FROM `matconrating` WHERE `MatconId` = MatconId), 0);

END$$

/****** Object:  StoredProcedure `GetPopularTags`    Script Date: 04/08/2020 17:26:42 ******/


CREATE DEFINER=`root`@`localhost` PROCEDURE  `GetPopularTags`()
BEGIN

	SELECT `tag`.`id`, `tag`.`tag`, COUNT(*) as `count` FROM `tag` INNER JOIN `matcontag` on `tag`.`Id` = `matcontag`.`TagId` GROUP BY `tag`.`Id` ORDER BY `count` DESC LIMIT 8;

END$$

DELIMITER ;