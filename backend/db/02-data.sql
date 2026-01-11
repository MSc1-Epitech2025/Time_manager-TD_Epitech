-- ==========================================================
-- USERS
-- ==========================================================
INSERT INTO users (id, first_name, last_name, email, phone, role, poste, password, first_connection)
VALUES
  (UUID(), 'Alex', 'Fraioli', 'alex.fraioli@epitech.eu', '0600000001', JSON_ARRAY('admin'), 'HR Director', '$2a$12$AiWFHiPzTeqWJhKtjMj5B.6ldZgGY0hcHJ3sn.o2wmoPgcXLGENDS', FALSE),
  (UUID(), 'Gaspard', 'Malmon', 'gaspard.malmon@epitech.eu', '0600000002', JSON_ARRAY('admin', 'manager'), 'Project Manager', '$2a$12$F0einImE6HfpUWpCdlXES.i0Nu64CFvCgd/DWT43HY4D.NgElUxfu', FALSE),
  (UUID(), 'Clement', 'Hamimi', 'clement.hamimi@epitech.eu', '0600000003', JSON_ARRAY('employee'), 'Developer', '$2a$12$FAZaPBuJDxXp5UcPBJjlMuY8cltPiUqBE7BAJDvJuboTNoCteX2FC', FALSE),
  (UUID(), 'Armand', 'Braud', 'armand.braud@epitech.eu', '0600000004', JSON_ARRAY('employee'), 'QA Engineer', '$2a$12$Wc2LamaRHkps9PShOR1Mq.xYYm2geR.RCDLVzhe3Zg.cBz7QFjSHS', TRUE);

-- ==========================================================
-- TEAMS
-- ==========================================================
INSERT INTO teams (id, name, description)
VALUES
  (1, 'Backend Team', 'Handles backend services and APIs'),
  (2, 'Frontend Team', 'Responsible for UI and UX development')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

