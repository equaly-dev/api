const pool = require('./config/db');

async function createFakeReferral() {
    try {
        console.log("Creando referido dummy...");

        // Asume userId = 3 corresponds to the 'demo@correo.com' or whoever we injected earlier
        const referrerId = 3;

        // Insert a new fake user who used the referral link
        const [userResult] = await pool.query(
            "INSERT INTO users (name, email, password_hash, country, terms_accepted, referral_code, referred_by) VALUES (?, ?, 'dummy', 'CO', 1, UUID(), ?)",
            ['Laura Gomez', 'laura.dummy@example.com', referrerId]
        );
        const referredId = userResult.insertId;

        // Insert a fake transaction for Laura ($500)
        const [txnResult] = await pool.query(
            "INSERT INTO transactions (user_id, stripe_session_id, plan_name, amount, status) VALUES (?, UUID(), 'plata', 500.00, 'completed')",
            [referredId]
        );
        const txnId = txnResult.insertId;

        // Give the 5% commission to referrerId (3) -> 500 * 0.05 = 25.00
        await pool.query(
            "INSERT INTO referral_commissions (referrer_id, referred_id, transaction_id, amount, commission_percentage) VALUES (?, ?, ?, ?, ?)",
            [referrerId, referredId, txnId, 25.00, 5.00]
        );

        console.log("¡Referido simulado y comisión añadidos con éxito!");
        process.exit(0);
    } catch (err) {
        console.error("Error creating fake referral:", err);
        process.exit(1);
    }
}
createFakeReferral();
