
-- ==========================================================
-- USERS
-- ==========================================================
INSERT INTO users (id, first_name, last_name, email, phone, role, poste, password)
VALUES
  (UUID(), 'Alex', 'Fraioli', 'alex.fraioli@epitech.eu', '0600000001', JSON_ARRAY('admin'), 'HR Director', '$2b$12$AiWFHiPzTeqWJhKtjMj5B.6ldZgGY0hcHJ3sn.o2wmoPgcXLGENDS'),
  (UUID(), 'Gaspard', 'Malmon', 'gaspard.malmon@epitech.eu', '0600000002', JSON_ARRAY('manager'), 'Project Manager', '$2b$12$F0einImE6HfpUWpCdlXES.i0Nu64CFvCgd/DWT43HY4D.NgElUxfu'),
  (UUID(), 'Clement', 'Hamimi', 'clement.hamimi@epitech.eu', '0600000003', JSON_ARRAY('employee'), 'Developer', '$2b$12$FAZaPBuJDxXp5UcPBJjlMuY8cltPiUqBE7BAJDvJuboTNoCteX2FC'),
  (UUID(), 'Armand', 'Braud', 'armand.braud@epitech.eu', '0600000004', JSON_ARRAY('employee'), 'QA Engineer', '$2b$12$Wc2LamaRHkps9PShOR1Mq.xYYm2geR.RCDLVzhe3Zg.cBz7QFjSHS');

-- ==========================================================
-- TEAMS
-- ==========================================================
INSERT INTO teams (id, name, description)
VALUES
  (1, 'Backend Team', 'Handles backend services and APIs'),
  (2, 'Frontend Team', 'Responsible for UI and UX development');

-- ==========================================================
-- TEAM MEMBERS
-- Gaspard (manager) manages Backend Team, Clement & Armand are members
-- ==========================================================
INSERT INTO team_members (id, team_id, user_id)
VALUES
  (1, 1, (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu')), -- Gaspard (manager)
  (2, 1, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu')), -- Clement
  (3, 1, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu')); -- Armand

-- ==========================================================
-- CLOCKS (check-in/out)
-- ==========================================================
INSERT INTO clocks (id, user_id, kind, `at`)
VALUES
  (1, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'IN',  '2025-10-08 08:59:00'),
  (2, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'OUT', '2025-10-08 17:12:00'),
  (3, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'IN',  '2025-10-08 09:05:00'),
  (4, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'OUT', '2025-10-08 16:45:00');

-- ==========================================================
-- WORK SCHEDULES (weekly planning)
-- ==========================================================
INSERT INTO work_schedules (id, user_id, day_of_week, period, start_time, end_time)
VALUES
  (1, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'MON', 'AM', '09:00:00', '12:00:00'),
  (2, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'MON', 'PM', '13:00:00', '17:00:00'),
  (3, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'MON', 'AM', '09:00:00', '12:00:00'),
  (4, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'MON', 'PM', '13:30:00', '17:30:00');

-- ==========================================================
-- ABSENCE (simulate a sick leave)
-- ==========================================================
INSERT INTO absence (id, user_id, absence_date, type, period, start_time, end_time, reason)
VALUES
  (1, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), '2025-10-07', 'SICK', 'AM', '09:00:00', '12:00:00', 'Flu symptoms'),
  (2, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), '2025-10-07', 'SICK', 'PM', '13:00:00', '17:00:00', 'Doctor appointment'),
  (3, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), '2025-10-10', 'PERSONAL', 'PM', '13:00:00', '17:00:00', 'Family event');

-- ==========================================================
-- REPORTS (manager notifications)
-- ==========================================================
INSERT INTO reports (id, manager_id, title, body)
VALUES
  (1, (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'Absence report: Clément', 'Clément was absent on Tuesday due to sickness.'),
  (2, (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'Late arrival: Armand', 'Armand checked in at 09:05 on Monday, slightly late.');
