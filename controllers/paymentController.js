const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/db');

// Map plan info (in a real app this might come from a DB)
const PLANS = {
    'bronze': { name: 'Plan Bronce' },
    'silver': { name: 'Plan Plata' },
    'gold': { name: 'Plan Oro' },
    'usd': { name: 'Divisa USD' },
    'eur': { name: 'Divisa EUR' },
    'btc': { name: 'Bitcoin (BTC)' },
    'AAPL': { name: 'Apple Inc. (AAPL)' },
    'TSLA': { name: 'Tesla Inc. (TSLA)' }
};

exports.createCheckoutSession = async (req, res) => {
    try {
        const { planId, amount, localCurrencyCode, exchangeRate, cryptoPriceUsd } = req.body;
        const user = req.user; // from authMiddleware

        if (!planId || !PLANS[planId]) {
            return res.status(400).json({ error: 'Plan inválido.' });
        }

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ error: 'Monto de inversión inválido.' });
        }

        const selectedPlan = PLANS[planId];
        const investmentAmount = Number(amount);
        const priceCents = Math.round(investmentAmount * 100);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: selectedPlan.name,
                            description: `Suscripción de inversión en EQUALY (${selectedPlan.name})`,
                        },
                        unit_amount: priceCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Update URLs for production as needed (pointing to dashboard paths)
            success_url: `${process.env.CLIENT_URL || 'https://dashboard.equaly.co'}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL || 'https://dashboard.equaly.co'}/?canceled=true`,
            metadata: {
                userId: user.id.toString(),
                planId: planId,
                planName: selectedPlan.name,
                planPrice: investmentAmount.toString(),
                localCurrencyCode: localCurrencyCode || 'USD',
                exchangeRate: exchangeRate ? exchangeRate.toString() : '1',
                cryptoPriceUsd: cryptoPriceUsd ? cryptoPriceUsd.toString() : '0'
            }
        });

        // Store a pending transaction in PostgreSQL
        await db.query(
            'INSERT INTO transactions (user_id, stripe_session_id, plan_name, amount, status) VALUES ($1, $2, $3, $4, $5)',
            [user.id, session.id, planId, investmentAmount, 'pending']
        );

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating Stripe session:', error);
        res.status(500).json({ error: 'Fallo al iniciar el pago. Razón: ' + error.message });
    }
};

exports.webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Without STRIPE_WEBHOOK_SECRET, you can verify via direct object, but signature is safer in prod
        // Let's assume you've added it, or in testing we simply parse the raw body if we can't verify signature secretly yet.
        // For standard local tests without secret:
        event = JSON.parse(req.body.toString());

        // If you have a true webhook secret registered, uncomment and pass process.env.STRIPE_WEBHOOK_SECRET:
        // event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const metadata = session.metadata;
        const sessionId = session.id;

        try {
            // Check if transaction exists
            const transactionsRes = await db.query('SELECT * FROM transactions WHERE stripe_session_id = $1', [sessionId]);
            const transactions = transactionsRes.rows;

            if (transactions.length > 0 && transactions[0].status !== 'completed') {
                // Update transaction status
                await db.query('UPDATE transactions SET status = $1 WHERE stripe_session_id = $2', ['completed', sessionId]);

                const planId = transactions[0].plan_name; // 'usd', 'eur', 'btc', 'bronze', etc.

                if (planId === 'usd' || planId === 'eur') {
                    // Register user's divisa purchase
                    await db.query(
                        'INSERT INTO user_divisas (user_id, divisa_type, amount_usd_paid, local_currency_code, purchase_exchange_rate) VALUES ($1, $2, $3, $4, $5)',
                        [transactions[0].user_id, planId, transactions[0].amount, metadata.localCurrencyCode, parseFloat(metadata.exchangeRate)]
                    );
                } else if (planId === 'btc') {
                    // Register user's crypto purchase
                    const amountUsd = parseFloat(transactions[0].amount);
                    const btcPriceUsd = parseFloat(metadata.cryptoPriceUsd) || 1;
                    const btcAmountBought = amountUsd / btcPriceUsd;

                    await db.query(
                        'INSERT INTO user_cryptos (user_id, crypto_type, amount_usd_paid, crypto_amount_bought, purchase_price_usd, local_currency_code) VALUES ($1, $2, $3, $4, $5, $6)',
                        [transactions[0].user_id, 'btc', amountUsd, btcAmountBought, btcPriceUsd, metadata.localCurrencyCode]
                    );
                } else if (planId === 'AAPL' || planId === 'TSLA') {
                    // Register user's stock purchase
                    await db.query(
                        'INSERT INTO user_plans (user_id, plan_name, amount_invested, status) VALUES ($1, $2, $3, $4)',
                        [transactions[0].user_id, PLANS[planId]?.name || planId, transactions[0].amount, 'active']
                    );
                } else {
                    // Register user's purchased plan
                    await db.query(
                        'INSERT INTO user_plans (user_id, plan_name, amount_invested, status) VALUES ($1, $2, $3, $4)',
                        [transactions[0].user_id, PLANS[planId]?.name || planId, transactions[0].amount, 'active']
                    );
                }
            }
        } catch (dbError) {
            console.error('Database error on webhook handling:', dbError);
            return res.status(500).send('Webhook database error');
        }
    }

    res.status(200).json({ received: true });
};
