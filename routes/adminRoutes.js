const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middlewares/authMiddleware');

router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.get('/stats', verifyAdmin, adminController.getStats);
router.get('/users', verifyAdmin, adminController.getUsersDetails);

module.exports = router;