-- ==========================================================
-- TEAM MEMBERS
-- ==========================================================
INSERT INTO team_members (team_id, user_id)
VALUES
  (1, (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu')), -- Gaspard (manager)
  (1, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu')), -- Clement
  (1, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu')),  -- Armand
  (2, (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu')), -- Gaspard (manager)
  (2, (SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'))   -- Alex
;

-- ==========================================================
-- WORK SCHEDULES (full shedules for users)
-- ==========================================================

INSERT INTO work_schedules (user_id, day_of_week, period, start_time, end_time)
VALUES
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'MON', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'MON', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'TUE', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'TUE', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'WED', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'WED', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'THU', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'THU', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'FRI', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'FRI', 'PM', '13:00:00', '16:00:00');

INSERT INTO work_schedules (user_id, day_of_week, period, start_time, end_time)
VALUES
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'MON', 'AM', '09:00:00', '12:30:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'MON', 'PM', '14:00:00', '18:00:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'TUE', 'AM', '09:00:00', '12:30:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'TUE', 'PM', '14:00:00', '18:00:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'WED', 'AM', '09:00:00', '12:30:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'WED', 'PM', '14:00:00', '18:00:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'THU', 'AM', '09:00:00', '12:30:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'THU', 'PM', '14:00:00', '18:00:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'FRI', 'AM', '09:00:00', '12:30:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'FRI', 'PM', '14:00:00', '17:00:00');

INSERT INTO work_schedules (user_id, day_of_week, period, start_time, end_time)
VALUES
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'MON', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'MON', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'TUE', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'TUE', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'WED', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'WED', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'THU', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'THU', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'FRI', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'FRI', 'PM', '13:00:00', '16:00:00');

INSERT INTO work_schedules (user_id, day_of_week, period, start_time, end_time)
VALUES
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'MON', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'MON', 'PM', '13:30:00', '17:30:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'TUE', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'TUE', 'PM', '13:30:00', '17:30:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'WED', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'WED', 'PM', '13:30:00', '17:30:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'THU', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'THU', 'PM', '13:30:00', '17:30:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'FRI', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'FRI', 'PM', '13:30:00', '16:30:00');

INSERT INTO clocks (user_id, kind, `at`)
VALUES
  -- ==========================================================
  -- CLOCKS — 2025-12-01 → 2026-01-08 (NO clocks after 2026-01-08)
  -- Coherent with your existing absences:
  -- - Clément RTT PM: 2025-12-04 (half-day -> morning only)
  -- - Armand PERSONAL full day: 2025-12-10 (no clocks)
  -- - Alex VACATION: 2025-12-15 → 2025-12-19 (no clocks)
  -- - Gaspard OTHER AM: 2025-12-18 (half-day -> afternoon only)
  -- ==========================================================

  -- ===== WEEK 2025-12-01 → 2025-12-05 =====
  -- 2025-12-01
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-01 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-01 17:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-01 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-01 17:33:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-01 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-01 18:06:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-01 08:56:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-01 17:06:00'),

  -- 2025-12-02
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-02 09:00:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-02 17:02:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-02 09:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-02 17:31:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-02 09:09:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-02 18:08:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-02 08:57:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-02 17:04:00'),

  -- 2025-12-03
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-03 09:03:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-03 17:07:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-03 09:07:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-03 17:35:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-03 09:11:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-03 18:03:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-03 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-03 17:10:00'),

  -- 2025-12-04 (Clément RTT PM -> morning only)
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-04 08:59:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-04 12:08:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-04 09:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-04 17:32:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-04 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-04 18:05:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-04 08:54:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-04 17:03:00'),

  -- 2025-12-05 (Friday)
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-05 09:02:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-05 16:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-05 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-05 16:34:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-05 09:08:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-05 17:06:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-05 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-05 16:02:00'),

  -- ===== WEEK 2025-12-08 → 2025-12-12 =====
  -- 2025-12-08
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-08 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-08 17:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-08 09:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-08 17:34:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-08 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-08 18:04:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-08 08:57:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-08 17:05:00'),

  -- 2025-12-09
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-09 09:00:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-09 17:02:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-09 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-09 17:36:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-09 09:11:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-09 18:07:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-09 08:56:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-09 17:03:00'),

  -- 2025-12-10 (Armand full day PERSONAL -> NO CLOCKS for Armand)
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-10 09:02:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-10 17:06:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-10 09:09:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-10 18:05:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-10 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-10 17:08:00'),

  -- 2025-12-11
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-11 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-11 17:03:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-11 09:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-11 17:31:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-11 09:12:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-11 18:03:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-11 08:58:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-11 17:05:00'),

  -- 2025-12-12 (Friday)
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-12 09:03:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-12 16:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-12 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-12 16:33:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-12 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-12 17:04:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-12 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-12 16:01:00'),

  -- ===== WEEK 2025-12-15 → 2025-12-19 (Alex on vacation: NO CLOCKS for Alex) =====
  -- 2025-12-15
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-15 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-15 17:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-15 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-15 17:35:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-15 09:09:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-15 18:06:00'),

  -- 2025-12-16
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-16 09:00:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-16 17:02:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-16 09:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-16 17:33:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-16 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-16 18:05:00'),

  -- 2025-12-17
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-17 09:02:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-17 17:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-17 09:07:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-17 17:36:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-17 09:11:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-17 18:04:00'),

  -- 2025-12-18 (Gaspard OTHER AM -> afternoon only)
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-18 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-18 17:03:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-18 09:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-18 17:32:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-18 13:57:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-18 18:06:00'),

  -- 2025-12-19 (Friday)
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-19 09:02:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-19 16:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-19 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-19 16:32:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-19 09:09:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-19 17:03:00'),

  -- ===== WEEK 2025-12-22 → 2025-12-26 =====
  -- 2025-12-22
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-22 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-22 17:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-22 09:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-22 17:34:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-22 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-22 18:05:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-22 08:56:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-22 17:06:00'),

  -- 2025-12-23
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-23 09:00:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-23 17:02:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-23 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-23 17:33:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-23 09:11:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-23 18:06:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-23 08:57:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-23 17:04:00'),

  -- 2025-12-24
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-24 09:02:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-24 17:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-24 09:07:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-24 17:36:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-24 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-24 18:04:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-24 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-24 17:08:00'),

  -- 2025-12-25
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-25 09:03:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-25 17:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-25 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-25 17:34:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-25 09:12:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-25 18:03:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-25 08:56:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-25 17:05:00'),

  -- 2025-12-26 (Friday)
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-26 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-26 16:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-26 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-26 16:33:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-26 09:09:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-26 17:04:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-26 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-26 16:01:00'),

  -- ===== WEEK 2025-12-29 → 2025-12-31 =====
  -- 2025-12-29
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-29 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-29 17:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-29 09:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-29 17:34:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-29 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-29 18:05:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-29 08:56:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-29 17:06:00'),

  -- 2025-12-30
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-30 09:00:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-30 17:02:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-30 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-30 17:33:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-30 09:11:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-30 18:06:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-30 08:57:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-30 17:04:00'),

  -- 2025-12-31
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-12-31 09:02:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-12-31 17:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-12-31 09:07:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-12-31 17:36:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-12-31 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-12-31 18:04:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-12-31 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-12-31 17:08:00'),

  -- ===== JAN 2026 (up to today 2026-01-08) =====
  -- 2026-01-02 (Friday)
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2026-01-02 09:02:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2026-01-02 16:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2026-01-02 09:06:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2026-01-02 16:32:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2026-01-02 09:09:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2026-01-02 17:03:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2026-01-02 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2026-01-02 16:01:00'),

  -- 2026-01-05
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2026-01-05 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2026-01-05 17:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2026-01-05 09:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2026-01-05 17:34:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2026-01-05 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2026-01-05 18:05:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2026-01-05 08:56:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2026-01-05 17:06:00'),

  -- 2026-01-06
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2026-01-06 09:00:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2026-01-06 17:02:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2026-01-06 09:11:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2026-01-06 18:06:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2026-01-06 08:57:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2026-01-06 17:04:00'),

  -- 2026-01-07
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2026-01-07 09:02:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2026-01-07 17:05:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2026-01-07 09:07:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2026-01-07 17:36:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2026-01-07 09:10:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2026-01-07 18:04:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2026-01-07 08:55:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2026-01-07 17:08:00'),

  -- 2026-01-08
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2026-01-08 09:01:00'),
  ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2026-01-08 17:03:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2026-01-08 09:04:00'),
  ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2026-01-08 17:32:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2026-01-08 09:12:00'),
  ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2026-01-08 18:03:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2026-01-08 08:58:00'),
  ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2026-01-08 17:05:00')
;


-- ==========================================================
-- REPORTS (manager notifications)
-- ==========================================================
-- ==========================================================
-- REPORTS — Dec 2025 → Jan 2026 (associated with the new absences)
-- ==========================================================
INSERT INTO reports (author_id, target_user_id, subject_user_id, type, severity, rule_key, title, body, created_at)
VALUES
  -- Clément — RTT PM — 04/12/2025
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Partial absence: Clément RTT afternoon',
    'Clément was on RTT on the afternoon of 04/12/2025.',
    '2025-12-04 17:15:00'
  ),

  -- Armand — Personal leave FULL DAY — 10/12/2025
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Absence report: Armand personal leave',
    'Armand was absent for a personal appointment on 10/12/2025.',
    '2025-12-10 17:30:00'
  ),

  -- Alex — Vacation — 15 → 19/12/2025
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
    (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Alex vacation planning',
    'Alex is on paid vacation from 15/12/2025 to 19/12/2025.',
    '2025-12-15 09:05:00'
  ),

  -- Gaspard — Other leave AM — 18/12/2025
  (
    (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Partial absence: Gaspard doctor appointment',
    'Gaspard was absent on the morning of 18/12/2025 for a doctor appointment.',
    '2025-12-18 13:00:00'
  )
;

INSERT INTO reports (author_id, target_user_id, subject_user_id, type, severity, rule_key, title, body, created_at)
VALUES
  -- Armand — Sick leave FULL DAY — 06/01/2026
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Absence report: Armand sick leave',
    'Armand was on sick leave on 06/01/2026.',
    '2026-01-06 17:15:00'
  ),

  -- Armand — Personal leave AM — 15/01/2026
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Partial absence: Armand administrative appointment',
    'Armand was absent on the morning of 15/01/2026 for an administrative appointment.',
    '2026-01-15 12:30:00'
  ),

  -- Clément — Sick leave — 19 → 20/01/2026
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Absence report: Clément sick leave',
    'Clément was on sick leave from 19/01/2026 to 20/01/2026.',
    '2026-01-20 17:20:00'
  ),

  -- Gaspard — Vacation — 26 → 30/01/2026
  (
    (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Gaspard vacation planning',
    'Gaspard is on paid vacation from 26/01/2026 to 30/01/2026.',
    '2026-01-26 09:10:00'
  )
;

-- ==========================================================
-- REPORTS (manager notifications)
-- ==========================================================
-- ==========================================================
-- REPORTS — Dec 2025 → Jan 2026 (associated with the new absences)
-- ==========================================================
INSERT INTO reports (author_id, target_user_id, subject_user_id, type, severity, rule_key, title, body, created_at)
VALUES
  -- Clément — RTT PM — 04/12/2025
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Partial absence: Clément RTT afternoon',
    'Clément was on RTT on the afternoon of 04/12/2025.',
    '2025-12-04 17:15:00'
  ),

  -- Armand — Personal leave FULL DAY — 10/12/2025
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Absence report: Armand personal leave',
    'Armand was absent for a personal appointment on 10/12/2025.',
    '2025-12-10 17:30:00'
  ),

  -- Alex — Vacation — 15 → 19/12/2025
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
    (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Alex vacation planning',
    'Alex is on paid vacation from 15/12/2025 to 19/12/2025.',
    '2025-12-15 09:05:00'
  ),

  -- Gaspard — Other leave AM — 18/12/2025
  (
    (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Partial absence: Gaspard doctor appointment',
    'Gaspard was absent on the morning of 18/12/2025 for a doctor appointment.',
    '2025-12-18 13:00:00'
  )
;

INSERT INTO reports (author_id, target_user_id, subject_user_id, type, severity, rule_key, title, body, created_at)
VALUES
  -- Armand — Sick leave FULL DAY — 06/01/2026
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Absence report: Armand sick leave',
    'Armand was on sick leave on 06/01/2026.',
    '2026-01-06 17:15:00'
  ),

  -- Armand — Personal leave AM — 15/01/2026
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Partial absence: Armand administrative appointment',
    'Armand was absent on the morning of 15/01/2026 for an administrative appointment.',
    '2026-01-15 12:30:00'
  ),

  -- Clément — Sick leave — 19 → 20/01/2026
  (
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Absence report: Clément sick leave',
    'Clément was on sick leave from 19/01/2026 to 20/01/2026.',
    '2026-01-20 17:20:00'
  ),

  -- Gaspard — Vacation — 26 → 30/01/2026
  (
    (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Gaspard vacation planning',
    'Gaspard is on paid vacation from 26/01/2026 to 30/01/2026.',
    '2026-01-26 09:10:00'
  )
;


-- ==========================================================
-- REPORTS (manager notifications)
-- ==========================================================
-- ==========================================================
-- REPORTS — Dec 2025 → Jan 2026 (associated with the new absences)
-- ==========================================================
INSERT INTO reports (author_id, target_user_id, subject_user_id, type, severity, rule_key, title, body, created_at)
VALUES
  -- Clément reports on Armand's absence (Clément as author)
  (
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Colleague notice: Armand absent',
    'Armand was absent on 10/12/2025 for a personal appointment.',
    '2025-12-10 18:00:00'
  ),

  -- Armand reports on Clément's RTT (Armand as author)
  (
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Colleague notice: Clément RTT',
    'Clément was on RTT in the afternoon on 04/12/2025.',
    '2025-12-04 18:00:00'
  ),

  -- Clément reports on Gaspard's absence (Clément as author)
  (
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Manager absence: Gaspard doctor appointment',
    'Gaspard was absent on the morning of 18/12/2025.',
    '2025-12-18 14:00:00'
  ),

  -- Armand reports on Clément's sick leave (Armand as author)
  (
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Colleague notice: Clément sick leave',
    'Clément was on sick leave from 19/01/2026 to 20/01/2026.',
    '2026-01-20 18:00:00'
  ),

  -- Clément reports on Armand's sick leave (Clément as author)
  (
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Colleague notice: Armand sick',
    'Armand was on sick leave on 06/01/2026.',
    '2026-01-06 18:00:00'
  ),

  -- Armand reports on Clément's report (Armand as author)
  (
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Colleague update: Armand administrative appointment',
    'Armand will be absent on the morning of 15/01/2026.',
    '2026-01-15 13:00:00'
  ),

  -- Clément reports on Gaspard's vacation (Clément as author)
  (
    (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Manager vacation: Gaspard away',
    'Gaspard is on paid vacation from 26/01/2026 to 30/01/2026.',
    '2026-01-26 10:00:00'
  ),

  -- Armand reports on Gaspard's vacation (Armand as author)
  (
    (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
    'MANUAL',
    'INFO',
    NULL,
    'Manager vacation: Gaspard away',
    'Gaspard is on paid vacation from 26/01/2026 to 30/01/2026.',
    '2026-01-26 10:00:00'
  )
;

-- ==========================================================
-- LEAVE TYPES
-- ==========================================================
INSERT INTO leave_types (code, label) VALUES
  ('VAC', 'Paid Vacation'),
  ('RTT', 'Reduce Time of Work'),
  ('SICK', 'Sick Leave')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- ==========================================================
-- LEAVE ACCOUNTS (VAC + RTT + SICK) 
-- ==========================================================

-- Alex
INSERT INTO leave_accounts (user_id, leave_type, opening_balance, accrual_per_month, max_carryover, carryover_expire_on)
VALUES
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'VAC', 15.00, 2.083, 10.00, '2026-03-31'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'RTT',  5.00, 0.000,  5.00, NULL),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'SICK', 10.00, 0.000, NULL, NULL)
ON DUPLICATE KEY UPDATE
  opening_balance = VALUES(opening_balance),
  accrual_per_month = VALUES(accrual_per_month),
  max_carryover = VALUES(max_carryover),
  carryover_expire_on = VALUES(carryover_expire_on);

-- Gaspard
INSERT INTO leave_accounts (user_id, leave_type, opening_balance, accrual_per_month, max_carryover, carryover_expire_on)
VALUES
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'VAC', 12.00, 2.083, 10.00, '2026-03-31'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'RTT',  6.00, 0.000,  6.00, NULL),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'SICK', 10.00, 0.000, NULL, NULL)
ON DUPLICATE KEY UPDATE
  opening_balance = VALUES(opening_balance),
  accrual_per_month = VALUES(accrual_per_month),
  max_carryover = VALUES(max_carryover),
  carryover_expire_on = VALUES(carryover_expire_on);

