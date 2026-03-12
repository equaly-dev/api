const pool = require('./config/db');

async function run() {
    try {
        console.log("Buscando/creando usuario...");

        let usersRes = await pool.query('SELECT id FROM users WHERE email = $1', ['demo@correo.com']);
        let userId;
        
        if (usersRes.rows.length === 0) {
            console.log("Usuario demo@correo.com no encontrado. Creando usuario dummy...");
            await pool.query('INSERT INTO users (name, email, password_hash, country, terms_accepted) VALUES ($1, $2, $3, $4, $5)', 
                ['Demo User', 'demo@correo.com', 'dummyhash', 'EC', true]);
            usersRes = await pool.query('SELECT id FROM users WHERE email = $1', ['demo@correo.com']);
        }
        userId = usersRes.rows[0].id;

        const purchaseDate = new Date();
        purchaseDate.setDate(purchaseDate.getDate() - 10);

        console.log(`Fecha de compra: ${purchaseDate.toISOString().split('T')[0]}`);

        const planRes = await pool.query(`
            INSERT INTO user_plans (user_id, plan_name, amount_invested, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [userId, 'oro', 200.00, 'active', purchaseDate]);

        const userPlanId = planRes.rows[0].id;

        await pool.query(`
            INSERT INTO transactions (user_id, stripe_session_id, plan_name, amount, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, 'manual_' + Date.now(), 'oro', 200.00, 'completed', purchaseDate]);

        const dailyPercentage = 0.36563071298;
        const dailyAmount = 200.00 * (dailyPercentage / 100);

        for (let i = 0; i < 10; i++) {
            const earningDate = new Date(purchaseDate);
            earningDate.setDate(earningDate.getDate() + i + 1);

            await pool.query(`
                INSERT INTO daily_earnings (user_id, user_plan_id, amount, earning_date)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_plan_id, earning_date) DO NOTHING
            `, [userId, userPlanId, dailyAmount, earningDate.toISOString().split('T')[0]]);

            console.log(`Ganancia registrada para la fecha ${earningDate.toISOString().split('T')[0]}: $${dailyAmount.toFixed(4)}`);
        }

        console.log("Operación completada exitosamente.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
