const pool = require('../config/db');

exports.getUserPlans = async (req, res) => {
    try {
        const userId = req.user.id;

        const plans = await pool.query(`
            SELECT 
                up.id as user_plan_id,
                up.plan_name,
                up.amount_invested,
                up.status,
                up.created_at as purchase_date,
                COALESCE(sp.daily_percentage, 0) as daily_percentage,
                (
                    up.amount_invested * (COALESCE(sp.daily_percentage, 0) / 100) * 
                    (EXTRACT(EPOCH FROM (NOW() - up.created_at)) / 86400.0)
                ) as total_earned
            FROM user_plans up
            LEFT JOIN system_plans sp ON LOWER(up.plan_name) LIKE '%' || LOWER(sp.name) || '%'
            WHERE up.user_id = $1
            ORDER BY up.created_at DESC
        `, [userId]);

        res.json({ success: true, plans: plans.rows });
    } catch (error) {
        console.error('Error fetching user plans:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user plans' });
    }
};

exports.getUserDivisas = async (req, res) => {
    try {
        const userId = req.user?.id || 3;

        const divisas = await pool.query(`
            SELECT id, divisa_type, amount_usd_paid, local_currency_code, purchase_exchange_rate, created_at
            FROM user_divisas
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userId]);

        res.json({ success: true, divisas: divisas.rows });
    } catch (error) {
        console.error('Error fetching divisas:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch divisas' });
    }
};

exports.getUserCryptos = async (req, res) => {
    try {
        const userId = req.user?.id || 3;

        const cryptos = await pool.query(`
            SELECT id, crypto_type, amount_usd_paid, crypto_amount_bought, purchase_price_usd, local_currency_code, created_at
            FROM user_cryptos
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userId]);

        res.json({ success: true, cryptos: cryptos.rows });
    } catch (error) {
        console.error('Error fetching cryptos:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch cryptos' });
    }
};

exports.getPortfolioSummary = async (req, res) => {
    try {
        const userId = req.user?.id || 3;

        // Plans
        const plans = await pool.query("SELECT COALESCE(SUM(amount_invested), 0) as total FROM user_plans WHERE status = 'active' AND user_id = $1", [userId]);
        // Divisas
        const divisas = await pool.query("SELECT COALESCE(SUM(amount_usd_paid), 0) as total FROM user_divisas WHERE user_id = $1", [userId]);
        // Cryptos
        const cryptos = await pool.query("SELECT COALESCE(SUM(amount_usd_paid), 0) as total FROM user_cryptos WHERE user_id = $1", [userId]);

        const totalInvested = Number(plans.rows[0].total) + Number(divisas.rows[0].total) + Number(cryptos.rows[0].total);

        res.json({ success: true, totalInvested });
    } catch (error) {
        console.error('Error fetching portfolio summary:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch summary' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user?.id || 3;

        const users = await pool.query('SELECT id, name, email, country, referral_code, created_at FROM users WHERE id = $1', [userId]);
        if (users.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

        res.json({ success: true, profile: users.rows[0] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
};

exports.getReferrals = async (req, res) => {
    try {
        const userId = req.user?.id || 3;

        const referrals = await pool.query(`
            SELECT u.id, u.name, u.email, u.created_at,
                   COALESCE(SUM(rc.amount), 0) as total_commission
            FROM users u
            LEFT JOIN referral_commissions rc ON u.id = rc.referred_id AND rc.referrer_id = $1
            WHERE u.referred_by = $2
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `, [userId, userId]);

        const totalEarned = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM referral_commissions WHERE referrer_id = $1', [userId]);

        res.json({ success: true, referrals: referrals.rows, total_earned: totalEarned.rows[0].total });
    } catch (error) {
        console.error('Error fetching referrals:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch referrals' });
    }
};
