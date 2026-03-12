const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware');

// The checkout session creation requires validation
router.post('/create-checkout-session', verifyToken, paymentController.createCheckoutSession);

// Route for Stripe Webhook (runs without normal auth, validación manejada por Stripe)
// Notice we don't define express.raw here since it needs to be set up globally at index.js level for this specific path
router.post('/webhook', paymentController.webhook);

module.exports = router;
