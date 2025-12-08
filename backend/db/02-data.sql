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

-- ==========================================================
-- CLOCKS
-- ==========================================================

INSERT INTO clocks (user_id, kind, `at`)
VALUES
  -- Clément
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'IN',  '2025-10-06 08:58:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'OUT', '2025-10-06 17:05:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'IN',  '2025-10-07 09:02:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'OUT', '2025-10-07 17:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'IN',  '2025-10-08 09:01:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'OUT', '2025-10-08 17:10:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'IN',  '2025-10-09 09:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'OUT', '2025-10-09 16:50:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'IN',  '2025-10-10 09:05:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'OUT', '2025-10-10 16:55:00'),

  -- Armand
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'IN',  '2025-10-06 09:05:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'OUT', '2025-10-06 17:25:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'IN',  '2025-10-07 09:02:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'OUT', '2025-10-07 17:20:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'IN',  '2025-10-08 09:05:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'OUT', '2025-10-08 16:45:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'IN',  '2025-10-09 09:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'OUT', '2025-10-09 17:35:00');

INSERT INTO clocks (user_id, kind, `at`)
VALUES
  -- Gaspard
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'IN',  '2025-10-06 09:10:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'OUT', '2025-10-06 18:05:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'IN',  '2025-10-07 09:00:00'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'), 'OUT', '2025-10-07 18:15:00'),

  -- Alex
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'IN',  '2025-10-06 08:55:00'),
  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'), 'OUT', '2025-10-06 17:10:00');

-- ==========================================================
-- CLOCKS — WEEK 2 (2025-10-13 to 2025-10-17)
-- ==========================================================

-- 2025-10-13 (Clement on sick leave)
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-13 09:04:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-13 17:26:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-13 09:12:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-13 18:01:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-10-13 08:55:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-10-13 17:05:00');

-- 2025-10-14
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-14 09:01:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-14 17:02:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-14 09:05:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-14 17:32:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-14 09:09:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-14 18:06:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-10-14 08:57:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-10-14 17:04:00');

-- 2025-10-15
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-15 08:59:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-15 17:01:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-15 09:07:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-15 17:44:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-15 09:11:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-15 18:12:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-10-15 08:54:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-10-15 17:10:00');

-- 2025-10-16
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-16 09:03:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-16 17:00:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-16 09:04:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-16 17:30:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-16 09:07:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-16 18:02:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-10-16 08:53:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-10-16 17:00:00');

-- 2025-10-17
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-17 09:00:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-17 16:03:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-17 09:02:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-17 16:30:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-17 09:10:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-17 17:00:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-10-17 08:55:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-10-17 16:00:00');

-- ==========================================================
-- CLOCKS — WEEK 3 (2025-10-20 to 2025-10-24)
-- ==========================================================

-- 2025-10-20 (Alex on vacation)
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-20 08:59:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-20 17:04:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-20 09:03:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-20 17:25:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-20 09:11:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-20 18:03:00');

-- 2025-10-21 (Alex on vacation)
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-21 09:01:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-21 17:02:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-21 09:02:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-21 17:28:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-21 09:10:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-21 18:01:00');

-- 2025-10-22 (Alex on vacation)
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-22 09:01:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-22 17:01:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-22 09:06:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-22 17:32:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-22 09:12:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-22 18:07:00');

-- 2025-10-23
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-23 09:03:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-23 17:00:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-23 09:05:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-23 17:31:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-23 09:10:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-23 18:02:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-10-23 08:56:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-10-23 17:05:00');

-- 2025-10-24
INSERT INTO clocks (user_id, kind, `at`) VALUES
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'IN','2025-10-24 08:58:00'),
 ((SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),'OUT','2025-10-24 16:05:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'IN','2025-10-24 09:04:00'),
 ((SELECT id FROM users WHERE email='armand.braud@epitech.eu'),'OUT','2025-10-24 16:40:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'IN','2025-10-24 09:08:00'),
 ((SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),'OUT','2025-10-24 17:02:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'IN','2025-10-24 08:57:00'),
 ((SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),'OUT','2025-10-24 16:00:00');

-- ==========================================================
-- REPORTS (manager notifications)
-- ==========================================================
INSERT INTO reports (author_id, target_user_id, title, body)
VALUES
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
   (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'),
   'Absence report: Clément sick leave',
   'Clément was on sick leave on 13/10/2025.'),

  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
   (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'),
   'Partial absence: Armand personal errand',
   'Armand was absent on the afternoon of 10/10/2025 for a personal appointment.'),

  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
   (SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'),
   'Alex vacation planning',
   'Alex is on vacation from 20/10/2025 to 22/10/2025.'),

  ((SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'),
   (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
   'Reminder: approve pending leaves',
   'Please review and approve remaining pending leave requests for October.');

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

-- ----------------------------------------------------------
-- Clément — Sick Leave (FULL DAY) — 13 Oct 2025 (PAST)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
  '2025-10-13', '2025-10-13',
  'SICK',
  'Flu, medical certificate provided',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-10-12 10:00:00'
);
SET @abs_clement_sick := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_clement_sick, '2025-10-13', 'FULL_DAY', '09:00:00', '17:00:00');


-- ----------------------------------------------------------
-- Clément — Personal Leave (AM) — 28 Oct 2025 (PAST)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu'),
  '2025-10-28', '2025-10-28',
  'PERSONAL',
  'Administrative appointment in the morning',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-10-25 09:30:00'
);
SET @abs_clement_personal_am := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_clement_personal_am, '2025-10-28', 'AM', '09:00:00', '12:00:00');


-- ----------------------------------------------------------
-- Armand — Personal Leave (PM) — 10 Oct 2025 (PAST)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
  '2025-10-10', '2025-10-10',
  'PERSONAL',
  'Administrative appointment',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-10-09 15:30:00'
);
SET @abs_armand_personal := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_armand_personal, '2025-10-10', 'PM', '13:30:00', '17:30:00');


