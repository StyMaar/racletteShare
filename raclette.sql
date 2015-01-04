-- phpMyAdmin SQL Dump
-- version 3.4.11.1deb2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 31, 2013 at 04:03 PM
-- Server version: 5.5.31
-- PHP Version: 5.4.4-14+deb7u5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+01:00";


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
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `label` char(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=10 ;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`id`, `label`) VALUES
(0, 'Coup de main'),
(1, 'Fiesta'),
(2, 'Voyage'),
(3, 'High-tech'),
(4, 'Bricolage/Jardinage'),
(5, 'Sport'),
(6, 'Maison/Cuisine'),
(7, 'Culture');


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
-- Table structure for table `item`
--

CREATE TABLE IF NOT EXISTS `item` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY `user_ID` (`user_id`) REFERENCES user(id)
                     ON DELETE CASCADE,
  FOREIGN KEY `category_ID` (`category`) REFERENCES category(id)
                     ON DELETE CASCADE,
  FULLTEXT KEY `rechercheNom` (`name`,`description`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- Table structure for table `demande`
--

CREATE TABLE IF NOT EXISTS `demande` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category` int(10) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY `user_ID` (`user_id`) REFERENCES user(id)
                     ON DELETE CASCADE,
  FOREIGN KEY `category` (`category`) REFERENCES category(id)
                     ON DELETE CASCADE,
  FULLTEXT KEY `rechercheNom` (`name`,`description`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

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
  FOREIGN KEY `target` (`target_uuid`) REFERENCES user(id)
                     ON DELETE CASCADE,
  FOREIGN KEY `sender` (`sender_uuid`) REFERENCES user(id)
                     ON DELETE CASCADE,
  FOREIGN KEY `object_ID` (`item_uuid`) REFERENCES item(id)
                     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

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
  FOREIGN KEY `sender_ID` (`sender_id`) REFERENCES user(id)
                     ON DELETE CASCADE,
  FOREIGN KEY `receiver_ID` (`receiver_id`) REFERENCES user(id)
                    ON DELETE CASCADE,
  FOREIGN KEY `object_ID` (`item_id`) REFERENCES item(id)
                     ON DELETE CASCADE
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=58 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