-- Clément
INSERT INTO leave_accounts (user_id, leave_type, opening_balance, accrual_per_month, max_carryover, carryover_expire_on)
VALUES
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'VAC',  8.00, 2.083, 10.00, '2026-03-31'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'RTT',  4.00, 0.000,  6.00, NULL),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'SICK', 10.00, 0.000, NULL, NULL)
ON DUPLICATE KEY UPDATE
  opening_balance = VALUES(opening_balance),
  accrual_per_month = VALUES(accrual_per_month),
  max_carryover = VALUES(max_carryover),
  carryover_expire_on = VALUES(carryover_expire_on);

-- Armand
INSERT INTO leave_accounts (user_id, leave_type, opening_balance, accrual_per_month, max_carryover, carryover_expire_on)
VALUES
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'VAC',  7.00, 2.083, 10.00, '2026-03-31'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'RTT',  3.00, 0.000,  6.00, NULL),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'SICK', 10.00, 0.000, NULL, NULL)
ON DUPLICATE KEY UPDATE
  opening_balance = VALUES(opening_balance),
  accrual_per_month = VALUES(accrual_per_month),
  max_carryover = VALUES(max_carryover),
  carryover_expire_on = VALUES(carryover_expire_on);

-- ==========================================================
-- ABSENCE + ABSENCE_DAYS (CLEAN + CONSISTENT)
-- ==========================================================

