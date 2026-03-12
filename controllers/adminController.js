const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required.' });

        const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already in use.' });

        const hashed = await bcrypt.hash(password, 12);
        await pool.query('INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3)', [name, email, hashed]);

        res.status(201).json({ success: true, message: 'Admin registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to register admin' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

        const admins = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
        if (admins.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

        const admin = admins.rows[0];
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

        const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });

        res.json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.getStats = async (req, res) => {
    try {
        // Stats: total users
        const usersRaw = await pool.query('SELECT COUNT(*) as c FROM users');
        const divisasRaw = await pool.query("SELECT COUNT(*) as c, COALESCE(SUM(amount_usd_paid), 0) as total_usd FROM user_divisas");
        const plansRaw = await pool.query("SELECT COUNT(*) as c, COALESCE(SUM(amount_invested), 0) as total_usd FROM user_plans WHERE status = 'active'");

        // Detailed data for tables
        const recentUsers = await pool.query('SELECT id, name, email, country, created_at, referral_code FROM users ORDER BY created_at DESC LIMIT 10');
        const allDivisas = await pool.query('SELECT ud.id, u.name as user_name, ud.divisa_type, ud.amount_usd_paid, ud.created_at FROM user_divisas ud JOIN users u ON ud.user_id = u.id ORDER BY ud.created_at DESC LIMIT 10');
        const allPlans = await pool.query("SELECT up.id, u.name as user_name, up.plan_name, up.amount_invested, up.created_at FROM user_plans up JOIN users u ON up.user_id = u.id WHERE up.status = 'active' ORDER BY up.created_at DESC LIMIT 10");

        res.json({
            success: true,
            summary: {
                totalUsers: usersRaw.rows[0].c,
                totalDivisasPurchased: divisasRaw.rows[0].c,
                totalDivisasUSD: divisasRaw.rows[0].total_usd,
                totalPlansActive: plansRaw.rows[0].c,
                totalPlansUSD: plansRaw.rows[0].total_usd
            },
            recentUsers: recentUsers.rows,
            recentDivisas: allDivisas.rows,
            recentPlans: allPlans.rows
        });
    } catch (error) {
        console.error("Error building admin stats", error);
        res.status(500).json({ error: 'Failed to build stats' });
    }
};

exports.getUsersDetails = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, u.name, u.email, u.country, u.created_at,
                (SELECT COUNT(*) FROM user_plans WHERE user_id = u.id AND status = 'active') as active_plans_count,
                (SELECT COALESCE(SUM(amount_invested), 0) FROM user_plans WHERE user_id = u.id AND status = 'active') as plans_invested,
                (SELECT COUNT(*) FROM user_divisas WHERE user_id = u.id) as divisas_count,
                (SELECT COALESCE(SUM(amount_usd_paid), 0) FROM user_divisas WHERE user_id = u.id) as divisas_invested,
                (SELECT COUNT(*) FROM user_cryptos WHERE user_id = u.id) as cryptos_count,
                (SELECT COALESCE(SUM(amount_usd_paid), 0) FROM user_cryptos WHERE user_id = u.id) as cryptos_invested
            FROM users u
            ORDER BY u.created_at DESC
        `;
        const usersResult = await pool.query(query);
        const users = usersResult.rows;

        const detailedUsers = users.map(user => {
            const plansCount = Number(user.active_plans_count) || 0;
            const divisasCount = Number(user.divisas_count) || 0;
            const cryptosCount = Number(user.cryptos_count) || 0;

            const plansUsd = parseFloat(user.plans_invested) || 0;
            const divisasUsd = parseFloat(user.divisas_invested) || 0;
            const cryptosUsd = parseFloat(user.cryptos_invested) || 0;

            const totalTransactions = plansCount + divisasCount + cryptosCount;
            const totalInvestedUSD = plansUsd + divisasUsd + cryptosUsd;

            // Un usuario se considera activo si tiene al menos 1 inversion
            const isActive = totalTransactions > 0;

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                country: user.country,
                createdAt: user.created_at,
                isActive,
                totalTransactions,
                totalInvestedUSD,
                details: {
                    plansCount, plansUsd,
                    divisasCount, divisasUsd,
                    cryptosCount, cryptosUsd
                }
            };
        });

        res.json({ success: true, users: detailedUsers });
    } catch (error) {
        console.error("Error fetching detailed users", error);
        res.status(500).json({ error: 'Failed to fetch users details' });
    }
};
