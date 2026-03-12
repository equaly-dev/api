const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register a new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, country, terms_accepted, referral_code } = req.body;

        // Validation
        if (!name || !email || !password || !country || terms_accepted === undefined) {
            return res.status(400).json({ error: 'Todos los campos y aceptar términos son requeridos.' });
        }

        if (terms_accepted !== true) {
            return res.status(400).json({ error: 'Debes aceptar los términos y condiciones.' });
        }

        // Check if user already exists
        const checkUser = await db.query('SELECT email FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email is already taken.' }); // 409 Conflict
        }

        let referredBy = null;
        if (referral_code) {
            const referrer = await db.query('SELECT id FROM users WHERE referral_code = $1', [referral_code]);
            if (referrer.rows.length > 0) {
                referredBy = referrer.rows[0].id;
            }
        }

        // Hash the password securely
        const saltRounds = 12; // 12 rounds is a good balance for security/performance
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newReferralCode = 'EU-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Insert new user into Database
        await db.query(
            'INSERT INTO users (name, email, password_hash, country, terms_accepted, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [name, email, passwordHash, country, terms_accepted, newReferralCode, referredBy]
        );

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
};

// Login an existing user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Fetch user by email
        const users = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (users.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = users.rows[0];

        // Compare given password with stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT Token
        const tokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: '24h' // Token expires in 24 hours
        });

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};
