BEGIN;

-- Fixed UUIDs for stable local seed
-- Roles
INSERT INTO "Roles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp") VALUES
('11111111-1111-1111-1111-111111111111', 'STUDENT', 'STUDENT', 'seed-role-student'),
('22222222-2222-2222-2222-222222222222', 'ORGANIZER', 'ORGANIZER', 'seed-role-organizer'),
('33333333-3333-3333-3333-333333333333', 'CHECKIN_STAFF', 'CHECKIN_STAFF', 'seed-role-checkin')
ON CONFLICT ("Id") DO NOTHING;

-- Role claims (permission based authorization)
INSERT INTO "RoleClaims" ("RoleId", "ClaimType", "ClaimValue")
SELECT v."RoleId", v."ClaimType", v."ClaimValue"
FROM (
  VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'permission'::text, 'view_workshop'::text),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'permission'::text, 'register_workshop'::text),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'permission'::text, 'manage_workshop'::text),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'permission'::text, 'view_checkins'::text),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'permission'::text, 'checkin'::text),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'permission'::text, 'view_checkins'::text)
) AS v("RoleId", "ClaimType", "ClaimValue")
WHERE NOT EXISTS (
  SELECT 1
  FROM "RoleClaims" rc
  WHERE rc."RoleId" = v."RoleId"
    AND rc."ClaimType" = v."ClaimType"
    AND rc."ClaimValue" = v."ClaimValue"
);

-- Users
INSERT INTO "Users" (
  "Id", "FullName", "StudentId", "Role", "TelegramChatId", "DateOfBirth", "EntryYear",
  "CreatedAt", "UpdatedAt", "TwoFactorCode", "TwoFactorExpiry",
  "UserName", "NormalizedUserName", "Email", "NormalizedEmail", "EmailConfirmed",
  "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "PhoneNumber", "PhoneNumberConfirmed",
  "TwoFactorEnabled", "LockoutEnd", "LockoutEnabled", "AccessFailedCount"
) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Organizer Seed',
  'ORG001',
  1,
  NULL,
  NULL,
  NULL,
  NOW(),
  NULL,
  NULL,
  NULL,
  'organizer.seed@unihub.local',
  'ORGANIZER.SEED@UNIHUB.LOCAL',
  'organizer.seed@unihub.local',
  'ORGANIZER.SEED@UNIHUB.LOCAL',
  TRUE,
  NULL,
  'seed-security-organizer',
  'seed-concurrency-organizer',
  NULL,
  FALSE,
  FALSE,
  NULL,
  TRUE,
  0
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Student Seed',
  'SE2026001',
  0,
  NULL,
  NULL,
  2026,
  NOW(),
  NULL,
  NULL,
  NULL,
  'student.seed@unihub.local',
  'STUDENT.SEED@UNIHUB.LOCAL',
  'student.seed@unihub.local',
  'STUDENT.SEED@UNIHUB.LOCAL',
  TRUE,
  NULL,
  'seed-security-student',
  'seed-concurrency-student',
  NULL,
  FALSE,
  FALSE,
  NULL,
  TRUE,
  0
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Checkin Staff Seed',
  'CHK001',
  2,
  NULL,
  NULL,
  NULL,
  NOW(),
  NULL,
  NULL,
  NULL,
  'checkin.seed@unihub.local',
  'CHECKIN.SEED@UNIHUB.LOCAL',
  'checkin.seed@unihub.local',
  'CHECKIN.SEED@UNIHUB.LOCAL',
  TRUE,
  NULL,
  'seed-security-checkin',
  'seed-concurrency-checkin',
  NULL,
  FALSE,
  FALSE,
  NULL,
  TRUE,
  0
)
ON CONFLICT ("Id") DO NOTHING;

-- User role mapping
INSERT INTO "UserRoles" ("UserId", "RoleId") VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333')
ON CONFLICT ("UserId", "RoleId") DO NOTHING;

-- Workshops
INSERT INTO "Workshops" (
  "Id", "Title", "Description", "SpeakerName", "SpeakerBio", "Room", "RoomMapUrl",
  "StartTime", "EndTime", "TotalSlots", "RegisteredCount", "IsFree", "Price", "Status",
  "ImageUrl", "PdfUrl", "AiSummary", "AiSummaryGeneratedAt", "CreatedByUserId", "CreatedAt", "UpdatedAt", "IsDeleted"
) VALUES
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'AI Basics for Students',
  'Intro workshop for students',
  'Dr. Tran Minh',
  'Lecturer in Computer Science',
  'A101',
  NULL,
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day 2 hours',
  60,
  1,
  TRUE,
  0,
  1,
  NULL,
  NULL,
  NULL,
  NULL,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NOW(),
  NULL,
  FALSE
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Career CV Clinic',
  'Hands-on CV improvement workshop',
  'Ms. Nguyen Anh',
  'Career mentor',
  'B201',
  NULL,
  NOW() + INTERVAL '2 days',
  NOW() + INTERVAL '2 days 90 minutes',
  80,
  1,
  FALSE,
  50000,
  1,
  NULL,
  NULL,
  NULL,
  NULL,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  NOW(),
  NULL,
  FALSE
)
ON CONFLICT ("Id") DO NOTHING;

-- Registrations
INSERT INTO "Registrations" (
  "Id", "UserId", "WorkshopId", "Status", "QrCode", "QrToken", "IdempotencyKey", "CreatedAt", "UpdatedAt", "IsDeleted"
) VALUES
(
  'f1111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  1,
  'REG-F1111111111111111111111111111111',
  NULL,
  NULL,
  NOW(),
  NULL,
  FALSE
),
(
  'f2222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  0,
  NULL,
  NULL,
  NULL,
  NOW(),
  NULL,
  FALSE
)
ON CONFLICT ("Id") DO NOTHING;

-- Payment for paid workshop registration (pending)
INSERT INTO "Payments" (
  "Id", "RegistrationId", "UserId", "Amount", "Status", "IdempotencyKey", "GatewayTransactionId",
  "GatewayResponse", "RetryCount", "PaidAt", "ExpiredAt", "CreatedAt", "UpdatedAt", "IsDeleted"
) VALUES
(
  'f3333333-3333-3333-3333-333333333333',
  'f2222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  50000,
  0,
  NULL,
  NULL,
  NULL,
  0,
  NULL,
  NOW() + INTERVAL '2 days',
  NOW(),
  NULL,
  FALSE
)
ON CONFLICT ("Id") DO NOTHING;

-- Attendance for free workshop registration
INSERT INTO "Attendances" (
  "Id", "RegistrationId", "UserId", "WorkshopId", "Status", "CheckedInAt", "IsSyncedFromOffline",
  "OfflineDeviceId", "CreatedAt", "UpdatedAt", "IsDeleted"
) VALUES
(
  'f4444444-4444-4444-4444-444444444444',
  'f1111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  0,
  NOW(),
  FALSE,
  NULL,
  NOW(),
  NULL,
  FALSE
)
ON CONFLICT ("Id") DO NOTHING;

-- Sample sync task
INSERT INTO "SyncTasks" (
  "Id", "InputCsvUrl", "SuccessUrl", "ErrorUrl", "SyncState", "ErrorMessage",
  "TotalRows", "SuccessCount", "ErrorCount", "CreatedAt", "ProcessedAt"
) VALUES
(
  'f5555555-5555-5555-5555-555555555555',
  'https://example.local/input/students.csv',
  NULL,
  NULL,
  0,
  NULL,
  0,
  0,
  0,
  NOW(),
  NULL
)
ON CONFLICT ("Id") DO NOTHING;

COMMIT;
