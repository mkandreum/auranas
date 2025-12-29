import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../services/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';
const SALT_ROUNDS = 10;

export const register = async (req, res) => {
    try {
        const { username, password, key } = req.body;

        // Simple protection against public registration
        // In production, you might want to disable registration or use an invite code
        const ADMIN_KEY = process.env.ADMIN_REGISTRATION_KEY || 'auranas-admin';

        if (key !== ADMIN_KEY) {
            return res.status(403).json({ error: 'Invalid registration key' });
        }

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const insert = db.prepare('INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)');

        try {
            insert.run(username, hashedPassword, 'admin', Date.now());
            res.json({ status: 'ok', message: 'User registered' });
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).json({ error: 'Username already exists' });
            }
            throw err;
        }

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ status: 'ok', token, user: { username: user.username, role: user.role } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
