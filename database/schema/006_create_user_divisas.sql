CREATE TABLE IF NOT EXISTS user_divisas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    divisa_type VARCHAR(10) NOT NULL,
    amount_usd_paid DECIMAL(10, 2) NOT NULL,
    local_currency_code VARCHAR(10) NOT NULL,
    purchase_exchange_rate DECIMAL(20, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