-- ==========================================================
-- ABSENCE + ABSENCE_DAYS — 2025-12-01 → 2026-01-31
-- (coherent with your clocks: no clocks for full-day absences,
--  half-days match the clock pairs you inserted)
-- ==========================================================

-- ----------------------------------------------------------
-- Clément — RTT (PM) — 04 Dec 2025
-- (matches clocks: IN 08:59, OUT 12:08 -> morning only)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
  '2025-12-04', '2025-12-04',
  'RTT',
  'RTT afternoon',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-11-25 11:00:00'
);
SET @abs_clement_rtt_pm := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_clement_rtt_pm, '2025-12-04', 'PM', '13:00:00', '17:00:00');


-- ----------------------------------------------------------
-- Armand — PERSONAL (FULL DAY) — 10 Dec 2025
-- (matches clocks: no clocks for Armand that day)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
  '2025-12-10', '2025-12-10',
  'PERSONAL',
  'Family-related appointment',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-11-20 14:30:00'
);
SET @abs_armand_personal_fd := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_armand_personal_fd, '2025-12-10', 'FULL_DAY', '09:00:00', '17:00:00');


-- ----------------------------------------------------------
-- Alex — VACATION (FULL DAYS) — 15 → 19 Dec 2025
-- (matches clocks: no clocks for Alex on these days)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
  '2025-12-15', '2025-12-19',
  'VACATION',
  'Winter holiday break',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-11-10 09:00:00'
);
SET @abs_alex_wintervac := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_alex_wintervac, '2025-12-15', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_alex_wintervac, '2025-12-16', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_alex_wintervac, '2025-12-17', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_alex_wintervac, '2025-12-18', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_alex_wintervac, '2025-12-19', 'FULL_DAY', '09:00:00', '17:00:00');


