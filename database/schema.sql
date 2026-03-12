-- CREATE DATABASE IF NOT EXISTS carlog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE carlog;

CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  avatar_url  VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  token      VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token(255)),
  INDEX idx_user_id (user_id)
);


CREATE TABLE IF NOT EXISTS vehicles (
  id             INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_id       INT UNSIGNED NOT NULL,
  brand          VARCHAR(100) NOT NULL,
  model          VARCHAR(100) NOT NULL,
  registration   VARCHAR(20) NOT NULL,
  year           SMALLINT UNSIGNED NOT NULL,
  mileage        INT UNSIGNED NOT NULL DEFAULT 0,
  fuel_type      ENUM('essence','diesel','electrique','hybride','hybride_rechargeable','gpl') NOT NULL DEFAULT 'essence',
  color          VARCHAR(50),
  notes          TEXT,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id)
);

CREATE TABLE IF NOT EXISTS vehicle_shares (
  id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehicle_id      INT UNSIGNED NOT NULL,
  shared_with_id  INT UNSIGNED NOT NULL,
  permission      ENUM('view','edit') NOT NULL DEFAULT 'view',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_share (vehicle_id, shared_with_id)
);

CREATE TABLE IF NOT EXISTS trips (
  id          INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehicle_id  INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  date        DATE NOT NULL,
  distance    DECIMAL(10,2) UNSIGNED NOT NULL,
  departure   VARCHAR(255),
  arrival     VARCHAR(255),
  trip_type   ENUM('personnel','professionnel') NOT NULL DEFAULT 'personnel',
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vehicle_date (vehicle_id, date)
);


CREATE TABLE IF NOT EXISTS expenses (
  id                  INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehicle_id          INT UNSIGNED NOT NULL,
  user_id             INT UNSIGNED NOT NULL,
  date                DATE NOT NULL,
  category            ENUM('carburant','entretien','reparation','assurance','peage','parking','autre') NOT NULL,
  amount              DECIMAL(10,2) UNSIGNED NOT NULL,
  mileage_at_expense  INT UNSIGNED,
  fuel_liters         DECIMAL(8,3) UNSIGNED,
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vehicle_date (vehicle_id, date)
);

CREATE TABLE IF NOT EXISTS maintenance (
  id            INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  vehicle_id    INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  date          DATE NOT NULL,
  type          ENUM('vidange','pneus','controle_technique','freins','distribution','batterie','filtres','autre') NOT NULL,
  description   VARCHAR(255) NOT NULL,
  mileage       INT UNSIGNED,
  cost          DECIMAL(10,2) UNSIGNED,
  next_date     DATE,
  next_mileage  INT UNSIGNED,
  garage        VARCHAR(255),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vehicle_date (vehicle_id, date)
);
