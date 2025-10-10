
-- ==========================================================
-- USERS
-- ==========================================================
INSERT INTO users (id, first_name, last_name, email, phone, role, poste, password)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alex', 'Fraioli', 'alex.fraioli@epitech.eu', '0600000001', JSON_ARRAY('admin'), 'HR Director', 'Alex.123'),
  ('22222222-2222-2222-2222-222222222222', 'Gaspard', 'Malmon', 'gaspard.malmon@epitech.eu', '0600000002', JSON_ARRAY('manager'), 'Project Manager', 'Gaspard.123'),
  ('33333333-3333-3333-3333-333333333333', 'Clement', 'Hamimi', 'clement.hamimi@epitech.eu', '0600000003', JSON_ARRAY('employee'), 'Developer', 'Clement.123'),
  ('44444444-4444-4444-4444-444444444444', 'Armand', 'Braud', 'armand.braud@epitech.eu', '0600000004', JSON_ARRAY('employee'), 'QA Engineer', 'Armand.123');

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
  (1, 1, '22222222-2222-2222-2222-222222222222'), -- Gaspard (manager)
  (2, 1, '33333333-3333-3333-3333-333333333333'), -- Clement
  (3, 1, '44444444-4444-4444-4444-444444444444'); -- Armand

-- ==========================================================
-- CLOCKS (check-in/out)
-- ==========================================================
INSERT INTO clocks (id, user_id, kind, `at`)
VALUES
  (1, '33333333-3333-3333-3333-333333333333', 'IN',  '2025-10-08 08:59:00'),
  (2, '33333333-3333-3333-3333-333333333333', 'OUT', '2025-10-08 17:12:00'),
  (3, '44444444-4444-4444-4444-444444444444', 'IN',  '2025-10-08 09:05:00'),
  (4, '44444444-4444-4444-4444-444444444444', 'OUT', '2025-10-08 16:45:00');

-- ==========================================================
-- WORK SCHEDULES (weekly planning)
-- ==========================================================
INSERT INTO work_schedules (id, user_id, day_of_week, period, start_time, end_time)
VALUES
  (1, '33333333-3333-3333-3333-333333333333', 'MON', 'AM', '09:00:00', '12:00:00'),
  (2, '33333333-3333-3333-3333-333333333333', 'MON', 'PM', '13:00:00', '17:00:00'),
  (3, '44444444-4444-4444-4444-444444444444', 'MON', 'AM', '09:00:00', '12:00:00'),
  (4, '44444444-4444-4444-4444-444444444444', 'MON', 'PM', '13:30:00', '17:30:00');

-- ==========================================================
-- ABSENCE (simulate a sick leave)
-- ==========================================================
INSERT INTO absence (id, user_id, absence_date, type, period, start_time, end_time, reason)
VALUES
  (1, '33333333-3333-3333-3333-333333333333', '2025-10-07', 'SICK', 'AM', '09:00:00', '12:00:00', 'Flu symptoms'),
  (2, '33333333-3333-3333-3333-333333333333', '2025-10-07', 'SICK', 'PM', '13:00:00', '17:00:00', 'Doctor appointment'),
  (3, '44444444-4444-4444-4444-444444444444', '2025-10-10', 'PERSONAL', 'PM', '13:00:00', '17:00:00', 'Family event');

-- ==========================================================
-- REPORTS (manager notifications)
-- ==========================================================
INSERT INTO reports (id, manager_id, title, body)
VALUES
  (1, '22222222-2222-2222-2222-222222222222', 'Absence report: Clément', 'Clément was absent on Tuesday due to sickness.'),
  (2, '22222222-2222-2222-2222-222222222222', 'Late arrival: Armand', 'Armand checked in at 09:05 on Monday, slightly late.');
