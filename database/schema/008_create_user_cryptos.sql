CREATE TABLE IF NOT EXISTS user_cryptos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    crypto_type VARCHAR(10) NOT NULL,
    amount_usd_paid DECIMAL(10, 2) NOT NULL,
    crypto_amount_bought DECIMAL(20, 8) NOT NULL,
    purchase_price_usd DECIMAL(20, 2) NOT NULL,
    local_currency_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
