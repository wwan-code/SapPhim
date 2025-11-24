-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th10 24, 2025 lúc 12:43 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `rapre_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_logs`
--

CREATE TABLE `ai_logs` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `prompt` text NOT NULL,
  `response` text NOT NULL,
  `type` varchar(255) DEFAULT 'general' COMMENT 'Type of AI interaction: suggestMovie, chat, translate, generateMarketing, etc.',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional metadata about the AI interaction' CHECK (json_valid(`metadata`)),
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `title`, `slug`, `createdAt`, `updatedAt`) VALUES
(1, 'Phim lẻ', 'phim-le', '2025-09-04 15:48:27', '2025-09-04 15:48:27'),
(2, 'Phim bộ', 'phim-bo', '2025-09-04 15:48:34', '2025-09-04 15:48:34'),
(3, 'Phim chiếu rạp', 'phim-chieu-rap', '2025-09-04 15:48:40', '2025-09-04 15:48:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `userId` int(11) NOT NULL,
  `contentId` int(11) NOT NULL COMMENT 'ID của nội dung được bình luận',
  `contentType` varchar(255) NOT NULL COMMENT 'Loại nội dung (vd: "episode", "movie")',
  `parentId` int(11) DEFAULT NULL,
  `text` text NOT NULL,
  `likes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`likes`)),
  `reports` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`reports`)),
  `isSpoiler` tinyint(1) DEFAULT 0,
  `isPinned` tinyint(1) DEFAULT 0,
  `isEdited` tinyint(1) DEFAULT 0,
  `isApproved` tinyint(1) NOT NULL DEFAULT 1,
  `isHidden` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `comments`
--

INSERT INTO `comments` (`id`, `uuid`, `userId`, `contentId`, `contentType`, `parentId`, `text`, `likes`, `reports`, `isSpoiler`, `isPinned`, `isEdited`, `isApproved`, `isHidden`, `createdAt`, `updatedAt`) VALUES
(1, 'ac629e26-5252-4972-9660-d97dc44a0483', 1, 1, 'movie', NULL, 'Hé vloo', '[2]', '[]', 0, 0, 0, 1, 0, '2025-10-04 12:19:27', '2025-10-05 11:29:14'),
(2, 'dcdfce75-4db5-4611-ae24-10ec7c7a97c1', 1, 1, 'movie', 1, 'đc đó', '[1,2]', '[]', 0, 0, 0, 1, 0, '2025-10-05 05:00:30', '2025-10-05 07:02:01'),
(3, '782054d7-4e3c-4d49-8d58-f3a35cf334d3', 1, 1, 'movie', 2, 'thích nhé', '[]', '[]', 0, 0, 0, 1, 0, '2025-10-05 05:00:40', '2025-10-05 05:00:40'),
(4, '3a10acca-17ea-4a11-908e-a1e95816cea5', 1, 1, 'movie', 1, 'Bao giờ mới có tính năng gửi ảnh v??', '[]', '[]', 0, 0, 0, 1, 0, '2025-10-05 07:01:10', '2025-10-05 07:01:10'),
(5, '693bc0ee-7a9b-42d2-bc98-9a95a4d392da', 2, 1, 'movie', 2, 'oke e', '[]', '[]', 0, 0, 0, 1, 0, '2025-10-05 07:02:16', '2025-10-05 07:02:16'),
(6, '722bdcc3-8f35-4510-965d-44b32269c39c', 1, 1, 'movie', NULL, '[@Nghĩa Hoàng](/profile/XB1p1TCgPwf2TBLOKA9lszZnP4Z2) alooo', '[2]', '[]', 0, 0, 0, 1, 0, '2025-10-05 07:18:29', '2025-10-05 13:16:07'),
(7, '6f7b0ab6-d714-49f7-81cd-e22d384e0864', 1, 1, 'movie', NULL, '[@Nghĩa Hoàng](/profile/XB1p1TCgPwf2TBLOKA9lszZnP4Z2) fa', '[2,3,1]', '[]', 0, 0, 0, 1, 0, '2025-10-05 07:18:39', '2025-11-10 06:46:54'),
(8, 'b2ccaad4-f74d-46fc-b781-65e8ab48c9c0', 2, 1, 'movie', 7, 'chago', '[]', '[1]', 0, 0, 0, 1, 0, '2025-10-05 07:18:54', '2025-11-22 22:55:39'),
(9, '874ec290-082e-4fc2-aecb-6f99f9bdd4c9', 1, 1, 'movie', 8, 'coc cặc🖕', '[2]', '[]', 0, 0, 0, 1, 0, '2025-10-05 07:43:58', '2025-10-05 07:44:10'),
(13, 'a496b627-6439-4b97-a1c9-da6969b802ea', 1, 1, 'movie', 8, '[@Nghĩa Hoàng](/profile/XB1p1TCgPwf2TBLOKA9lszZnP4Z2) được nha', '[]', '[]', 0, 0, 0, 1, 0, '2025-11-10 05:17:46', '2025-11-10 05:17:46'),
(15, '6033eeff-2a79-4fc4-b4c5-2df2654a252c', 1, 1, 'episode', NULL, 'hello 1', '[]', '[]', 0, 0, 0, 1, 0, '2025-11-10 13:09:47', '2025-11-22 15:40:15'),
(17, '30dc3a7e-2fd6-4b42-8a1f-4956265f6989', 1, 37, 'movie', NULL, 'nội dung hay😃', '[1]', '[]', 0, 0, 0, 1, 0, '2025-11-15 20:09:23', '2025-11-24 04:58:54'),
(18, '5167c520-ca71-463f-996b-be7bd91ac472', 1, 37, 'movie', 17, 'fad dưq', '[1]', '[]', 0, 0, 0, 1, 0, '2025-11-22 15:40:05', '2025-11-22 15:40:12');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `countries`
--

INSERT INTO `countries` (`id`, `title`, `slug`, `createdAt`, `updatedAt`) VALUES
(1, 'Nhật Bản', 'nhat-ban', '2025-09-04 15:48:51', '2025-09-04 15:48:51'),
(2, 'Hàn Quốc', 'han-quoc', '2025-09-05 00:01:05', '2025-09-05 00:01:05'),
(3, 'Thái Lan', 'thai-lan', '2025-09-10 04:02:42', '2025-09-10 04:02:42'),
(4, 'Úc', 'uc', '2025-09-10 04:02:46', '2025-09-10 04:02:46'),
(5, 'Anh', 'anh', '2025-09-10 07:07:49', '2025-09-10 07:07:49'),
(6, 'Pháp', 'phap', '2025-09-10 07:08:01', '2025-09-10 07:08:01'),
(7, 'Hoa Kỳ', 'hoa-ky', '2025-09-10 07:57:52', '2025-09-10 07:57:52');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `episodes`
--

CREATE TABLE `episodes` (
  `id` int(11) NOT NULL,
  `uuid` char(36) NOT NULL,
  `episodeNumber` int(11) NOT NULL,
  `views` int(11) NOT NULL DEFAULT 0,
  `linkEpisode` varchar(255) NOT NULL,
  `movieId` int(11) NOT NULL,
  `duration` varchar(255) DEFAULT NULL,
  `hlsUrl` varchar(255) DEFAULT NULL,
  `status` enum('pending','processing','ready','error') NOT NULL DEFAULT 'pending',
  `jobId` varchar(255) DEFAULT NULL,
  `quality` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`quality`)),
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `episodes`
--

INSERT INTO `episodes` (`id`, `uuid`, `episodeNumber`, `views`, `linkEpisode`, `movieId`, `duration`, `hlsUrl`, `status`, `jobId`, `quality`, `createdAt`, `updatedAt`) VALUES
(14, '367876db-b892-423e-be7c-98bbb5447e43', 1, 18, '', 37, '00:00:15', '/uploads/videos/hls/367876db-b892-423e-be7c-98bbb5447e43/master.m3u8', 'ready', '16', '[\"1080p\",\"720p\",\"480p\"]', '2025-11-23 22:43:13', '2025-11-24 06:33:19'),
(17, 'cafaf1b6-6926-4263-acb1-e658530be8bd', 2, 5, '', 37, '00:00:15', '/uploads/videos/hls/cafaf1b6-6926-4263-acb1-e658530be8bd/master.m3u8', 'ready', '20', '[\"1080p\",\"720p\",\"480p\"]', '2025-11-24 01:18:26', '2025-11-24 03:49:21'),
(18, '11a515ca-8218-4262-b306-5eedf83a3f2a', 3, 1, '', 37, '00:00:15', '/uploads/videos/hls/11a515ca-8218-4262-b306-5eedf83a3f2a/master.m3u8', 'ready', '21', '[\"1440p\",\"1080p\",\"720p\",\"480p\"]', '2025-11-24 01:34:54', '2025-11-24 06:21:21'),
(19, '3068c3ff-dc95-42db-a5ec-e102af1726a2', 4, 2, '', 37, '00:00:15', '/uploads/videos/hls/3068c3ff-dc95-42db-a5ec-e102af1726a2/master.m3u8', 'ready', '22', '[\"1440p\",\"1080p\",\"720p\",\"480p\"]', '2025-11-24 01:41:27', '2025-11-24 04:17:08'),
(20, '11946785-1182-4e1f-89eb-32f75e1a8bd1', 5, 7, '', 37, '00:06:56', '/uploads/videos/hls/11946785-1182-4e1f-89eb-32f75e1a8bd1/master.m3u8', 'ready', '23', '[\"480p\"]', '2025-11-24 04:16:12', '2025-11-24 04:38:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `movieId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `favorites`
--

INSERT INTO `favorites` (`id`, `userId`, `movieId`, `createdAt`, `updatedAt`) VALUES
(2, 1, 26, '2025-11-09 07:22:01', '2025-11-09 07:22:01'),
(4, 1, 24, '2025-11-16 17:20:54', '2025-11-16 17:20:54');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `friendships`
--

CREATE TABLE `friendships` (
  `id` int(11) NOT NULL,
  `senderId` int(11) NOT NULL,
  `receiverId` int(11) NOT NULL,
  `status` enum('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `friendships`
--

INSERT INTO `friendships` (`id`, `senderId`, `receiverId`, `status`, `createdAt`, `updatedAt`) VALUES
(7, 2, 1, 'accepted', '2025-10-05 15:43:26', '2025-10-05 15:43:33'),
(19, 7, 1, 'accepted', '2025-11-22 23:50:50', '2025-11-22 23:51:09'),
(21, 1, 3, 'accepted', '2025-11-23 02:25:00', '2025-11-23 02:25:08');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `genres`
--

CREATE TABLE `genres` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `genres`
--

INSERT INTO `genres` (`id`, `title`, `slug`, `createdAt`, `updatedAt`) VALUES
(1, 'Fantasy', 'fantasy', '2025-09-04 15:13:22', '2025-09-04 15:13:22'),
(2, 'Adventure', 'adventure', '2025-09-04 15:13:27', '2025-09-04 15:13:27'),
(3, 'Isekai', 'isekai', '2025-09-04 15:13:32', '2025-09-04 15:13:32'),
(4, 'Action', 'action', '2025-09-04 15:13:37', '2025-09-04 15:13:37'),
(5, 'Sci-Fi', 'sci-fi', '2025-09-04 18:04:51', '2025-09-04 23:27:08'),
(8, 'Comedy', 'comedy', '2025-09-04 23:23:15', '2025-09-04 23:23:15'),
(9, 'Shounen', 'shounen', '2025-09-04 23:34:38', '2025-09-04 23:34:38'),
(10, 'Thriller', 'thriller', '2025-09-05 00:05:07', '2025-09-05 00:05:07'),
(11, 'Mystery', 'mystery', '2025-09-05 00:05:14', '2025-09-05 00:05:14'),
(12, 'Crime', 'crime', '2025-09-05 00:05:20', '2025-09-05 00:05:20'),
(13, 'Romance', 'romance', '2025-09-05 00:05:28', '2025-09-05 00:05:28'),
(14, 'Slice of Life', 'slice-of-life', '2025-09-05 01:03:04', '2025-09-05 01:03:04'),
(15, 'Supernatural', 'supernatural', '2025-09-05 01:03:16', '2025-09-05 01:03:16'),
(16, 'Shonen', 'shonen', '2025-09-05 05:34:32', '2025-09-05 05:34:32'),
(17, 'Dark Fantasy', 'dark-fantasy', '2025-09-09 11:23:09', '2025-09-09 11:23:09'),
(18, 'Horror', 'horror', '2025-09-09 11:23:15', '2025-09-09 11:23:15'),
(19, 'Harem', 'harem', '2025-09-09 12:06:00', '2025-09-09 12:06:00'),
(20, 'School', 'school', '2025-09-09 12:06:30', '2025-09-09 12:06:30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `loginhistories`
--

CREATE TABLE `loginhistories` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `ipAddress` varchar(255) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `deviceType` varchar(255) DEFAULT NULL,
  `loginAt` datetime NOT NULL,
  `logoutAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `loginhistories`
--

INSERT INTO `loginhistories` (`id`, `userId`, `provider`, `ipAddress`, `userAgent`, `deviceType`, `loginAt`, `logoutAt`) VALUES
(1, 2, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '2025-10-04 02:39:21', '2025-10-04 02:39:21'),
(2, 3, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '2025-10-07 11:40:04', '2025-10-07 11:40:04'),
(3, 7, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '2025-10-15 18:51:57', '2025-10-15 18:51:57'),
(4, 1, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-11 12:19:41', '2025-11-11 12:19:41'),
(5, 2, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-11 12:19:56', '2025-11-11 12:19:56'),
(6, 1, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-11 12:24:02', '2025-11-11 12:24:02'),
(7, 1, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-11 16:55:27', '2025-11-11 16:55:27'),
(8, 3, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-11 21:23:00', '2025-11-11 21:23:00'),
(9, 1, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', NULL, '2025-11-11 21:23:50', '2025-11-11 21:23:50'),
(10, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-13 19:05:49', '2025-11-13 19:05:49'),
(11, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-15 15:28:21', '2025-11-15 15:28:21'),
(12, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-15 15:28:25', '2025-11-15 15:28:25'),
(13, 1, 'local', '192.168.0.27', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.7339.164 Mobile/15E148 Safari/604.1', 'mobile', '2025-11-15 20:07:34', '2025-11-15 20:07:34'),
(14, 1, 'local', '192.168.0.20', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', 'mobile', '2025-11-16 14:22:41', '2025-11-16 14:22:41'),
(15, 1, 'local', '192.168.0.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-16 22:19:07', '2025-11-16 22:19:07'),
(16, 1, 'local', '192.168.0.28', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-18 06:01:07', '2025-11-18 06:01:07'),
(17, 1, 'local', '192.168.0.28', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-18 16:00:25', '2025-11-18 16:00:25'),
(18, 1, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 'desktop', '2025-11-19 00:22:59', '2025-11-19 00:22:59'),
(19, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-19 00:55:08', '2025-11-19 00:55:08'),
(20, 1, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 'desktop', '2025-11-19 00:56:32', '2025-11-19 00:56:32'),
(21, 2, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 'desktop', '2025-11-20 05:08:11', '2025-11-20 05:08:11'),
(22, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-21 20:43:56', '2025-11-21 20:43:56'),
(23, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-21 20:44:40', '2025-11-21 20:44:40'),
(24, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-21 20:44:53', '2025-11-21 20:44:53'),
(25, 2, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0', 'desktop', '2025-11-21 21:50:15', '2025-11-21 21:50:15'),
(26, 7, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-21 21:51:00', '2025-11-21 21:51:00'),
(27, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-22 02:05:27', '2025-11-22 02:05:27'),
(28, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-22 08:00:13', '2025-11-22 08:00:13'),
(29, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-22 08:22:01', '2025-11-22 08:22:01'),
(30, 17, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-22 08:30:29', '2025-11-22 08:30:29'),
(31, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-22 10:01:00', '2025-11-22 10:01:00'),
(32, 1, 'local', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-22 15:39:56', '2025-11-22 15:39:56'),
(33, 3, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-23 02:02:18', '2025-11-23 02:02:18'),
(34, 2, 'google', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'desktop', '2025-11-24 04:59:15', '2025-11-24 04:59:15');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `movies`
--

CREATE TABLE `movies` (
  `id` int(11) NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `titles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`titles`)),
  `slug` varchar(255) NOT NULL,
  `duration` varchar(255) DEFAULT NULL,
  `quality` varchar(255) DEFAULT NULL,
  `subtitles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`subtitles`)),
  `image` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image`)),
  `status` varchar(255) DEFAULT NULL,
  `views` int(11) NOT NULL DEFAULT 0,
  `countryId` int(11) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `belongToCategory` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `totalEpisodes` int(11) NOT NULL DEFAULT 0,
  `releaseDate` datetime DEFAULT NULL,
  `classification` varchar(255) DEFAULT NULL,
  `trailerUrl` varchar(255) DEFAULT NULL,
  `seriesId` int(11) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `season` varchar(255) DEFAULT NULL,
  `seoKeywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`seoKeywords`)),
  `marketingContent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`marketingContent`)),
  `director` varchar(255) DEFAULT NULL,
  `studio` varchar(255) DEFAULT NULL,
  `imdb` varchar(255) DEFAULT NULL,
  `cast` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cast`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `movies`
--

INSERT INTO `movies` (`id`, `uuid`, `titles`, `slug`, `duration`, `quality`, `subtitles`, `image`, `status`, `views`, `countryId`, `categoryId`, `year`, `belongToCategory`, `description`, `totalEpisodes`, `releaseDate`, `classification`, `trailerUrl`, `seriesId`, `type`, `tags`, `season`, `seoKeywords`, `marketingContent`, `director`, `studio`, `imdb`, `cast`, `createdAt`, `updatedAt`) VALUES
(1, '885906e1-3ea8-45bb-a866-523d92a027bc', '[{\"type\":\"default\",\"title\":\"Cỏ Bốn Lá Đen\"},{\"type\":\"Japanese\",\"title\":\"ブラッククローバー\"},{\"type\":\"English\",\"title\":\"Black Clover\"},{\"type\":\"Vietnamese\",\"title\":\"Cỏ Bốn Lá Đen\"},{\"type\":\"Original\",\"title\":\"ブラッククローバー\"}]', 'co-bon-la-den', '24 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/co-bon-la-den/poster-1757006461578-199764708.jpg\",\"bannerUrl\":\"/uploads/movies/co-bon-la-den/banner-1757006461582-88257543.png\",\"coverUrl\":\"/uploads/movies/co-bon-la-den/cover-1757006461640-372068105.jpg\"}', 'completed', 2455, 1, 2, 2017, 'Phim bộ', 'Trong một thế giới mà ma thuật quyết định tất cả, Asta sinh ra mà không hề có chút năng lực phép thuật nào. Quyết tâm vượt lên số phận, cậu ôm ấp giấc mơ trở thành Vua Pháp Sư, danh hiệu cao quý nhất của vương quốc. Với một cuốn Grimoire cỏ năm lá bí ẩn - biểu tượng của ác quỷ, và tinh thần không bao giờ bỏ cuộc, Asta gia nhập hội Kỵ Sĩ Ma Pháp Hắc Ngưu (Black Bulls) nổi tiếng là lập dị. Cùng với đối thủ kiêm người bạn thuở nhỏ Yuno – một thiên tài ma thuật bẩm sinh, Asta dấn thân vào cuộc phiêu lưu đầy thử thách, chiến đấu chống lại các thế lực tà ác và chứng minh rằng ngay cả một người không có phép thuật cũng có thể thay đổi thế giới.', 170, '2017-10-03 00:00:00', 'PG-13', '', NULL, 'series', '[\"Shonen\",\"Ma thuật\",\"Phiêu lưu\",\"Hành động\",\"Tình bạn\",\"Quyết tâm\",\"Grimoire\",\"Hiệp sĩ ma pháp\",\"Vua Pháp Sư\",\"Fantasy\"]', 'Phần 1', '[\"Black Clover anime\",\"xem Black Clover\",\"Cỏ Bốn Lá Đen\",\"Asta\",\"Yuno\",\"Vua Pháp Sư\",\"anime phép thuật\",\"shonen anime\",\"anime hành động\",\"Studio Pierrot\"]', '{\"vietnamese\":\"Hãy sẵn sàng cho một cuộc phiêu lưu đầy phép thuật, hành động và những tràng cười sảng khoái! Black Clover đưa bạn đến một thế giới nơi sức mạnh ma thuật là tất cả, nhưng chính ý chí và tinh thần kiên cường mới là thứ thực sự tạo nên sự khác biệt. Cùng Asta, chàng trai không phép thuật nhưng sở hữu Grimoire năm lá bí ẩn, chinh phục những thử thách không tưởng, kết bạn với những đồng đội lập dị nhất và chiến đấu vì ước mơ trở thành Vua Pháp Sư. Liệu một chàng trai không có phép thuật có thể thay đổi số phận của cả một vương quốc? Đừng bỏ lỡ câu chuyện đầy cảm hứng về sự quyết tâm, tình bạn và sức mạnh nội tại này!\",\"english\":\"Get ready for an epic journey filled with magic, action, and heartwarming humor! Black Clover plunges you into a world where magical power dictates everything, but it\'s the sheer will and indomitable spirit that truly make a difference. Follow Asta, a magicless boy with a mysterious five-leaf grimoire, as he overcomes impossible odds, befriends the quirkiest squad of magic knights, and fights for his dream of becoming the Wizard King. Can a boy without magic truly change the fate of a kingdom? Don\'t miss this inspiring tale of determination, friendship, and inner strength!\"}', 'Tatsuya Yoshihara', 'Pierrot', '7.9', '[{\"actor\":\"Gakuto Kajiwara\",\"role\":\"Asta\"},{\"actor\":\"Nobunaga Shimazaki\",\"role\":\"Yuno\"},{\"actor\":\"Kana Yuuki\",\"role\":\"Noelle Silva\"},{\"actor\":\"Junichi Suwabe\",\"role\":\"Yami Sukehiro\"}]', '2025-09-04 17:21:01', '2025-11-22 22:55:33'),
(10, 'b51dea9e-cec9-4de0-a4ca-4e2f87e7b4d3', '[{\"type\":\"default\",\"title\":\"Tiến Sĩ Đá\"},{\"type\":\"Japanese\",\"title\":\"ドクターストーン\"},{\"type\":\"English\",\"title\":\"Dr. Stone\"},{\"type\":\"Vietnamese\",\"title\":\"Bác Sĩ Đá\"},{\"type\":\"Original\",\"title\":\"Dr. Stone\"}]', 'tien-si-da', '23 phút/tập', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/tien-si-da/poster-1757012845394-152571680.jpg\",\"bannerUrl\":\"/uploads/movies/tien-si-da/banner-1757012845399-846689541.jpg\",\"coverUrl\":\"/uploads/movies/tien-si-da/cover-1757012845403-512152134.webp\"}', 'upcoming', 53, 1, 2, 2019, 'Phim lẻ', 'Khi mọi người trên thế giới đột ngột bị biến thành đá, thiên tài khoa học Senku Ishigami quyết tâm sử dụng kiến thức của mình để khôi phục lại nền văn minh. Cùng với người bạn thân Taiju Oki, Senku bắt đầu một cuộc hành trình phi thường để xây dựng lại thế giới từ đống tro tàn, chống lại những thế lực muốn duy trì trạng thái nguyên thủy của nhân loại. Một cuộc phiêu lưu khoa học đầy sáng tạo và kịch tính!', 24, '2019-07-05 00:00:00', 'PG-13', '', 1, 'series', '[\"Anime\",\"Khoa học\",\"Phiêu lưu\",\"Hậu tận thế\",\"Sinh tồn\"]', 'Phần 1', '[\"Dr. Stone\",\"Tiến Sĩ Đá\",\"Anime khoa học\",\"Senku Ishigami\",\"Anime phiêu lưu\",\"Xem anime online\",\"Review Dr. Stone\"]', '{\"vietnamese\":\"Chứng kiến sự trỗi dậy của khoa học trong một thế giới đổ nát! Dr. Stone - hành trình xây dựng lại nền văn minh đầy cảm hứng và hài hước. Đừng bỏ lỡ!\",\"english\":\"Witness the rise of science in a ruined world! Dr. Stone - an inspiring and humorous journey to rebuild civilization. Don\'t miss it!\"}', 'Shinya Iino', 'TMS Entertainment', '8.2', '[{\"actor\":\"Yusuke Kobayashi\",\"role\":\"Senku Ishigami\"},{\"actor\":\"Makoto Furukawa\",\"role\":\"Taiju Oki\"},{\"actor\":\"Kana Ichinose\",\"role\":\"Yuzuriha Ogawa\"}]', '2025-09-04 19:07:25', '2025-09-13 14:26:08'),
(11, 'dc1d0a43-6ec5-4a45-9581-d7f95782c880', '[{\"type\":\"default\",\"title\":\"Dr. Stone: Stone Wars\"},{\"type\":\"Japanese\",\"title\":\"ドクターストーン STONE WARS\"},{\"type\":\"English\",\"title\":\"Dr. Stone: Stone Wars\"},{\"type\":\"Original\",\"title\":\"Dr. Stone\"}]', 'dr-stone-stone-wars', '23 phút/tập', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/dr-stone-stone-wars/poster-1757027884167-827569548.webp\",\"bannerUrl\":\"/uploads/movies/dr-stone-stone-wars/banner-1757027884171-298125280.webp\",\"coverUrl\":\"/uploads/movies/dr-stone-stone-wars/cover-1757027884172-441287510.jpg\"}', 'completed', 22, 1, 2, 2021, 'Phim bộ', 'Tiếp nối sự kiện của phần đầu, Senku và Vương quốc Khoa học của mình đối mặt với Đế chế Stone của Tsukasa trong một cuộc chiến khoa học và sức mạnh. Với mục tiêu giải phóng tất cả mọi người khỏi hóa đá, Senku sử dụng trí thông minh và kiến thức khoa học của mình để tạo ra những phát minh mới, chiến đấu chống lại sức mạnh thể chất vượt trội của Tsukasa và quân đội của hắn. Liệu Senku có thể chiến thắng và mang lại một kỷ nguyên mới cho thế giới?', 11, '2021-01-14 00:00:00', 'PG-13', 'https://www.youtube.com/watch?v=q1Q_cE4X20Q', 1, 'series', '[\"Khoa học\",\"Hậu tận thế\",\"Phát minh\",\"Chiến tranh\",\"Shonen\"]', 'Phần 2', '[\"Dr. Stone Stone Wars\",\"anime Dr. Stone\",\"Vương quốc Khoa học\",\"Tsukasa\",\"Senku\",\"phim khoa học viễn tưởng\"]', '{\"vietnamese\":\"Cuộc chiến giữa khoa học và sức mạnh bùng nổ! Dr. Stone: Stone Wars - Chứng kiến Senku vượt qua giới hạn của bản thân để cứu lấy thế giới khỏi hóa đá!\",\"english\":\"The war between science and power explodes! Dr. Stone: Stone Wars - Witness Senku push his limits to save the world from petrification!\"}', 'Shinya Iino', 'TMS Entertainment', '7.8', '[{\"actor\":\"Yusuke Kobayashi\",\"role\":\"Senku Ishigami\"},{\"actor\":\"Makoto Furukawa\",\"role\":\"Taiju Oki\"},{\"actor\":\"Kana Hanazawa\",\"role\":\"Lillian Weinberg\"},{\"actor\":\"Yuichi Nakamura\",\"role\":\"Tsukasa Shishio\"}]', '2025-09-04 23:18:04', '2025-09-05 05:35:43'),
(13, '4c2bd11c-972f-446f-ad58-bf703c32e923', '[{\"type\":\"default\",\"title\":\"Dr. Stone: Ryusui\"},{\"type\":\"Japanese\",\"title\":\"Dr.STONE 龍水\"},{\"type\":\"English\",\"title\":\"Dr. Stone: Ryusui\"},{\"type\":\"Vietnamese\",\"title\":\"Dr. Stone: Tập đặc biệt Ryusui\"},{\"type\":\"Original\",\"title\":\"Dr.STONE 龍水\"}]', 'dr-stone-ryusui', '28 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/dr-stone-ryusui/poster-1757030338184-394016358.webp\",\"bannerUrl\":\"/uploads/movies/dr-stone-ryusui/banner-1757030338186-380127028.jpg\",\"coverUrl\":\"/uploads/movies/dr-stone-ryusui/cover-1757030338190-862134677.jpg\"}', 'completed', 32, 1, 2, 2022, 'Phim bộ', 'Sau khi kết thúc Cuộc Chiến Tối Thượng, Vương quốc Khoa học của Senku đối mặt với thử thách lớn nhất từ trước đến nay: vượt đại dương để tìm ra bí ẩn đằng sau sự hóa đá toàn nhân loại. Để thực hiện hải trình vĩ đại này, họ cần một thuyền trưởng tài ba. Lựa chọn duy nhất là hồi sinh Nanami Ryusui - người thừa kế của một tập đoàn hàng hải khổng lồ, một tay chơi siêu hạng và một thuyền trưởng thiên tài với lòng tham vô đáy. Tập đặc biệt này là cầu nối quan trọng giữa mùa 2 và mùa 3, tập trung vào cuộc hành trình chế tạo con tàu đầu tiên của thế giới đá và những thỏa thuận dở khóc dở cười với Ryusui để biến giấc mơ ra khơi thành hiện thực.', 2, '2022-07-10 00:00:00', 'PG-13', 'https://www.youtube.com/watch?v=kF3ySAf41cs', 1, 'series', '[\"khoa học\",\"sinh tồn\",\"hậu tận thế\",\"xây dựng văn minh\",\"phiêu lưu biển cả\",\"phát minh\",\"chế tạo tàu\"]', 'Phần Special', '[\"Dr. Stone Ryusui\",\"Dr. Stone special\",\"Dr. Stone tập đặc biệt\",\"anime khoa học viễn tưởng\",\"xem Dr. Stone Ryusui vietsub\",\"Nanami Ryusui\",\"Dr. Stone phần 3\"]', '{\"vietnamese\":\"Hành trình vĩ đại nhất của nhân loại sắp bắt đầu! Vương quốc Khoa học cần vượt đại dương, và họ chỉ có một lựa chọn: hồi sinh thuyền trưởng tham lam nhất thế giới, Nanami Ryusui! Đón xem tập đặc biệt hoành tráng, cầu nối giữa hai mùa phim, nơi những phát minh táo bạo và những thỏa thuận không tưởng sẽ đưa Senku và các bạn ra khơi!\",\"english\":\"The greatest journey of humanity is about to begin! The Kingdom of Science must conquer the seas, and they have only one choice: revive the world\'s greediest captain, Ryusui Nanami! Witness the epic special that bridges the seasons, where daring inventions and unbelievable deals will set Senku and his friends on a course for the new world!\"}', 'Shinya Iino', 'TMS Entertainment', '8.1', '[{\"actor\":\"Yusuke Kobayashi\",\"role\":\"Senku Ishigami (Lồng tiếng)\"},{\"actor\":\"Ryota Suzuki\",\"role\":\"Ryusui Nanami (Lồng tiếng)\"},{\"actor\":\"Gen Satou\",\"role\":\"Chrome (Lồng tiếng)\"},{\"actor\":\"Manami Numakura\",\"role\":\"Kohaku (Lồng tiếng)\"},{\"actor\":\"Kengo Kawanishi\",\"role\":\"Gen Asagiri (Lồng tiếng)\"}]', '2025-09-04 23:58:58', '2025-09-05 01:32:47'),
(14, '3de51fbf-7b4b-41a0-869f-b1c8e9038e20', '[{\"type\":\"default\",\"title\":\"Lãng Khách\"},{\"type\":\"English\",\"title\":\"Vagabond\"},{\"type\":\"Vietnamese\",\"title\":\"Lãng Khách\"},{\"type\":\"Original\",\"title\":\"배가본드\"}]', 'lang-khach', 'Khoảng 65 phút/tập', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/lang-khach/poster-1757031001220-427019216.webp\",\"bannerUrl\":\"/uploads/movies/lang-khach/banner-1757031001220-614055893.jpg\",\"coverUrl\":\"/uploads/movies/lang-khach/cover-1757031001221-63346729.webp\"}', 'completed', 41, 2, 2, 2019, 'Phim bộ', 'Một vụ tai nạn máy bay thảm khốc đã cướp đi sinh mạng của người cháu trai yêu quý, đẩy diễn viên đóng thế Cha Dal-geon vào một cuộc hành trình nguy hiểm để tìm kiếm sự thật. Anh tình cờ phát hiện ra đây không phải là một tai nạn đơn thuần mà là một phần của mạng lưới âm mưu tham nhũng và khủng bố quốc tế. Cùng với Go Hae-ri, một nữ điệp viên của Cục Tình báo Quốc gia (NIS), họ dấn thân vào một cuộc điều tra đầy rẫy hiểm nguy, đối mặt với những thế lực che giấu sự thật kinh hoàng.', 16, '2019-09-20 00:00:00', 'PG-13', 'https://www.youtube.com/watch?v=PndjeodkGj8', NULL, 'series', '[\"Action\",\"Spy\",\"Thriller\",\"Conspiracy\",\"Revenge\",\"Investigation\"]', 'Phần 1', '[\"Vagabond\",\"Lãng Khách\",\"phim Lãng Khách\",\"Lee Seung-gi\",\"Bae Suzy\",\"phim Hàn Quốc hành động\",\"phim điệp viên\",\"K-drama\",\"배가본드\",\"Vagabond 2019\"]', '{\"vietnamese\":\"Siêu phẩm hành động bom tấn với kinh phí 25 tỷ won! \'Lãng Khách\' sẽ đưa bạn vào một cuộc rượt đuổi nghẹt thở khắp các châu lục, từ Maroc đến Bồ Đào Nha. Với những pha hành động mãn nhãn và một cốt truyện âm mưu không thể đoán trước, liệu một người bình thường có thể lật đổ cả một thế lực ngầm khổng lồ? Hãy cùng theo dõi hành trình đi tìm công lý của Cha Dal-geon và Go Hae-ri.\",\"english\":\"A blockbuster action thriller with a ₩25 billion budget! \'Vagabond\' takes you on a breathtaking chase across continents, from Morocco to Portugal. Featuring spectacular action sequences and an unpredictable conspiracy plot, can an ordinary man bring down a colossal hidden power? Follow the journey for justice with Cha Dal-geon and Go Hae-ri.\"}', 'Yoo In-sik', 'Celltrion Entertainment', '8.1', '[{\"actor\":\"Lee Seung-gi\",\"role\":\"Cha Dal-geon\"},{\"actor\":\"Bae Suzy\",\"role\":\"Go Hae-ri\"},{\"actor\":\"Shin Sung-rok\",\"role\":\"Gi Tae-ung\"},{\"actor\":\"Lee Kyoung-young\",\"role\":\"Edward Park\"},{\"actor\":\"Moon Jeong-hee\",\"role\":\"Jessica Lee\"}]', '2025-09-05 00:10:01', '2025-09-05 06:05:19'),
(15, 'b04431a6-8265-48bf-85c3-70e6e23dc7ed', '[{\"type\":\"default\",\"title\":\"Clevatess: Vua Quái Thú, Đứa Bé và Dũng Sĩ Xác Chết\"},{\"type\":\"Japanese\",\"title\":\"Clevatess: Majuu no Ou to Akago to Shikabane no Yuusha\"},{\"type\":\"English\",\"title\":\"Clevatess: The King of the Magic Beasts, the Baby, and the Corpse Hero\"},{\"type\":\"Vietnamese\",\"title\":\"Clevatess: Vua Quái Thú, Đứa Bé và Dũng Sĩ Xác Chết\"},{\"type\":\"Original\",\"title\":\"Clevatess: Majuu no Ou to Akago to Shikabane no Yuusha\"}]', 'clevatess-vua-quai-thu-dua-be-va-dung-si-xac-chet', '24 phút', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/clevatess-vua-quai-thu-dua-be-va-dung-si-xac-chet/poster-1757034688653-469450837.webp\",\"bannerUrl\":\"/uploads/movies/clevatess-vua-quai-thu-dua-be-va-dung-si-xac-chet/banner-1757034688657-559160715.webp\",\"coverUrl\":\"/uploads/movies/clevatess-vua-quai-thu-dua-be-va-dung-si-xac-chet/cover-1757034688658-232560491.webp\"}', 'ongoing', 33, 1, 2, 2025, 'Phim bộ', 'Sau khi thoát khỏi phong ấn, vị Vua Quái Thú Clevatess hùng mạnh tái sinh và tình cờ gặp một đứa bé sơ sinh loài người. Hắn quyết định đặt tên đứa bé là Mia và nuôi dưỡng cô bé, bắt đầu một cuộc hành trình bất ngờ trong thế giới đầy phép thuật và hiểm nguy. Khi cuộc sống mới của Clevatess và Mia dần ổn định, họ lại bị cuốn vào vòng xoáy của những bí ẩn từ quá khứ, đặc biệt là sự xuất hiện của một \'dũng sĩ xác chết\' bí ẩn. Đây là câu chuyện cảm động và kịch tính về tình cảm gia đình bất đắc dĩ giữa một chúa tể quỷ và một đứa trẻ, cùng những thử thách lớn lao mà họ phải đối mặt.', 12, '2025-01-01 00:00:00', 'PG-13', '', NULL, 'series', '[\"Fantasy\",\"Action\",\"Adventure\",\"Demon Lord\",\"Found Family\",\"Raising Child\",\"Magic\",\"Light Novel Adaptation\",\"Supernatural\"]', 'Phần 1', '[\"Clevatess\",\"Vua Quái Thú\",\"Dũng Sĩ Xác Chết\",\"anime 2025\",\"fantasy anime\",\"demon lord anime\",\"manga adaptation\",\"Hoods Entertainment\",\"Jun Kawagoe\",\"anime nuôi con\"]', '{\"vietnamese\":\"Chuẩn bị cho một cuộc phiêu lưu fantasy độc nhất vô nhị! \\\"Clevatess: Vua Quái Thú, Đứa Bé và Dũng Sĩ Xác Chết\\\" sẽ đưa bạn vào một thế giới nơi một vị vua quỷ đáng sợ trở thành người cha bất đắc dĩ của một đứa bé loài người. Đối mặt với nguy hiểm từ mọi phía và một \'dũng sĩ xác chết\' bí ẩn, liệu tình yêu thương có thể chinh phục mọi thứ? Đón xem siêu phẩm anime đầy kịch tính và cảm động này vào năm 2025 để khám phá một câu chuyện về gia đình, phép thuật và định mệnh!\",\"english\":\"Prepare for an extraordinary and heartwarming fantasy adventure! \\\"Clevatess: The King of the Magic Beasts, the Baby, and the Corpse Hero\\\" plunges you into a world where a fearsome demon lord becomes the unlikely father to a human child. Facing dangers from all sides and a mysterious \'corpse hero,\' can love transcend all boundaries? Join this thrilling and emotional anime masterpiece in 2025 to discover a tale of family, magic, and destiny!\"}', 'Jun Kawagoe', 'Hoods Entertainment', '', '[]', '2025-09-05 01:11:28', '2025-11-22 01:30:26'),
(16, 'ce394e63-4866-4683-ba2d-8b11a23e3bee', '[{\"type\":\"default\",\"title\":\"Khải Huyền Dị Giới Mynoghra: Chinh Phục Thế Giới Bắt Đầu Từ Nền Văn Minh Đổ Nát\"},{\"type\":\"Japanese\",\"title\":\"異世界黙示録マイノグーラ ～破滅の文明で始める世界征服～\"},{\"type\":\"English\",\"title\":\"Isekai Mokushiroku Mynoghra: World Conquest by Starting with the Civilization of Ruin\"},{\"type\":\"Vietnamese\",\"title\":\"Khải Huyền Dị Giới Mynoghra\"},{\"type\":\"Original\",\"title\":\"Isekai Mokushiroku Mynoghra: Hametsu no Bunmei de Hajimeru Sekai Seifuku\"}]', 'khai-huyen-di-gioi-mynoghra-chinh-phuc-the-gioi-bat-dau-tu-nen-van-minh-do-nat', '24 phút', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/khai-huyen-di-gioi-mynoghra-chinh-phuc-the-gioi-bat-dau-tu-nen-van-minh-do-nat/poster-1757035921909-285283803.jpg\",\"bannerUrl\":\"/uploads/movies/khai-huyen-di-gioi-mynoghra-chinh-phuc-the-gioi-bat-dau-tu-nen-van-minh-do-nat/banner-1757035921914-292299535.jpg\",\"coverUrl\":\"/uploads/movies/khai-huyen-di-gioi-mynoghra-chinh-phuc-the-gioi-bat-dau-tu-nen-van-minh-do-nat/cover-1757035921925-141342659.jpg\"}', 'ongoing', 1128590, 1, 2, 2025, 'Phim lẻ', 'Iryuu Takuto, một game thủ chiến thuật xuất chúng, bất ngờ được triệu hồi đến một thế giới khác trong vai trò của một vị thần hoang tàn – Mynoghra. Tại đây, anh phải đối mặt với thực tại nghiệt ngã: nền văn minh mà anh cai quản đang trên bờ vực sụp đổ, và chủng tộc dưới trướng anh đang bị săn lùng. Với kiến thức và kỹ năng chiến lược đỉnh cao từ thế giới cũ, Takuto phải xây dựng lại đế chế từ đống đổ nát, sử dụng các chủng tộc và quái vật từ tựa game yêu thích của mình để chinh phục và thống trị thế giới mới này. Liệu một vị thần của sự hủy diệt có thể kiến tạo một tương lai mới, hay chỉ mang đến thêm đổ nát?', 12, '2025-01-08 00:00:00', 'TV-14', '', NULL, 'series', '[\"Isekai\",\"Fantasy\",\"Strategy\",\"Kingdom Building\",\"Dark Fantasy\",\"Game Elements\",\"Villain Protagonist\",\"Reincarnation\",\"Magic\",\"Monsters\",\"World Conquest\"]', 'Phần 1', '[\"Isekai Mokushiroku Mynoghra anime\",\"Mynoghra anime\",\"World Conquest by Starting with the Civilization of Ruin anime\",\"Isekai strategy anime\",\"kingdom building anime\",\"villain protagonist isekai\",\"isekai light novel adaptation\",\"fantasy anime 202X\",\"new isekai anime\",\"khải huyền dị giới mynoghra\"]', '{\"vietnamese\":\"Bạn có sẵn sàng xây dựng lại một đế chế từ tro tàn? \\\"Khải Huyền Dị Giới Mynoghra\\\" đưa bạn vào hành trình của Iryuu Takuto, một game thủ chiến thuật bị ném vào vai một vị thần đổ nát với nhiệm vụ chinh phục thế giới. Khám phá một thế giới fantasy đầy rẫy hiểm nguy, nơi mỗi quyết định chiến lược sẽ định đoạt số phận của bạn và chủng tộc của bạn. Liệu Takuto sẽ trở thành một bạo chúa hay một vị cứu tinh? Đón xem cuộc phiêu lưu sử thi đầy kịch tính, chiến lược và ma thuật này!\",\"english\":\"Are you ready to forge an empire from the ashes of ruin? \\\"Isekai Mokushiroku Mynoghra\\\" plunges you into the epic journey of Iryuu Takuto, a master strategist reborn as a God of Ruin tasked with world conquest. Explore a perilous fantasy world where every strategic decision dictates the fate of your nascent civilization. Will Takuto become a tyrant or a savior? Prepare for a thrilling adventure filled with grand strategy, dark magic, and the ultimate test of leadership!\"}', 'Naoyuki Itou', 'Madhouse', '7.5', '[{\"actor\":\"Takehito Koyasu\",\"role\":\"Iryuu Takuto / Mynoghra\"},{\"actor\":\"Inori Minase\",\"role\":\"Alice\"}]', '2025-09-05 01:32:01', '2025-09-09 10:32:40'),
(17, 'e6d6b8b1-a7c2-45d1-87d8-0cb1929f5241', '[{\"type\":\"default\",\"title\":\"Nàng Búp Bê Biết Yêu\"},{\"type\":\"Japanese\",\"title\":\"その着せ替え人形は恋をする\"},{\"type\":\"English\",\"title\":\"My Dress-Up Darling\"},{\"type\":\"Vietnamese\",\"title\":\"Nàng Búp Bê Biết Yêu\"},{\"type\":\"Original\",\"title\":\"Sono Bisque Doll wa Koi wo Suru\"}]', 'nang-bup-be-biet-yeu', '24 phút/tập', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/nang-bup-be-biet-yeu/poster-1757036487372-288643088.jpg\",\"bannerUrl\":\"/uploads/movies/nang-bup-be-biet-yeu/banner-1757036487394-732510657.jpg\",\"coverUrl\":\"/uploads/movies/nang-bup-be-biet-yeu/cover-1757036487412-790188696.avif\"}', 'completed', 28, 1, 2, 2022, 'Phim bộ', 'Wakana Gojo, một nam sinh cao trung nhút nhát với đam mê làm búp bê Hina truyền thống, luôn cảm thấy lạc lõng với bạn bè. Cuộc sống của cậu thay đổi khi Marin Kitagawa, một cô nàng gyaru xinh đẹp, nổi tiếng và hướng ngoại, tình cờ phát hiện ra tài năng may vá phi thường của cậu. Với ước mơ cháy bỏng là được cosplay thành nhân vật mình yêu thích, Marin đã nhờ Gojo giúp cô tạo ra những bộ trang phục hoàn hảo. Mối quan hệ giữa hai con người tưởng chừng như ở hai thế giới khác biệt dần nảy nở, đưa họ vào thế giới cosplay đầy màu sắc và những khoảnh khắc lãng mạn, hài hước khó quên.', 12, '2022-01-09 00:00:00', 'PG-13', 'https://www.youtube.com/watch?v=kFxBw5U4G5g', NULL, 'series', '[\"Cosplay\",\"Gyaru\",\"Học đường\",\"Lãng mạn\",\"Tình cảm\",\"Đời thường\",\"Otaku\"]', 'Phần 1', '[\"Nàng Búp Bê Biết Yêu\",\"My Dress-Up Darling\",\"Sono Bisque Doll wa Koi wo Suru\",\"anime cosplay\",\"anime tình cảm\",\"Wakana Gojo\",\"Marin Kitagawa\",\"phim rom-com học đường\",\"CloverWorks\"]', '{\"vietnamese\":\"Khi thế giới của một nghệ nhân búp bê Hina trầm lặng va chạm với vũ trụ rực rỡ của một nữ hoàng gyaru đam mê cosplay, một câu chuyện tình yêu độc đáo và ngọt ngào bắt đầu. Đừng bỏ lỡ \'Nàng Búp Bê Biết Yêu\' - bộ anime sẽ sưởi ấm trái tim bạn bằng sự hài hước, những khoảnh khắc lãng mạn và hình ảnh mãn nhãn!\",\"english\":\"When the world of a quiet Hina doll artisan collides with the vibrant universe of a gyaru queen passionate about cosplay, a uniquely sweet love story begins. Don\'t miss \'My Dress-Up Darling\'—the anime that will warm your heart with its humor, romance, and stunning visuals!\"}', 'Keisuke Shinohara', 'CloverWorks', '8.3', '[{\"actor\":\"Shoya Ishige\",\"role\":\"Wakana Gojo (voice)\"},{\"actor\":\"Hina Suguta\",\"role\":\"Marin Kitagawa (voice)\"},{\"actor\":\"Atsumi Tanezaki\",\"role\":\"Sajuna Inui (voice)\"},{\"actor\":\"Hina Yomiya\",\"role\":\"Shinju Inui (voice)\"}]', '2025-09-05 01:40:07', '2025-09-05 05:35:37'),
(18, 'ecade46d-9080-4359-b7f5-124cfdbca0fc', '[{\"type\":\"default\",\"title\":\"Thanh Gươm Diệt Quỷ\"},{\"type\":\"Japanese\",\"title\":\"鬼滅の刃\"},{\"type\":\"English\",\"title\":\"Demon Slayer: Kimetsu no Yaiba\"},{\"type\":\"Original\",\"title\":\"Kimetsu no Yaiba\"}]', 'thanh-guom-diet-quy', '24 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/thanh-guom-diet-quy/poster-1757050816599-64373213.webp\",\"bannerUrl\":\"/uploads/movies/thanh-guom-diet-quy/banner-1757050816602-757538843.jpg\",\"coverUrl\":\"/uploads/movies/thanh-guom-diet-quy/cover-1757050816603-455898243.avif\"}', 'completed', 23, 1, 2, 2019, 'Phim bộ', 'Bước vào thế giới đầy khắc nghiệt của \'Thanh Gươm Diệt Quỷ\' Phần 1, nơi cậu bé Tanjiro Kamado trải qua bi kịch mất cả gia đình dưới tay quỷ dữ, chỉ còn cô em gái Nezuko may mắn sống sót nhưng lại biến thành quỷ. Với quyết tâm mãnh liệt, Tanjiro dấn thân vào con đường đầy nguy hiểm để trở thành một Thợ Săn Quỷ, tìm cách chữa khỏi cho em gái và trả thù cho gia đình. Hành trình của họ là sự kết hợp giữa những trận chiến kiếm thuật mãn nhãn, tình anh em cảm động và khám phá bí ẩn về thế giới quỷ.', 26, '2019-04-06 00:00:00', 'PG-13', '', NULL, 'series', '[\"Anime\",\"Shonen\",\"Hành động\",\"Phiêu lưu\",\"Kỳ ảo\",\"Diệt quỷ\",\"Nhật Bản\",\"Ufotable\",\"Tình cảm gia đình\",\"Siêu nhiên\",\"Kiếm thuật\"]', 'Phần 1', '[\"Thanh Gươm Diệt Quỷ Phần 1\",\"Demon Slayer Season 1\",\"Kimetsu no Yaiba anime\",\"Tanjiro Kamado\",\"Nezuko Kamado\",\"anime hành động\",\"phim Nhật Bản\",\"xem Thanh Gươm Diệt Quỷ\",\"anime hay nhất\",\"Ufotable\",\"Thợ Săn Quỷ\",\"anime fantasy\"]', '{\"vietnamese\":\"Chuẩn bị cho một cuộc phiêu lưu không thể nào quên! \'Thanh Gươm Diệt Quỷ\' Phần 1 sẽ đưa bạn từ những cảm xúc bi thương nhất đến những pha hành động đỉnh cao với đồ họa tuyệt mỹ. Hãy cùng Tanjiro và Nezuko khám phá sức mạnh của tình anh em và ý chí bất khuất trong cuộc chiến chống lại cái ác. Một kiệt tác anime mà bạn không thể bỏ lỡ!\",\"english\":\"Prepare for an unforgettable adventure! \'Demon Slayer: Kimetsu no Yaiba\' Season 1 will take you from the deepest emotional lows to the most breathtaking action sequences with stunning animation. Join Tanjiro and Nezuko as they uncover the power of sibling bonds and indomitable will in their fight against evil. An anime masterpiece you simply cannot miss!\"}', 'Haruo Sotozaki', 'Ufotable', '8.7', '[{\"actor\":\"Natsuki Hanae\",\"role\":\"Tanjiro Kamado\"},{\"actor\":\"Akari Kitō\",\"role\":\"Nezuko Kamado\"},{\"actor\":\"Hiro Shimono\",\"role\":\"Zenitsu Agatsuma\"},{\"actor\":\"Yoshitsugu Matsuoka\",\"role\":\"Inosuke Hashibira\"},{\"actor\":\"Takahiro Sakurai\",\"role\":\"Giyu Tomioka\"}]', '2025-09-05 05:40:16', '2025-09-13 14:25:57'),
(19, '78348747-abc3-4e01-915b-36ab4619135b', '[{\"type\":\"default\",\"title\":\"Thanh Gươm Diệt Quỷ: Chuyến Tàu Vô Tận\"},{\"type\":\"Japanese\",\"title\":\"鬼滅の刃 無限列車編\"},{\"type\":\"English\",\"title\":\"Demon Slayer: Kimetsu no Yaiba – The Movie: Mugen Train\"},{\"type\":\"Vietnamese\",\"title\":\"Demon Slayer: Chuyến Tàu Bất Tận\"},{\"type\":\"Original\",\"title\":\"鬼滅の刃\"}]', 'thanh-guom-diet-quy-chuyen-tau-vo-tan', '117 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/thanh-guom-diet-quy-chuyen-tau-vo-tan/poster-1757051499905-247697656.jpg\",\"bannerUrl\":\"/uploads/movies/thanh-guom-diet-quy-chuyen-tau-vo-tan/banner-1757051499909-731485836.jpg\",\"coverUrl\":\"/uploads/movies/thanh-guom-diet-quy-chuyen-tau-vo-tan/cover-1757051499909-427270402.jpg\"}', 'upcoming', 21, 1, 3, 2020, 'Phim lẻ', 'Nối tiếp những sự kiện kịch tính của mùa đầu tiên, Thanh Gươm Diệt Quỷ: Chuyến Tàu Vô Tận đưa Tanjiro, Nezuko, Zenitsu và Inosuke lên chuyến tàu Mugen để cùng Viêm Trụ Kyojuro Rengoku điều tra một loạt vụ mất tích bí ẩn. Họ nhanh chóng phát hiện ra mình đang đối mặt với một Ác Quỷ cấp thấp cực kỳ nguy hiểm, Enmu, kẻ có khả năng thao túng giấc mơ và gieo rắc nỗi kinh hoàng. Cuộc chiến sinh tử trên chuyến tàu định mệnh này không chỉ thử thách sức mạnh thể chất mà còn là bài kiểm tra ý chí và lòng dũng cảm của các kiếm sĩ diệt quỷ.', 1, '2020-10-16 00:00:00', 'PG-13', 'https://www.youtube.com/watch?v=AT21r4dK1rI', NULL, 'movie', '[\"Anime\",\"Shonen\",\"Hành Động\",\"Phiêu Lưu\",\"Kỳ Ảo\",\"Siêu Nhiên\",\"Diệt Quỷ\",\"Tanjiro\",\"Rengoku\",\"Ufotable\"]', 'Phần Movie', '[\"Thanh Gươm Diệt Quỷ Chuyến Tàu Vô Tận\",\"Demon Slayer Mugen Train\",\"Kimetsu no Yaiba Movie\",\"Phim Hoạt Hình Nhật Bản\",\"Anime chiếu rạp\",\"Tanjiro Kamado\",\"Kyojuro Rengoku\",\"Ufotable anime\",\"Kimetsu no Yaiba phần movie\",\"Phim diệt quỷ\"]', '{\"vietnamese\":\"Đừng bỏ lỡ siêu phẩm anime hành động đã xô đổ mọi kỷ lục phòng vé! Thanh Gươm Diệt Quỷ: Chuyến Tàu Vô Tận sẽ đưa bạn vào một cuộc phiêu lưu nghẹt thở, nơi tình bạn, lòng dũng cảm và tinh thần bất khuất được thử thách đến tột cùng. Hình ảnh mãn nhãn, âm nhạc đỉnh cao và những trận chiến không thể nào quên đang chờ đón bạn. Hãy cùng Tanjiro và những người bạn đối mặt với Ác Quỷ hùng mạnh nhất trên chuyến tàu định mệnh!\",\"english\":\"Don\'t miss the record-breaking anime action masterpiece! Demon Slayer: Kimetsu no Yaiba – The Movie: Mugen Train will take you on a breathtaking adventure where friendship, courage, and an unyielding spirit are tested to their limits. Stunning visuals, an epic soundtrack, and unforgettable battles await you. Join Tanjiro and his companions as they confront the most powerful demon on this fated train!\"}', 'Haruo Sotozaki', 'Ufotable', '8.2', '[{\"actor\":\"Natsuki Hanae\",\"role\":\"Tanjiro Kamado\"},{\"actor\":\"Akari Kitō\",\"role\":\"Nezuko Kamado\"},{\"actor\":\"Hiro Shimono\",\"role\":\"Zenitsu Agatsuma\"},{\"actor\":\"Yoshitsugu Matsuoka\",\"role\":\"Inosuke Hashibira\"},{\"actor\":\"Satoshi Hino\",\"role\":\"Kyojuro Rengoku\"},{\"actor\":\"Daisuke Hirakawa\",\"role\":\"Enmu\"},{\"actor\":\"Akira Ishida\",\"role\":\"Akaza\"}]', '2025-09-05 05:51:39', '2025-09-05 06:04:44'),
(20, '496e9c6f-0a56-4dc7-bdcb-1a911b118a80', '[{\"type\":\"default\",\"title\":\"Thanh Gươm Diệt Quỷ: Phố Đèn Đỏ\"},{\"type\":\"Japanese\",\"title\":\"鬼滅の刃 遊郭編\"},{\"type\":\"English\",\"title\":\"Demon Slayer: Kimetsu no Yaiba – Entertainment District Arc\"},{\"type\":\"Vietnamese\",\"title\":\"Thanh Gươm Diệt Quỷ: Phố Đèn Đỏ\"},{\"type\":\"Original\",\"title\":\"鬼滅の刃 遊郭編\"}]', 'thanh-guom-diet-quy-pho-den-do', '24 phút/tập', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/thanh-guom-diet-quy-pho-den-do/poster-1757052256856-739161064.jpg\",\"bannerUrl\":\"/uploads/movies/thanh-guom-diet-quy-pho-den-do/banner-1757052256857-373168893.webp\",\"coverUrl\":\"/uploads/movies/thanh-guom-diet-quy-pho-den-do/cover-1757052256858-529073882.jpg\"}', 'upcoming', 87, 1, 2, 2021, 'Phim lẻ', 'Sau các sự kiện đầy kịch tính trên Chuyến Tàu Vô Tận, Tanjiro Kamado cùng em gái Nezuko và những người bạn Zenitsu, Inosuke, theo chân Âm Trụ Uzui Tengen đến Phố Đèn Đỏ Yoshiwara, một khu vực nổi tiếng với những thú vui trần tục nhưng cũng ẩn chứa mối nguy hiểm chết người. Họ phải tìm kiếm những người vợ mất tích của Uzui và săn lùng một Thượng Huyền Quỷ đang ẩn mình, kẻ đã gieo rắc nỗi kinh hoàng trong khu phố này. Cuộc chiến khốc liệt nhất từ trước đến nay đang chờ đợi họ, buộc các Thợ Săn Quỷ phải phát huy tối đa sức mạnh và ý chí để bảo vệ những người vô tội và vén màn bí mật đằng sau những mất tích bí ẩn.', 11, '2021-12-05 00:00:00', 'TV-14', 'https://www.youtube.com/watch?v=kYv9lH9w_3g', NULL, 'series', '[\"Anime\",\"Shonen\",\"Demon Slayer\",\"Kimetsu no Yaiba\",\"Entertainment District Arc\",\"Hành động\",\"Phiêu lưu\",\"Kỳ ảo\",\"Siêu nhiên\",\"Diệt Quỷ\",\"Thời Taisho\",\"Ufotable\",\"Thượng Huyền Quỷ\"]', 'Phần 2', '[\"Demon Slayer Entertainment District Arc\",\"Thanh Gươm Diệt Quỷ Phố Đèn Đỏ\",\"Kimetsu no Yaiba Yuukaku-hen\",\"Anime hành động hay\",\"Xem Thanh Gươm Diệt Quỷ\",\"Tanjiro Kamado\",\"Tengen Uzui\",\"Upper Rank Demon\",\"Phim anime Nhật Bản\",\"Ufotable anime\"]', '{\"vietnamese\":\"Chuẩn bị cho một hành trình đầy kịch tính vào lòng Phố Đèn Đỏ huyền ảo nhưng chết chóc! \\\"Thanh Gươm Diệt Quỷ: Phố Đèn Đỏ\\\" mang đến những pha hành động đỉnh cao, đồ họa mãn nhãn và một câu chuyện cuốn hút về tình bạn, lòng dũng cảm và cuộc chiến không ngừng nghỉ chống lại cái ác. Liệu Tanjiro và những người bạn có thể sống sót sau cuộc đối đầu với một Thượng Huyền Quỷ và cứu rỗi những linh hồn vô tội? Đừng bỏ lỡ mùa phim bùng nổ này, nơi ánh sáng và bóng tối giao thoa!\",\"english\":\"Prepare for an electrifying journey into the heart of the dazzling yet deadly Entertainment District! \\\"Demon Slayer: Kimetsu no Yaiba – Entertainment District Arc\\\" delivers breathtaking action, stunning visuals, and a captivating story of friendship, courage, and the relentless fight against evil. Can Tanjiro and his comrades survive their most perilous encounter yet with an Upper Rank Demon and save innocent lives? Don\'t miss this explosive season, where light and shadow collide!\"}', 'Haruo Sotozaki', 'Ufotable', '8.7', '[{\"actor\":\"Natsuki Hanae\",\"role\":\"Tanjiro Kamado\"},{\"actor\":\"Akari Kitō\",\"role\":\"Nezuko Kamado\"},{\"actor\":\"Hiro Shimono\",\"role\":\"Zenitsu Agatsuma\"},{\"actor\":\"Yoshitsugu Matsuoka\",\"role\":\"Inosuke Hashibira\"},{\"actor\":\"Katsuyuki Konishi\",\"role\":\"Tengen Uzui\"},{\"actor\":\"Miyuki Sawashiro\",\"role\":\"Daki\"},{\"actor\":\"Ryota Osaka\",\"role\":\"Gyutaro\"}]', '2025-09-05 06:04:16', '2025-09-05 06:05:02'),
(21, '47b6e471-39cc-4bf4-bf20-fcb75a8b3897', '[{\"type\":\"default\",\"title\":\"SAKAMOTO DAYS: Sát Thủ Về Vườn\"},{\"type\":\"Japanese\",\"title\":\"サカモトデイズ\"},{\"type\":\"English\",\"title\":\"SAKAMOTO DAYS\"},{\"type\":\"Vietnamese\",\"title\":\"SAKAMOTO DAYS: Sát Thủ Về Hưu\"},{\"type\":\"Original\",\"title\":\"SAKAMOTO DAYS\"}]', 'sakamoto-days-sat-thu-ve-vuon', '24 phút/tập', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/sakamoto-days-sat-thu-ve-vuon/poster-1757409882414-737246270.webp\",\"bannerUrl\":\"/uploads/movies/sakamoto-days-sat-thu-ve-vuon/banner-1757409882415-343833704.webp\",\"coverUrl\":\"/uploads/movies/sakamoto-days-sat-thu-ve-vuon/cover-1757409882417-726928993.jpg\"}', 'ongoing', 9230918, 1, 2, 2025, 'Phim bộ', 'Taro Sakamoto từng là sát thủ khét tiếng nhất thế giới, được cả giới ngầm nể sợ. Với sức mạnh phi thường, sự nhạy bén không ai sánh kịp và khả năng ám sát lạnh lùng, anh đã gieo rắc nỗi kinh hoàng cho bất kỳ mục tiêu nào. Nhưng rồi một ngày, Sakamoto quyết định \'rửa tay gác kiếm\' để kết hôn, lập gia đình và sống một cuộc đời bình thường. Hiện tại, anh là chủ một cửa hàng tiện lợi, béo ú và có vẻ ngoài hiền lành, nhưng bên trong vẫn là một cỗ máy chiến đấu nguy hiểm. Khi những kẻ thù cũ và các sát thủ mới từ thế giới ngầm bắt đầu tìm đến, Sakamoto buộc phải quay lại với bản năng sát thủ của mình để bảo vệ gia đình và cuộc sống yên bình mà anh đã dày công xây dựng, tất nhiên là không được giết người! Phim là sự kết hợp hài hước giữa hành động đỉnh cao, những tình huống dở khóc dở cười và câu chuyện về một người đàn ông tìm cách cân bằng giữa quá khứ và hiện tại.', 12, '2025-01-11 00:00:00', 'PG-13', '', NULL, 'series', '[\"Action\",\"Comedy\",\"Slice of Life\",\"Hitman\",\"Assassin\",\"Family\",\"Supernatural Powers\",\"Shonen\",\"Manga Adaptation\"]', 'Phần 1', '[\"SAKAMOTO DAYS anime\",\"Sakamoto Days movie\",\"Sakamoto Days trailer\",\"phim Sakamoto Days\",\"sát thủ về vườn\",\"anime hành động hài hước\",\"manga chuyển thể\",\"Taro Sakamoto\",\"Shin\",\"Lu Xiaotang\"]', '{\"vietnamese\":\"Huyền thoại sát thủ số 1 thế giới \'rửa tay gác kiếm\' để làm ông chủ tiệm tạp hóa?! SAKAMOTO DAYS: Sát Thủ Về Vườn mang đến câu chuyện độc đáo về Taro Sakamoto – một sát thủ lừng lẫy giờ đây là người đàn ông của gia đình, phải đối mặt với những thử thách \'chết người\' từ quá khứ mà không được phép giết chóc! Cười nghiêng ngả với những tình huống dở khóc dở cười, mãn nhãn với các pha hành động đỉnh cao và đắm chìm vào thế giới ngầm đầy kịch tính nhưng cũng không kém phần ấm áp. Hãy sẵn sàng cho cuộc phiêu lưu có một không hai của \'ông chú\' Sakamoto!\",\"english\":\"The world\'s number one legendary hitman \'retires\' to become a convenience store owner?! SAKAMOTO DAYS brings a unique story about Taro Sakamoto – a renowned assassin who\'s now a family man, facing \'deadly\' challenges from his past without being allowed to kill! Laugh out loud at hilarious situations, be thrilled by top-notch action sequences, and immerse yourself in an exhilarating yet heartwarming underworld. Get ready for the one-of-a-kind adventure of \'Uncle\' Sakamoto!\"}', 'Masaki Watanabe', 'TMS Entertainment', '8', '[{\"actor\":\"Tomokazu Sugita\",\"role\":\"Taro Sakamoto\"},{\"actor\":\"Nobunaga Shimazaki\",\"role\":\"Shin\"},{\"actor\":\"Akari Kitō\",\"role\":\"Lu Xiaotang\"}]', '2025-09-09 09:24:42', '2025-09-09 09:24:42'),
(22, 'b524ec90-ffb0-4c71-8620-f8524a0941d9', '[{\"type\":\"default\",\"title\":\"Quái Vật Số 8\"},{\"type\":\"Japanese\",\"title\":\"怪獣８号\"},{\"type\":\"English\",\"title\":\"Kaiju No. 8\"},{\"type\":\"Vietnamese\",\"title\":\"Quái Vật Số 8\"},{\"type\":\"Original\",\"title\":\"怪獣８号\"},{\"type\":\"Other\",\"title\":\"8Kaijuu\"}]', 'quai-vat-so-8', '23 phút/tập', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/quai-vat-so-8/poster-1757414399297-908870826.jpg\",\"bannerUrl\":\"/uploads/movies/quai-vat-so-8/banner-1757414399300-874626564.jpg\",\"coverUrl\":\"/uploads/movies/quai-vat-so-8/cover-1757414399308-615386566.jpg\"}', 'completed', 17294030, 1, 2, 2024, 'Phim bộ', 'Trong một thế giới nơi những quái vật khổng lồ (Kaiju) liên tục đe dọa cuộc sống con người, Hibino Kafka là một thanh niên 32 tuổi bất mãn với công việc dọn dẹp xác Kaiju. Anh từng có ước mơ gia nhập Lực lượng Phòng vệ để chiến đấu chống lại Kaiju cùng người bạn thuở nhỏ Mina Ashiro, nhưng số phận lại đẩy anh vào một vai trò khác. Tuy nhiên, sau một sự cố bất ngờ khiến anh bị thương và nuốt phải một con Kaiju lạ, Kafka bỗng nhiên có khả năng biến hình thành Kaiju! Với sức mạnh mới này, liệu anh có thể biến ước mơ thời thơ ấu thành hiện thực, chiến đấu bên cạnh Mina và bảo vệ nhân loại khỏi mối đe dọa Kaiju?', 12, '2024-04-13 00:00:00', 'PG-13', '', NULL, 'series', '[\"Anime\",\"Shonen\",\"Kaiju\",\"Action\",\"Sci-Fi\",\"Monsters\",\"Military\",\"Transformation\",\"Comedy\",\"Supernatural\"]', 'Phần 1', '[\"Kaiju No. 8 anime\",\"Quái Vật Số 8\",\"Hibino Kafka\",\"Mina Ashiro\",\"Production I.G\",\"Crunchyroll\",\"Anime 2024\",\"Shonen Jump\",\"Monster anime\",\"Japanese anime\"]', '{\"vietnamese\":\"Hãy sẵn sàng cho một cuộc phiêu lưu đầy hành động và tiếng cười! \'Quái Vật Số 8\' đưa bạn vào một thế giới nơi những con Kaiju khổng lồ gieo rắc nỗi kinh hoàng, và một người đàn ông bình thường bỗng chốc trở thành hy vọng cuối cùng. Với hình dạng quái vật và trái tim anh hùng, liệu Hibino Kafka có thể biến ước mơ dang dở thành hiện thực và bảo vệ những người anh yêu thương? Đừng bỏ lỡ siêu phẩm anime hành động bùng nổ của năm 2024!\",\"english\":\"Get ready for an action-packed and hilarious adventure! \'Kaiju No. 8\' plunges you into a world where colossal Kaiju wreak havoc, and an ordinary man unexpectedly becomes humanity\'s last hope. With a monstrous form and a heroic heart, can Hibino Kafka turn his long-lost dream into reality and protect those he cares about? Don\'t miss out on one of the most explosive action anime of 2024!\"}', 'Shigeyuki Miya, Tomomi Mochizuki', 'Production I.G', '7.6', '[{\"actor\":\"Masaya Fukunishi\",\"role\":\"Hibino Kafka\"},{\"actor\":\"Wataru Katou\",\"role\":\"Ichikawa Leno\"},{\"actor\":\"Asami Seto\",\"role\":\"Ashiro Mina\"},{\"actor\":\"Kengo Kawanishi\",\"role\":\"Shinomiya Kikoru\"},{\"actor\":\"Mutsumi Tamura\",\"role\":\"Hoshina Soshiro\"}]', '2025-09-09 10:39:59', '2025-09-09 10:39:59'),
(23, '44e2c13b-65b0-4b43-a49f-0981614115c2', '[{\"type\":\"default\",\"title\":\"Kaiju No. 8 Phần 2\"},{\"type\":\"English\",\"title\":\"Kaiju No. 8 Season 2\"},{\"type\":\"Japanese\",\"title\":\"怪獣８号 第2期\"},{\"type\":\"Original\",\"title\":\"怪獣８号 第2期\"},{\"type\":\"Other\",\"title\":\"Monster #8 Season 2\"}]', 'kaiju-no-8-phan-2', '23 phút/tập', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/kaiju-no-8-phan-2/poster-1757415158900-943593027.jpg\",\"bannerUrl\":\"/uploads/movies/kaiju-no-8-phan-2/banner-1757415158901-128272696.jpg\",\"coverUrl\":\"/uploads/movies/kaiju-no-8-phan-2/cover-1757415158901-377560460.jpg\"}', 'ongoing', 3125017, 1, 2, 2025, 'Phim bộ', 'Sau khi Phần 1 kết thúc với những diễn biến đầy kịch tính, Kaiju No. 8 Phần 2 sẽ tiếp nối hành trình đầy thử thách của Kafka Hibino và các thành viên Lực lượng Phòng vệ. Kafka, người mang trong mình bí mật động trời về việc có thể biến hình thành Kaiju Số 8, sẽ phải đối mặt với những mối đe dọa mới từ các Kaiju mạnh mẽ hơn, đồng thời vật lộn để giữ kín thân phận của mình khỏi đồng đội và toàn thể nhân loại. Phần 2 hứa hẹn sẽ đào sâu hơn vào thế giới của Kaiju, khám phá nguồn gốc và sức mạnh của chúng, cũng như phát triển mối quan hệ phức tạp giữa Kafka và những người xung quanh, đặc biệt là Mina Ashiro và Leno Ichikawa. Những trận chiến hoành tráng, những âm mưu sâu sắc và những quyết định sinh tử sẽ là tâm điểm của mùa phim này, đẩy câu chuyện lên một tầm cao mới.', 11, '2025-07-19 00:00:00', 'TV-14', '', NULL, 'series', '[\"Anime\",\"Hành động\",\"Khoa học viễn tưởng\",\"Shounen\",\"Quái vật\",\"Siêu năng lực\",\"Lực lượng phòng vệ\",\"Nhật Bản\"]', 'Phần 2', '[\"Kaiju No. 8 Season 2\",\"Kaiju No. 8 Phần 2\",\"怪獣８号 第2期\",\"Kafka Hibino\",\"Mina Ashiro\",\"Leno Ichikawa\",\"Kaiju anime\",\"Anime hành động 2025\",\"Manga chuyển thể\",\"Shounen Jump\"]', '{\"vietnamese\":\"Năm 2025, Kaiju No. 8 Phần 2 sẽ trở lại với những trận chiến khốc liệt hơn, bí mật động trời hơn và một Kafka Hibino đang đứng giữa ranh giới mong manh giữa con người và quái vật. Đừng bỏ lỡ cuộc chiến sinh tồn và những khám phá chấn động sắp tới!\",\"english\":\"In 2025, Kaiju No. 8 Season 2 returns with more intense battles, deeper secrets, and Kafka Hibino balancing precariously between humanity and monster. Don\'t miss the thrilling fight for survival and shocking revelations that await!\"}', 'Shigeyuki Miya, Tomokazu Tokoro', 'Production I.G, Toho Animation', '7.5', '[{\"actor\":\"Masaya Fukunishi\",\"role\":\"Kafka Hibino / Kaiju No. 8\"},{\"actor\":\"Asami Seto\",\"role\":\"Mina Ashiro\"},{\"actor\":\"Wataru Katou\",\"role\":\"Leno Ichikawa\"},{\"actor\":\"Fairouz Ai\",\"role\":\"Kikoru Shinomiya\"}]', '2025-09-09 10:52:38', '2025-09-09 10:52:38'),
(24, '7501b0d9-4c16-4281-a940-96db81e6d4b3', '[{\"type\":\"default\",\"title\":\"Chú Thuật Hồi Chiến\"},{\"type\":\"Vietnamese\",\"title\":\"Chú Thuật Hồi Chiến\"},{\"type\":\"Japanese\",\"title\":\"呪術廻戦\"},{\"type\":\"English\",\"title\":\"Jujutsu Kaisen\"},{\"type\":\"Original\",\"title\":\"呪術廻戦\"},{\"type\":\"Other\",\"title\":\"Jujutsu Kaisen (TV Series)\"}]', 'chu-thuat-hoi-chien', '24 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/chu-thuat-hoi-chien/poster-1757417423190-832115007.jpg\",\"bannerUrl\":\"/uploads/movies/chu-thuat-hoi-chien/banner-1757417423197-496488727.webp\",\"coverUrl\":\"/uploads/movies/chu-thuat-hoi-chien/cover-1757417423199-668220759.webp\"}', 'completed', 20194456, 1, 2, 2020, 'Phim bộ', 'Trong một thế giới đầy rẫy những lời nguyền và ác quỷ khát máu, những mảnh vỡ của con quỷ huyền thoại Ryoumen Sukuna đã bị phân tán khắp nơi. Nếu bất kỳ thực thể bị nguyền rủa nào hấp thụ các bộ phận của Sukuna, sức mạnh hủy diệt mà chúng đạt được có thể đẩy thế giới vào bờ vực diệt vong. May mắn thay, một ngôi trường bí ẩn của các Chú Thuật Sư tồn tại để bảo vệ nhân loại khỏi thế lực siêu nhiên đáng sợ này!\r\n\r\nYuuji Itadori là một học sinh trung học bình thường với sức mạnh thể chất phi thường, dành phần lớn thời gian rảnh để chăm sóc ông nội ốm yếu. Mặc dù các câu lạc bộ thể thao luôn săn đón, Itadori lại chọn tham gia Câu lạc bộ Huyền bí của trường. Một ngày nọ, câu lạc bộ vô tình tìm thấy một vật thể bị nguyền rủa bị phong ấn. Khi phong ấn bị phá vỡ, một mối hiểm họa kinh hoàng đã trỗi dậy, kéo Yuuji vào thế giới tối tăm của chú thuật, buộc cậu phải đối mặt với số phận nghiệt ngã: trở thành vật chứa cho Sukuna và tham gia vào cuộc chiến chống lại các lời nguyền để bảo vệ những người cậu yêu thương.', 24, '2020-10-03 00:00:00', 'TV-14', '', 3, 'series', '[\"Anime\",\"Shonen\",\"Action\",\"Supernatural\",\"Fantasy\",\"Demons\",\"Curses\",\"Magic\",\"School Life\",\"Survival\",\"Urban Fantasy\",\"Dark Fantasy\"]', 'Phần 1', '[\"Jujutsu Kaisen\",\"Chú Thuật Hồi Chiến\",\"anime hành động\",\"anime siêu nhiên\",\"Yuuji Itadori\",\"Gojo Satoru\",\"Sukuna\",\"Phù thủy Jujutsu\",\"anime Nhật Bản\",\"manga adaptation\",\"thế giới lời nguyền\"]', '{\"vietnamese\":\"Sức mạnh hủy diệt và định mệnh nghiệt ngã đang chờ đón! Đắm chìm vào thế giới đen tối đầy rẫy linh hồn bị nguyền rủa và những trận chiến ngoạn mục trong `Chú Thuật Hồi Chiến`. Yuuji Itadori, một học sinh tưởng chừng bình thường, bỗng chốc trở thành chìa khóa giữa sự sống và cái chết khi cậu nuốt phải một vật thể bị nguyền rủa kinh hoàng. Liệu cậu có thể kiểm soát sức mạnh của quỷ vương Sukuna và bảo vệ nhân loại khỏi diệt vong? Khám phá ngay siêu phẩm anime hành động đỉnh cao này!\",\"english\":\"Destructive power and a grim destiny await! Dive into the dark world of cursed spirits and breathtaking battles in `Jujutsu Kaisen`. Yuuji Itadori, a seemingly ordinary high schooler, suddenly becomes the key between life and death when he swallows a terrifying cursed object. Can he control the power of the demon king Sukuna and protect humanity from annihilation? Discover this top-tier action anime phenomenon now!\"}', 'Sunghoo Park', 'MAPPA', '8.6', '[{\"actor\":\"Junya Enoki\",\"role\":\"Yuuji Itadori\"},{\"actor\":\"Yuma Uchida\",\"role\":\"Megumi Fushiguro\"},{\"actor\":\"Asami Seto\",\"role\":\"Nobara Kugisaki\"},{\"actor\":\"Yuichi Nakamura\",\"role\":\"Satoru Gojo\"},{\"actor\":\"Junichi Suwabe\",\"role\":\"Ryomen Sukuna\"}]', '2025-09-09 11:30:23', '2025-09-09 13:49:25'),
(25, '93fc4fcb-289e-4eb0-bec8-de4e00ed9802', '[{\"type\":\"default\",\"title\":\"Jujutsu Kaisen 0: Chú Thuật Hồi Chiến\"},{\"type\":\"English\",\"title\":\"Jujutsu Kaisen 0: The Movie\"},{\"type\":\"Other\",\"title\":\"Jujutsu Kaisen 0 Movie\"},{\"type\":\"Japanese\",\"title\":\"劇場版 呪術廻戦 0\"},{\"type\":\"Vietnamese\",\"title\":\"Jujutsu Kaisen 0: Chú Thuật Hồi Chiến\"},{\"type\":\"Original\",\"title\":\"Gekijouban Jujutsu Kaisen 0\"}]', 'jujutsu-kaisen-0-chu-thuat-hoi-chien', '105 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/jujutsu-kaisen-0-chu-thuat-hoi-chien/poster-1757418100440-799481407.webp\",\"bannerUrl\":\"/uploads/movies/jujutsu-kaisen-0-chu-thuat-hoi-chien/banner-1757418100442-115968986.png\",\"coverUrl\":\"/uploads/movies/jujutsu-kaisen-0-chu-thuat-hoi-chien/cover-1757418100463-980776687.jpg\"}', 'completed', 4234265, 1, 3, 2021, 'Phim lẻ', 'Trong một thế giới đầy rẫy những lời nguyền và linh hồn thù hận, Yuta Okkotsu là một nam sinh trung học rụt rè, đang phải chịu đựng lời nguyền kinh hoàng từ linh hồn của người bạn thơ ấu đã mất – Rika Orimoto. Lời nguyền của Rika quá mạnh mẽ và nguy hiểm, khiến Yuta bị cô lập và luôn bị đeo bám. Khi giáo viên chú thuật Satoru Gojo phát hiện ra Yuta, anh đã thuyết phục cậu nhập học tại trường Chú Thuật Tokyo. Tại đây, Yuta bắt đầu học cách kiểm soát sức mạnh của Rika, đối mặt với những lời nguyền khác và tìm hiểu về thế giới chú thuật sư đầy khắc nghiệt. Liệu cậu có thể giải thoát cho Rika và tìm thấy ý nghĩa cuộc sống của mình?', 1, '2021-12-24 00:00:00', 'PG-13', '', 3, 'series', '[\"Jujutsu Kaisen\",\"Chú Thuật Hồi Chiến\",\"Jujutsu Kaisen 0\",\"Yuta Okkotsu\",\"Rika Orimoto\",\"Satoru Gojo\",\"Suguru Geto\",\"Lời nguyền\",\"Chú thuật sư\",\"Anime movie\",\"Phim chiếu rạp\",\"MAPPA\",\"Shounen\",\"Hành động\",\"Siêu nhiên\",\"Fantasy\",\"Phim Nhật Bản\"]', 'Phần Movie', '[\"Jujutsu Kaisen 0\",\"phim Jujutsu Kaisen 0\",\"chú thuật hồi chiến 0\",\"xem Jujutsu Kaisen 0\",\"nội dung Jujutsu Kaisen 0\",\"trailer Jujutsu Kaisen 0\",\"diễn viên Jujutsu Kaisen 0\",\"anime movie hay\",\"phim MAPPA\",\"Jujutsu Kaisen tiền truyện\",\"phim ma thuật\",\"phim siêu nhiên nhật bản\"]', '{\"vietnamese\":\"Đừng bỏ lỡ siêu phẩm anime điện ảnh \'Jujutsu Kaisen 0: Chú Thuật Hồi Chiến\' – tiền truyện bùng nổ của series đình đám! Khám phá nguồn gốc bi thương của chú thuật sư Yuta Okkotsu và lời nguyền Rika bí ẩn, cùng cuộc chiến cam go chống lại thế lực tà ác của Suguru Geto. Đồ họa mãn nhãn, những pha hành động đỉnh cao và cốt truyện đầy cảm xúc sẽ khiến bạn không thể rời mắt. Chuẩn bị cho một trải nghiệm điện ảnh choáng ngợp!\",\"english\":\"Don\'t miss the anime blockbuster \'Jujutsu Kaisen 0: The Movie\' – the explosive prequel to the acclaimed series! Discover the tragic origins of Jujutsu Sorcerer Yuta Okkotsu and the mysterious Rika curse, alongside an intense battle against the evil forces of Suguru Geto. Stunning animation, exhilarating action sequences, and an emotionally charged storyline will keep you on the edge of your seat. Prepare for an overwhelming cinematic experience!\"}', 'Sunghoo Park', 'MAPPA', '7.8', '[{\"actor\":\"Megumi Ogata\",\"role\":\"Yuta Okkotsu\"},{\"actor\":\"Kana Hanazawa\",\"role\":\"Rika Orimoto\"},{\"actor\":\"Yuichi Nakamura\",\"role\":\"Satoru Gojo\"},{\"actor\":\"Mikako Komatsu\",\"role\":\"Maki Zenin\"},{\"actor\":\"Koki Uchiyama\",\"role\":\"Toge Inumaki\"},{\"actor\":\"Tomokazu Seki\",\"role\":\"Panda\"},{\"actor\":\"Takahiro Sakurai\",\"role\":\"Suguru Geto\"}]', '2025-09-09 11:41:40', '2025-11-22 10:17:17');
INSERT INTO `movies` (`id`, `uuid`, `titles`, `slug`, `duration`, `quality`, `subtitles`, `image`, `status`, `views`, `countryId`, `categoryId`, `year`, `belongToCategory`, `description`, `totalEpisodes`, `releaseDate`, `classification`, `trailerUrl`, `seriesId`, `type`, `tags`, `season`, `seoKeywords`, `marketingContent`, `director`, `studio`, `imdb`, `cast`, `createdAt`, `updatedAt`) VALUES
(26, 'cecd23e3-fd7e-4978-b264-ba9df4c934f6', '[{\"type\":\"default\",\"title\":\"Chú Thuật Hồi Chiến Mùa 2\"},{\"type\":\"Japanese\",\"title\":\"呪術廻戦 2期\"},{\"type\":\"English\",\"title\":\"Jujutsu Kaisen Season 2\"},{\"type\":\"Vietnamese\",\"title\":\"Chú Thuật Hồi Chiến Mùa 2\"},{\"type\":\"Original\",\"title\":\"呪術廻戦 2期\"}]', 'chu-thuat-hoi-chien-mua-2', '23 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/chu-thuat-hoi-chien-mua-2/poster-1757419181085-851789094.jpg\",\"bannerUrl\":\"/uploads/movies/chu-thuat-hoi-chien-mua-2/banner-1757419181086-130098931.webp\",\"coverUrl\":\"/uploads/movies/chu-thuat-hoi-chien-mua-2/cover-1757419181090-507465300.webp\"}', 'completed', 32156846, 1, 2, 2023, 'Phim bộ', 'Chú Thuật Hồi Chiến Mùa 2 đưa người xem trở lại thế giới đầy rẫy nguyền hồn và chú thuật sư, tập trung vào hai arc cốt truyện quan trọng: \'Quá Khứ của Gojo\' (Hidden Inventory / Premature Death) và \'Sự Cố Shibuya\' (Shibuya Incident). Phần đầu tiên khám phá sâu sắc về quá khứ bi kịch và mối quan hệ phức tạp giữa Satoru Gojo và Suguru Geto khi họ còn là học sinh tại Cao đẳng Chú thuật Tokyo. Nửa sau, \'Sự Cố Shibuya\', đẩy vũ trụ chú thuật vào một cuộc khủng hoảng chưa từng có với những trận chiến khốc liệt, những mất mát đau thương và những tiết lộ chấn động, thay đổi hoàn toàn cục diện thế giới chú thuật sư. Đây là một mùa phim không thể bỏ lỡ với những pha hành động đỉnh cao, cốt truyện sâu sắc và sự phát triển nhân vật mạnh mẽ.', 23, '2023-07-06 00:00:00', 'R - 17+', '', 3, 'series', '[\"anime\",\"shounen\",\"supernatural\",\"action\",\"fantasy\",\"sorcery\",\"cursed spirits\",\"gojo satoru\",\"itadori yuuji\",\"shibuya incident\",\"hidden inventory\",\"mappa\",\"magic\"]', 'Phần 2', '[\"jujutsu kaisen season 2\",\"chú thuật hồi chiến mùa 2\",\"jujutsu kaisen anime\",\"gojo satoru past\",\"shibuya incident arc\",\"jujutsu kaisen watch online\",\"anime hay\",\"phim hoạt hình nhật bản\",\"mappa studio\",\"mùa giải 2 chú thuật hồi chiến\"]', '{\"vietnamese\":\"Huyền thoại trở lại với \'Chú Thuật Hồi Chiến Mùa 2\' – nơi lịch sử và tương lai của thế giới chú thuật va chạm! Khám phá quá khứ bi tráng của Gojo Satoru, chứng kiến những bí mật đen tối được hé lộ, và chuẩn bị cho \'Sự Cố Shibuya\' chấn động, một biến cố sẽ thay đổi tất cả. Đồ họa mãn nhãn, cốt truyện gay cấn, và những trận chiến đỉnh cao đang chờ đón bạn. Đừng bỏ lỡ mùa phim bùng nổ nhất năm!\",\"english\":\"The legend returns with \'Jujutsu Kaisen Season 2\' – where the history and future of the Jujutsu world collide! Uncover the tragic past of Satoru Gojo, witness dark secrets unveiled, and brace yourself for the earth-shattering \'Shibuya Incident\', an event that will change everything. Breathtaking visuals, a gripping storyline, and epic battles await you. Don\'t miss the most explosive anime season of the year!\"}', 'Shota Goshozono', 'MAPPA', '8.7', '[{\"actor\":\"Yuuichi Nakamura\",\"role\":\"Gojo Satoru\"},{\"actor\":\"Takahiro Sakurai\",\"role\":\"Suguru Geto\"},{\"actor\":\"Aya Endou\",\"role\":\"Shoko Ieiri\"},{\"actor\":\"Mugihito\",\"role\":\"Tengen\"},{\"actor\":\"Anna Nagase\",\"role\":\"Riko Amanai\"},{\"actor\":\"Takehito Koyasu\",\"role\":\"Toji Fushiguro\"},{\"actor\":\"Junya Enoki\",\"role\":\"Itadori Yuuji\"},{\"actor\":\"Yuma Uchida\",\"role\":\"Fushiguro Megumi\"},{\"actor\":\"Asami Seto\",\"role\":\"Kugisaki Nobara\"}]', '2025-09-09 11:59:41', '2025-11-22 10:14:31'),
(27, 'f815026f-9b04-4c91-b972-1824d45acac6', '[{\"type\":\"default\",\"title\":\"Ta Muốn Trở Thành Chúa Tể Bóng Tối!\"},{\"type\":\"Other\",\"title\":\"Eminence in Shadow\"},{\"type\":\"Japanese\",\"title\":\"陰の実力者になりたくて！\"},{\"type\":\"English\",\"title\":\"The Eminence in Shadow\"},{\"type\":\"Vietnamese\",\"title\":\"Ta Muốn Trở Thành Chúa Tể Bóng Tối!\"},{\"type\":\"Original\",\"title\":\"Kage no Jitsuryokusha ni Naritakute!\"}]', 'ta-muon-tro-thanh-chua-te-bong-toi', '23 phút/tập', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/ta-muon-tro-thanh-chua-te-bong-toi/poster-1757420034353-976638822.jpg\",\"bannerUrl\":\"/uploads/movies/ta-muon-tro-thanh-chua-te-bong-toi/banner-1757420034356-803712427.jpg\",\"coverUrl\":\"/uploads/movies/ta-muon-tro-thanh-chua-te-bong-toi/cover-1757420034358-450665387.webp\"}', 'completed', 3, 1, 2, 2022, 'Phim bộ', 'Cid Kagenou là một chàng trai trẻ bị ám ảnh bởi việc trở thành một \'chúa tể bóng tối\' – một kẻ đứng sau mọi sự kiện, điều khiển thế giới từ trong bóng tối mà không ai biết. Sau một tai nạn xe tải, anh được tái sinh vào một thế giới phép thuật. Ở đây, với thân phận Cid Kagenou, anh quyết tâm biến giấc mơ của mình thành hiện thực. Anh sáng tạo ra một tổ chức bí mật mang tên \'Shadow Garden\' và thêu dệt nên một câu chuyện hoành tráng về \'Giáo phái Diabolos\' – một thế lực tà ác giả tưởng cần bị tiêu diệt. Thế nhưng, điều bất ngờ là Giáo phái Diabolos lại hoàn toàn có thật, và những câu chuyện bịa đặt của Cid vô tình ăn khớp một cách kỳ lạ với những âm mưu thực sự đang diễn ra trong thế giới đó. Anh vô thức trở thành một nhân vật chủ chốt, gây ảnh hưởng lớn đến thế giới, trong khi vẫn tin rằng tất cả chỉ là một trò diễn xuất đỉnh cao của mình.', 20, '2022-10-05 00:00:00', 'TV-14', '', NULL, 'series', '[\"Isekai\",\"Fantasy\",\"Action\",\"Comedy\",\"Overpowered Protagonist\",\"Delusional Protagonist\",\"Harem\",\"Magic\",\"Secret Organization\",\"Reincarnation\",\"Anime\"]', 'Phần 1', '[\"Ta Muốn Trở Thành Chúa Tể Bóng Tối\",\"The Eminence in Shadow\",\"Kage no Jitsuryokusha ni Naritakute\",\"Anime Isekai\",\"Cid Kagenou\",\"Shadow Garden\",\"Phim Hành Động Hài\",\"Anime Fantasy\",\"Light Novel Adaptation\",\"Nexus Studio\"]', '{\"vietnamese\":\"Bạn đã bao giờ mơ ước trở thành người hùng thầm lặng, kẻ đứng sau mọi sự kiện, kiểm soát thế giới mà không ai hay biết? \\\"Ta Muốn Trở Thành Chúa Tể Bóng Tối!\\\" sẽ đưa bạn vào cuộc phiêu lưu có một không hai của Cid Kagenou – một thanh niên cuồng loạn với ước mơ đó. Tái sinh vào một thế giới phép thuật, Cid biến những trò \\\"đóng vai\\\" của mình thành hiện thực, vô tình vạch trần những âm mưu đen tối có thật và trở thành chúa tể bóng tối thực thụ. Một bộ phim isekai đầy ắp hành động, hài hước và những pha xử lý \\\"ảo diệu\\\" khiến bạn không thể rời mắt!\",\"english\":\"Ever dreamed of becoming a silent hero, the one pulling the strings from the shadows, controlling the world without anyone knowing? \\\"The Eminence in Shadow\\\" plunges you into the unique adventure of Cid Kagenou – a young man obsessed with this very dream. Reborn into a world of magic, Cid turns his \\\"role-playing\\\" into reality, inadvertently exposing real dark conspiracies and becoming a true eminence in shadow. An action-packed, hilarious isekai series with \\\"god-tier\\\" manipulations that will keep you on the edge of your seat!\"}', 'Kazuya Nakanishi', 'Nexus', '7.9', '[{\"actor\":\"Seichiro Yamashita\",\"role\":\"Cid Kagenou / Shadow\"},{\"actor\":\"Asami Seto\",\"role\":\"Alpha\"},{\"actor\":\"Inori Minase\",\"role\":\"Beta\"},{\"actor\":\"Suzumiya Haruka\",\"role\":\"Gamma\"},{\"actor\":\"Ai Fairouz\",\"role\":\"Delta\"},{\"actor\":\"Hisakawa Aya\",\"role\":\"Epsilon\"},{\"actor\":\"Yuuna Mimura\",\"role\":\"Zeta\"},{\"actor\":\"Rina Hidaka\",\"role\":\"Iris Midgar\"}]', '2025-09-09 12:13:54', '2025-09-09 12:13:54'),
(28, '6c0fae74-468c-4c61-87ef-964062cc9875', '[{\"type\":\"default\",\"title\":\"Ta Muốn Trở Thành Chúa Tể Bóng Tối! Mùa 2\"},{\"type\":\"Japanese\",\"title\":\"陰の実力者になりたくて！ 2nd season\"},{\"type\":\"English\",\"title\":\"The Eminence in Shadow 2nd Season\"},{\"type\":\"Original\",\"title\":\"陰の実力者になりたくて！ 2nd season\"},{\"type\":\"Other\",\"title\":\"Kage-Jitsu 2nd Season\"}]', 'ta-muon-tro-thanh-chua-te-bong-toi-mua-2', '23 phút', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/ta-muon-tro-thanh-chua-te-bong-toi-mua-2/poster-1757420885949-387257239.jpg\",\"bannerUrl\":\"/uploads/movies/ta-muon-tro-thanh-chua-te-bong-toi-mua-2/banner-1757420885951-115634996.webp\",\"coverUrl\":\"/uploads/movies/ta-muon-tro-thanh-chua-te-bong-toi-mua-2/cover-1757420885954-783520664.webp\"}', 'completed', 20148516, 1, 2, 2023, 'Phim bộ', 'Mùa 2 của \"Ta Muốn Trở Thành Chúa Tể Bóng Tối!\" tiếp tục cuộc phiêu lưu của Cid Kagenou, người bị ám ảnh bởi việc trở thành một \"nhân vật quyền lực trong bóng tối\". Mùa này, Cid và tổ chức bí mật Shadow Garden của anh đối mặt với những thử thách mới, từ việc điều tra một thành phố không ngủ đang chìm trong tội lỗi (City of Lawless) đến việc đối đầu với những mối đe dọa từ Cult of Diabolos và một pháp sư vĩ đại trong quá khứ. Trong khi Cid tận hưởng việc đóng vai trò kẻ thao túng mọi thứ từ trong bóng tối, vô tình anh lại vướng vào những âm mưu thực sự, tạo ra những tình huống hài hước và những trận chiến ngoạn mục.', 12, '2023-10-04 00:00:00', 'R - 17+', '', NULL, 'series', '[\"Isekai\",\"Action\",\"Comedy\",\"Fantasy\",\"Harem\",\"Magic\",\"Shadow Garden\",\"Chuunibyou\",\"Overpowered Protagonist\",\"Vampire\"]', 'Phần 2', '[\"The Eminence in Shadow Season 2\",\"Ta Muốn Trở Thành Chúa Tể Bóng Tối Mùa 2\",\"Kage no Jitsuryokusha ni Naritakute 2nd Season\",\"Cid Kagenou\",\"Shadow Garden\",\"Isekai anime\",\"Fantasy anime\",\"Action comedy anime\",\"Anime Fall 2023\",\"OP protagonist anime\",\"Vampire anime\"]', '{\"vietnamese\":\"Chuẩn bị cho một cuộc phiêu lưu huyền thoại! Cid Kagenou đã trở lại với Mùa 2 của \\\"Ta Muốn Trở Thành Chúa Tể Bóng Tối!\\\", nơi mọi ảo tưởng chuunibyou của anh đều trở thành hiện thực... theo một cách bất ngờ nhất! Với tổ chức Shadow Garden đang lớn mạnh, những âm mưu thâm hiểm và những trận chiến hoành tráng, liệu Cid có thể tiếp tục giữ vững vai trò \\\"kẻ đứng sau mọi chuyện\\\" mà không ai biết được sự thật hài hước đằng sau? Đừng bỏ lỡ những pha hành động đỉnh cao, những tình huống dở khóc dở cười và những bí mật được hé lộ trong phần tiếp theo đầy kịch tính này!\",\"english\":\"Prepare for a legendary adventure! Cid Kagenou returns in \\\"The Eminence in Shadow 2nd Season,\\\" where his chuunibyou fantasies inexplicably come true... in the most unexpected ways! With Shadow Garden expanding, deeper conspiracies unraveling, and spectacular battles on the horizon, can Cid maintain his facade as the ultimate puppet master while everyone remains blissfully unaware of the hilarious truth? Don\'t miss the epic action, sidesplitting comedy, and shocking revelations in this thrilling continuation!\"}', 'Kazuya Nakanishi', 'Nexus', '7.8', '[{\"actor\":\"Seiichirou Yamashita\",\"role\":\"Cid Kagenou / Shadow\"},{\"actor\":\"Asami Seto\",\"role\":\"Alpha\"},{\"actor\":\"Inori Minase\",\"role\":\"Beta\"},{\"actor\":\"Suzuko Mimori\",\"role\":\"Gamma\"},{\"actor\":\"Fairouz Ai\",\"role\":\"Delta\"},{\"actor\":\"Hisako Kanemoto\",\"role\":\"Epsilon\"},{\"actor\":\"Ayaka Asai\",\"role\":\"Zeta\"},{\"actor\":\"Reina Kondo\",\"role\":\"Eta\"},{\"actor\":\"Rina Hidaka\",\"role\":\"Claire Kagenou\"},{\"actor\":\"Kana Hanazawa\",\"role\":\"Alexia Midgar\"},{\"actor\":\"Ai Kayano\",\"role\":\"Aurora\"}]', '2025-09-09 12:28:05', '2025-09-09 12:28:05'),
(29, 'aef0f632-dee5-4679-84ed-26d09e07fa97', '[{\"type\":\"default\",\"title\":\"Mashle: Ma Thuật và Cơ Bắp\"},{\"type\":\"Japanese\",\"title\":\"マッシュル-MASHLE-\"},{\"type\":\"English\",\"title\":\"Mashle: Magic and Muscles\"},{\"type\":\"Vietnamese\",\"title\":\"Mashle: Ma Thuật và Cơ Bắp\"},{\"type\":\"Original\",\"title\":\"マッシュル-MASHLE-\"},{\"type\":\"Other\",\"title\":\"Mashle\"}]', 'mashle-ma-thuat-va-co-bap', '23 phút', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/mashle-ma-thuat-va-co-bap/poster-1757421886208-238566686.jpg\",\"bannerUrl\":\"/uploads/movies/mashle-ma-thuat-va-co-bap/banner-1757421886213-459498186.jpg\",\"coverUrl\":\"/uploads/movies/mashle-ma-thuat-va-co-bap/cover-1757421886217-151789955.jpg\"}', 'completed', 20125180, 1, 2, 2023, 'Phim lẻ', 'Trong một thế giới nơi phép thuật là tất cả và địa vị xã hội được quyết định bởi khả năng sử dụng nó, tồn tại Mash Burnedead, một chàng trai trẻ sống sâu trong rừng. Với một dấu vết ma thuật duy nhất trên mặt – dấu hiệu của một người được ban phước lành – Mash lại hoàn toàn không thể sử dụng phép thuật. Thay vào đó, cậu rèn luyện cơ thể mình đến giới hạn tối đa, sở hữu sức mạnh thể chất phi thường. Cuộc sống yên bình của cậu với người cha nuôi đột nhiên bị đe dọa khi danh tính không có phép thuật của cậu bị phanh phui. Để bảo vệ những người thân yêu và sống một cuộc sống bình lặng, Mash buộc phải ghi danh vào Học viện Phép thuật Easton danh giá, nơi cậu phải chứng minh rằng cơ bắp vĩ đại có thể đánh bại bất kỳ loại phép thuật nào. Liệu Mash có thể che giấu bí mật của mình, sống sót qua ngôi trường đầy phù thủy ưu tú, và vươn lên trở thành một Thần Thuật Sĩ?', 12, '2023-04-08 00:00:00', 'PG-13', '', 2, 'series', '[\"anime\",\"mashle\",\"magic and muscles\",\"comedy\",\"action\",\"fantasy\",\"shounen\",\"school life\",\"overpowered protagonist\",\"gag anime\",\"muscle magic\",\"magic academy\"]', 'Phần 1', '[\"mashle anime\",\"mashle magic and muscles\",\"mashle season 1\",\"mash burnedead\",\"anime hài hước\",\"anime hành động\",\"anime giả tưởng\",\"phim hoạt hình nhật bản\",\"a-1 pictures\",\"manga chuyển thể\",\"phim ma thuật\",\"phim cơ bắp\",\"học viện phép thuật\"]', '{\"vietnamese\":\"Sức mạnh cơ bắp có thể đánh bại mọi phép thuật? Đón xem \'Mashle: Ma Thuật và Cơ Bắp\' - bộ anime hài hước, hành động bùng nổ kể về Mash, chàng trai không có phép thuật nhưng sở hữu cơ bắp phi thường, buộc phải nhập học tại Học viện Phép thuật Easton. Với những trận chiến đầy kịch tính, tình huống dở khóc dở cười và thông điệp ý nghĩa về việc theo đuổi con đường riêng, Mashle chắc chắn sẽ là series không thể bỏ lỡ! Hãy cùng Mash chứng minh rằng đôi khi, chỉ cần một cú đấm thép là đủ để thay đổi cả một thế giới!\",\"english\":\"Can muscles truly conquer magic? Dive into \'Mashle: Magic and Muscles\' – an explosive action-comedy anime following Mash, a magically inept but physically overpowered young man forced to enroll in the prestigious Easton Magic Academy. Featuring thrilling battles, hilarious situations, and a powerful message about forging your own path, Mashle is an unmissable series! Join Mash as he proves that sometimes, all it takes is a well-placed punch to change an entire world!\"}', 'Tomoya Tanaka', 'A-1 Pictures', '7.7', '[{\"actor\":\"Chiaki Kobayashi\",\"role\":\"Mash Burnedead\"},{\"actor\":\"Reina Ueda\",\"role\":\"Lemon Irvine\"},{\"actor\":\"Kaito Ishikawa\",\"role\":\"Lance Crown\"},{\"actor\":\"Takuya Eguchi\",\"role\":\"Dot Barrett\"},{\"actor\":\"Yuuki Kaji\",\"role\":\"Finn Ames\"}]', '2025-09-09 12:44:46', '2025-11-23 16:47:10'),
(30, 'e049f923-4d59-45ed-8e62-f7b3ba1e747c', '[{\"type\":\"default\",\"title\":\"Mashle Mùa 2: Kỳ Thi Tuyển Chọn Thần Nhãn Giả\"},{\"type\":\"Japanese\",\"title\":\"マッシュル-MASHLE- 神覚者候補選抜試験編\"},{\"type\":\"English\",\"title\":\"Mashle: Magic and Muscles Season 2 – The Divine Visionary Candidate Exam Arc\"},{\"type\":\"Vietnamese\",\"title\":\"Mashle Mùa 2: Cuộc Thi Chọn Lọc Ứng Viên Thần Nhãn Giả\"},{\"type\":\"Original\",\"title\":\"マッシュル-MASHLE- 神覚者候補選抜試験編\"},{\"type\":\"Other\",\"title\":\"Mashle: Magic and Muscles Season 2\"}]', 'mashle-mua-2-ky-thi-tuyen-chon-than-nhan-gia', '23 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/mashle-mua-2-ky-thi-tuyen-chon-than-nhan-gia/poster-1757423998428-927634301.webp\",\"bannerUrl\":\"/uploads/movies/mashle-mua-2-ky-thi-tuyen-chon-than-nhan-gia/banner-1757423998433-412176296.jpg\",\"coverUrl\":\"/uploads/movies/mashle-mua-2-ky-thi-tuyen-chon-than-nhan-gia/cover-1757423998448-229832380.webp\"}', 'completed', 20021938, 1, 2, 2024, 'Phim bộ', 'Mashle Mùa 2: Kỳ Thi Tuyển Chọn Thần Nhãn Giả tiếp nối hành trình đầy hài hước và kịch tính của Mash Burnedead, cậu bé không có phép thuật trong một thế giới mà ma thuật là tất cả. Để bảo vệ bạn bè và bí mật của mình, Mash buộc phải tham gia Kỳ thi Tuyển chọn Thần Nhãn Giả khắc nghiệt, một cuộc thi đỉnh cao quyết định người kế vị những pháp sư mạnh nhất. Với sức mạnh cơ bắp phi thường và tinh thần kiên cường, Mash sẽ phải đối mặt với những đối thủ mạnh mẽ nhất, những thử thách cam go và những âm mưu ẩn giấu, chứng minh rằng cơ bắp có thể vượt qua mọi giới hạn của ma thuật.', 12, '2024-01-06 00:00:00', 'PG-13', '', 2, 'series', '[\"Anime\",\"Fantasy\",\"Comedy\",\"Action\",\"Magic\",\"School\",\"Shonen\",\"Supernatural\",\"Manga Adaptation\",\"Divine Visionary\",\"Muscles\",\"Bling-Bang-Bang-Born\"]', 'Phần 2', '[\"Mashle Season 2\",\"Magic and Muscles\",\"Divine Visionary Candidate Exam Arc\",\"Mash Burnedead\",\"Anime 2024\",\"A-1 Pictures\",\"Crunchyroll\",\"Bling-Bang-Bang-Born\",\"Phim hoạt hình Nhật Bản\",\"Mùa 2 Mashle\"]', '{\"vietnamese\":\"Hãy sẵn sàng cho Mùa 2 bùng nổ của Mashle! Cậu bé Mash Burnedead đã trở lại, mạnh mẽ hơn, hài hước hơn và sẵn sàng dùng cơ bắp để \'đấm\' xuyên qua mọi rào cản ma thuật trong Kỳ thi Tuyển chọn Thần Nhãn Giả! Liệu một chàng trai không có chút phép thuật nào có thể trở thành Thần Nhãn Giả tối cao? Đón xem cuộc phiêu lưu không thể tin nổi này, nơi cơ bắp là ma thuật, và tiếng cười không bao giờ dứt! Đừng bỏ lỡ những trận chiến mãn nhãn và những khoảnh khắc cười ra nước mắt chỉ có ở Mashle Mùa 2!\",\"english\":\"Get ready for Mashle Season 2\'s explosive return! Mash Burnedead is back, stronger, funnier, and ready to \'punch\' his way through every magical barrier in the Divine Visionary Candidate Exam! Can a boy with no magic whatsoever become the ultimate Divine Visionary? Dive into this unbelievable adventure where muscles are magic, and the laughs never stop! Don\'t miss the thrilling battles and side-splitting moments only found in Mashle Season 2!\"}', 'Tanaka Tomonari', 'A-1 Pictures', '7.7', '[{\"actor\":\"Kobayashi Chiaki\",\"role\":\"Mash Burnedead\"},{\"actor\":\"Kawashima Reiji\",\"role\":\"Finn Ames\"},{\"actor\":\"Ishikawa Kaito\",\"role\":\"Lance Crown\"},{\"actor\":\"Eguchi Takuya\",\"role\":\"Dot Barrett\"},{\"actor\":\"Ueda Reina\",\"role\":\"Lemon Irvine\"},{\"actor\":\"Suwabe Junichi\",\"role\":\"Ryoh Grantz\"},{\"actor\":\"Ono Kensho\",\"role\":\"Kaldo Gehenna\"},{\"actor\":\"Kohara Konomi\",\"role\":\"Sophina Awakens\"},{\"actor\":\"Hanae Natsuki\",\"role\":\"Cell War\"},{\"actor\":\"Furukawa Makoto\",\"role\":\"Wahlberg Baigan\"}]', '2025-09-09 13:19:58', '2025-09-09 13:21:46'),
(31, '209d7a19-4c47-4712-a6e8-4ef245dcfbea', '[{\"type\":\"default\",\"title\":\"Mượn Hồn Đoạt Xác\"},{\"type\":\"Original\",\"title\":\"Bring Her Back\"}]', 'muon-hon-doat-xac', '100 phút', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/muon-hon-doat-xac/poster-1757477783341-761706051.jpg\",\"bannerUrl\":\"/uploads/movies/muon-hon-doat-xac/banner-1757477783344-908361236.jpg\",\"coverUrl\":\"/uploads/movies/muon-hon-doat-xac/cover-1757477783417-16411684.png\"}', 'completed', 34, 4, 3, 2025, 'Phim lẻ', 'Từ bộ đôi đạo diễn tài năng Danny và Michael Philippou – những \'bộ óc\' đứng sau siêu phẩm kinh dị \'Talk to Me\' – cùng nhà sản xuất danh tiếng A24, \'Mượn Hồn Đoạt Xác\' là dự án kinh dị được mong chờ nhất. Bộ phim khám phá một niềm tin cổ xưa và rợn người: linh hồn người chết vẫn có thể vương vấn thể xác trong một khoảng thời gian ngắn trước khi hoàn toàn siêu thoát. Niềm tin này mở ra cánh cửa cho một nghi lễ ám ảnh, đầy rẫy sự bí ẩn và nguy hiểm, dự kiến sẽ khiến khán giả lạnh sống lưng. \'Mượn Hồn Đoạt Xác\' hứa hẹn mang đến một trải nghiệm kinh dị tâm linh căng thẳng, đi sâu vào nỗi sợ hãi nguyên thủy nhất của con người về cái chết và thế giới bên kia.', 1, '2025-05-29 00:00:00', 'T18', 'https://youtu.be/kBskrYZfhw8', NULL, 'movie', '[\"kinh dị\",\"tâm linh\",\"hồn ma\",\"ma ám\",\"nghi lễ\",\"Talk to Me\",\"A24\",\"Danny Philippou\",\"Michael Philippou\",\"Úc\"]', '', '[\"Mượn Hồn Đoạt Xác\",\"Bring Her Back movie\",\"A24 horror film\",\"Danny Michael Philippou new movie\",\"kinh dị Úc 2025\",\"phim kinh dị mới nhất\",\"phim Talk to Me đạo diễn\",\"phim ma ám\"]', '{\"vietnamese\":\"Sau thành công vang dội của \'Talk to Me\', bộ đôi đạo diễn Danny và Michael Philippou trở lại với \'Mượn Hồn Đoạt Xác\' – một lời cảnh báo rợn người về ranh giới mỏng manh giữa sự sống và cái chết. Bạn có dám đối mặt với nghi lễ có thể gọi hồn người đã khuất, nhưng liệu bạn có thể kiểm soát được khi họ quay trở lại? Một trải nghiệm kinh dị không dành cho người yếu tim, từ A24 và những bộ óc sáng tạo đã định nghĩa lại thể loại kinh dị đương đại.\",\"english\":\"Following the phenomenal success of \'Talk to Me,\' directors Danny and Michael Philippou return with \'Bring Her Back\' – a chilling warning about the thin veil between life and death. Dare to confront a ritual that can summon the departed, but can you control what returns? An intense horror experience not for the faint of heart, from A24 and the visionary minds that redefined contemporary horror.\"}', 'Danny Philippou, Michael Philippou', 'A24, Causeway Films', '7.2', '[]', '2025-09-10 04:16:23', '2025-11-22 10:16:41'),
(32, '3669bdd9-fde7-40d8-970d-b3058ae04452', '[{\"type\":\"default\",\"title\":\"Hố Đen Tử Thần\"},{\"type\":\"Original\",\"title\":\"Interstellar\"},{\"type\":\"English\",\"title\":\"Interstellar\"},{\"type\":\"Japanese\",\"title\":\"インターステラー\"}]', 'ho-den-tu-than', '169 phút', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/ho-den-tu-than/poster-1757481900493-362509382.webp\",\"bannerUrl\":\"/uploads/movies/ho-den-tu-than/banner-1757481900516-44942521.webp\",\"coverUrl\":\"/uploads/movies/ho-den-tu-than/cover-1757481900518-74728640.webp\"}', 'completed', 125657, 4, 3, 2014, 'Phim lẻ', 'Khi tương lai của loài người trên Trái Đất bị đe dọa nghiêm trọng, một nhóm các nhà thám hiểm dũng cảm thực hiện sứ mệnh quan trọng nhất trong lịch sử: du hành vượt ra ngoài thiên hà của chúng ta thông qua một lỗ sâu mới được phát hiện. Mục tiêu của họ là tìm kiếm một hành tinh mới có thể trở thành ngôi nhà tiếp theo cho nhân loại. Đối mặt với những thách thức to lớn của không gian, thời gian bị bẻ cong và những điều chưa biết, họ phải đấu tranh để đảm bảo sự tồn vong của loài người trong một cuộc phiêu lưu đầy cảm xúc và trí tuệ.', 1, '2014-11-05 00:00:00', 'PG-13', '', NULL, 'movie', '[\"khoa học viễn tưởng\",\"du hành vũ trụ\",\"lỗ đen\",\"lỗ sâu\",\"thời gian\",\"sự sống còn\",\"tương lai\",\"khám phá\",\"cha con\",\"sử thi\",\"vũ trụ\",\"Christopher Nolan\"]', '', '[\"Interstellar movie\",\"Hố Đen Tử Thần\",\"phim khoa học viễn tưởng\",\"Christopher Nolan\",\"Matthew McConaughey\",\"Anne Hathaway\",\"Jessica Chastain\",\"du hành thời gian\",\"lỗ đen vũ trụ\",\"khám phá không gian\",\"tương lai nhân loại\",\"phim phiêu lưu\",\"Hans Zimmer soundtrack\"]', '{\"vietnamese\":\"Bước vào một cuộc phiêu lưu vĩ đại, nơi thời gian và không gian bị bẻ cong, và tương lai của nhân loại nằm trong tay một nhóm nhỏ những nhà thám hiểm dũng cảm. \'Hố Đen Tử Thần\' của đạo diễn Christopher Nolan là một kiệt tác khoa học viễn tưởng đầy cảm xúc, kết hợp trí tuệ khoa học với câu chuyện nhân văn sâu sắc về tình yêu, sự hy sinh và ý chí sinh tồn, chắc chắn sẽ khiến bạn không thể rời mắt.\",\"english\":\"Embark on an epic journey where time and space bend, and the fate of humanity rests on the shoulders of a few brave explorers. Christopher Nolan\'s \'Interstellar\' is an emotionally resonant science fiction masterpiece, blending scientific intellect with a profound human story of love, sacrifice, and the will to survive, promising an unforgettable cinematic experience.\"}', 'Christopher Nolan', 'Paramount Pictures, Warner Bros. Pictures, Legendary Entertainment, Syncopy', '8.7', '[{\"actor\":\"Matthew McConaughey\",\"role\":\"Cooper\"},{\"actor\":\"Anne Hathaway\",\"role\":\"Brand\"},{\"actor\":\"Jessica Chastain\",\"role\":\"Murph (adult)\"},{\"actor\":\"Mackenzie Foy\",\"role\":\"Murph (young)\"},{\"actor\":\"Michael Caine\",\"role\":\"Professor Brand\"},{\"actor\":\"Matt Damon\",\"role\":\"Dr. Mann\"},{\"actor\":\"Casey Affleck\",\"role\":\"Tom (adult)\"}]', '2025-09-10 05:25:01', '2025-09-10 06:26:29'),
(34, 'c784d7ee-9280-4ff1-aac1-74d3a39d61dd', '[{\"type\":\"default\",\"title\":\"Thần Dược\"},{\"type\":\"Original\",\"title\":\"The Substance\"}]', 'than-duoc', '139 phút', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/than-duoc/poster-1757490634170-336604769.webp\",\"bannerUrl\":\"/uploads/movies/than-duoc/banner-1757490634171-799512680.webp\",\"coverUrl\":\"/uploads/movies/than-duoc/cover-1757490634172-747607249.webp\"}', 'completed', 49, 5, 3, 2024, 'Phim lẻ', 'Một ngôi sao điện ảnh đã lớn tuổi trải qua một liệu pháp tái tạo tế bào cấp tiến để tạo ra một phiên bản trẻ hơn, đẹp hơn của chính mình. Tuy nhiên, quá trình này dẫn đến những hậu quả không lường trước được, đẩy cô vào một cuộc đấu tranh kinh hoàng để duy trì sự tồn tại. Bộ phim mang đến góc nhìn rùng rợn và sâu sắc về nỗi ám ảnh về vẻ đẹp và sự lão hóa trong xã hội hiện đại.', 1, '2024-09-20 00:00:00', 'T-18', '', NULL, 'movie', '[\"body horror\",\"sci-fi horror\",\"psychological thriller\",\"aging\",\"beauty standards\",\"identity\",\"transformation\",\"Cannes Film Festival\",\"Demi Moore\",\"Margaret Qualley\"]', '', '[\"The Substance\",\"Thần Dược\",\"phim kinh dị\",\"khoa học viễn tưởng\",\"Coralie Fargeat\",\"Demi Moore\",\"Margaret Qualley\",\"phim 2024\",\"Cannes 2024\",\"body horror film\",\"phim R rated\"]', '{\"vietnamese\":\"Thần Dược - bộ phim kinh dị khoa học viễn tưởng gây chấn động tại Liên hoan phim Cannes 2024, nơi đạo diễn Coralie Fargeat đã xuất sắc giành giải Kịch bản xuất sắc nhất. Với sự tham gia của Demi Moore và Margaret Qualley trong vai những phiên bản đối lập của cùng một người phụ nữ, phim khám phá nỗi ám ảnh về vẻ đẹp, sự lão hóa và hậu quả kinh hoàng của việc chạy theo sự hoàn hảo. Hãy chuẩn bị cho một trải nghiệm điện ảnh rợn tóc gáy, đầy mãn nhãn và không kém phần suy tư!\",\"english\":\"The Substance - the shocking sci-fi body horror sensation that premiered at the Cannes Film Festival 2024, where director Coralie Fargeat won Best Screenplay. Starring Demi Moore and Margaret Qualley as two versions of the same woman, the film delves into the obsession with beauty, aging, and the horrific consequences of chasing perfection. Prepare for a visually stunning, viscerally disturbing, and thought-provoking cinematic experience!\"}', 'Coralie Fargeat', 'Vixens, Working Title Films, Wild Bunch International, Universal Pictures', '7.2', '[{\"actor\":\"Demi Moore\",\"role\":\"Elisabeth Sparkle\"},{\"actor\":\"Margaret Qualley\",\"role\":\"Sue\"},{\"actor\":\"Dennis Quaid\",\"role\":\"Harvey\"}]', '2025-09-10 07:50:37', '2025-11-22 10:16:52'),
(35, '712426b4-0f88-4583-8f45-e33044330dd0', '[{\"type\":\"default\",\"title\":\"Wednesday\"},{\"type\":\"Japanese\",\"title\":\"ウェンズデー\"},{\"type\":\"English\",\"title\":\"Wednesday\"},{\"type\":\"Vietnamese\",\"title\":\"Wednesday\"},{\"type\":\"Original\",\"title\":\"Wednesday\"}]', 'wednesday', '50 phút/tập', 'FHD', '[\"VietSub\",\"EngSub\",\"Thuyết minh\"]', '{\"posterUrl\":\"/uploads/movies/wednesday/poster-1757492324385-8429072.webp\",\"bannerUrl\":\"/uploads/movies/wednesday/banner-1757492324402-512588800.webp\",\"coverUrl\":\"/uploads/movies/wednesday/cover-1757492324403-539063578.webp\"}', 'completed', 8, 7, 2, 2022, 'Phim lẻ', 'Thông minh, châm biếm và có chút vô cảm, Wednesday Addams điều tra một bí ẩn quái dị tại Học viện Nevermore, đồng thời làm quen với những mối quan hệ mới. Đây là một series kỳ lạ, đen tối và đầy ma mị từ bàn tay đạo diễn Tim Burton, khám phá cuộc sống tuổi teen, tình bạn và một âm mưu kinh hoàng gắn liền với quá khứ của gia đình cô.', 8, '2022-11-23 00:00:00', 'TV-14', '', NULL, 'series', '[\"Wednesday Addams\",\"Nevermore Academy\",\"Mystery\",\"Teen Drama\",\"Supernatural\",\"Dark Comedy\",\"Gothic\",\"Family\",\"Friendship\",\"Outcast\",\"Tim Burton\"]', 'Mùa 1', '[\"Wednesday Addams series\",\"Jenna Ortega\",\"Tim Burton Netflix\",\"Nevermore Academy\",\"Wednesday season 2\",\"Addams Family show\",\"supernatural mystery\",\"dark fantasy teen drama\",\"horror comedy\"]', '{\"vietnamese\":\"Bạn đã sẵn sàng bước vào thế giới kỳ quái của Wednesday Addams chưa? Tại Học viện Nevermore, cô con gái của gia đình Addams phải đối mặt với thử thách lớn nhất cuộc đời: kết bạn, điều tra những bí ẩn cổ xưa, và ngăn chặn một tên giết người hàng loạt. Một hành trình đầy kịch tính, hài hước đen tối và phép thuật đang chờ bạn khám phá!\",\"english\":\"Are you ready to dive into the peculiar world of Wednesday Addams? At Nevermore Academy, the eldest Addams child faces her greatest challenges: making friends, investigating ancient mysteries, and stopping a monstrous serial killer. A thrilling journey filled with dark humor, supernatural elements, and unexpected twists awaits!\"}', 'Tim Burton', 'MGM Television, Toluca Pictures, Glickmania, 1.21 Entertainment', '8.1', '[{\"actor\":\"Jenna Ortega\",\"role\":\"Wednesday Addams\"},{\"actor\":\"Gwendoline Christie\",\"role\":\"Principal Larissa Weems\"},{\"actor\":\"Riki Lindhome\",\"role\":\"Dr. Valerie Kinbott\"},{\"actor\":\"Jamie McShane\",\"role\":\"Sheriff Donovan Galpin\"},{\"actor\":\"Hunter Doohan\",\"role\":\"Tyler Galpin\"},{\"actor\":\"Percy Hynes White\",\"role\":\"Xavier Thorpe\"},{\"actor\":\"Emma Myers\",\"role\":\"Enid Sinclair\"},{\"actor\":\"Joy Sunday\",\"role\":\"Bianca Barclay\"},{\"actor\":\"Catherine Zeta-Jones\",\"role\":\"Morticia Addams\"},{\"actor\":\"Luis Guzmán\",\"role\":\"Gomez Addams\"},{\"actor\":\"Fred Armisen\",\"role\":\"Uncle Fester\"},{\"actor\":\"Christina Ricci\",\"role\":\"Marilyn Thornhill\"}]', '2025-09-10 08:18:52', '2025-09-10 08:18:52'),
(36, '4b783240-50d9-476c-87ae-8e431c0a0202', '[{\"type\":\"default\",\"title\":\"Siêu Anh Hùng Phá Hoại\"},{\"type\":\"Original\",\"title\":\"The Boys\"},{\"type\":\"English\",\"title\":\"The Boys\"},{\"type\":\"Japanese\",\"title\":\"ザ・ボーイズ\"}]', 'sieu-anh-hung-pha-hoai', '60 phút/tập', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/sieu-anh-hung-pha-hoai/poster-1757495739220-648140778.webp\",\"bannerUrl\":\"/uploads/movies/sieu-anh-hung-pha-hoai/banner-1757495739221-678762618.webp\",\"coverUrl\":\"/uploads/movies/sieu-anh-hung-pha-hoai/cover-1757495739222-562856507.webp\"}', 'completed', 17, 7, 2, 2019, 'Phim bộ', 'Trong một thế giới nơi các siêu anh hùng được tôn sùng như những người nổi tiếng và được sở hữu bởi tập đoàn Vought International khổng lồ, họ thường xuyên lạm dụng siêu năng lực của mình thay vì sử dụng chúng vì điều thiện. Khi những người dân thường mất đi người thân vì hành động cẩu thả hoặc tàn bạo của các siêu anh hùng, một nhóm vigilante được gọi là \'The Boys\' – do Billy Butcher dẫn đầu – quyết định đứng lên vạch trần sự thật về \'The Seven\' (Bảy Siêu Anh Hùng) và tập đoàn Vought, bất kể hậu quả.', 8, '2019-07-26 00:00:00', 'TV-MA', '', NULL, 'series', '[\"siêu anh hùng\",\"phản anh hùng\",\"hành động\",\"hài đen\",\"châm biếm\",\"bạo lực\",\"phim chuyển thể truyện tranh\",\"Vought International\",\"Amazon Prime Video\",\"tham nhũng\",\"The Seven\"]', 'Phần 1', '[\"The Boys Season 1 xem online\",\"Siêu Anh Hùng Phá Hoại Phần 1 vietsub\",\"phim The Boys nội dung\",\"diễn viên The Boys\",\"phim siêu anh hùng bạo lực\",\"Homelander\",\"Billy Butcher\",\"Prime Video original\"]', '{\"vietnamese\":\"Quên những gì bạn biết về siêu anh hùng đi! \'Siêu Anh Hùng Phá Hoại\' Phần 1 sẽ đưa bạn vào một cuộc chiến không khoan nhượng giữa những người thường và các \'siêu\' anh hùng mục nát. Với cốt truyện kịch tính, châm biếm sâu cay và những pha hành động gây sốc, đây là series bạn không thể bỏ lỡ nếu muốn khám phá mặt tối của thế giới người hùng. Hãy sẵn sàng cho một trải nghiệm điện ảnh bùng nổ và đầy bất ngờ!\",\"english\":\"Forget everything you thought you knew about superheroes! \'The Boys\' Season 1 throws you into a no-holds-barred battle between ordinary people and corrupt \'supes\'. With a gripping plot, sharp satire, and shocking action sequences, this is the series you can\'t miss if you want to explore the dark underbelly of heroism. Prepare for an explosive and unpredictable cinematic experience!\"}', 'Eric Kripke (Showrunner)', 'Amazon Studios, Sony Pictures Television, Point Grey Pictures, Kripke Enterprises', '8.7', '[{\"actor\":\"Karl Urban\",\"role\":\"Billy Butcher\"},{\"actor\":\"Jack Quaid\",\"role\":\"Hughie Campbell\"},{\"actor\":\"Antony Starr\",\"role\":\"Homelander\"},{\"actor\":\"Erin Moriarty\",\"role\":\"Starlight / Annie January\"},{\"actor\":\"Jessie T. Usher\",\"role\":\"A-Train\"},{\"actor\":\"Laz Alonso\",\"role\":\"Mother\'s Milk / Marvin T. Milk\"},{\"actor\":\"Chace Crawford\",\"role\":\"The Deep / Kevin Moskowitz\"},{\"actor\":\"Tomer Capone\",\"role\":\"Frenchie\"},{\"actor\":\"Karen Fukuhara\",\"role\":\"Kimiko Miyashiro / The Female\"},{\"actor\":\"Dominique McElligott\",\"role\":\"Queen Maeve / Maggie Shaw\"},{\"actor\":\"Elisabeth Shue\",\"role\":\"Madelyn Stillwell\"}]', '2025-09-10 09:15:39', '2025-09-10 09:15:39'),
(37, '5994890c-4c62-4915-96c7-d1e7e877f9a3', '[{\"type\":\"default\",\"title\":\"Đào Nguyên Ám Quỷ\"},{\"type\":\"Japanese\",\"title\":\"桃源暗鬼\"},{\"type\":\"English\",\"title\":\"Tougen Anki\"},{\"type\":\"Vietnamese\",\"title\":\"Đào Nguyên Ám Quỷ\"},{\"type\":\"Original\",\"title\":\"Tougen Anki\"}]', 'dao-nguyen-am-quy', '24 phút/tập', 'FHD', '[\"VietSub\"]', '{\"posterUrl\":\"/uploads/movies/dao-nguyen-am-quy/poster-1758568095588-687895006.webp\",\"bannerUrl\":\"/uploads/movies/dao-nguyen-am-quy/banner-1758568095595-746161051.webp\",\"coverUrl\":\"/uploads/movies/dao-nguyen-am-quy/cover-1758568095596-719093289.webp\"}', 'ongoing', 843712, 1, 2, 2025, 'Phim bộ', 'Trong một thế giới nơi những hậu duệ của Momotarou và Oni đã đối đầu nhau qua nhiều thế hệ, mối thù truyền kiếp ấy vẫn luôn âm ỉ cháy. Oni, với bản tính nóng nảy, hỗn loạn và bất cẩn, bị Momotarou xem là mối đe dọa cần phải kiềm chế để bảo vệ loài người. Ichinose Shiki là một thiếu niên liều lĩnh và vô trách nhiệm, luôn tự hào về sự nổi loạn của mình đến mức bị đuổi học. Dù vậy, người cha nuôi Tsuyoshi vẫn dành cho cậu tình yêu thương vô bờ bến. Tình yêu hy sinh của Tsuyoshi được chứng minh một cách bi thảm khi một Momotarou tấn công Shiki. Tsuyoshi, một Momotarou đã che giấu thân phận Oni của Shiki suốt bao năm, đã dùng tính mạng mình để bảo vệ cậu. Khoảnh khắc bi thương đó không chỉ tiết lộ sự thật kinh hoàng mà còn đánh thức dòng máu Oni ngủ yên trong Shiki, biến cậu thành một con quỷ cuồng nộ, tràn ngập khát khao báo thù. Sự bộc phát bất ngờ này thu hút sự chú ý của Mudano Naito, một giáo viên Oni từ Học viện Rakshasa – nơi dành cho những Oni trẻ tuổi học cách kiểm soát sức mạnh của mình. Để báo thù cho cha, Shiki phải học cách kiềm chế bản tính bốc đồng và bản năng quỷ dữ đang chảy trong huyết quản của mình.', 24, '2025-11-07 00:00:00', 'R - 17+', '', NULL, 'series', '[\"Tougen Anki\",\"Oni\",\"Momotarou\",\"Supernatural\",\"Action\",\"Fantasy\",\"Revenge\",\"School Life\",\"Demons\",\"Shounen\",\"Rakshasa Academy\"]', 'Phần 1', '[\"Tougen Anki anime\",\"Đào Nguyên Ám Quỷ anime\",\"manga adaptation\",\"Studio NUT\",\"Oni vs Momotarou\",\"supernatural action anime\",\"new anime 2025\",\"Shiki Ichinose\",\"fantasy battle\",\"demon powers\",\"Revenge story\"]', '{\"vietnamese\":\"Bước vào thế giới của \'Đào Nguyên Ám Quỷ\', nơi ranh giới giữa chính nghĩa và tà ác mờ nhạt, và dòng máu của một Oni đang trỗi dậy mạnh mẽ! Shiki Ichinose, một thiếu niên bất trị, bỗng chốc phải đối mặt với sự thật kinh hoàng về dòng máu quỷ dữ chảy trong huyết quản mình sau cái chết bi thảm của cha nuôi. Bị đẩy vào Học viện Rakshasa bí ẩn, cậu phải học cách kiềm chế sức mạnh hủy diệt và thắp lên ngọn lửa báo thù. Liệu Shiki có thể làm chủ số phận hay sẽ bị nuốt chửng bởi cơn thịnh nộ của quỷ dữ? Đừng bỏ lỡ siêu phẩm hành động - kỳ ảo đầy kịch tính này, hứa hẹn bùng nổ vào năm 2025!\",\"english\":\"Step into the world of \'Tougen Anki,\' where the line between good and evil blurs, and the blood of an Oni surges with power! Shiki Ichinose, an unruly teenager, is thrust into a horrifying truth about his demonic heritage after the tragic death of his foster father. Forced into the enigmatic Rakshasa Academy, he must learn to master his destructive powers and ignite the flames of revenge. Will Shiki control his destiny, or will he be consumed by the Oni\'s wrath? Don\'t miss this thrilling action-fantasy masterpiece, set to explode onto screens in 2025!\"}', 'Ootsu Nao', 'NUT', '6.7', '[{\"actor\":\"Ura Kazuki\",\"role\":\"Ichinose Shiki\"},{\"actor\":\"Uchida Yuuma\",\"role\":\"Mudano Naito\"},{\"actor\":\"Hanae Natsuki\",\"role\":\"Momozono Todoroki\"},{\"actor\":\"Izawa Shiori\",\"role\":\"Kijino Chizuru\"},{\"actor\":\"Asanuma Shintarou\",\"role\":\"Kenzaki Masamune\"},{\"actor\":\"Tsuda Kenjirou\",\"role\":\"Ichinose Tsuyoshi / Naya Youhei\"},{\"actor\":\"Majima Junji\",\"role\":\"Sumida Kouki\"},{\"actor\":\"Hatanaka Tasuku\",\"role\":\"Senda Jin\"}]', '2025-09-22 19:08:15', '2025-11-24 06:33:19');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `movie_genres`
--

CREATE TABLE `movie_genres` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `GenreId` int(11) NOT NULL,
  `MovieId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `movie_genres`
