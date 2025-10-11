-- ✅ Enable UUID (MariaDB 10.7+ supports UUID() natively)
-- No need to create a function manually

CREATE TABLE users (
                       id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                       first_name VARCHAR(255) NOT NULL,
                       last_name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       phone VARCHAR(50) UNIQUE,
                       role JSON NOT NULL, -- ['employee', 'manager', 'admin']
                       poste VARCHAR(100),
                       password VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       name VARCHAR(255) NOT NULL,
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
                        `at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reports (  -- notifications
                         id INT PRIMARY KEY AUTO_INCREMENT,
                         manager_id CHAR(36),
                         title VARCHAR(255) NOT NULL,
                         body TEXT,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE work_schedules ( -- planning
                                id INT PRIMARY KEY AUTO_INCREMENT,
                                user_id CHAR(36) NOT NULL,
                                day_of_week ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN') NOT NULL,
                                period ENUM('AM', 'PM') NOT NULL,
                                start_time TIME NOT NULL,
                                end_time TIME NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- absence
CREATE TABLE absence (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type ENUM('SICK', 'VACATION', 'PERSONAL', 'FORMATION', 'OTHER') NOT NULL,
    reason TEXT,
    supporting_document_url VARCHAR(500),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    approved_by CHAR(36),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- absence_days
CREATE TABLE absence_days (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    absence_id INT UNSIGNED NOT NULL,
    absence_date DATE NOT NULL,
    period ENUM('AM', 'PM', 'FULL_DAY') DEFAULT 'FULL_DAY',
    start_time TIME,
    end_time TIME,
    FOREIGN KEY (absence_id) REFERENCES absence(id) ON DELETE CASCADE
) ENGINE=InnoDB;
