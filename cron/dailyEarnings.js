const cron = require('node-cron');
const pool = require('../config/db');

// Run every day at midnight (00:00:00) server time
cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Starting daily earnings calculation...');
    try {
        const today = new Date().toISOString().split('T')[0];

        // Ensure we calculate for ALL active plans
        const activePlansRes = await pool.query(`
            SELECT up.id as user_plan_id, up.user_id, up.amount_invested, sp.daily_percentage 
            FROM user_plans up
            JOIN system_plans sp ON up.plan_name = sp.name
            WHERE up.status = 'active'
        `);
        const activePlans = activePlansRes.rows;

        console.log(`[CRON] Found ${activePlans.length} active plans.`);

        let count = 0;
        for (const plan of activePlans) {
            const dailyAmount = plan.amount_invested * (plan.daily_percentage / 100);

            try {
                const result = await pool.query(`
                    INSERT INTO daily_earnings (user_id, user_plan_id, amount, earning_date)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_plan_id, earning_date) DO NOTHING
                `, [plan.user_id, plan.user_plan_id, dailyAmount, today]);

                if (result.rowCount > 0) {
                    count++;
                }
            } catch (err) {
                console.error(`[CRON] Error inserting earning for plan ID ${plan.user_plan_id}:`, err);
            }
        }

        console.log(`[CRON] Daily earnings calculation completed. Inserted ${count} new records for ${today}.`);
    } catch (err) {
        console.error('[CRON] Error during daily earnings calculation:', err);
    }
});
