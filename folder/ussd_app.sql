-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Oct 26, 2021 at 04:53 PM
-- Server version: 10.4.14-MariaDB
-- PHP Version: 7.4.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ussd_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `fee_charges`
--

CREATE TABLE `fee_charges` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `country` varchar(5) NOT NULL,
  `charge_type` varchar(10) NOT NULL,
  `charge_value` varchar(500) DEFAULT NULL,
  `charge_currency` varchar(4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `fee_charges`
--

INSERT INTO `fee_charges` (`id`, `name`, `country`, `charge_type`, `charge_value`, `charge_currency`, `created_at`, `updated_at`) VALUES
(1, 'balance', 'BJ', 'fix', '400', 'XOF', '2021-07-29 10:12:15', '2021-07-29 12:00:34'),
(9, 'transfer', 'NG', 'fix', '2.01', 'NGN', '2021-07-29 10:18:09', '2021-07-29 12:00:58'),
(10, 'name', 'NG', 'fix', '12', 'XOF', '2021-08-01 14:12:44', '2021-08-01 14:12:44'),
(21, 'transfer', 'BJ', 'range', '100=0.1,500=0.5,1000=1.0,2000=6.0', 'XOF', '2021-08-20 10:49:18', '2021-08-21 15:02:44');

-- --------------------------------------------------------

--
-- Table structure for table `merchants`
--

CREATE TABLE `merchants` (
  `id` int(11) NOT NULL,
  `name` varchar(90) NOT NULL,
  `email` varchar(120) NOT NULL,
  `phone` varchar(16) NOT NULL,
  `password` text NOT NULL,
  `api_key` varchar(40) NOT NULL,
  `balance` decimal(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
  `status` int(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `merchants`
--

INSERT INTO `merchants` (`id`, `name`, `email`, `phone`, `password`, `api_key`, `balance`, `status`, `created_at`, `updated_at`) VALUES
(2, 'Golden-Malter', 'engr.increase@gmail.com', '07064591948', '$2b$10$DbCdmPpO8agUWfaEKgakvO8kP/V.Y/aO05fSU1Nhn9i/VQDP4aqRS', '6dF0F4L66wlKvsBKD9BHT0ElSjwpzluhxvA4r4H2', '95900.00', 1, '2021-07-17 13:57:05', '2021-08-26 16:37:25'),
(3, 'tope ajibuwa', 'admin@admin.com', '2347032838025', '$2b$10$dI/z9ZVarFH398IiEoEBH.syaTG6dM.oIXD50YlVJRRtJq7hjLQx6', '9WsSrk5KfsVwEF4XUGqeT9xhFkiX7T16VVBhSKrW', '0.00', 1, '2021-07-20 13:48:44', '2021-08-26 16:37:36'),
(4, 'tope ajibuwa', 'tajibuwa@gmail.com', '07032838025', '$2b$10$ZyAV7LLtcai/1z.uHl.LAeXxlEBBvW6jY8UA0DXtqqyPl1r2qeiG6', 'A8tdgLFITKi8POUYCJbienQo6U5gIZ7ye3iSs9ZV', '0.00', 0, '2021-07-20 13:55:31', '2021-07-20 13:55:31'),
(5, 'tope ajibuwa', 'tajibuwa1@gmail.com', '2347032838033', '$2b$10$WtIqc6N4ZV2qP.AFChGmE.4xy/GDOaKxxNIq51uppjmcZ2FU/Wl/2', 'WLUDjRmTZtVfyo9fVWt3nI3Z4yi45MoHGDuOfDW7', '0.00', 0, '2021-07-20 13:56:44', '2021-07-20 13:56:44'),
(6, 'tope ajibuwa', 'admin@admins.com', '2347032833025', '$2b$10$bIUvjcTL8KFy3EOKiA0sJOljcPhJrZT16b9sJiBw7vugH9/8En2au', 'qFTVQ4kjSFAIrhTAPrTUidiOqQELJigRQD4liR6N', '0.00', 0, '2021-07-20 14:46:43', '2021-07-20 14:46:43'),
(7, 'tope ajibuwa', 'adnnmin@admin.com', '2346032838025', '$2b$10$DSq3zPM/l4jg4N7x4kJHkOe04XxIzEaG5OI3O3OwMMeIubCHTyKg2', 'UHi9Gfd2hf5RtcxYRAEE2d6Z5aLkJ7xjaDa1HwgL', '0.00', 0, '2021-07-20 14:52:04', '2021-07-20 14:52:04'),
(8, 'tope ajibuwa', 'admnnbin@admin.com', '087032838025', '$2b$10$Lk.qdX5kCoLF3HK/ZK4uLuCgX/tbWpkDDCwZHYR4ZwtKOorYyvgWy', 'wa3YllXYWQaPoeSz1YGspfC3ewr3zcASvXiB2dzi', '0.00', 0, '2021-07-20 15:03:02', '2021-07-20 15:03:02'),
(9, 'tope ajibuwa', 'adnbnmin@admin.com', '07032838032', '$2b$10$4Bf2UQCMgLFS69ncAFk/MePc9fNgGpt0ytD.b68e6JvLaNrjso2bi', 'Z2LWF8SPQMgS8gqoM1ujJzc6vGtqlAEIQ3yx6GTw', '0.00', 0, '2021-07-20 15:08:18', '2021-07-20 15:08:18'),
(10, 'tope ajibuwa', 'tajibuwa3@gmail.com', '07032138025', '$2b$10$FCOD5ScnMIe0FvZV/DxwR.G9Te.1SN3n9K67m05a3RvSQ68CMvz8u', 'J3ZafYGEUM3e8gXMRszXRGERXH4tGiguu5jPi4au', '0.00', 0, '2021-07-20 15:33:11', '2021-07-20 15:33:11'),
(11, 'tope ajibuwa', 'tajibuwa5@gmail.com', '07032638025', '$2b$10$D6RbOxpVqfUZvx6q8d4aWO/cKXBjLHIBfRNb21c9JrsrvzX1WfU2G', 'rSGmcf8JmfFnAX4l3zwpU1U8KoSXJxhpNALLebX7', '0.00', 0, '2021-07-20 15:40:25', '2021-07-20 15:40:25'),
(12, 'tope ajibuwa', 'bmbmbmbm@gmail.com', '0954554567', '$2b$10$Xz2/5XIpTNomGxpQifjyQuVEhy9i2V1k8T.MTWrHgFcRwz7vLUq.u', '27AHiwgJl6JYdcrvNgBvHGBFNcy2ExRL6qhP1btd', '0.00', 1, '2021-07-20 16:02:05', '2021-08-26 16:37:33'),
(14, 'Holla-Malter', 'admin@hollajobs.com', '07064591940', '$2b$10$DbCdmPpO8agUWfaEKgakvO8kP/V.Y/aO05fSU1Nhn9i/VQDP4aqRS', '6dA0L4L66wlKvsBKD9BHT0ElSjwpzluhxvA4r4H2', '95900.00', 1, '2021-07-17 13:57:05', '2021-08-26 16:37:31');

-- --------------------------------------------------------

--
-- Table structure for table `name_enquiries`
--

CREATE TABLE `name_enquiries` (
  `id` int(11) NOT NULL,
  `merchants_id` int(11) NOT NULL,
  `telco` varchar(20) NOT NULL,
  `msisdn` varchar(16) NOT NULL,
  `country` varchar(3) NOT NULL,
  `status` int(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `name_enquiries`
--

INSERT INTO `name_enquiries` (`id`, `merchants_id`, `telco`, `msisdn`, `country`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 'moov', '07064591948', 'BJ', 1, '2021-08-26 09:53:18', '2021-08-26 09:53:18');

-- --------------------------------------------------------

--
-- Table structure for table `transfer_transactions`
--

CREATE TABLE `transfer_transactions` (
  `id` int(11) NOT NULL,
  `merchant_id` int(11) NOT NULL,
  `from_telco` varchar(16) NOT NULL,
  `from_msisdn` varchar(15) NOT NULL,
  `from_response` text DEFAULT NULL,
  `to_telco` varchar(16) NOT NULL,
  `to_msisdn` varchar(15) NOT NULL,
  `to_response` text DEFAULT NULL,
  `amount` float(16,2) NOT NULL,
  `transfer_status` int(1) NOT NULL DEFAULT 0,
  `failure_status` int(1) NOT NULL DEFAULT 0,
  `country` varchar(3) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `transfer_transactions`
--

INSERT INTO `transfer_transactions` (`id`, `merchant_id`, `from_telco`, `from_msisdn`, `from_response`, `to_telco`, `to_msisdn`, `to_response`, `amount`, `transfer_status`, `failure_status`, `country`, `created_at`, `updated_at`) VALUES
(1, 2, 'mtn', '07064591948', '[object Object]', 'moov', '229708233322', '{\"transactionid\":\"420210122000188\",\"status\":\"SUCCESS\"}', 400.00, 3, 0, 'bj', '2021-07-31 08:56:31', '2021-08-02 13:54:47'),
(2, 2, 'mtn', '09034591951', '{\"status\":\"NOT_ENOUGH_FUNDS\"}', 'moov', '229708390001', NULL, 400.00, 0, 1, 'ng', '2021-07-31 09:11:46', '2021-08-02 13:54:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fee_charges`
--
ALTER TABLE `fee_charges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name_uniqueness` (`name`,`country`) USING BTREE;

--
-- Indexes for table `merchants`
--
ALTER TABLE `merchants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_uniqueness` (`email`),
  ADD UNIQUE KEY `phone_uniqueness` (`phone`),
  ADD UNIQUE KEY `api_key_uniqueness` (`api_key`);

--
-- Indexes for table `name_enquiries`
--
ALTER TABLE `name_enquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `merchant_id_constrait` (`merchants_id`);

--
-- Indexes for table `transfer_transactions`
--
ALTER TABLE `transfer_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `merchant_id_constraint` (`merchant_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fee_charges`
--
ALTER TABLE `fee_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `merchants`
--
ALTER TABLE `merchants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `name_enquiries`
--
ALTER TABLE `name_enquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `transfer_transactions`
--
ALTER TABLE `transfer_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `name_enquiries`
--
ALTER TABLE `name_enquiries`
  ADD CONSTRAINT `merchant_id_constrait` FOREIGN KEY (`merchants_id`) REFERENCES `merchants` (`id`);

--
-- Constraints for table `transfer_transactions`
--
ALTER TABLE `transfer_transactions`
  ADD CONSTRAINT `merchant_id_constraint` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
