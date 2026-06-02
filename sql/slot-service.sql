DROP DATABASE IF EXISTS slot_db;
CREATE DATABASE slot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE slot_db;
truncate table parking_slots;
-- is_occupied: -1=available, 0=reserved (no vehicle yet), 1=occupied (vehicle inside)
-- NOTE: createReservation() sets slot → 1; logExit() sets slot → -1
CREATE TABLE parking_slots (
    id          BIGINT      AUTO_INCREMENT PRIMARY KEY,
    type        VARCHAR(5)  NOT NULL,
    is_occupied INT         NOT NULL DEFAULT -1,
    location    VARCHAR(50) NOT NULL
);

INSERT INTO parking_slots (type, is_occupied, location) VALUES
('2W',  1, 'G'),   -- id=1  → G-1  : CONFIRMED reservation by Priya (TN01AB1234) — slot marked occupied by createReservation
('2W',  1, 'G'),   -- id=2  → G-2  : CONFIRMED reservation by Sneha (KA05EF9012)
('2W', -1, 'G'),   -- id=3  → G-3  : free
('2W',  1, 'G'),   -- id=4  → G-4  : OCCUPIED — KL09MN2345 walk-in vehicle inside
('2W', -1, 'G'),   -- id=5  → G-5  : free
('2W', -1, 'G'),   -- id=6  → G-6  : free
('4W',  1, 'F1'),  -- id=7  → F1-7 : CONFIRMED reservation by Rahul (MH02CD5678)
('4W',  1, 'F1'),  -- id=8  → F1-8 : CONFIRMED reservation by Arjun (DL03GH3456)
('4W',  1, 'F1'),  -- id=9  → F1-9 : OCCUPIED — AP40BQ8904 reserved+entered
('4W', -1, 'F1'),  -- id=10 → F1-10: free
('4W', -1, 'F1'),  -- id=11 → F1-11: free
('4W', -1, 'F1');  -- id=12 → F1-12: free
USE slot_db;
UPDATE parking_slots ps
SET ps.is_occupied = 0
WHERE ps.is_occupied = 1
  AND EXISTS (
      SELECT 1 FROM reservation_db.reservations r
      WHERE r.slot_id = ps.id AND r.status = 'CONFIRMED'
  )
  AND NOT EXISTS (
      SELECT 1 FROM vehicle_log_db.vehicle_logs vl
      WHERE vl.slot_id = ps.id AND vl.status = 'ACTIVE'
  );
SELECT * FROM parking_slots;
update parking_slots set is_occupied =-1;