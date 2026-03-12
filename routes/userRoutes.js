const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken); // Apply auth to all user routes

router.get('/plans', userController.getUserPlans);
router.get('/profile', userController.getProfile);
router.get('/referrals', userController.getReferrals);
router.get('/divisas', userController.getUserDivisas);
router.get('/criptos', userController.getUserCryptos);
router.get('/portfolio-summary', userController.getPortfolioSummary);

module.exports = router;
