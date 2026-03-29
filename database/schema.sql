-- MySQL schema for commerce backend
-- Designed for Laragon (MySQL 8+). Engine: InnoDB, charset: utf8mb4

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(30) NULL,
  address VARCHAR(255) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  role ENUM('BUYER','SELLER','ADMIN') NOT NULL DEFAULT 'BUYER',
  credit INT NOT NULL DEFAULT 0,
  free_unlock INT NOT NULL DEFAULT 3,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NULL,
  category VARCHAR(100) NULL,
  location VARCHAR(150) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  contact_phone VARCHAR(30) NULL,
  contact_whatsapp VARCHAR(30) NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  is_premium TINYINT(1) NOT NULL DEFAULT 0,
  premium_expired_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_items_user_id (user_id),
  KEY idx_items_created_at (created_at),
  KEY idx_items_status_created_at (status, created_at),
  CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS item_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id INT UNSIGNED NOT NULL,
  image_url TEXT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_item_images_item_id (item_id),
  CONSTRAINT fk_item_images_item FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_unlocks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  unlock_type ENUM('FREE','CREDIT') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contact_unlocks_user_item (user_id, item_id),
  KEY idx_contact_unlocks_item_id (item_id),
  CONSTRAINT fk_contact_unlocks_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_contact_unlocks_item FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('CREDIT_ADD','CREDIT_USE','FREE_USE') NOT NULL,
  amount INT NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_credit_tx_user_id (user_id),
  KEY idx_credit_tx_created_at (created_at),
  CONSTRAINT fk_credit_tx_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_status ENUM('PENDING','PAID','FAILED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  payment_gateway VARCHAR(50) NOT NULL DEFAULT 'xendit',
  gateway_reference VARCHAR(190) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_gateway_reference (gateway_reference),
  KEY idx_payments_user_id (user_id),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS premium_ads (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('ACTIVE','ENDED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (id),
  KEY idx_premium_ads_item_id (item_id),
  KEY idx_premium_ads_user_id (user_id),
  CONSTRAINT fk_premium_ads_item FOREIGN KEY (item_id) REFERENCES items(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_premium_ads_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
