-- phpMyAdmin SQL Dump
-- version 3.4.11.1deb2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 25, 2013 at 05:49 PM
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
  `item_uuid` varchar(36) NOT NULL,
  `sender_uuid` varchar(36) NOT NULL,
  `content` varchar(255) DEFAULT NULL,
  `date` datetime NOT NULL,
  `receiver_uuid` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_ID` (`sender_uuid`),
  KEY `object_ID` (`item_uuid`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=21 ;

--
-- Dumping data for table `message`
--

INSERT INTO `message` (`id`, `item_uuid`, `sender_uuid`, `content`, `date`, `receiver_uuid`) VALUES
(1, '42', '7', 'Bob', '2013-09-03 00:00:00', 'borrower'),
(3, '42', '7', 'coucou', '2013-09-03 00:00:00', 'borrower'),
(4, '42', '7', 'tu', '2013-09-03 00:00:00', 'lender'),
(5, '42', '7', 'veux', '2013-09-03 00:00:00', 'borrower'),
(6, '42', '7', 'voir', '2013-09-03 00:00:00', 'lender'),
(7, '42', '2', 'ma bite ?', '2013-09-03 00:00:00', 'borrower'),
(8, '25', '5', 'Bonjjo', '2013-09-16 00:00:00', 'lender'),
(9, '25', '5', 'Allo ?', '2013-09-16 00:00:00', 'borrower'),
(10, '25', '5', 'Enculé !', '2013-09-16 00:00:00', 'lender'),
(11, '454', '5454', 'coucou', '2013-09-12 00:00:00', 'lender'),
(12, '42', '3', 'cc tvvmb ?', '2013-09-12 00:00:00', 'lender'),
(13, 'e5beba96-e68c-11e2-8b18-485b394e1431', 'yghujik', 'bonjour poney', '2013-09-16 00:00:00', 'cdc68c8d-e627-11e2-9aab-002170dd300a'),
(14, 'fd81e820-e091-4b57-8229-7a1b8d013094', '919ec6c8-2962-48f7-b34a-4a458dd39056', 'ALLO ?', '2013-09-17 00:00:00', '53be87e4-0ff2-4c9d-8748-d066f2f04d03'),
(15, 'fd81e820-e091-4b57-8229-7a1b8d013094', '919ec6c8-2962-48f7-b34a-4a458dd39056', 'ALLO, NON MAIS ALLO QUOI ?!', '2013-09-17 00:00:00', '53be87e4-0ff2-4c9d-8748-d066f2f04d03'),
(16, 'fd81e820-e091-4b57-8229-7a1b8d013094', '53be87e4-0ff2-4c9d-8748-d066f2f04d03', 'kikoulol', '2013-09-26 13:26:48', '919ec6c8-2962-48f7-b34a-4a458dd39056'),
(17, 'fd81e820-e091-4b57-8229-7a1b8d013094', '53be87e4-0ff2-4c9d-8748-d066f2f04d03', 'grawaaak', '2013-09-26 13:30:32', '919ec6c8-2962-48f7-b34a-4a458dd39056'),
(18, '25eb49a9-af35-4fe2-a2c7-d0cfdff90263', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954', 'Coucou ! Tu veux voir ma Bite ?', '2013-09-27 13:49:30', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954'),
(19, '25eb49a9-af35-4fe2-a2c7-d0cfdff90263', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954', 'mouahaha', '2013-09-27 13:49:44', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954'),
(20, '25eb49a9-af35-4fe2-a2c7-d0cfdff90263', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954', 'Poney', '2013-09-27 13:49:54', 'e6dcc7ac-66a6-4f15-ad81-20272a7b7954');

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
('d61a183e-c90e-4df9-ad8e-1ce4cdf215a1', 'stymaar@stymaar.fr', 'StyMaar', 'f85f7bc6173a294737b1f8d6544d6fbc0f6c85b8a6e34ba49110d35c', 'Chatenay-Malabry', '06-21-46-11-11');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
