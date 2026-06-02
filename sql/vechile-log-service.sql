DROP DATABASE IF EXISTS vehicle_log_db;
CREATE DATABASE vehicle_log_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vehicle_log_db;
truncate table vehicle_logs;
-- Valid statuses (LogStatus enum): ACTIVE | COMPLETED
CREATE TABLE vehicle_logs (
    id               BIGINT      AUTO_INCREMENT PRIMARY KEY,
    vehicle_number   VARCHAR(20) NOT NULL,
    slot_id          BIGINT      NOT NULL,
    user_id          BIGINT      NOT NULL,
    reservation_id   BIGINT      NULL,
    entry_time       DATETIME    NOT NULL,
    exit_time        DATETIME    NULL,
    duration_minutes BIGINT      NULL,
    status           VARCHAR(15) NOT NULL DEFAULT 'ACTIVE'
);

INSERT INTO vehicle_logs (vehicle_number, slot_id, user_id, reservation_id, entry_time, exit_time, duration_minutes, status) VALUES
-- ACTIVE: currently parked → appear in Log Exit dropdown
('KL09MN2345', 4,  2, NULL,   '2026-05-18 07:30:00', NULL,                  NULL, 'ACTIVE'),
('AP40BQ8904', 9,  7, 100005, '2026-05-18 09:45:00', NULL,                  NULL, 'ACTIVE'),
-- COMPLETED: historical exits
('TN01AB1234', 4,  3, 100006, '2026-05-17 10:05:00', '2026-05-17 13:00:00', 175,  'COMPLETED'),
('MH02CD5678', 10, 4, 100007, '2026-05-16 09:05:00', '2026-05-16 11:30:00', 145,  'COMPLETED'),
('KA05EF9012', 3,  5, 100008, '2026-05-15 10:00:00', '2026-05-15 12:30:00', 150,  'COMPLETED'),
('DL03GH3456', 11, 6, NULL,   '2026-05-14 08:30:00', '2026-05-14 11:00:00', 150,  'COMPLETED');

SELECT * FROM vehicle_logs;