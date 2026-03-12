-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    country VARCHAR(10) DEFAULT 'EC',
    terms_accepted BOOLEAN DEFAULT FALSE,
    referral_code VARCHAR(20) UNIQUE NULL,
    referred_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referred By Foreign Key
ALTER TABLE users 
ADD CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;

-- Plans Table
CREATE TABLE IF NOT EXISTS user_plans (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    amount_invested DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System Plans Table
CREATE TABLE IF NOT EXISTS system_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    daily_percentage DECIMAL(16,11) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commission Settings Table
CREATE TABLE IF NOT EXISTS commission_settings (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    description VARCHAR(255)
);

-- Daily Earnings Table
CREATE TABLE IF NOT EXISTS daily_earnings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    user_plan_id INT NOT NULL,
    amount DECIMAL(10,4) NOT NULL,
    earning_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_plan_id) REFERENCES user_plans(id) ON DELETE CASCADE,
    CONSTRAINT unique_daily_earning UNIQUE (user_plan_id, earning_date)
);

-- Referral Commissions Table
CREATE TABLE IF NOT EXISTS referral_commissions (
    id SERIAL PRIMARY KEY,
    referrer_id INT NOT NULL,
    referred_id INT NOT NULL,
    transaction_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- User Divisas Table
CREATE TABLE IF NOT EXISTS user_divisas (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    divisa_type VARCHAR(10) NOT NULL,
    amount_usd_paid DECIMAL(10, 2) NOT NULL,
    local_currency_code VARCHAR(10) NOT NULL,
    purchase_exchange_rate DECIMAL(20, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Cryptos Table
CREATE TABLE IF NOT EXISTS user_cryptos (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    crypto_type VARCHAR(10) NOT NULL,
    amount_usd_paid DECIMAL(10, 2) NOT NULL,
    crypto_amount_bought DECIMAL(20, 8) NOT NULL,
    purchase_price_usd DECIMAL(20, 2) NOT NULL,
    local_currency_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Seed initial data
INSERT INTO system_plans (name, daily_percentage) VALUES 
('oro', 0.36563071298),
('plata', 0.33333333333),
('bronce', 0.16666666667)
ON CONFLICT (name) DO UPDATE SET daily_percentage = EXCLUDED.daily_percentage;

INSERT INTO commission_settings (type, percentage, description) VALUES
('vinculados', 5.00, 'Comisión por valor de ingreso de referido'),
('partners', 2.00, 'Comisión por transferencia')
ON CONFLICT (type) DO UPDATE SET percentage = EXCLUDED.percentage;
