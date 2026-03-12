const pool = require('./config/db');

async function migrate() {
    try {
        console.log("Adding referrals columns...");

        try {
            await pool.query(`
                ALTER TABLE users
                ADD COLUMN referral_code VARCHAR(20) UNIQUE NULL,
                ADD COLUMN referred_by INT NULL;
            `);
        } catch (e) {
            console.log("Columns might exist already or error:", e.message);
        }

        try {
            await pool.query(`
                ALTER TABLE users 
                ADD CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;
            `);
        } catch (e) {
            console.log("FK might exist already or error:", e.message);
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS referral_commissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
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
        `);

        // Generate referral codes for existing users
        const [users] = await pool.query('SELECT id, name FROM users WHERE referral_code IS NULL');
        for (let u of users) {
            const code = 'EU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            await pool.query('UPDATE users SET referral_code = ? WHERE id = ?', [code, u.id]);
        }
        console.log('Updated referral codes for', users.length, 'users');
        console.log("Referral schema ready!");
        process.exit(0);

    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
migrate();
