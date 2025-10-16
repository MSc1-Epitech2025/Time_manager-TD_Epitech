-- ==========================================================
-- USERS
-- ==========================================================
INSERT INTO users (id, first_name, last_name, email, phone, role, poste, password)
VALUES
  (UUID(), 'Alex', 'Fraioli', 'alex.fraioli@epitech.eu', '0600000001', JSON_ARRAY('admin'), 'HR Director', '$2b$12$AiWFHiPzTeqWJhKtjMj5B.6ldZgGY0hcHJ3sn.o2wmoPgcXLGENDS'),
  (UUID(), 'Gaspard', 'Malmon', 'gaspard.malmon@epitech.eu', '0600000002', JSON_ARRAY('employee manager'), 'Project Manager', '$2b$12$F0einImE6HfpUWpCdlXES.i0Nu64CFvCgd/DWT43HY4D.NgElUxfu'),
  (UUID(), 'Clement', 'Hamimi', 'clement.hamimi@epitech.eu', '0600000003', JSON_ARRAY('employee'), 'Developer', '$2b$12$FAZaPBuJDxXp5UcPBJjlMuY8cltPiUqBE7BAJDvJuboTNoCteX2FC'),
  (UUID(), 'Armand', 'Braud', 'armand.braud@epitech.eu', '0600000004', JSON_ARRAY('employee'), 'QA Engineer', '$2b$12$Wc2LamaRHkps9PShOR1Mq.xYYm2geR.RCDLVzhe3Zg.cBz7QFjSHS');

-- ==========================================================
-- TEAMS  (IDs fixés pour correspondre aux affectations)
-- ==========================================================
INSERT INTO teams (id, name, description)
VALUES
  (1, 'Backend Team', 'Handles backend services and APIs'),
  (2, 'Frontend Team', 'Responsible for UI and UX development');

-- ==========================================================
-- TEAM MEMBERS
-- ==========================================================
INSERT INTO team_members (team_id, user_id)
VALUES
  (1, (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu')), -- Gaspard (manager)
  (1, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu')), -- Clement
  (1, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'));   -- Armand

-- ==========================================================
-- CLOCKS (check-in/out)
-- ==========================================================
INSERT INTO clocks (user_id, kind, `at`)
VALUES
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'IN',  '2025-10-08 08:59:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'OUT', '2025-10-08 17:12:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'),  'IN',  '2025-10-08 09:05:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'),  'OUT', '2025-10-08 16:45:00');

-- ==========================================================
-- WORK SCHEDULES (weekly planning)
-- ==========================================================
INSERT INTO work_schedules (user_id, day_of_week, period, start_time, end_time)
VALUES
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'MON', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'MON', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'),  'MON', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'),  'MON', 'PM', '13:30:00', '17:30:00');

-- ==========================================================
-- ABSENCE + ABSENCE_DAYS (adaptation au nouveau modèle)
-- ==========================================================
-- Clément : 2025-10-07 SICK (AM + PM)
INSERT INTO absence (user_id, start_date, end_date, type, reason)
VALUES
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'),
   '2025-10-07', '2025-10-07', 'SICK',
   'Flu symptoms in the morning; doctor appointment in the afternoon');
SET @abs_clement := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_clement, '2025-10-07', 'AM', '09:00:00', '12:00:00'),
  (@abs_clement, '2025-10-07', 'PM', '13:00:00', '17:00:00');

-- Armand : 2025-10-10 PERSONAL (PM)
INSERT INTO absence (user_id, start_date, end_date, type, reason)
VALUES
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'),
   '2025-10-10', '2025-10-10', 'PERSONAL',
   'Family event');
SET @abs_armand := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_armand, '2025-10-10', 'PM', '13:00:00', '17:00:00');

-- ==========================================================
-- REPORTS (manager notifications)
-- ==========================================================
INSERT INTO reports (author_id, target_user_id, title, body)
VALUES
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
   (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'),
   'Absence report: Clément',
   'Clément was absent on Tuesday due to sickness.'),

  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
   (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'),
   'Late arrival: Armand',
   'Armand checked in at 09:05 on Monday, slightly late.');
INSERT INTO reports (author_id, target_user_id, title, body)
VALUES (
  (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
  (SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'),
  'Notice: Alex PTO policy check',
  'Alex, please review the updated PTO policy and confirm by Friday.'
);

