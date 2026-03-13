const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.jnoewmmsbfnvgaoldnrj:Equaly2026++@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function update() {
    try {
        console.log("🛠️ Actualizando porcentajes de sistema...");
        await pool.query("UPDATE system_plans SET daily_percentage = 0.36563071298 WHERE name = 'oro'");
        await pool.query("UPDATE system_plans SET daily_percentage = 0.33333333333 WHERE name = 'plata'");
        await pool.query("UPDATE system_plans SET daily_percentage = 0.16666666667 WHERE name = 'bronce'");
        console.log("✅ Porcentajes actualizados correctamente.");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

update();
