DROP DATABASE IF EXISTS invoice_db;
CREATE DATABASE invoice_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE invoice_db;
truncate table invoices;
-- Valid statuses (InvoiceStatus enum): PENDING | PAID | CANCELLED
-- Valid slot_type (SlotType enum): TWO_WHEELER | FOUR_WHEELER
-- Billing: amount = base + ceil((minutes-60)/60) × hourly  [when minutes > 60]
--   TWO_WHEELER:  base=₹10, hourly=₹5
--   FOUR_WHEELER: base=₹20, hourly=₹10
CREATE TABLE invoices (
    id               BIGINT        AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT        NOT NULL,
    vehicle_number   VARCHAR(20)   NOT NULL,
    amount           DECIMAL(10,2) NOT NULL,
    payment_method   VARCHAR(20)   NOT NULL DEFAULT 'UPI',
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    created_at       DATETIME      NULL,
    slot_type        VARCHAR(50)   NULL,
    duration_minutes BIGINT        NULL
);

-- Amount calc:
--   175 min, TWO_WHEELER   → ceil((175-60)/60)=2 → 10 + 2×5  = ₹20
--   145 min, FOUR_WHEELER  → ceil((145-60)/60)=2 → 20 + 2×10 = ₹40
--   150 min, TWO_WHEELER   → ceil((150-60)/60)=2 → 10 + 2×5  = ₹20
--   150 min, FOUR_WHEELER  → ceil((150-60)/60)=2 → 20 + 2×10 = ₹40
INSERT INTO invoices (user_id, vehicle_number, amount, payment_method, status, created_at, slot_type, duration_minutes) VALUES
(3, 'TN01AB1234', 20.00, 'UPI',  'PAID',    '2026-05-17 13:05:00', 'TWO_WHEELER',  175),
(4, 'MH02CD5678', 40.00, 'CASH', 'PAID',    '2026-05-16 11:35:00', 'FOUR_WHEELER', 145),
(5, 'KA05EF9012', 20.00, 'UPI',  'PENDING', '2026-05-15 12:35:00', 'TWO_WHEELER',  150),
(6, 'DL03GH3456', 40.00, 'UPI',  'PAID',    '2026-05-14 11:05:00', 'FOUR_WHEELER', 150);

SELECT * FROM invoices;