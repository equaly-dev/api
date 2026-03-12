CREATE TABLE IF NOT EXISTS system_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    daily_percentage DECIMAL(16,11) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commission_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS daily_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_plan_id INT NOT NULL,
    amount DECIMAL(10,4) NOT NULL,
    earning_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_plan_id) REFERENCES user_plans(id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily_earning (user_plan_id, earning_date)
);

INSERT INTO system_plans (name, daily_percentage) VALUES 
('oro', 0.36563071298),
('plata', 0.33333333333),
('bronce', 0.16666666667)
ON DUPLICATE KEY UPDATE daily_percentage=VALUES(daily_percentage);

INSERT INTO commission_settings (type, percentage, description) VALUES
('vinculados', 5.00, 'Comisión por valor de ingreso de referido'),
('partners', 2.00, 'Comisión por transferencia')
ON DUPLICATE KEY UPDATE percentage=VALUES(percentage);
