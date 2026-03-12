require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();

// Set up security and general middleware
app.set('trust proxy', 1);
app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Stripe Webhook (Must be before any body parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Health check / Homepage (Beautiful WOW Design)
app.get('/', (req, res) => {
    res.status(200).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>EQUALY API | Infraestructura de Inversión</title>
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
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 3.5rem;
                    border-radius: 32px;
                    text-align: center;
                    max-width: 550px;
                    width: 90%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .logo-text {
                    font-size: 3.5rem;
                    font-weight: 800;
                    letter-spacing: -2px;
                    background: linear-gradient(135deg, #fff 0%, #9ca3af 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 0.5rem;
                }
                .tagline {
                    font-size: 1.125rem;
                    color: #9ca3af;
                    margin-bottom: 2.5rem;
                    font-weight: 300;
                }
                .status-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2.5rem;
                }
                .status {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(45, 212, 191, 0.05);
                    padding: 10px 20px;
                    border-radius: 100px;
                    font-size: 0.9rem;
                    color: var(--primary);
                    border: 1px solid rgba(45, 212, 191, 0.15);
                }
                .status-dot {
                    width: 10px;
                    height: 10px;
                    background-color: var(--primary);
                    border-radius: 50%;
                    box-shadow: 0 0 12px var(--primary);
                }
                .btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    color: #000;
                    padding: 18px 36px;
                    border-radius: 16px;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 1.125rem;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 10px 25px -5px rgba(45, 212, 191, 0.4);
                }
                .btn:hover {
                    transform: translateY(-5px) scale(1.02);
                    box-shadow: 0 20px 40px -5px rgba(45, 212, 191, 0.6);
                }
                .logo-img {
                    width: 140px;
                    height: auto;
                    margin-bottom: 1.5rem;
                    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
                }
                .footer-info {
                    margin-top: 3rem;
                    display: flex;
                    justify-content: space-between;
                    color: #4b5563;
                    font-size: 0.75rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 1.5rem;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    from { transform: scale(1); opacity: 0.15; }
                    to { transform: scale(1.15); opacity: 0.25; }
                }
            </style>
        </head>
        <body>
            <div class="bg-glow"></div>
            <div class="bg-glow-2"></div>
            <div class="card">
                <img src="/images/equaly-logo.png" alt="EQUALY Logo" class="logo-img">
                <div class="logo-text">EQUALY</div>
                <p class="tagline">Infraestructura Tecnológica para Activos Digitales</p>
                <div class="status-container">
                    <div class="status">
                        <div class="status-dot"></div>
                        <span>API Cluster: Operational</span>
                    </div>
                </div>
                <a href="/api-docs" class="btn">Explorar Documentación →</a>
                <div class="footer-info">
                    <span>Versión 1.2.5</span>
                    <span>Seguridad SSL Grado A+</span>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Loading Swagger YAML safely
let swaggerDocument;
try {
    const swaggerPath = path.join(__dirname, 'swagger.yaml');
    swaggerDocument = YAML.load(swaggerPath);
} catch (err) {
    console.error('CRITICAL: YAML Load error:', err.message);
}

// Swagger UI with CDN assets to fix Vercel MIME type errors
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
const JS_URLS = [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"
];

if (swaggerDocument) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
        customCssUrl: CSS_URL,
        customJs: JS_URLS,
        customSiteTitle: "Equaly API | Docs",
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
            persistAuthorization: true
        }
    }));
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

// Rate Limit and Error Handling
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 15000 }));

app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`Server acting locally on port ${PORT}`));
}

module.exports = app;
