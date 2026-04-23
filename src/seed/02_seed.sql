BEGIN;

INSERT INTO users (username, email, role)
VALUES
  ('student01', 'student01@unihub.local', 'STUDENT'),
  ('student02', 'student02@unihub.local', 'STUDENT'),
  ('organizer01', 'organizer01@unihub.local', 'ORGANIZER'),
  ('checkin01', 'checkin01@unihub.local', 'CHECKIN_STAFF')
ON CONFLICT (username) DO NOTHING;

INSERT INTO workshops (title, speaker_name, room_name, start_time, end_time, capacity, available_slots, price, status)
VALUES
  ('AI Basics for Students', 'Dr. Tran Minh', 'A101', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', 60, 60, 0, 'OPEN'),
  ('Career CV Clinic', 'Ms. Nguyen Anh', 'B201', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 90 minutes', 80, 80, 50000, 'OPEN'),
  ('React Native Bootcamp', 'Mr. Le Kien', 'C301', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', 50, 50, 0, 'OPEN')
ON CONFLICT DO NOTHING;

COMMIT;