-- ----------------------------------------------------------
-- Armand — Sick Leave (FULL DAY) — 29 Oct 2025 (PAST)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='armand.braud@epitech.eu'),
  '2025-10-29', '2025-10-29',
  'SICK',
  'Fever, rest recommended',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-10-28 18:00:00'
);
SET @abs_armand_sick_full := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_armand_sick_full, '2025-10-29', 'FULL_DAY', '09:00:00', '17:00:00');


-- ----------------------------------------------------------
-- Alex — Vacation — 20 → 22 Oct 2025 (PAST)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
  '2025-10-20', '2025-10-22',
  'VACATION',
  'Short autumn holidays',
  'APPROVED',
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-10-10 09:00:00'
);
SET @abs_alex_vac := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_alex_vac, '2025-10-20', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_alex_vac, '2025-10-21', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_alex_vac, '2025-10-22', 'FULL_DAY', '09:00:00', '17:00:00');


-- ----------------------------------------------------------
-- Gaspard — RTT (PM) — 03 Oct 2025 (PAST)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-10-03', '2025-10-03',
  'RTT',
  'RTT afternoon',
  'APPROVED',
  (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
  '2025-10-01 11:00:00'
);
SET @abs_gaspard_rtt := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_gaspard_rtt, '2025-10-03', 'PM', '14:00:00', '18:00:00');


-- ----------------------------------------------------------
-- Gaspard — FORMATION (FULL DAY) — 05 Nov 2025 (FUTURE)
-- ----------------------------------------------------------
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES (
  (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu'),
  '2025-11-05', '2025-11-05',
  'FORMATION',
  'Leadership training program',
  'APPROVED',
  (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu'),
  '2025-10-30 10:00:00'
);
SET @abs_gaspard_training := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES (@abs_gaspard_training, '2025-11-05', 'FULL_DAY', '09:00:00', '17:00:00');


-- ----------------------------------------------------------
-- Alex — Future Vacation — 15 → 19 Dec 2025 (FUTURE)
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
-- Clément — Future RTT (PM) — 04 Dec 2025 (FUTURE)
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
-- Armand — Future Personal Leave — 10 Dec 2025 (FUTURE)
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
-- Gaspard — OTHER Leave (AM) — 18 Dec 2025 (FUTURE)
-- (corrected: REMOVED DUPLICATE)
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


-- ==========================================================
-- FUTURE LEAVE LEDGER ENTRIES (only for APPROVED leaves)
-- ==========================================================

-- Alex: 5 days VACATION in April 2026
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
(
  (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu') AND leave_type='VAC'),
  '2026-04-10',
  'DEBIT',
  5.00,
  @abs_alex_vac_2026_spring,
  '5 days paid vacation (Spring 2026)'
);

-- Gaspard: 0.5 RTT in March 2026
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
(
  (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu') AND leave_type='RTT'),
  '2026-03-11',
  'DEBIT',
  0.50,
  @abs_gaspard_rtt_2026_mar,
  'RTT afternoon 11/03/2026'
);

-- Gaspard: 5 days VACATION in July 2026
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
(
  (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu') AND leave_type='VAC'),
  '2026-07-22',
  'DEBIT',
  5.00,
  @abs_gaspard_vac_2026_jul,
  '5 days paid vacation (July 2026)'
);

-- Clement: 2 days SICK in January 2026
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
(
  (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu') AND leave_type='SICK'),
  '2026-01-19',
  'DEBIT',
  2.00,
  @abs_clement_sick_2026_jan,
  '2 sick days used (Jan 2026)'
);

-- Clement: 5 days VACATION in May 2026
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
(
  (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu') AND leave_type='VAC'),
  '2026-05-08',
  'DEBIT',
  5.00,
  @abs_clement_vac_2026_may,
  '5 days paid vacation (May 2026)'
);

-- Armand: 3 days SICK in September 2026
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
(
  (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='armand.braud@epitech.eu') AND leave_type='SICK'),
  '2026-09-07',
  'DEBIT',
  3.00,
  @abs_armand_sick_2026_sep,
  '3 sick days used (Sep 2026)'
);
