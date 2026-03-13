const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.jnoewmmsbfnvgaoldnrj:Equaly2026++@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query('SELECT * FROM system_plans');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
