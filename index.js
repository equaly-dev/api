require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();

// Health check / Homepage (at the very top)
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

// Routes loaded INSIDE a try-catch to prevent total crash
try {
    const authRoutes = require('./routes/authRoutes');
    const paymentRoutes = require('./routes/paymentRoutes');
    const userRoutes = require('./routes/userRoutes');
    const adminRoutes = require('./routes/adminRoutes');

    app.use('/api/auth', authRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminRoutes);

    const swaggerPath = path.join(__dirname, 'swagger.yaml');
    const swaggerDocument = YAML.load(swaggerPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
    console.error('CRITICAL: Failed to load routes:', err.message);
}

// Global API rate limit
const apiLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 15000,
    message: { error: 'Too many requests' }
});
app.use('/api/', apiLimiter);

// Error Handling
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
// Only listen if NOT on Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running locally on port ${PORT}`);
    });
}

module.exports = app;