-- ----------------------------------------------------------
-- Gaspard — OTHER (AM) — 18 Dec 2025
-- (matches clocks: IN 13:57, OUT 18:06 -> afternoon only)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-12-18', '2025-12-18',
  'OTHER',
  'Doctor appointment',
  'APPROVED',
  (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
  '2025-11-23 10:00:00'
);
SET @abs_gaspard_other_am := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_gaspard_other_am, '2025-12-18', 'AM', '09:00:00', '12:30:00');



-- ----------------------------------------------------------
-- Clément — SICK (2 days) — 19 → 20 Jan 2026
-- (variable name matches your ledger ref @abs_clement_sick_2026_jan)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
  '2026-01-19', '2026-01-20',
  'SICK',
  'Flu-like symptoms, medical certificate provided',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2026-01-18 10:00:00'
);
SET @abs_clement_sick_2026_jan := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_clement_sick_2026_jan, '2026-01-19', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_clement_sick_2026_jan, '2026-01-20', 'FULL_DAY', '09:00:00', '17:00:00');


-- ----------------------------------------------------------
-- Armand — PERSONAL (AM) — 15 Jan 2026
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
  '2026-01-15', '2026-01-15',
  'PERSONAL',
  'Administrative appointment (morning)',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2026-01-10 14:00:00'
);
SET @abs_armand_personal_am_2026_jan := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_armand_personal_am_2026_jan, '2026-01-15', 'AM', '09:00:00', '12:00:00');


