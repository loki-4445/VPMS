DROP DATABASE IF EXISTS user_db;
CREATE DATABASE user_db;
USE user_db;

CREATE TABLE users (
    id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone_number  VARCHAR(15)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, phone_number, password_hash, role, created_at) VALUES
  ('Admin User', 'admin@vpms.com', '9000000001', '$2a$10$7QJ8Z1z1z1z1z1z1z1z1zuXwQ1z1z1z1z1z1z1z1z1z1z1z1z1zu', 'ADMIN',    NOW()),
  ('John Doe',   'john@vpms.com',  '9000000002', '$2a$10$7QJ8Z1z1z1z1z1z1z1z1zuXwQ1z1z1z1z1z1z1z1z1z1z1z1z1zu', 'CUSTOMER', NOW()),
  ('Ravi Kumar', 'ravi@vpms.com',  '9000000003', '$2a$10$7QJ8Z1z1z1z1z1z1z1z1zuXwQ1z1z1z1z1z1z1z1z1z1z1z1z1zu', 'CUSTOMER', NOW());

SELECT * FROM users;