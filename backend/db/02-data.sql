-- ==========================================================
-- USERS (inchangés)
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
  (2, (SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'))   -- Alex
;

-- ==========================================================
-- WORK SCHEDULES (planning complet LUNDI → VENDREDI, AM/PM)
-- ==========================================================

-- Alex : 9h-12h / 13h-17h
INSERT INTO work_schedules (user_id, day_of_week, period, start_time, end_time)
VALUES
  -- Lundi à vendredi
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

-- Gaspard : 9h-12h30 / 14h-18h
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

-- Clément : 9h-12h / 13h-17h (développeur)
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

-- Armand : 9h-12h / 13h30-17h30 (QA)
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
-- CLOCKS (check-in/out sur plusieurs jours)
-- ==========================================================

-- Semaine du 2025-10-06 pour Clément & Armand
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

-- Quelques clocks pour Gaspard et Alex
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
-- ABSENCE + ABSENCE_DAYS
-- ==========================================================

-- 1) Clément : 1 jour SICK complet (2025-10-13)
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES
  (
    (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'),
    '2025-10-13', '2025-10-13',
    'SICK',
    'Grippe, certificat médical fourni',
    'APPROVED',
    (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
    '2025-10-12 10:00:00'
  );
SET @abs_clement_sick := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_clement_sick, '2025-10-13', 'FULL_DAY', '09:00:00', '17:00:00');

-- 2) Armand : absence PERSONNELLE l’après-midi (2025-10-10, comme avant mais plus complet)
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES
  (
    (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'),
    '2025-10-10', '2025-10-10',
    'PERSONAL',
    'Rendez-vous administratif',
    'APPROVED',
    (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
    '2025-10-09 15:30:00'
  );
SET @abs_armand_personal := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_armand_personal, '2025-10-10', 'PM', '13:30:00', '17:30:00');

-- 3) Alex : 3 jours VACATION (2025-10-20 → 2025-10-22)
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES
  (
    (SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'),
    '2025-10-20', '2025-10-22',
    'VACATION',
    'Short autumn holidays',
    'APPROVED',
    (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
    '2025-10-10 09:00:00'
  );
SET @abs_alex_vac := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_alex_vac, '2025-10-20', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_alex_vac, '2025-10-21', 'FULL_DAY', '09:00:00', '17:00:00'),
  (@abs_alex_vac, '2025-10-22', 'FULL_DAY', '09:00:00', '17:00:00');

-- 4) Gaspard : RTT le 2025-10-03 après-midi
INSERT INTO absence (user_id, start_date, end_date, type, reason, status, approved_by, approved_at)
VALUES
  (
    (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
    '2025-10-03', '2025-10-03',
    'RTT',
    'RTT afternoon',
    'APPROVED',
    (SELECT id FROM users WHERE email = 'alex.fraioli@epitech.eu'),
    '2025-10-01 11:00:00'
  );
SET @abs_gaspard_rtt := LAST_INSERT_ID();

INSERT INTO absence_days (absence_id, absence_date, period, start_time, end_time)
VALUES
  (@abs_gaspard_rtt, '2025-10-03', 'PM', '14:00:00', '18:00:00');

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
  ('RTT', 'Réduction du temps de travail'),
  ('SICK', 'Sick Leave')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- ==========================================================
-- LEAVE ACCOUNTS (VAC + RTT + SICK) pour chaque user
-- opening_balance en jours, accrual_per_month en jours/mois
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
-- LEAVE LEDGER (exemples : accruals + débits liés aux absences)
-- ==========================================================

-- Accrual VAC Sep & Oct 2025 pour tout le monde
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
  -- Alex VAC
  ((SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu') AND leave_type='VAC'),
   '2025-09-30', 'ACCRUAL', 2.08, NULL, 'Monthly accrual Sep 2025'),
  ((SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu') AND leave_type='VAC'),
   '2025-10-31', 'ACCRUAL', 2.08, NULL, 'Monthly accrual Oct 2025'),

  -- Gaspard VAC
  ((SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu') AND leave_type='VAC'),
   '2025-09-30', 'ACCRUAL', 2.08, NULL, 'Monthly accrual Sep 2025'),
  ((SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu') AND leave_type='VAC'),
   '2025-10-31', 'ACCRUAL', 2.08, NULL, 'Monthly accrual Oct 2025'),

  -- Clément VAC
  ((SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu') AND leave_type='VAC'),
   '2025-09-30', 'ACCRUAL', 2.08, NULL, 'Monthly accrual Sep 2025'),
  ((SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu') AND leave_type='VAC'),
   '2025-10-31', 'ACCRUAL', 2.08, NULL, 'Monthly accrual Oct 2025'),

  -- Armand VAC
  ((SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='armand.braud@epitech.eu') AND leave_type='VAC'),
   '2025-09-30', 'ACCRUAL', 2.08, NULL, 'Monthly accrual Sep 2025'),
  ((SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='armand.braud@epitech.eu') AND leave_type='VAC'),
   '2025-10-31', 'ACCRUAL', 2.08, NULL, 'Monthly accrual Oct 2025');

-- Débits liés aux absences définies plus haut
-- Alex : 3 jours de VAC (20-22/10/2025)
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
  (
    (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='alex.fraioli@epitech.eu') AND leave_type='VAC'),
    '2025-10-22', 'DEBIT', 3.00, @abs_alex_vac, '3 days paid vacation'
  );

-- Gaspard : 0.5 RTT le 03/10/2025
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
  (
    (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='gaspard.malmon@epitech.eu') AND leave_type='RTT'),
    '2025-10-03', 'DEBIT', 0.50, @abs_gaspard_rtt, 'RTT afternoon'
  );

-- Clément : 1 jour SICK (généralement non décompté du VAC, juste un exemple d’ajustement)
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
  (
    (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='clement.hamimi@epitech.eu') AND leave_type='SICK'),
    '2025-10-13', 'DEBIT', 1.00, @abs_clement_sick, '1 sick day used'
  );

-- Armand : ajustement manuel +0.5 VAC
INSERT INTO leave_ledger (account_id, entry_date, kind, amount, reference_absence_id, note)
VALUES
  (
    (SELECT id FROM leave_accounts WHERE user_id = (SELECT id FROM users WHERE email='armand.braud@epitech.eu') AND leave_type='VAC'),
    '2025-10-15', 'ADJUSTMENT', 0.50, NULL, 'Manual correction +0.5 day'
  );
