-- ==========================================================
-- USERS
-- ==========================================================
INSERT INTO users (id, first_name, last_name, email, phone, role, poste, password)
VALUES
  (UUID(), 'Alex', 'Fraioli', 'alex.fraioli@epitech.eu', '0600000001', JSON_ARRAY('admin'), 'HR Director', 'Alex.123'),
  (UUID(), 'Gaspard', 'Malmon', 'gaspard.malmon@epitech.eu', '0600000002', JSON_ARRAY('manager'), 'Project Manager', 'Gaspard.123'),
  (UUID(), 'Clement', 'Hamimi', 'clement.hamimi@epitech.eu', '0600000003', JSON_ARRAY('employee'), 'Developer', 'Clement.123'),
  (UUID(), 'Armand', 'Braud', 'armand.braud@epitech.eu', '0600000004', JSON_ARRAY('employee'), 'QA Engineer', 'Armand.123');


-- ==========================================================
-- TEAMS
-- ==========================================================
INSERT INTO teams (name, description)
VALUES
  ('Backend Team', 'Handles backend services and APIs'),
  ('Frontend Team', 'Responsible for UI and UX development');


-- ==========================================================
-- TEAM MEMBERS
-- Gaspard (manager) manages Backend Team, Clement & Armand are members
-- ==========================================================
INSERT INTO team_members (team_id, user_id)
VALUES
  (1, (SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu')),
  (1, (SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu')),
  (1, (SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'));


-- ==========================================================
-- CLOCKS (check-in/out)
-- ==========================================================
INSERT INTO clocks (user_id, kind, `at`)
VALUES
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'IN', '2025-10-08 08:59:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'OUT', '2025-10-08 17:12:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'IN', '2025-10-08 09:05:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'OUT', '2025-10-08 16:45:00');


-- ==========================================================
-- WORK SCHEDULES (weekly planning)
-- ==========================================================
INSERT INTO work_schedules (user_id, day_of_week, period, start_time, end_time)
VALUES
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'MON', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), 'MON', 'PM', '13:00:00', '17:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'MON', 'AM', '09:00:00', '12:00:00'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), 'MON', 'PM', '13:30:00', '17:30:00');


-- ==========================================================
-- ABSENCE (simulate a sick leave)
-- ==========================================================
INSERT INTO absence (user_id, absence_date, type, period, start_time, end_time, reason)
VALUES
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), '2025-10-07', 'SICK', 'AM', '09:00:00', '12:00:00', 'Flu symptoms'),
  ((SELECT id FROM users WHERE email = 'clement.hamimi@epitech.eu'), '2025-10-07', 'SICK', 'PM', '13:00:00', '17:00:00', 'Doctor appointment'),
  ((SELECT id FROM users WHERE email = 'armand.braud@epitech.eu'), '2025-10-10', 'PERSONAL', 'PM', '13:00:00', '17:00:00', 'Family event');


-- ==========================================================
-- REPORTS (manager notifications)
-- ==========================================================
INSERT INTO reports (manager_id, title, body)
VALUES
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
   'Absence report: Clément',
   'Clément was absent on Tuesday due to sickness.'),
  ((SELECT id FROM users WHERE email = 'gaspard.malmon@epitech.eu'),
   'Late arrival: Armand',
   'Armand checked in at 09:05 on Monday, slightly late.');
