require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

console.log('App starting. Environment:', process.env.NODE_ENV);
console.log('DB_HOST configured:', !!process.env.DB_HOST);
console.log('JWT_SECRET configured:', !!process.env.JWT_SECRET);

// Safety fallback for JWT_SECRET to avoid crashing before env vars are set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'temp_secret_for_booting_on_vercel_please_set_real_one';

// Initialize Cron Jobs (only if not on Vercel)
if (!process.env.VERCEL) {
    require('./cron/dailyEarnings');
}

const app = express();

// Health check / Homepage (at the top to ensure it loads even if routes fail)
app.get('/', (req, res) => {
    res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>EQUALY API</title>
            <style>
                body { background: #0b0f19; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); text-align: center; }
                h1 { margin: 0; color: #2dd4bf; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>EQUALY API</h1>
                <p>Status: Online & Secure</p>
                <a href="/api-docs" style="color: #2dd4bf;">View Documentation</a>
            </div>
        </body>
        </html>
    `);
});

// Required for express-rate-limit
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// Stripe Webhook
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes - Loaded after homepage to improve boot success
try {
    const authRoutes = require('./routes/authRoutes');
    const paymentRoutes = require('./routes/paymentRoutes');
    const userRoutes = require('./routes/userRoutes');
    const adminRoutes = require('./routes/adminRoutes');

    app.use('/api/auth', authRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminRoutes);

    const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
    console.error('Error loading routes or swagger:', err);
}

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15000 });
app.use('/api/', apiLimiter);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
