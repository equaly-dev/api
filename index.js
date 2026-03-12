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

// Initialize Cron Jobs
require('./cron/dailyEarnings');

const app = express();

// Security Middlewares
app.use(helmet());

// Configure CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Permitimos cualquier origen (localhost, production domain, etc.) para evitar 'Failed to fetch'
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// Stripe Webhook needs the raw body format, so we exclude it from express.json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for everything else
app.use(express.json());

// Serve static files (like images) explicitly
app.use(express.static(path.join(__dirname, 'public')));

// Swagger Documentation setup
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rate Limiting designed for high-concurrency 
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15000, // Augmented limit to allow intense load testing (5000+ users simulated)
    message: 'Too many requests from this IP, please try again later.',
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
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #0b0f19;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    text-align: center;
                }
                .logo {
                    width: 120px;
                    height: auto;
                    margin-bottom: 2rem;
                    animation: float 3s ease-in-out infinite;
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
                    animation: pulse 2s infinite;
                }
                .version { margin-top: 5px; color: #9ca3af; font-size: 0.9rem; }
                .btn {
                    display: inline-block;
                    background-color: #2dd4bf;
                    color: #0b0f19;
                    padding: 12px 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(45, 212, 191, 0.3);
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            </style>
        </head>
        <body>
            <img src="/images/equaly-logo.png" alt="EQUALY Logo" class="logo">
            <h1>EQUALY API Services</h1>
            
            <div class="status-box">
                <div class="status-dot"></div>
                <span>Server is Online & Secure</span>
            </div>
            
            <p class="version">Version 1.0.0</p>
            <br>
            <a href="/api-docs" class="btn">View API Documentation</a>
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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