--

INSERT INTO `movie_genres` (`createdAt`, `updatedAt`, `GenreId`, `MovieId`) VALUES
('2025-09-04 17:21:01', '2025-09-04 17:21:01', 1, 1),
('2025-09-05 01:11:28', '2025-09-05 01:11:28', 1, 15),
('2025-09-05 01:32:01', '2025-09-05 01:32:01', 1, 16),
('2025-09-05 05:40:16', '2025-09-05 05:40:16', 1, 18),
('2025-09-05 05:51:39', '2025-09-05 05:51:39', 1, 19),
('2025-09-09 11:30:23', '2025-09-09 11:30:23', 1, 24),
('2025-09-09 11:41:40', '2025-09-09 11:41:40', 1, 25),
('2025-09-09 11:59:41', '2025-09-09 11:59:41', 1, 26),
('2025-09-09 12:13:54', '2025-09-09 12:13:54', 1, 27),
('2025-09-09 12:28:05', '2025-09-09 12:28:05', 1, 28),
('2025-09-09 12:44:46', '2025-09-09 12:44:46', 1, 29),
('2025-09-09 13:19:58', '2025-09-09 13:19:58', 1, 30),
('2025-09-10 08:18:52', '2025-09-10 08:18:52', 1, 35),
('2025-09-22 19:08:16', '2025-09-22 19:08:16', 1, 37),
('2025-09-04 17:21:01', '2025-09-04 17:21:01', 2, 1),
('2025-09-04 23:12:14', '2025-09-04 23:12:14', 2, 10),
('2025-09-04 23:19:13', '2025-09-04 23:19:13', 2, 11),
('2025-09-04 23:58:58', '2025-09-04 23:58:58', 2, 13),
('2025-09-05 01:11:28', '2025-09-05 01:11:28', 2, 15),
('2025-09-05 01:32:01', '2025-09-05 01:32:01', 2, 16),
('2025-09-05 05:40:16', '2025-09-05 05:40:16', 2, 18),
('2025-09-05 05:51:39', '2025-09-05 05:51:39', 2, 19),
('2025-09-05 06:04:16', '2025-09-05 06:04:16', 2, 20),
('2025-09-09 11:59:41', '2025-09-09 11:59:41', 2, 26),
('2025-09-09 12:13:54', '2025-09-09 12:13:54', 2, 27),
('2025-09-10 05:25:01', '2025-09-10 05:25:01', 2, 32),
('2025-09-05 01:32:01', '2025-09-05 01:32:01', 3, 16),
('2025-09-09 12:13:54', '2025-09-09 12:13:54', 3, 27),
('2025-09-09 12:28:05', '2025-09-09 12:28:05', 3, 28),
('2025-09-04 17:21:01', '2025-09-04 17:21:01', 4, 1),
('2025-09-04 23:19:13', '2025-09-04 23:19:13', 4, 11),
('2025-09-05 00:10:01', '2025-09-05 00:10:01', 4, 14),
('2025-09-05 01:11:28', '2025-09-05 01:11:28', 4, 15),
('2025-09-05 01:32:01', '2025-09-05 01:32:01', 4, 16),
('2025-09-05 05:40:16', '2025-09-05 05:40:16', 4, 18),
('2025-09-05 05:51:39', '2025-09-05 05:51:39', 4, 19),
('2025-09-05 06:04:16', '2025-09-05 06:04:16', 4, 20),
('2025-09-09 09:24:42', '2025-09-09 09:24:42', 4, 21),
('2025-09-09 10:39:59', '2025-09-09 10:39:59', 4, 22),
('2025-09-09 10:52:38', '2025-09-09 10:52:38', 4, 23),
('2025-09-09 11:30:23', '2025-09-09 11:30:23', 4, 24),
('2025-09-09 11:41:40', '2025-09-09 11:41:40', 4, 25),
('2025-09-09 11:59:41', '2025-09-09 11:59:41', 4, 26),
('2025-09-09 12:13:54', '2025-09-09 12:13:54', 4, 27),
('2025-09-09 12:28:05', '2025-09-09 12:28:05', 4, 28),
('2025-09-09 12:44:46', '2025-09-09 12:44:46', 4, 29),
('2025-09-09 13:19:58', '2025-09-09 13:19:58', 4, 30),
('2025-09-10 09:15:39', '2025-09-10 09:15:39', 4, 36),
('2025-09-22 19:08:16', '2025-09-22 19:08:16', 4, 37),
('2025-09-04 23:12:14', '2025-09-04 23:12:14', 5, 10),
('2025-09-04 23:19:13', '2025-09-04 23:19:13', 5, 11),
('2025-09-04 23:58:58', '2025-09-04 23:58:58', 5, 13),
('2025-09-09 10:39:59', '2025-09-09 10:39:59', 5, 22),
('2025-09-09 10:52:38', '2025-09-09 10:52:38', 5, 23),
('2025-09-10 05:25:01', '2025-09-10 05:25:01', 5, 32),
('2025-09-10 07:50:37', '2025-09-10 07:50:37', 5, 34),
('2025-09-10 09:15:39', '2025-09-10 09:15:39', 5, 36),
('2025-09-04 23:58:58', '2025-09-04 23:58:58', 8, 13),
('2025-09-05 01:40:07', '2025-09-05 01:40:07', 8, 17),
('2025-09-09 09:24:42', '2025-09-09 09:24:42', 8, 21),
('2025-09-09 10:39:59', '2025-09-09 10:39:59', 8, 22),
('2025-09-09 12:13:54', '2025-09-09 12:13:54', 8, 27),
('2025-09-09 12:28:05', '2025-09-09 12:28:05', 8, 28),
('2025-09-09 12:44:46', '2025-09-09 12:44:46', 8, 29),
('2025-09-09 13:19:58', '2025-09-09 13:19:58', 8, 30),
('2025-09-10 08:18:52', '2025-09-10 08:18:52', 8, 35),
('2025-09-10 09:15:39', '2025-09-10 09:15:39', 8, 36),
('2025-09-09 10:39:59', '2025-09-09 10:39:59', 9, 22),
('2025-09-09 10:52:38', '2025-09-09 10:52:38', 9, 23),
('2025-09-09 11:41:40', '2025-09-09 11:41:40', 9, 25),
('2025-09-05 00:10:48', '2025-09-05 00:10:48', 10, 14),
('2025-09-10 04:16:23', '2025-09-10 04:16:23', 10, 31),
('2025-09-10 07:50:37', '2025-09-10 07:50:37', 10, 34),
('2025-09-05 00:10:48', '2025-09-05 00:10:48', 11, 14),
('2025-09-10 08:18:52', '2025-09-10 08:18:52', 11, 35),
('2025-09-05 00:10:48', '2025-09-05 00:10:48', 12, 14),
('2025-09-10 09:15:39', '2025-09-10 09:15:39', 12, 36),
('2025-09-05 00:10:48', '2025-09-05 00:10:48', 13, 14),
('2025-09-05 01:40:07', '2025-09-05 01:40:07', 13, 17),
('2025-09-05 01:40:07', '2025-09-05 01:40:07', 14, 17),
('2025-09-05 05:40:16', '2025-09-05 05:40:16', 15, 18),
('2025-09-05 05:51:39', '2025-09-05 05:51:39', 15, 19),
('2025-09-05 06:04:16', '2025-09-05 06:04:16', 15, 20),
('2025-09-09 10:52:38', '2025-09-09 10:52:38', 15, 23),
('2025-09-09 11:30:23', '2025-09-09 11:30:23', 15, 24),
('2025-09-09 11:41:40', '2025-09-09 11:41:40', 15, 25),
('2025-09-09 11:59:41', '2025-09-09 11:59:41', 15, 26),
('2025-09-10 04:16:23', '2025-09-10 04:16:23', 15, 31),
('2025-09-10 08:18:52', '2025-09-10 08:18:52', 15, 35),
('2025-09-22 19:08:16', '2025-09-22 19:08:16', 15, 37),
('2025-09-05 05:51:39', '2025-09-05 05:51:39', 16, 19),
('2025-09-09 09:24:42', '2025-09-09 09:24:42', 16, 21),
('2025-09-09 11:30:23', '2025-09-09 11:30:23', 16, 24),
('2025-09-09 11:35:14', '2025-09-09 11:35:14', 17, 24),
('2025-09-09 11:35:14', '2025-09-09 11:35:14', 18, 24),
('2025-09-10 04:16:23', '2025-09-10 04:16:23', 18, 31),
('2025-09-10 07:50:37', '2025-09-10 07:50:37', 18, 34),
('2025-09-10 08:18:52', '2025-09-10 08:18:52', 18, 35),
('2025-09-09 12:44:46', '2025-09-09 12:44:46', 20, 29),
('2025-09-09 13:19:58', '2025-09-09 13:19:58', 20, 30);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `senderId` int(11) DEFAULT NULL,
  `type` enum('friend_request','friend_request_status','new_comment','like_comment','user_mention','movie_update','system_message','comment_report','new_message') NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `isPinned` tinyint(1) NOT NULL DEFAULT 0,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `userId`, `senderId`, `type`, `title`, `body`, `link`, `isRead`, `isPinned`, `metadata`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(61, 1, 2, '', 'Tin của bạn có phản ứng mới', 'Nghĩa Hoàng đã phản ứng 😄 với tin của bạn.', '/stories/1', 0, 0, '{\"storyId\":1,\"reactorId\":2,\"emoji\":\"😄\"}', '2025-10-08 01:25:01', '2025-10-08 01:25:01', '2025-10-08 03:41:05'),
