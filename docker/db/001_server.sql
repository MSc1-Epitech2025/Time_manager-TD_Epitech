-- Enable UUID function if needed
-- (MariaDB has UUID() by default, no extension needed)

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(20), -- 'employee' | 'manager' | 'admin'
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE clocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  kind ENUM('IN', 'OUT') NOT NULL,
  at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  manager_id CHAR(36) NOT NULL,
  title VARCHAR(255),
  body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);
