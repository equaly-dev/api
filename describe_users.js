const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.jnoewmmsbfnvgaoldnrj:Equaly2026++@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function describeTable() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

describeTable();
