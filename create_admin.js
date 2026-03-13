const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgresql://postgres.jnoewmmsbfnvgaoldnrj:Equaly2026++@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
    try {
        const email = 'admin@equaly.co';
        const password = 'admin';
        const name = 'Admin Equaly';

        console.log(`🔍 Verificando si existe el admin: ${email}...`);
        const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);

        if (existing.rows.length > 0) {
            console.log("⚠️ El usuario admin ya existe. Actualizando contraseña...");
            const hashed = await bcrypt.hash(password, 12);
            await pool.query('UPDATE admins SET password_hash = $1, name = $2 WHERE email = $3', [hashed, name, email]);
            console.log("✅ Contraseña de admin actualizada.");
        } else {
            console.log("🆕 El usuario admin no existe. Creándolo...");
            const hashed = await bcrypt.hash(password, 12);
            await pool.query('INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3)', [name, email, hashed]);
            console.log(`✅ Admin creado con éxito: ${email}`);
        }
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await pool.end();
    }
}

createAdmin();