-- ----------------------------------------------------------
-- Gaspard — VACATION (5 days) — 26 → 30 Jan 2026
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2026-01-26', '2026-01-30',
  'VACATION',
  'End of January holidays',
  'APPROVED',
  (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
  '2026-01-12 09:00:00'
);
SET @abs_gaspard_vac_2026_jan := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_gaspard_vac_2026_jan, '2026-01-26', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_gaspard_vac_2026_jan, '2026-01-27', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_gaspard_vac_2026_jan, '2026-01-28', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_gaspard_vac_2026_jan, '2026-01-29', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_gaspard_vac_2026_jan, '2026-01-30', 'FULL_DAY', '09:00:00', '17:00:00');

-- Armand — SICK (FULL DAY) — 06 Jan 2026
-- (coherent with clocks: no clocks for Armand on this day)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
  '2026-01-06', '2026-01-06',
  'SICK',
  'Sick leave (reported)',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2026-01-05 18:00:00'
);
SET @abs_armand_sick_2026_jan06 := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_armand_sick_2026_jan06, '2026-01-06', 'FULL_DAY', '09:00:00', '17:00:00');


-- ==========================================================
-- LEAVE LEDGER ENTRIES (cohérent avec tes absences existantes)
-- ==========================================================

-- (Optionnel) évite les doublons si tu relances le seed
DELETE FROM leave_ledger
WHERE reference_absence_id IN (
  @abs_clement_rtt_pm,
  @abs_alex_wintervac,
  @abs_clement_sick_2026_jan,
  @abs_gaspard_vac_2026_jan,
  @abs_armand_sick_2026_jan06
);

