const db = require('./config/db');

async function insertDivisa() {
    try {
        console.log("Fetching user...");
        const [users] = await db.query('SELECT id, country FROM users WHERE email = ?', ['demo@correo.com']);
        if (users.length === 0) {
            console.log("User demo@correo.com not found!");
            process.exit(1);
        }

        const userId = users[0].id;
        const country = users[0].country || 'US';

        let localCode = 'USD';
        let exchangeRate = 1;

        if (country === 'CO') {
            localCode = 'COP';
            exchangeRate = 4250.50;
        } else if (country === 'EC') {
            localCode = 'USD';
            exchangeRate = 1;
        } else if (country === 'PE') {
            localCode = 'PEN';
            exchangeRate = 3.75;
        } else if (country === 'MX') {
            localCode = 'MXN';
            exchangeRate = 16.50;
        } else if (country === 'AR') {
            localCode = 'ARS';
            exchangeRate = 1050.20;
        }

        console.log(`Inserting 100 USD for user ${userId} in ${localCode}...`);

        await db.execute(
            'INSERT INTO user_divisas (user_id, divisa_type, amount_usd_paid, local_currency_code, purchase_exchange_rate, created_at) VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 5 DAY))',
            [userId, 'usd', 100.00, localCode, exchangeRate]
        );

        console.log("Successfully inserted 100 USD divisa purchase for Pedro (demo@correo.com).");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

insertDivisa();
