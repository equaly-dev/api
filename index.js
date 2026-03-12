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

// Initialize Cron Jobs (only if not on Vercel)
if (!process.env.VERCEL) {
    require('./cron/dailyEarnings');
}

const app = express();

// Required for express-rate-limit to work correctly on Vercel
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: false // Disable CSP for swagger-ui issues on some environments
}));

// Configure CORS
const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// Stripe Webhook needs the raw body format
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for everything else
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Swagger Documentation setup
try {
    const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
    console.error('Failed to load swagger.yaml:', err);
}

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15000,
    message: 'Too many requests.',
});
app.use('/api/', apiLimiter);

// Homepage Route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>EQUALY API Server</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #0b0f19;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    text-align: center;
                }
                .logo-text {
                    font-size: 3rem;
                    font-weight: 800;
                    letter-spacing: 2px;
                    margin-bottom: 2rem;
                    color: #fff;
                }
                h1 {
                    font-size: 2.5rem;
                    margin: 0 0 1rem;
                    background: linear-gradient(135deg, #2dd4bf, #6366f1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .status-box {
                    background: rgba(45, 212, 191, 0.1);
                    border: 1px solid rgba(45, 212, 191, 0.2);
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .status-dot {
                    width: 12px;
                    height: 12px;
                    background-color: #2dd4bf;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #2dd4bf;
                }
                .btn {
                    display: inline-block;
                    background-color: #2dd4bf;
                    color: #0b0f19;
                    padding: 12px 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="logo-text">EQUALY</div>
            <h1>API Services</h1>
            <div class="status-box">
                <div class="status-dot"></div>
                <span>Server is Online & Secure</span>
            </div>
            <a href="/api-docs" class="btn">Explorar documentación</a>
        </body>
        </html>
    `);
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