(62, 1, 2, '', 'Tin của bạn đã được xem', 'Nghĩa Hoàng đã xem tin của bạn.', '/stories/5', 0, 0, '{\"storyId\":5,\"viewerId\":2}', '2025-10-08 01:34:59', '2025-10-08 01:34:59', '2025-10-08 03:41:04'),
(63, 1, 2, '', 'Tin của bạn có cảm xúc mới', 'Nghĩa Hoàng đã thả cảm xúc 😇 với tin của bạn.', '/stories/5', 0, 0, '{\"storyId\":5,\"reactorId\":2,\"emoji\":\"😇\"}', '2025-10-08 01:35:11', '2025-10-08 01:35:11', '2025-10-08 03:41:04'),
(64, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc ❤️ với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"❤️\"}', '2025-10-08 02:27:28', '2025-10-08 02:27:28', NULL),
(65, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc ❤️ với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"❤️\"}', '2025-10-08 02:27:40', '2025-10-08 02:27:40', NULL),
(66, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc ❤️ với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"❤️\"}', '2025-10-08 02:27:42', '2025-10-08 02:27:42', NULL),
(67, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc ❤️ với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"❤️\"}', '2025-10-08 02:27:49', '2025-10-08 02:27:49', NULL),
(68, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc 🍉 với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"🍉\"}', '2025-10-08 02:28:05', '2025-10-08 02:28:05', NULL),
(69, 1, 2, '', 'Tin của bạn có cảm xúc mới', 'Nghĩa Hoàng đã thả cảm xúc 😇 với tin của bạn.', '/stories/3', 0, 0, '{\"storyId\":3,\"reactorId\":2,\"emoji\":\"😇\"}', '2025-10-08 02:43:01', '2025-10-08 02:43:01', '2025-10-08 03:41:04'),
(70, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc 😢 với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"😢\"}', '2025-10-08 03:40:47', '2025-10-08 03:40:47', NULL),
(71, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc ❤️ với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"❤️\"}', '2025-10-08 03:40:56', '2025-10-08 03:40:56', NULL),
(72, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc 😮 với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"😮\"}', '2025-10-08 03:40:57', '2025-10-08 03:40:57', NULL),
(73, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc 🖕 với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"🖕\"}', '2025-10-08 04:04:46', '2025-10-08 04:04:46', NULL),
(74, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc 🖕 với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"🖕\"}', '2025-10-08 04:04:46', '2025-10-08 04:04:46', NULL),
(75, 2, 1, '', 'Tin của bạn có cảm xúc mới', 'Rạp Phim đã thả cảm xúc 🍉 với tin của bạn.', '/stories/4', 0, 0, '{\"storyId\":4,\"reactorId\":1,\"emoji\":\"🍉\"}', '2025-10-08 04:05:52', '2025-10-08 04:05:52', NULL),
(76, 3, 1, '', 'Tin của bạn đã được xem', 'Rạp Phim đã xem tin của bạn.', '/stories/7', 0, 0, '{\"storyId\":7,\"viewerId\":1}', '2025-10-08 04:37:13', '2025-10-08 04:37:13', NULL),
(77, 1, 3, '', 'Tin của bạn đã được xem', 'Nghĩa Văn đã xem tin của bạn.', '/stories/1', 0, 0, '{\"storyId\":1,\"viewerId\":3}', '2025-10-10 05:05:53', '2025-10-10 05:05:53', '2025-10-13 09:42:37'),
(78, 1, 3, '', 'Tin của bạn có cảm xúc mới', 'Nghĩa Văn đã thả cảm xúc 😃 với tin của bạn.', '/stories/1', 0, 0, '{\"storyId\":1,\"reactorId\":3,\"emoji\":\"😃\"}', '2025-10-10 05:06:00', '2025-10-10 05:06:00', '2025-10-13 09:42:36'),
(79, 1, 3, 'like_comment', 'Bình luận được yêu thích', 'Nghĩa Văn đã thích bình luận của bạn: \"[@Nghĩa Hoàng](/profile/XB1p1TCgPwf2TBLOKA9lszZnP4...\"', '/movie/co-bon-la-den?commentId=7', 0, 0, '{\"commentId\":7,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-10 05:06:23', '2025-10-10 05:06:23', '2025-10-13 09:42:36'),
(80, 1, 3, 'like_comment', 'Bình luận được yêu thích', 'Nghĩa Văn đã thích bình luận của bạn: \"ădc3f2\"', '/movie/co-bon-la-den?commentId=10', 0, 0, '{\"commentId\":10,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-10 05:06:31', '2025-10-10 05:06:31', '2025-10-13 09:42:35'),
(81, 1, 3, 'new_comment', 'Bình luận mới', 'Nghĩa Văn đã trả lời bình luận của bạn: \"ê nha\"', '/movie/co-bon-la-den?commentId=11', 1, 0, '{\"commentId\":11,\"parentId\":10,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-10 05:06:46', '2025-10-10 05:06:50', '2025-10-13 09:42:37'),
(82, 1, 7, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/y0yE8BefQKaz41DlNgk9OBkPksO2', 1, 0, '{\"friendshipId\":8}', '2025-10-15 18:57:38', '2025-10-15 18:57:43', '2025-10-18 12:39:38'),
(83, 7, 1, 'friend_request_status', 'Đã chấp nhận lời mời kết bạn', 'Rạp Phim đã chấp nhận lời mời kết bạn của bạn.', '/profile/dcd9f220-372c-4593-a5ca-e16262554482', 0, 0, '{\"friendshipId\":8,\"status\":\"accepted\"}', '2025-10-15 18:57:52', '2025-10-15 18:57:52', '2025-11-22 23:40:36'),
(84, 1, 7, 'comment_report', 'Bình luận bị báo cáo', 'Nghĩa Hoàng vừa báo cáo một bình luận: \"ădc3f2\"', '/admin/comments/10', 1, 0, '{\"commentId\":10,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-19 04:21:07', '2025-11-09 14:34:11', '2025-11-22 23:03:25'),
(85, 1, 7, 'new_comment', 'Bình luận mới', 'Nghĩa Hoàng vừa trả lời bình luận: \"được hum😁\"', '/movie/co-bon-la-den?commentId=12', 1, 0, '{\"commentId\":12,\"parentId\":10,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-19 04:21:31', '2025-10-19 18:32:01', '2025-11-22 23:03:25'),
(86, 7, 1, 'like_comment', 'Bình luận được yêu thích', 'Rạp Phim vừa thích bình luận của bạn: \"được hum😁\"', '/movie/co-bon-la-den?commentId=12', 0, 0, '{\"commentId\":12,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-19 18:32:06', '2025-10-19 18:32:06', '2025-11-22 23:40:35'),
(87, 7, 1, 'like_comment', 'Bình luận được yêu thích', 'Rạp Phim vừa thích bình luận của bạn: \"được hum😁\"', '/movie/co-bon-la-den?commentId=12', 0, 0, '{\"commentId\":12,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-19 18:32:08', '2025-10-19 18:32:08', '2025-11-22 23:40:35'),
(88, 3, 1, 'like_comment', 'Bình luận được yêu thích', 'Rạp Phim vừa thích bình luận của bạn: \"ê nha\"', '/movie/co-bon-la-den?commentId=11', 0, 0, '{\"commentId\":11,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-19 18:32:10', '2025-10-19 18:32:10', NULL),
(89, 3, 1, 'like_comment', 'Bình luận được yêu thích', 'Rạp Phim vừa thích bình luận của bạn: \"ê nha\"', '/movie/co-bon-la-den?commentId=11', 0, 0, '{\"commentId\":11,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-19 18:32:11', '2025-10-19 18:32:11', NULL),
(90, 3, 1, 'like_comment', 'Bình luận được yêu thích', 'Rạp Phim vừa thích bình luận của bạn: \"ê nha\"', '/movie/co-bon-la-den?commentId=11', 0, 0, '{\"commentId\":11,\"contentId\":1,\"contentType\":\"movie\"}', '2025-10-19 18:32:13', '2025-10-19 18:32:13', NULL),
(91, 3, 1, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/dcd9f220-372c-4593-a5ca-e16262554482', 0, 0, '{\"friendshipId\":9}', '2025-11-09 12:40:55', '2025-11-09 12:40:55', '2025-11-23 02:02:25'),
(92, 7, 1, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/dcd9f220-372c-4593-a5ca-e16262554482', 0, 0, '{\"friendshipId\":10}', '2025-11-09 13:51:03', '2025-11-09 13:51:03', '2025-11-22 23:40:35'),
(94, 2, 1, 'new_comment', 'Bình luận mới', 'Nghĩa Hoàng vừa trả lời bình luận: \"[@Nghĩa Hoàng](/profile/XB1p1TCgPwf2TBLOKA9lszZnP4...\"', '/movie/co-bon-la-den?commentId=13', 0, 0, '{\"commentId\":13,\"parentId\":8,\"contentId\":1,\"contentType\":\"movie\"}', '2025-11-10 05:17:46', '2025-11-10 05:17:46', NULL),
(95, 1, NULL, 'new_comment', 'Bình luận mới', 'Hoàng Văn Nghĩa vừa trả lời bình luận: \"hello\"', '/watch/co-bon-la-den/episode/1?commentId=16', 1, 0, '{\"commentId\":16,\"parentId\":15,\"contentId\":1,\"contentType\":\"episode\"}', '2025-11-10 13:19:41', '2025-11-10 13:19:46', '2025-11-22 23:03:24'),
(96, 1, 3, 'friend_request_status', 'Đã chấp nhận lời mời kết bạn', 'Nghĩa Văn đã chấp nhận lời mời kết bạn của bạn.', '/profile/KZsLxLpZ7Pb0q52jE42KVYLrJLw2', 0, 0, '{\"friendshipId\":9,\"status\":\"accepted\"}', '2025-11-11 21:23:10', '2025-11-11 21:23:10', '2025-11-22 23:03:24'),
(97, 1, 1, 'comment_report', 'Bình luận bị báo cáo', 'Nghĩa Hoàng vừa báo cáo một bình luận: \"chago\"', '/admin/comments/8', 1, 0, '{\"commentId\":8,\"contentId\":1,\"contentType\":\"movie\"}', '2025-11-21 18:39:21', '2025-11-21 18:39:28', '2025-11-22 23:03:23'),
(98, 1, 7, 'friend_request_status', 'Đã chấp nhận lời mời kết bạn', 'Nghĩa Hoàng đã chấp nhận lời mời kết bạn của bạn.', '/profile/y0yE8BefQKaz41DlNgk9OBkPksO2', 1, 0, '{\"friendshipId\":10,\"status\":\"accepted\"}', '2025-11-21 21:51:28', '2025-11-22 22:43:59', '2025-11-22 23:03:22'),
(99, 1, 1, 'comment_report', 'Bình luận bị báo cáo', 'Nghĩa Hoàng vừa báo cáo một bình luận: \"chago\"', '/admin/comments/8', 0, 0, '{\"commentId\":8,\"contentId\":1,\"contentType\":\"movie\"}', '2025-11-22 22:55:39', '2025-11-22 22:55:39', '2025-11-22 23:41:41'),
(100, 1, 7, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/y0yE8BefQKaz41DlNgk9OBkPksO2', 0, 0, '{\"friendshipId\":12}', '2025-11-22 23:03:31', '2025-11-22 23:03:31', '2025-11-22 23:41:41'),
(101, 7, 1, 'friend_request_status', 'Đã chấp nhận lời mời kết bạn', 'Nghĩa Hoàng đã chấp nhận lời mời kết bạn của bạn.', '/profile/q2Nxen6MNRVJJZOivMtROBekBXy1', 0, 0, '{\"friendshipId\":12,\"status\":\"accepted\"}', '2025-11-22 23:05:28', '2025-11-22 23:05:28', '2025-11-22 23:40:34'),
(102, 7, 1, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/q2Nxen6MNRVJJZOivMtROBekBXy1', 1, 0, '{\"friendshipId\":13}', '2025-11-22 23:06:15', '2025-11-22 23:40:28', '2025-11-22 23:40:33'),
(103, 1, 7, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/y0yE8BefQKaz41DlNgk9OBkPksO2', 0, 0, '{\"friendshipId\":14}', '2025-11-22 23:40:46', '2025-11-22 23:40:46', '2025-11-22 23:41:41'),
(104, 7, 1, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/q2Nxen6MNRVJJZOivMtROBekBXy1', 0, 0, '{\"friendshipId\":15}', '2025-11-22 23:41:53', '2025-11-22 23:41:53', '2025-11-22 23:46:27'),
(105, 1, 7, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/y0yE8BefQKaz41DlNgk9OBkPksO2', 0, 0, '{\"friendshipId\":16}', '2025-11-22 23:42:24', '2025-11-22 23:42:24', '2025-11-23 02:46:30'),
(106, 1, 7, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/y0yE8BefQKaz41DlNgk9OBkPksO2', 0, 0, '{\"friendshipId\":17}', '2025-11-22 23:42:42', '2025-11-22 23:42:42', '2025-11-23 02:46:30'),
(107, 7, 1, 'friend_request_status', 'Lời mời kết bạn bị từ chối', 'Nghĩa Hoàng đã từ chối lời mời kết bạn của bạn.', '/profile/q2Nxen6MNRVJJZOivMtROBekBXy1', 0, 0, '{\"friendshipId\":17,\"status\":\"rejected\"}', '2025-11-22 23:42:54', '2025-11-22 23:42:54', '2025-11-22 23:46:27'),
(108, 7, 1, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/q2Nxen6MNRVJJZOivMtROBekBXy1', 0, 0, '{\"friendshipId\":18}', '2025-11-22 23:46:32', '2025-11-22 23:46:48', '2025-11-22 23:46:48'),
(109, 1, 7, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/y0yE8BefQKaz41DlNgk9OBkPksO2', 0, 0, '{\"friendshipId\":19}', '2025-11-22 23:50:53', '2025-11-22 23:50:53', '2025-11-23 02:46:29'),
(110, 7, 1, 'friend_request_status', 'Đã chấp nhận lời mời kết bạn', 'Nghĩa Hoàng đã chấp nhận lời mời kết bạn của bạn.', '/profile/q2Nxen6MNRVJJZOivMtROBekBXy1', 0, 0, '{\"friendshipId\":19,\"status\":\"accepted\"}', '2025-11-22 23:51:10', '2025-11-22 23:51:10', NULL),
(111, 1, 3, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Văn vừa gửi lời mời kết bạn cho bạn.', '/profile/KZsLxLpZ7Pb0q52jE42KVYLrJLw2', 0, 0, '{\"friendshipId\":20}', '2025-11-23 02:02:42', '2025-11-23 02:02:42', '2025-11-23 02:46:29'),
(112, 3, 1, 'friend_request_status', 'Lời mời kết bạn bị từ chối', 'Nghĩa Hoàng đã từ chối lời mời kết bạn của bạn.', '/profile/q2Nxen6MNRVJJZOivMtROBekBXy1', 0, 0, '{\"friendshipId\":20,\"status\":\"rejected\"}', '2025-11-23 02:24:44', '2025-11-23 02:24:44', NULL),
(113, 3, 1, 'friend_request', 'Lời mời kết bạn mới', 'Nghĩa Hoàng vừa gửi lời mời kết bạn cho bạn.', '/profile/q2Nxen6MNRVJJZOivMtROBekBXy1', 0, 0, '{\"friendshipId\":21}', '2025-11-23 02:25:01', '2025-11-23 02:25:01', NULL),
(114, 1, 3, 'friend_request_status', 'Đã chấp nhận lời mời kết bạn', 'Nghĩa Văn đã chấp nhận lời mời kết bạn của bạn.', '/profile/KZsLxLpZ7Pb0q52jE42KVYLrJLw2', 0, 0, '{\"friendshipId\":21,\"status\":\"accepted\"}', '2025-11-23 02:25:08', '2025-11-23 02:25:08', '2025-11-23 02:46:28');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `refreshtokens`
--

CREATE TABLE `refreshtokens` (
  `id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiryDate` datetime NOT NULL,
  `userId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `refreshtokens`
--

INSERT INTO `refreshtokens` (`id`, `token`, `expiryDate`, `userId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU5NTQ0NzM0LCJleHAiOjE3NjAxNDk1MzR9.oCjDAYy_EUpHo7ajr7Uv514icDrRIUqBqSHgpUneEdg', '2025-10-11 02:25:34', 1, '2025-10-04 02:25:34', '2025-10-04 02:25:34', '2025-10-04 15:43:36'),
(2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU5NTQ1NTYxLCJleHAiOjE3NjAxNTAzNjF9.nTL9hP9ENSCDCN_swqDYjK8Pt_P9D5UVgmKmuUn_vzI', '2025-10-11 02:39:21', 2, '2025-10-04 02:39:21', '2025-10-04 02:39:21', '2025-11-11 12:19:56'),
(3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU5NTkyNjE2LCJleHAiOjE3NjAxOTc0MTZ9.X-k97-neqEyG_Of9BCeXOheSzQ6phXPcndXIx0brF8E', '2025-10-11 15:43:36', 1, '2025-10-04 15:43:36', '2025-10-04 15:43:36', '2025-10-04 15:43:50'),
(4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU5NTkyNjMwLCJleHAiOjE3NjAxOTc0MzB9.2mcCe97PnxdYZR3XdkyDXZ23dLdKupDsCukkcY8ePcY', '2025-10-11 15:43:50', 1, '2025-10-04 15:43:50', '2025-10-04 15:43:50', '2025-10-04 15:44:02'),
(5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU5NTkyNjQyLCJleHAiOjE3NjAxOTc0NDJ9.cOcPp7U1Vcy5I_Z_AR2-DibMowe4W1ozsWEDM19nZx4', '2025-10-11 15:44:02', 1, '2025-10-04 15:44:02', '2025-10-04 15:44:02', '2025-10-05 14:32:04'),
(6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzU5Njc0NzI0LCJleHAiOjE3NjAyNzk1MjR9.4oMVhGdiKbj_GSAkdGu6c4ryLd85M8oGyz1cIujqTX0', '2025-10-12 14:32:04', 1, '2025-10-05 14:32:04', '2025-10-05 14:32:04', '2025-10-12 14:33:51'),
(7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzU5ODM3MjA0LCJleHAiOjE3NjA0NDIwMDR9.WKdfLsd3fm0MtULHus-yiXhuGJKMT79MoPF4KOsFG94', '2025-10-14 11:40:04', 3, '2025-10-07 11:40:04', '2025-10-07 11:40:04', '2025-11-11 21:23:00'),
(8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYwMjc5NjMxLCJleHAiOjE3NjA4ODQ0MzF9.FOjFXIDgj3r4-BGgLJRjz691pIdESPPkRk3Xgc3IveY', '2025-10-19 14:33:51', 1, '2025-10-12 14:33:51', '2025-10-12 14:33:51', '2025-10-14 13:11:26'),
(9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYwNDQ3NDg2LCJleHAiOjE3NjEwNTIyODZ9.4n3Cyl3Tdyfluu2CaAwfrL4mO5yKwR5ZLEpn_0FgugM', '2025-10-21 13:11:26', 1, '2025-10-14 13:11:26', '2025-10-14 13:11:26', '2025-10-19 18:46:46'),
(10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzYwNTU0MzE3LCJleHAiOjE3NjExNTkxMTd9.GuG1_QXMeawhy9uHYFlsewa2Cd1WQGPBDbRLnDTg-o8', '2025-10-22 18:51:57', 7, '2025-10-15 18:51:57', '2025-10-15 18:51:57', '2025-11-21 21:51:00'),
(11, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYwODk5NjA2LCJleHAiOjE3NjE1MDQ0MDZ9.9EkefNuKWpx1i9Zcdt0LtqePje8CDsMfpQ2EhmRewvk', '2025-10-26 18:46:46', 1, '2025-10-19 18:46:46', '2025-10-19 18:46:46', '2025-10-20 19:08:05'),
(12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYwOTg3Mjg1LCJleHAiOjE3NjE1OTIwODV9.RjkW-atFzJeXuhdYbtowGU-56aP6QqUezkSOFvHkpXY', '2025-10-27 19:08:05', 1, '2025-10-20 19:08:05', '2025-10-20 19:08:05', '2025-11-05 06:13:11'),
(13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzIzMTkxLCJleHAiOjE3NjI5Mjc5OTF9.AozhsKwzPgPf5mENRaDBgfhQ8d4pdat7AnBgHYp27iY', '2025-11-12 06:13:11', 1, '2025-11-05 06:13:11', '2025-11-05 06:13:11', '2025-11-05 06:43:47'),
(14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzI1MDI3LCJleHAiOjE3NjI5Mjk4Mjd9.vGHGRKLBZfDMzRc3QOCpBFZLLUuTPxpDaxirw4dpLAs', '2025-11-12 06:43:47', 1, '2025-11-05 06:43:47', '2025-11-05 06:43:47', '2025-11-05 06:47:36'),
(15, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzI1MjU2LCJleHAiOjE3NjI5MzAwNTZ9.5nNN5uyzO8-BR74LG55_ciIycCpxZCXPL_bjX87k84A', '2025-11-12 06:47:36', 1, '2025-11-05 06:47:36', '2025-11-05 06:47:36', '2025-11-05 06:50:00'),
(16, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzI1NDAwLCJleHAiOjE3NjI5MzAyMDB9.h0vQNssevDQtQP2ZeJA-_4pdIQiTn8mT9VzkdB-62dY', '2025-11-12 06:50:00', 1, '2025-11-05 06:50:00', '2025-11-05 06:50:00', '2025-11-05 07:58:06'),
(17, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzI5NDg2LCJleHAiOjE3NjI5MzQyODZ9.bLRc-MBStYI28wUORUCkjh97LB8jiHzLBfW86xYmnk8', '2025-11-12 07:58:06', 1, '2025-11-05 07:58:06', '2025-11-05 07:58:06', '2025-11-05 08:11:40'),
(18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzMwMzAwLCJleHAiOjE3NjI5MzUxMDB9.Nwi2s5hlNveynG9ZgsaaBJF7x2fvToNsQKXIl2vZEgw', '2025-11-12 08:11:40', 1, '2025-11-05 08:11:40', '2025-11-05 08:11:40', '2025-11-05 08:30:55'),
(19, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzMxNDU1LCJleHAiOjE3NjI5MzYyNTV9.PuPLTQxay52abJpuK5aDRkREYVC-2wNddL_UIIM685s', '2025-11-12 08:30:55', 1, '2025-11-05 08:30:55', '2025-11-05 08:30:55', '2025-11-05 08:56:48'),
(21, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzMzMDA4LCJleHAiOjE3NjI5Mzc4MDh9.F_zPZiQwpNyxDjBcu3PU0KBJfaqq1LjRRAAW3Jt1vGY', '2025-11-12 08:56:48', 1, '2025-11-05 08:56:48', '2025-11-05 08:56:48', '2025-11-05 08:57:28'),
(22, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyMzMzMDQ4LCJleHAiOjE3NjI5Mzc4NDh9.n9TzJ66ZeuxuxVVZGhH7Z45K3_q5qRzGaeQC0kkmnPk', '2025-11-12 08:57:28', 1, '2025-11-05 08:57:28', '2025-11-05 08:57:28', '2025-11-07 09:32:26'),
(23, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNTA3OTQ2LCJleHAiOjE3NjMxMTI3NDZ9.QAb4NNZMHgu81UqD7mS5oLw6P6FGzrrfDZhmmlleGh8', '2025-11-14 09:32:26', 1, '2025-11-07 09:32:26', '2025-11-07 09:32:26', '2025-11-07 09:41:57'),
(24, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNTA4NTE3LCJleHAiOjE3NjMxMTMzMTd9.ITY4Ph2T2_yktwjMK0nVPBETx2FPXmtEPZphEWV-pZc', '2025-11-14 09:41:57', 1, '2025-11-07 09:41:57', '2025-11-07 09:41:57', '2025-11-08 15:09:18'),
(25, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNjE0NTU4LCJleHAiOjE3NjMyMTkzNTh9.GFOPyzTSox9FK0HU1zjPy9E00XO4J1Jhjh-wI2rTNfg', '2025-11-15 15:09:18', 1, '2025-11-08 15:09:18', '2025-11-08 15:09:18', '2025-11-08 15:36:46'),
(26, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNjE2MjA2LCJleHAiOjE3NjMyMjEwMDZ9.XXXykiOqQEjXpPN7Ogm1uWtwZhPTWm_8Ne_-n96Wjis', '2025-11-15 15:36:46', 1, '2025-11-08 15:36:46', '2025-11-08 15:36:46', '2025-11-09 04:17:50'),
(27, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNjYxODcwLCJleHAiOjE3NjMyNjY2NzB9.leirnrunbSbqbIrWsNYF1w_eKY_TZkIykROU-b_wovs', '2025-11-16 04:17:50', 1, '2025-11-09 04:17:50', '2025-11-09 04:17:50', '2025-11-09 04:18:32'),
(28, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNjYxOTEyLCJleHAiOjE3NjMyNjY3MTJ9.qnkFiHeBUlVtj6xwY6W7su6jWfJn6Uuy7ZIbrJaH59I', '2025-11-16 04:18:32', 1, '2025-11-09 04:18:32', '2025-11-09 04:18:32', '2025-11-09 04:21:31'),
(29, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNjYyMDkxLCJleHAiOjE3NjMyNjY4OTF9.509GcguWrci32Wen3Hlt9s0e5IVZX26xm1-gBts6a5I', '2025-11-16 04:21:31', 1, '2025-11-09 04:21:31', '2025-11-09 04:21:31', '2025-11-09 07:16:30'),
(30, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNjcyNTkwLCJleHAiOjE3NjMyNzczOTB9.Pue9UhhZlLkBuysRt3-046V-4jwYLTVwazy1Dvz20Fw', '2025-11-16 07:16:30', 1, '2025-11-09 07:16:30', '2025-11-09 07:16:30', '2025-11-09 07:16:35'),
(31, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNjcyNTk1LCJleHAiOjE3NjMyNzczOTV9.IGgQDuMeIgY3HGA8o0b1SthnYWk29NjREm9w2LecUO8', '2025-11-16 07:16:35', 1, '2025-11-09 07:16:35', '2025-11-09 07:16:35', '2025-11-09 09:01:31'),
(32, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNjc4ODkxLCJleHAiOjE3NjMyODM2OTF9.ummr4uN4ODASeFJWVAw2aOsILUWLXdcADio_3fPjiS4', '2025-11-16 09:01:31', 1, '2025-11-09 09:01:31', '2025-11-09 09:01:31', '2025-11-09 19:34:28'),
(33, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNzE2ODY4LCJleHAiOjE3NjMzMjE2Njh9.txJw8A_acT20v2N0l6vLepIUUDw_XNxuBsa7tnt4roc', '2025-11-16 19:34:28', 1, '2025-11-09 19:34:28', '2025-11-09 19:34:28', '2025-11-09 19:37:23'),
(34, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNzE3MDQzLCJleHAiOjE3NjMzMjE4NDN9.YVhp2p47G1txFY-6DoOgFXwgMLhTZg5c_5n8SdL2Kh8', '2025-11-16 19:37:23', 1, '2025-11-09 19:37:23', '2025-11-09 19:37:23', '2025-11-10 04:55:17'),
(35, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNzUwNTE3LCJleHAiOjE3NjMzNTUzMTd9.O6oImPQDvt5Sbl-G80VruKomYPlpn58AmZ5DFyZULAs', '2025-11-17 04:55:17', 1, '2025-11-10 04:55:17', '2025-11-10 04:55:17', '2025-11-10 10:38:37'),
(36, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNzcxMTE3LCJleHAiOjE3NjMzNzU5MTd9.0zeyuOdydBO-seMPBwqbc5yiZLEHPLFj_f5Q_RI6rMA', '2025-11-17 10:38:37', 1, '2025-11-10 10:38:37', '2025-11-10 10:38:37', '2025-11-10 12:27:48'),
(37, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyNzc3NjY4LCJleHAiOjE3NjMzODI0Njh9.elTMP5zEg5B0RfCJW1bozDwojeqy6C6PC_KvxZUCEfc', '2025-11-17 12:27:48', 1, '2025-11-10 12:27:48', '2025-11-10 12:27:48', '2025-11-11 12:19:41'),
(39, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyODYzNTgxLCJleHAiOjE3NjM0NjgzODF9.H5UlwHh8uL4ODJkdxNNyAq6qxAYxmV0D15_5XlUsSKY', '2025-11-18 12:19:41', 1, '2025-11-11 12:19:41', '2025-11-11 12:19:41', '2025-11-11 12:24:02'),
(40, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzYyODYzNTk2LCJleHAiOjE3NjM0NjgzOTZ9.Da0bNI-hcuaUgBAwpHyNLyydDas32YoKLr4RHGVZmfM', '2025-11-18 12:19:56', 2, '2025-11-11 12:19:56', '2025-11-11 12:19:56', '2025-11-20 05:08:11'),
(41, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyODYzODQyLCJleHAiOjE3NjM0Njg2NDJ9.SuthH_9YhR8nv3HMKDv0-OGsgeLPEeVNjwvACvSjTg4', '2025-11-18 12:24:02', 1, '2025-11-11 12:24:02', '2025-11-11 12:24:02', '2025-11-11 16:47:02'),
(45, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyODc5NjIyLCJleHAiOjE3NjM0ODQ0MjJ9.XXUWXrZ7n9EUtbylvLRwxjU2n4VSd8-8N0tA8GcTJFY', '2025-11-18 16:47:02', 1, '2025-11-11 16:47:02', '2025-11-11 16:47:02', '2025-11-11 16:55:27'),
(46, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyODgwMTI3LCJleHAiOjE3NjM0ODQ5Mjd9.AsdTu-sZG0ePMfFzwY0pQlEMs9n87g3bpd3IGe1gQpY', '2025-11-18 16:55:27', 1, '2025-11-11 16:55:27', '2025-11-11 16:55:27', '2025-11-11 17:58:22'),
(47, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyODgzOTAyLCJleHAiOjE3NjM0ODg3MDJ9.62uRjzYL0joEPUWgEFwT6OEmfDlc7bmlmnCRZ3ZG_7k', '2025-11-18 17:58:22', 1, '2025-11-11 17:58:22', '2025-11-11 17:58:22', '2025-11-11 21:23:50'),
(48, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzYyODk2MTgwLCJleHAiOjE3NjM1MDA5ODB9.A_IcO9A0fbj545Eabv3murPCKuFExbSkkE73eULVtnc', '2025-11-18 21:23:00', 3, '2025-11-11 21:23:00', '2025-11-11 21:23:00', '2025-11-23 02:02:18'),
(49, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyODk2MjMwLCJleHAiOjE3NjM1MDEwMzB9.ham1TahCcBdULojBNcoWYUN31dyMtMbIEoAh9r5mbnE', '2025-11-18 21:23:50', 1, '2025-11-11 21:23:50', '2025-11-11 21:23:50', '2025-11-12 06:12:04'),
(50, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyOTI3OTI0LCJleHAiOjE3NjM1MzI3MjR9.d4FOhrl-K0pBBeMDoxGi-WCteb0oP0p2UWmGEPdLI9Q', '2025-11-19 06:12:04', 1, '2025-11-12 06:12:04', '2025-11-12 06:12:04', '2025-11-12 14:10:20'),
(51, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyOTMxNDIwLCJleHAiOjE3NjM1MzYyMjB9.nVHxFa1V5Ovc6k7l1USIxzw83SVSNkoDrz6XZRTgTvQ', '2025-11-19 14:10:20', 1, '2025-11-12 14:10:20', '2025-11-12 14:10:20', '2025-11-12 15:10:26'),
(55, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYyOTM1MDI2LCJleHAiOjE3NjM1Mzk4MjZ9.-MM0V7kInDZZq6e6OG8pLczovzx_xrymIxtLWYJEYOE', '2025-11-19 15:10:26', 1, '2025-11-12 15:10:26', '2025-11-12 15:10:26', '2025-11-13 19:05:49'),
(56, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzMDM1NTQ5LCJleHAiOjE3NjM2NDAzNDl9.TMFqw5S6r-vP8wcx0GLwjY_cgNs_It19nCAUANJY8B0', '2025-11-20 19:05:49', 1, '2025-11-13 19:05:49', '2025-11-13 19:05:49', '2025-11-15 15:28:21'),
(57, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzMTk1MzAxLCJleHAiOjE3NjM4MDAxMDF9.-IcljBiLp0Lgj3WaDZwifEK2KJmnRp3Vr_PM6sn6W8A', '2025-11-22 15:28:21', 1, '2025-11-15 15:28:21', '2025-11-15 15:28:21', '2025-11-15 15:28:25'),
(58, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzMTk1MzA1LCJleHAiOjE3NjM4MDAxMDV9.xo_-ysmiz1pErhobilkzqgm6reBh3wB1HHovJPMBBxs', '2025-11-22 15:28:25', 1, '2025-11-15 15:28:25', '2025-11-15 15:28:25', '2025-11-15 20:07:34'),
(59, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzMjEyMDUzLCJleHAiOjE3NjM4MTY4NTN9.hzhQMBQxJFt1gzB2I1zWWrpzF9l0ZcPZBD0lHButNfg', '2025-11-22 20:07:34', 1, '2025-11-15 20:07:34', '2025-11-15 20:07:34', '2025-11-16 14:22:41'),
(60, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzMjc3NzYxLCJleHAiOjE3NjM4ODI1NjF9.uIU9BD0h9qRMnOtDW-8stnO8WG5KuvXlMZ8IkvDy6OU', '2025-11-23 14:22:41', 1, '2025-11-16 14:22:41', '2025-11-16 14:22:41', '2025-11-16 22:19:07'),
(61, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzMzA2MzQ3LCJleHAiOjE3NjM5MTExNDd9.KvpykfVC4BX7kmHH2d8uYO1UupJGPkSKgqyw2MQEkuk', '2025-11-23 22:19:07', 1, '2025-11-16 22:19:07', '2025-11-16 22:19:07', '2025-11-18 06:01:07'),
(62, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNDIwNDY3LCJleHAiOjE3NjQwMjUyNjd9.V_GUlPYhPQA6sqW1RD4t743-HzrLqCcvZYWaSaBKCbQ', '2025-11-25 06:01:07', 1, '2025-11-18 06:01:07', '2025-11-18 06:01:07', '2025-11-18 16:00:25'),
(63, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNDU2NDI1LCJleHAiOjE3NjQwNjEyMjV9.mQSuD7QPnMxrxx1eOSi0BFzO2LmW3Hvg145vghCs2KU', '2025-11-25 16:00:25', 1, '2025-11-18 16:00:25', '2025-11-18 16:00:25', '2025-11-19 00:22:59'),
(64, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNDg2NTc5LCJleHAiOjE3NjQwOTEzNzl9.Km8_mRXGrlsS1VD9ZWDbisOqzPGGEOBRxV3BpIMg7pI', '2025-11-26 00:22:59', 1, '2025-11-19 00:22:59', '2025-11-19 00:22:59', '2025-11-19 00:55:08'),
(65, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNDg4NTA4LCJleHAiOjE3NjQwOTMzMDh9.QY7YrWc73FQY8m8u6132xlSHGb13K_OCnCxmtWwbwgI', '2025-11-26 00:55:08', 1, '2025-11-19 00:55:08', '2025-11-19 00:55:08', '2025-11-19 00:56:32'),
(66, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNDg4NTkyLCJleHAiOjE3NjQwOTMzOTJ9.GxZKa95-b02MLfO_fcLwHbCR0jj3BXqxN1Zhzk1LYGI', '2025-11-26 00:56:32', 1, '2025-11-19 00:56:32', '2025-11-19 00:56:32', '2025-11-21 20:43:56'),
(67, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzYzNTkwMDkxLCJleHAiOjE3NjQxOTQ4OTF9.L2AqgE6yI_3NoG0If1oCHSCzo0jzQDjt2hYockXGNcg', '2025-11-27 05:08:11', 2, '2025-11-20 05:08:11', '2025-11-20 05:08:11', '2025-11-21 21:50:15'),
(68, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNzMyNjM2LCJleHAiOjE3NjQzMzc0MzZ9.3I2nfFGk2g4iDih1knHLiYFITfs2cjG8oALD_W-ZAmM', '2025-11-28 20:43:56', 1, '2025-11-21 20:43:56', '2025-11-21 20:43:56', '2025-11-21 20:44:40'),
(69, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNzMyNjgwLCJleHAiOjE3NjQzMzc0ODB9.IJwgNaAwv4Zas124bHtIti5keOLZPw0TVbh5qVryy5M', '2025-11-28 20:44:40', 1, '2025-11-21 20:44:40', '2025-11-21 20:44:40', '2025-11-21 20:44:53'),
(70, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNzMyNjkzLCJleHAiOjE3NjQzMzc0OTN9.UG0bBTsV2f7neLQ0URPBC5GXxsCnuRIgf8Y_U39USXU', '2025-11-28 20:44:53', 1, '2025-11-21 20:44:53', '2025-11-21 20:44:53', '2025-11-22 02:05:27'),
(71, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzYzNzM2NjE1LCJleHAiOjE3NjQzNDE0MTV9.H35v_a8MGV7sDVTmz5zimE951dZiYlvCd5zh4U4iwak', '2025-11-28 21:50:15', 2, '2025-11-21 21:50:15', '2025-11-21 21:50:15', '2025-11-24 04:59:15'),
(72, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzYzNzM2NjYwLCJleHAiOjE3NjQzNDE0NjB9.ssLuif0Hj3YGehQ8-dGF8BK9Z8-z-GYhYCmrXe5bhZo', '2025-11-28 21:51:00', 7, '2025-11-21 21:51:00', '2025-11-21 21:51:00', NULL),
(73, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNzUxOTI3LCJleHAiOjE3NjQzNTY3Mjd9.h7rTubVP8LC8_C8Jbi6HCLu_asIIjYXMK9o2d4geduw', '2025-11-29 02:05:27', 1, '2025-11-22 02:05:27', '2025-11-22 02:05:27', '2025-11-22 08:00:12'),
(74, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNzczMjEyLCJleHAiOjE3NjQzNzgwMTJ9.CrHLukezqCa7GKRWNG36HHGoTmBqxFVk-qm_8DtY80Q', '2025-11-29 08:00:12', 1, '2025-11-22 08:00:12', '2025-11-22 08:00:12', '2025-11-22 08:22:01'),
(75, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNzc0NTIxLCJleHAiOjE3NjQzNzkzMjF9.Ray8JfcHaiNWw03YeitPLTLn_Ypk4AKI8q01LN3Jos8', '2025-11-29 08:22:01', 1, '2025-11-22 08:22:01', '2025-11-22 08:22:01', '2025-11-22 10:01:00'),
(76, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTcsImlhdCI6MTc2Mzc3NTAyOSwiZXhwIjoxNzY0Mzc5ODI5fQ.pbTAgCZQIZDCLjx-_fqzmwcJzduaUSbv4f6mf2njoUg', '2025-11-29 08:30:29', 17, '2025-11-22 08:30:29', '2025-11-22 08:30:29', NULL),
(77, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzNzgwNDYwLCJleHAiOjE3NjQzODUyNjB9.UPpBq6gKkir1SDivjkBobAayEr98_A-1V6qYUzHcM_Y', '2025-11-29 10:01:00', 1, '2025-11-22 10:01:00', '2025-11-22 10:01:00', '2025-11-22 15:39:56'),
(78, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzYzODAwNzk2LCJleHAiOjE3NjQ0MDU1OTZ9.m8jYCt2kF_m03ycQS_YD3QtcmYybp19OUyGccN5Y9aI', '2025-11-29 15:39:56', 1, '2025-11-22 15:39:56', '2025-11-22 15:39:56', NULL),
(79, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzYzODM4MTM4LCJleHAiOjE3NjQ0NDI5Mzh9.9brCsOKUkitwuFXztGMSx56PBbcDs-Or3actJri8c6E', '2025-11-30 02:02:18', 3, '2025-11-23 02:02:18', '2025-11-23 02:02:18', NULL),
(80, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzYzOTM1MTU1LCJleHAiOjE3NjQ1Mzk5NTV9.XdM6YmOZCt2T2EbTaIumVmsVGsu0cTrK5muwDgybVhU', '2025-12-01 04:59:15', 2, '2025-11-24 04:59:15', '2025-11-24 04:59:15', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` enum('user','editor','moderator','admin') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(1, 'user'),
(2, 'editor'),
(3, 'admin');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sections`
--

CREATE TABLE `sections` (
  `id` int(11) NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  `movieId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `series`
--

CREATE TABLE `series` (
  `id` int(11) NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `series`
--

INSERT INTO `series` (`id`, `uuid`, `title`, `slug`, `createdAt`, `updatedAt`) VALUES
(1, '29f8f412-b12f-485c-aed8-fd8afe3143a7', 'dr. stone', 'dr-stone', '2025-09-05 00:16:15', '2025-09-05 00:16:15'),
(2, 'b7f1660b-dc5a-449e-b41b-f7f68b1f91a6', 'Mashle', 'mashle', '2025-09-09 13:20:54', '2025-09-09 13:20:54'),
(3, 'fe39d024-fbb5-4931-97ee-9842b2e4ebff', 'Jujutsu Kaisen', 'jujutsu-kaisen', '2025-09-09 13:48:59', '2025-09-09 13:48:59');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sessions`
--

CREATE TABLE `sessions` (
  `sid` varchar(36) NOT NULL,
  `expires` datetime DEFAULT NULL,
  `data` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) DEFAULT NULL,
  `avatarUrl` varchar(255) DEFAULT NULL,
  `coverUrl` varchar(255) DEFAULT NULL,
  `sex` enum('nam','nữ','khác') DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `provider` varchar(255) DEFAULT NULL,
  `socialLinks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`socialLinks`)),
  `points` int(11) NOT NULL DEFAULT 0,
  `level` int(11) NOT NULL DEFAULT 1,
  `status` enum('active','banned') NOT NULL DEFAULT 'active',
  `online` tinyint(1) NOT NULL DEFAULT 0,
  `lastOnline` datetime DEFAULT NULL,
  `profileVisibility` enum('public','friends','private') NOT NULL DEFAULT 'public',
  `canReceiveFriendRequests` enum('everyone','friends_of_friends','nobody') NOT NULL DEFAULT 'everyone',
  `showOnlineStatus` tinyint(1) NOT NULL DEFAULT 1,
  `showFriendList` enum('public','friends','private') NOT NULL DEFAULT 'public',
  `showFavorites` enum('public','friends','private') NOT NULL DEFAULT 'public',
  `showWatchHistory` enum('public','friends','private') NOT NULL DEFAULT 'public',
  `allowSearchEngineIndexing` tinyint(1) NOT NULL DEFAULT 1,
  `notificationSettings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`notificationSettings`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `uuid`, `username`, `email`, `password`, `phoneNumber`, `avatarUrl`, `coverUrl`, `sex`, `bio`, `provider`, `socialLinks`, `points`, `level`, `status`, `online`, `lastOnline`, `profileVisibility`, `canReceiveFriendRequests`, `showOnlineStatus`, `showFriendList`, `showFavorites`, `showWatchHistory`, `allowSearchEngineIndexing`, `notificationSettings`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'q2Nxen6MNRVJJZOivMtROBekBXy1', 'Nghĩa Hoàng', 'contact.wwan@gmail.com', '$2b$10$JVKiY3Bm8sS8dsX84OrrEOdPNMycchL0B6KoQWlZf1PTBiZcJ3AFu', '0335005052', '/uploads/users/avatar-1763488609447.png', '/uploads/users/cover-1762861875900.jpg', 'nam', 'Mình là Admin Sạp Phim.<br/>\nCó gì thắc mắc hãy lh mình.', 'google', '{\"github\":\"https://github.com/wwan-code\",\"twitter\":\"\",\"instagram\":\"\",\"facebook\":\"https://www.facebook.com/Weee.1710.info/\"}', 0, 1, 'active', 1, NULL, 'public', 'everyone', 1, 'public', 'friends', 'friends', 1, '{\"friendRequest\":{\"inApp\":true,\"email\":false,\"sms\":false},\"friendRequestStatus\":{\"inApp\":true,\"email\":false,\"sms\":false},\"newMessage\":{\"inApp\":true,\"email\":false,\"sms\":false},\"movieActivity\":{\"inApp\":true,\"email\":false,\"sms\":false},\"storyActivity\":{\"inApp\":true,\"email\":false,\"sms\":false}}', '2025-10-04 02:25:34', '2025-11-24 06:33:19', NULL),
(2, 'XB1p1TCgPwf2TBLOKA9lszZnP4Z2', 'Nghĩa Hoàng', 'nghiapbg09@gmail.com', '$2b$10$D3e4WnJtDRa1iWEFRcN2xO3kt9FbDiz3uCWBC/yNBom/U5guz8Zye', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocLKCOg6nuJuA0h17QkwSleQom9lHiNLfk8hWvwtKk214ZGVwQFi=s96-c', NULL, NULL, NULL, 'google', '{\"github\":\"\",\"twitter\":\"\",\"instagram\":\"\",\"facebook\":\"\"}', 0, 1, 'active', 0, '2025-11-24 05:07:33', 'public', 'everyone', 1, 'public', 'public', 'public', 1, '{\"friendRequest\":{\"inApp\":true,\"email\":false,\"sms\":false},\"friendRequestStatus\":{\"inApp\":true,\"email\":false,\"sms\":false},\"newMessage\":{\"inApp\":true,\"email\":false,\"sms\":false},\"movieActivity\":{\"inApp\":true,\"email\":false,\"sms\":false},\"storyActivity\":{\"inApp\":true,\"email\":false,\"sms\":false}}', '2025-10-04 02:39:21', '2025-11-24 05:07:33', NULL),
(3, 'KZsLxLpZ7Pb0q52jE42KVYLrJLw2', 'Nghĩa Văn', 'nghiapbg1@gmail.com', '$2b$10$OZ60R0go2pH7PU5s1GB3s.EIEg24mFWGWWDeUD7OqMHYY9CJLb07W', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIO-oBKbe6W9yBNO1Ww8e1sWI_VfRR31z9tBw_t3dwRcKtJW7YA_Q=s96-c', NULL, NULL, NULL, 'google', '{\"github\":\"\",\"twitter\":\"\",\"instagram\":\"\",\"facebook\":\"\"}', 0, 1, 'active', 0, '2025-11-24 00:22:58', 'public', 'everyone', 1, 'public', 'public', 'public', 1, '{\"friendRequest\":{\"inApp\":true,\"email\":false,\"sms\":false},\"friendRequestStatus\":{\"inApp\":true,\"email\":false,\"sms\":false},\"newMessage\":{\"inApp\":true,\"email\":false,\"sms\":false},\"movieActivity\":{\"inApp\":true,\"email\":false,\"sms\":false},\"storyActivity\":{\"inApp\":true,\"email\":false,\"sms\":false}}', '2025-10-07 11:40:04', '2025-11-24 00:22:58', NULL),
(7, 'y0yE8BefQKaz41DlNgk9OBkPksO2', 'Nghĩa Hoàng', 'info.kfilmm@gmail.com', '$2b$10$bW6XKom7qN9lWzKQzZrTle5pzIOvGFR5EuorggsZGSCh4dZ82j.PW', NULL, '/uploads/users/avatar-1763736718494.png', NULL, NULL, NULL, 'google', '{\"github\":\"\",\"twitter\":\"\",\"instagram\":\"\",\"facebook\":\"\"}', 0, 1, 'active', 0, '2025-11-23 02:02:12', 'public', 'everyone', 1, 'public', 'public', 'public', 1, '{\"friendRequest\":{\"inApp\":true,\"email\":false,\"sms\":false},\"friendRequestStatus\":{\"inApp\":true,\"email\":false,\"sms\":false},\"newMessage\":{\"inApp\":true,\"email\":false,\"sms\":false},\"movieActivity\":{\"inApp\":true,\"email\":false,\"sms\":false}}', '2025-10-15 18:51:57', '2025-11-23 02:02:12', NULL),
(17, '6478dd58-25e7-411d-9d6e-a5e9e19b8d8a', 'Hoàng Văn Nghĩa', 'nghiapbg12345@gmail.com', '$2b$10$Ozt19ecNA1vWYH4q.G0Iheww2tXe8SXgBzXaNks0cceVmTZnTZfcG', '0335005052', NULL, NULL, NULL, NULL, NULL, '{\"github\":\"\",\"twitter\":\"\",\"instagram\":\"\",\"facebook\":\"\"}', 0, 1, 'active', 0, '2025-11-22 10:00:57', 'public', 'everyone', 1, 'public', 'public', 'public', 1, '{\"friendRequest\":{\"inApp\":true,\"email\":false,\"sms\":false},\"friendRequestStatus\":{\"inApp\":true,\"email\":false,\"sms\":false},\"newMessage\":{\"inApp\":true,\"email\":false,\"sms\":false},\"movieActivity\":{\"inApp\":true,\"email\":false,\"sms\":false}}', '2025-11-22 08:30:29', '2025-11-22 10:00:57', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_roles`
--

CREATE TABLE `user_roles` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int(11) NOT NULL,
  `roleId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `user_roles`
--

INSERT INTO `user_roles` (`createdAt`, `updatedAt`, `userId`, `roleId`) VALUES
('2025-10-04 02:25:34', '2025-10-04 02:25:34', 1, 1),
('2025-10-04 04:27:46', '2025-10-04 04:27:46', 1, 2),
('2025-10-04 04:27:46', '2025-10-04 04:27:46', 1, 3),
('2025-10-04 02:39:21', '2025-10-04 02:39:21', 2, 1),
('2025-10-07 11:40:04', '2025-10-07 11:40:04', 3, 1),
('2025-10-15 18:51:57', '2025-10-15 18:51:57', 7, 1),
('2025-11-05 08:56:06', '2025-11-05 08:56:06', 8, 1),
('2025-11-10 13:15:28', '2025-11-10 13:15:28', 9, 1),
('2025-11-11 15:00:16', '2025-11-11 15:00:16', 10, 1),
('2025-11-11 15:00:17', '2025-11-11 15:00:17', 11, 1),
('2025-11-11 15:00:18', '2025-11-11 15:00:18', 12, 1),
('2025-11-12 14:27:38', '2025-11-12 14:27:38', 15, 1),
('2025-11-12 14:36:40', '2025-11-12 14:36:40', 16, 1),
('2025-11-22 08:30:29', '2025-11-22 08:30:29', 17, 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `watchhistories`
--

CREATE TABLE `watchhistories` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `movieId` int(11) NOT NULL,
  `episodeId` int(11) DEFAULT NULL,
  `progress` int(11) NOT NULL DEFAULT 0,
  `timestamp` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `watchhistories`
--

INSERT INTO `watchhistories` (`id`, `userId`, `movieId`, `episodeId`, `progress`, `timestamp`, `createdAt`, `updatedAt`) VALUES
(10, 17, 37, NULL, 234, '2025-11-22 10:00:28', '2025-11-22 08:33:12', '2025-11-22 10:00:28'),
(22, 1, 37, 14, 0, '2025-11-24 06:21:21', '2025-11-24 06:21:09', '2025-11-24 06:21:21');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `ai_logs`
--
ALTER TABLE `ai_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `title` (`title`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD KEY `content_type_id_index` (`contentType`,`contentId`),
  ADD KEY `comments_user_id` (`userId`),
  ADD KEY `comments_parent_id` (`parentId`);

--
-- Chỉ mục cho bảng `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `title` (`title`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `episodes`
--
ALTER TABLE `episodes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD KEY `Episodes_movieId_fkey` (`movieId`);

--
-- Chỉ mục cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Favorites_movieId_userId_unique` (`userId`,`movieId`),
  ADD KEY `movieId` (`movieId`);

--
-- Chỉ mục cho bảng `friendships`
--
ALTER TABLE `friendships`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `friendships_sender_id_receiver_id` (`senderId`,`receiverId`),
  ADD KEY `receiverId` (`receiverId`);

--
-- Chỉ mục cho bảng `genres`
--
ALTER TABLE `genres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `title` (`title`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `loginhistories`
--
ALTER TABLE `loginhistories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`);

--
-- Chỉ mục cho bảng `movies`
--
ALTER TABLE `movies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `countryId` (`countryId`),
  ADD KEY `categoryId` (`categoryId`),
  ADD KEY `seriesId` (`seriesId`);

--
-- Chỉ mục cho bảng `movie_genres`
--
ALTER TABLE `movie_genres`
  ADD PRIMARY KEY (`GenreId`,`MovieId`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_user_read_created` (`userId`,`isRead`,`createdAt`),
  ADD KEY `idx_notification_user_type` (`userId`,`type`),
  ADD KEY `senderId` (`senderId`);

--
-- Chỉ mục cho bảng `refreshtokens`
--
ALTER TABLE `refreshtokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `userId` (`userId`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD KEY `movieId` (`movieId`);

--
-- Chỉ mục cho bảng `series`
--
ALTER TABLE `series`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `title` (`title`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Chỉ mục cho bảng `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`sid`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`userId`,`roleId`);

--
-- Chỉ mục cho bảng `watchhistories`
--
ALTER TABLE `watchhistories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `movieId` (`movieId`),
  ADD KEY `episodeId` (`episodeId`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `ai_logs`
--
ALTER TABLE `ai_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT cho bảng `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `episodes`
--
ALTER TABLE `episodes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `friendships`
--
ALTER TABLE `friendships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT cho bảng `genres`
--
ALTER TABLE `genres`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `loginhistories`
--
ALTER TABLE `loginhistories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT cho bảng `movies`
--
ALTER TABLE `movies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- AUTO_INCREMENT cho bảng `refreshtokens`
--
ALTER TABLE `refreshtokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `series`
--
ALTER TABLE `series`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT cho bảng `watchhistories`
--
ALTER TABLE `watchhistories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `ai_logs`
--
ALTER TABLE `ai_logs`
  ADD CONSTRAINT `ai_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_10` FOREIGN KEY (`parentId`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `comments_ibfk_41` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `episodes`
--
ALTER TABLE `episodes`
  ADD CONSTRAINT `Episodes_movieId_fkey` FOREIGN KEY (`movieId`) REFERENCES `movies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_10` FOREIGN KEY (`movieId`) REFERENCES `movies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `friendships`
--
ALTER TABLE `friendships`
  ADD CONSTRAINT `friendships_ibfk_1` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `friendships_ibfk_10` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `loginhistories`
--
ALTER TABLE `loginhistories`
  ADD CONSTRAINT `loginhistories_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `movies`
--
ALTER TABLE `movies`
  ADD CONSTRAINT `movies_ibfk_1` FOREIGN KEY (`countryId`) REFERENCES `countries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `movies_ibfk_11` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `movies_ibfk_12` FOREIGN KEY (`seriesId`) REFERENCES `series` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_10` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `refreshtokens`
--
ALTER TABLE `refreshtokens`
  ADD CONSTRAINT `refreshtokens_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `sections`
--
ALTER TABLE `sections`
  ADD CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`movieId`) REFERENCES `movies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `watchhistories`
--
ALTER TABLE `watchhistories`
  ADD CONSTRAINT `WatchHistories_episodeId_fkey` FOREIGN KEY (`episodeId`) REFERENCES `episodes` (`id`),
  ADD CONSTRAINT `WatchHistories_movieId_fkey` FOREIGN KEY (`movieId`) REFERENCES `movies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `watchhistories_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `watchhistories_ibfk_21` FOREIGN KEY (`episodeId`) REFERENCES `episodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
