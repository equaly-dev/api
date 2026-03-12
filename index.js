require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();

// Health check / Homepage (Beautiful WOW Design)
app.get('/', (req, res) => {
    res.status(200).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>EQUALY API | Documentation</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: #2dd4bf;
                    --secondary: #6366f1;
                    --bg: #030712;
                    --card-bg: rgba(17, 24, 39, 0.7);
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Outfit', sans-serif;
                    background-color: var(--bg);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    overflow: hidden;
                }
                .bg-glow {
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
                    opacity: 0.15;
                    filter: blur(80px);
                    z-index: 0;
                    animation: pulse 8s infinite alternate;
                }
                .bg-glow-2 {
                    position: absolute;
                    top: -100px;
                    right: -100px;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, var(--secondary) 0%, transparent 70%);
                    opacity: 0.1;
                    filter: blur(60px);
                    z-index: 0;
                }
                .card {
                    position: relative;
                    z-index: 10;
                    background: var(--card-bg);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 3rem;
                    border-radius: 24px;
                    text-align: center;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.8s ease-out;
                }
                .logo-container {
                    margin-bottom: 2rem;
                }
                .logo-text {
                    font-size: 3.5rem;
                    font-weight: 800;
                    letter-spacing: -2px;
                    background: linear-gradient(135deg, #fff 0%, #9ca3af 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                h1 {
                    font-size: 1.5rem;
                    font-weight: 400;
                    color: #9ca3af;
                    margin-bottom: 2.5rem;
                }
                .status {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(45, 212, 191, 0.1);
                    padding: 8px 16px;
                    border-radius: 100px;
                    font-size: 0.875rem;
                    color: var(--primary);
                    border: 1px solid rgba(45, 212, 191, 0.2);
                    margin-bottom: 2rem;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    background-color: var(--primary);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--primary);
                }
                .btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    color: #000;
                    padding: 16px 32px;
                    border-radius: 14px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 1.125rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 20px -5px rgba(45, 212, 191, 0.4);
                }
                .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 30px -5px rgba(45, 212, 191, 0.6);
                    filter: brightness(1.1);
                }
                .footer {
                    margin-top: 2rem;
                    font-size: 0.75rem;
                    color: #4b5563;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    from { transform: scale(1); opacity: 0.15; }
                    to { transform: scale(1.2); opacity: 0.25; }
                }
            </style>
        </head>
        <body>
            <div class="bg-glow"></div>
            <div class="bg-glow-2"></div>
            <div class="card">
                <div class="logo-container">
                    <div class="logo-text">EQUALY</div>
                </div>
                <h1>Servicios de API Centralizados</h1>
                <div class="status">
                    <div class="status-dot"></div>
                    <span>Sistemas Operativos & Estables</span>
                </div>
                <a href="/api-docs" class="btn">Explorar Documentación →</a>
                <div class="footer">v1.2.4 • Infraestructura Segura</div>
            </div>
        </body>
        </html>
    `);
});

// App Config
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// Stripe Webhook (Must be before any body parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Swagger Documentation with fixed paths for Vercel
try {
    const swaggerPath = path.join(__dirname, 'swagger.yaml');
    const swaggerDocument = YAML.load(swaggerPath);
    
    // Serve the documentation with specific options for Vercel
    app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
        // Fix for Vercel: ensure absolute paths for assets if needed
        next();
    }, swaggerUi.setup(swaggerDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "Equaly API Documentation"
    }));
} catch (err) {
    console.error('FAILED TO LOAD SWAGGER:', err.message);
}

// Routes
try {
    const authRoutes = require('./routes/authRoutes');
    const paymentRoutes = require('./routes/paymentRoutes');
    const userRoutes = require('./routes/userRoutes');
    const adminRoutes = require('./routes/adminRoutes');

    app.use('/api/auth', authRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminRoutes);
} catch (err) {
    console.error('CRITICAL: Failed to load routes:', err.message);
}

// Global API rate limit
const apiLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 15000,
    message: { error: 'Demasiadas peticiones. Intenta más tarde.' }
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