-- Clément : RTT demi-journée (PM) => -0.50 RTT
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES (
  (SELECT id FROM leave_accounts
   WHERE user_id = (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu')
     AND leave_type='RTT'),
  '2025-12-04',
  'DEBIT',
  0.50,
  @abs_clement_rtt_pm,
  'RTT afternoon (half-day) - 04/12/2025'
);

-- Alex : VACATION 15 -> 19/12 => -5.00 VAC
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES (
  (SELECT id FROM leave_accounts
   WHERE user_id = (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu')
     AND leave_type='VAC'),
  '2025-12-15',
  'DEBIT',
  5.00,
  @abs_alex_wintervac,
  'Paid vacation - 15/12/2025 to 19/12/2025 (5 days)'
);

-- Clément : SICK 19 -> 20/01 => -2.00 SICK
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES (
  (SELECT id FROM leave_accounts
   WHERE user_id = (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu')
     AND leave_type='SICK'),
  '2026-01-19',
  'DEBIT',
  2.00,
  @abs_clement_sick_2026_jan,
  'Sick leave - 19/01/2026 to 20/01/2026 (2 days)'
);

-- Gaspard : VACATION 26 -> 30/01 => -5.00 VAC
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES (
  (SELECT id FROM leave_accounts
   WHERE user_id = (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu')
     AND leave_type='VAC'),
  '2026-01-26',
  'DEBIT',
  5.00,
  @abs_gaspard_vac_2026_jan,
  'Paid vacation - 26/01/2026 to 30/01/2026 (5 days)'
);

-- Armand : SICK 06/01 => -1.00 SICK
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES (
  (SELECT id FROM leave_accounts
   WHERE user_id = (SELECT id FROM users WHERE email='armand.braud@epitech.eu')
     AND leave_type='SICK'),
  '2026-01-06',
  'DEBIT',
  1.00,
  @abs_armand_sick_2026_jan06,
  'Sick leave - 06/01/2026 (1 day)'
);

-- Armand : PERSONAL AM 15/01 => -0.50 PERSONAL (if tracking)
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES (
  (SELECT id FROM leave_accounts
   WHERE user_id = (SELECT id FROM users WHERE email='armand.braud@epitech.eu')
     AND leave_type='RTT'),
  '2026-01-15',
  'DEBIT',
  0.50,
  @abs_armand_personal_am_2026_jan,
  'Personal leave (half-day AM) - 15/01/2026'
);
