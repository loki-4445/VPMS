DROP DATABASE IF EXISTS reservation_db;
CREATE DATABASE reservation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reservation_db;

truncate table reservations;
-- id is NOT auto-increment: service generates random 6-digit IDs via @PrePersist
-- Valid statuses (ReservationServiceImpl): CONFIRMED | CANCELLED | COMPLETED
CREATE TABLE reservations (
    id             BIGINT      PRIMARY KEY,
    user_id        BIGINT      NOT NULL,
    slot_id        BIGINT      NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    start_time     DATETIME    NOT NULL,
    end_time       DATETIME    NULL,
    status         VARCHAR(15) NOT NULL DEFAULT 'CONFIRMED'
);

INSERT INTO reservations (id, user_id, slot_id, vehicle_number, start_time, end_time, status) VALUES
-- CONFIRMED: reserved, vehicle has not entered yet → appear in Log Entry dropdown
(100001, 3, 1,  'TN01AB1234', '2026-05-18 08:00:00', NULL,                  'CONFIRMED'),
(100002, 4, 7,  'MH02CD5678', '2026-05-18 09:00:00', NULL,                  'CONFIRMED'),
(100003, 5, 2,  'KA05EF9012', '2026-05-18 10:00:00', NULL,                  'CONFIRMED'),
(100004, 6, 8,  'DL03GH3456', '2026-05-18 11:00:00', NULL,                  'CONFIRMED'),
-- CONFIRMED: vehicle already entered (AP40BQ8904 in slot 9) — still CONFIRMED until exit
(100005, 7, 9,  'AP40BQ8904', '2026-05-18 09:30:00', NULL,                  'CONFIRMED'),
-- COMPLETED: fully entered + exited (historical)
(100006, 3, 4,  'TN01AB1234', '2026-05-17 10:00:00', '2026-05-17 13:00:00', 'COMPLETED'),
(100007, 4, 10, 'MH02CD5678', '2026-05-16 09:00:00', '2026-05-16 11:30:00', 'COMPLETED'),
(100008, 5, 3,  'KA05EF9012', '2026-05-15 10:00:00', '2026-05-15 12:30:00', 'COMPLETED'),
-- CANCELLED
(100009, 6, 11, 'DL03GH3456', '2026-05-14 08:00:00', NULL,                  'CANCELLED');

SELECT * FROM reservations;
