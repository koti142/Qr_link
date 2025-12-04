-- Seed data for video delivery system

USE video_delivery;

-- Insert default admin (password: admin123)
-- Password hash is bcrypt hash of 'admin123'
INSERT INTO admins (username, password_hash, email, role)
VALUES ('admin', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZ', 'admin@example.com', 'admin')
ON DUPLICATE KEY UPDATE username=username;





