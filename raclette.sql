-- phpMyAdmin SQL Dump
-- version 3.4.11.1deb2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 31, 2013 at 04:03 PM
-- Server version: 5.5.31
-- PHP Version: 5.4.4-14+deb7u5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `raclette`
--

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE IF NOT EXISTS `category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `label` char(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=10 ;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `label`) VALUES
(1, 'Cuisine'),
(2, 'Sport'),
(3, 'Bébé'),
(4, 'Bricolage'),
(5, 'Jardinage'),
(6, 'Jeu'),
(7, 'Service'),
(8, 'Culture'),
(9, 'Loisirs');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE IF NOT EXISTS `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `date` date NOT NULL,
  `sender_uuid` varchar(36) NOT NULL,
  `target_uuid` varchar(36) NOT NULL,
  `grade` int(11) NOT NULL,
  `comment` varchar(140) NOT NULL,
  `item_uuid` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `target` (`target_uuid`),
  KEY `sender` (`sender_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `demandes`
--

CREATE TABLE IF NOT EXISTS `demandes` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `user_uuid` varchar(36) NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(140) NOT NULL,
  `category_id` int(10) NOT NULL,
  `tagsList` varchar(64) NOT NULL,
  `closed` tinyint(1) NOT NULL DEFAULT '0',
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `debut` date NOT NULL,
  `fin` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `user_ID` (`user_uuid`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `demandes`
--

INSERT INTO `demandes` (`id`, `uuid`, `user_uuid`, `name`, `description`, `category_id`, `tagsList`, `closed`, `latitude`, `longitude`, `debut`, `fin`) VALUES
(1, '', '', '', '', 0, '', 0, 0, 0, '2013-09-04', '0000-00-00'),
(3, '45', '', '', '', 4, '', 0, 0, 0, '2013-09-04', '0000-00-00');

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

CREATE TABLE IF NOT EXISTS `item` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_ID` (`user_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`id`, `user_id`, `name`, `description`, `category`) VALUES
('1', '1', 'Raclette 6 pers.', 'Appareil à raclette 6 personnes + chauffe patates', '1'),
('2', '1', 'Mixeur', 'Mixeur avec plusieurs embouts', '1'),
('3', '2', 'Mixeur', 'Bouton on/off capricieux', '1'),
('6', 'cdc68c8d-e627-11e2-9aab-002170dd300a', 'Robot', 'Mixeur multifonctions', '1'),
('5', '6', 'Blender', 'Mixeur pour jus de fruits', '1'),
('7', '5', 'Mixeur 2L', 'Fonction programmation', '1'),
('8', '7', 'Mixeur', 'Mixeur avec plusieurs embouts', '1'),
('9', '8', 'Robot multifonctions', 'Robot mixeur blender', '1'),
('10', '2', 'Fixie', 'Vélo pignon fixe', '2'),
('11', '1', 'Vélo ville', 'Peugeot 32 pouces', '2'),
('12', '9', 'VTT', 'Vélo Modèle femme 36 pouces', '2'),
('13', '3', 'BBB', NULL, '0'),
('17', '4', 'bilig', 'Un authentique bilig Krampouz en excellent état', '4'),
('29', '53be87e4-0ff2-4c9d-8748-d066f2f04d03', 'bilig', 'Un authentique bilig Krampouz en excellent état', '4'),
('30', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954', 'Caribou', 'ceci est un bébé caribou', '1'),
('31', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954', 'miaou', 'un chat à clouer au mur', '2'),
('32', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954', 'Pia', 'If you know what I mean ;)', '5'),
('33', '53be87e4-0ff2-4c9d-8748-d066f2f04d03', 'Yoann', 'edrfgthuj', '1'),
('34', '5630eab6-89c0-4f02-96e5-c0c12de334d5', 'perceuse visseuse', 'sans fil 2 batteries chargeur mèches multiples dont 12 mm béton FARTOOLS', '2'),
('35', 'f146bc44-4ece-4272-96f9-871dab46d829', 'fétou', 'il fait tout', '3'),
('13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'Drapeau Breton', 'Whoa !!!!!\r\n\r\nTrop kewl, un drapeau Breizhoneg !', 'Culture');

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

CREATE TABLE IF NOT EXISTS `message` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `item_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `content` varchar(255) DEFAULT NULL,
  `date` datetime NOT NULL,
  `receiver_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_ID` (`sender_id`),
  KEY `object_ID` (`item_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=58 ;

--
-- Dumping data for table `message`
--

INSERT INTO `message` (`id`, `item_id`, `sender_id`, `content`, `date`, `receiver_id`) VALUES
(25, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Bonjour monsieur.', '2013-10-29 13:53:20', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(26, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'Bonjour !', '2013-10-29 16:06:10', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(27, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Merci de me répondre, comment allez vous ?', '2013-10-29 16:06:31', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(28, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'S''il vous plait, aidez moi !!!!', '2013-10-29 17:01:10', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(29, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'Du calme, du calme. Que puis-je faire pour vous ?', '2013-10-29 19:34:50', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(30, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Bonjour !', '2013-10-30 09:10:23', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(31, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'Ah !!!!!', '2013-10-30 09:14:29', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(32, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Quoi ?', '2013-10-30 09:14:46', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(33, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Raiponder cil vou pez', '2013-10-30 09:52:38', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(34, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', '...', '2013-10-30 09:52:56', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(35, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'go pve noob', '2013-10-30 09:53:10', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(36, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'sale gamin !!', '2013-10-30 10:20:37', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(37, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'tocard', '2013-10-30 10:20:47', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(38, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'espèce de merde !', '2013-10-30 10:24:01', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(39, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'boulet', '2013-10-30 10:24:44', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(40, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Maieuh', '2013-10-30 10:24:55', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(41, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Batard', '2013-10-30 10:26:50', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(42, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'Pute', '2013-10-30 10:27:23', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(43, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Say pas ganti de ce moquer dé enfents', '2013-10-30 11:48:21', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(44, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'Je t''emmerde, t''es qu''un tocard, je vais te report', '2013-10-30 11:48:39', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee'),
(45, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'NOOOOOOOOOOOOOOOOON ! :''(', '2013-10-30 11:49:17', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(46, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Pourkuoi', '2013-10-30 11:49:38', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(47, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'Fait pas sa sil te plé', '2013-10-30 11:49:49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(48, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'je sui genti en vré', '2013-10-30 11:50:04', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(49, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'DONT DO THIS   ! BITCH MOZAFUKA', '2013-10-30 11:50:25', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(50, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'e', '2013-10-30 11:50:31', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(51, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'e', '2013-10-30 11:50:34', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(52, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'e', '2013-10-30 11:50:36', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(53, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'e', '2013-10-30 11:50:39', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(54, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'feeder ! report noob !', '2013-10-31 12:56:02', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(55, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', '4456', '2013-10-31 12:56:39', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(56, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'pf !!!', '2013-10-31 12:56:44', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1'),
(57, '13437057-3a3d-4c04-9775-ef3b7baa0a49', 'aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'TF imba !', '2013-10-31 12:56:49', 'd61a183e-c90e-4df9-ad8e-1ce4cdf215a1');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id` varchar(36) NOT NULL,
  `login` varchar(64) NOT NULL,
  `name` varchar(40) NOT NULL,
  `password` char(56) NOT NULL,
  `city` varchar(64) DEFAULT NULL,
  `tel` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nickname` (`name`),
  UNIQUE KEY `login` (`login`),
  KEY `ville` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `login`, `name`, `password`, `city`, `tel`) VALUES
('aea5637c-12cc-47d3-b8ab-f457c23e43ee', 'poney@poney.fr', 'PoneyLand', '99fb2f48c6af4761f904fc85f95eb56190e5d40b1f44ec3a9c1fa319', 'Chatenay-Malabry', '0621461111'),
('d61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'stymaar@stymaar.fr', 'StyMaar', 'f85f7bc6173a294737b1f8d6544d6fbc0f6c85b8a6e34ba49110d35c', 'Chatenay-Malabry', '06-21-46-11-11');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
