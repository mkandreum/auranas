import db from '../services/db.js';
import bcrypt from 'bcryptjs';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== LIST USERS =====
export const listUsers = (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const users = db.prepare(`
        SELECT u.id, u.username, u.role, u.created_at, u.quota_bytes, u.is_active,
               COALESCE(SUM(f.size), 0) as used_bytes,
               COUNT(f.id) as file_count
        FROM users u
        LEFT JOIN files f ON u.id = f.user_id AND f.is_deleted = 0
        GROUP BY u.id
        ORDER BY u.created_at DESC
    `).all();

    res.json(users);
};

// ===== DELETE USER =====
export const deleteUser = async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { id, deleteFiles = false } = req.body;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (deleteFiles) {
        // Delete all user files physically
        const userDir = path.join(__dirname, '../storage', user.username);
        if (await fs.pathExists(userDir)) {
            await fs.remove(userDir);
        }
        db.prepare('DELETE FROM files WHERE user_id = ?').run(id);
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ status: 'ok', username: user.username });
};

// ===== CREATE USER =====
export const createUser = async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { username, password, role, quotaGB } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const quotaBytes = quotaGB ? quotaGB * 1024 * 1024 * 1024 : null;

        db.prepare(`
            INSERT INTO users (username, password_hash, role, quota_bytes, is_active, created_at) 
            VALUES (?, ?, ?, ?, 1, ?)
        `).run(username, hashedPassword, role || 'user', quotaBytes, Date.now());

        res.json({ status: 'ok', username });
    } catch (e) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to create' });
    }
};

// ===== UPDATE USER =====
export const updateUser = async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { id, role, quotaGB, isActive, newPassword } = req.body;

    try {
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashedPassword, id);
        }

        const quotaBytes = quotaGB !== undefined ? quotaGB * 1024 * 1024 * 1024 : undefined;

        let updates = [];
        let params = [];

        if (role !== undefined) { updates.push('role = ?'); params.push(role); }
        if (quotaBytes !== undefined) { updates.push('quota_bytes = ?'); params.push(quotaBytes); }
        if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

        if (updates.length > 0) {
            params.push(id);
            db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }

        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
};

// ===== SYSTEM STATS =====
export const getSystemStats = (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    try {
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count;
        const totalFiles = db.prepare('SELECT COUNT(*) as count FROM files WHERE is_deleted = 0').get().count;
        const totalSize = db.prepare('SELECT COALESCE(SUM(size), 0) as total FROM files WHERE is_deleted = 0').get().total;
        const trashSize = db.prepare('SELECT COALESCE(SUM(size), 0) as total FROM files WHERE is_deleted = 1').get().total;

        // Top users by storage
        const topUsers = db.prepare(`
            SELECT u.username, COALESCE(SUM(f.size), 0) as used_bytes, COUNT(f.id) as file_count
            FROM users u
            LEFT JOIN files f ON u.id = f.user_id AND f.is_deleted = 0
            GROUP BY u.id
            ORDER BY used_bytes DESC
            LIMIT 10
        `).all();

        // Recent uploads (last 24h)
        const recentUploads = db.prepare(`
            SELECT COUNT(*) as count FROM files 
            WHERE created_at > ? AND is_deleted = 0
        `).get(Date.now() - 24 * 60 * 60 * 1000).count;

        res.json({
            totalUsers,
            activeUsers,
            totalFiles,
            totalSize,
            trashSize,
            topUsers,
            recentUploads
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== ACTIVITY LOG =====
export const getActivityLog = (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    try {
        // Get recent file activities
        const activities = db.prepare(`
            SELECT f.name, f.created_at, f.size, u.username, 'upload' as action
            FROM files f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
            LIMIT 100
        `).all();

        res.json(activities);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== QUOTA CHECK =====
export const checkQuota = (req, res) => {
    try {
        const user = db.prepare('SELECT quota_bytes FROM users WHERE id = ?').get(req.user.id);
        const used = db.prepare('SELECT COALESCE(SUM(size), 0) as total FROM files WHERE user_id = ? AND is_deleted = 0').get(req.user.id).total;

        res.json({
            quota: user.quota_bytes,
            used,
            available: user.quota_bytes ? user.quota_bytes - used : null,
            percentage: user.quota_bytes ? Math.round((used / user.quota_bytes) * 100) : 0
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== UPDATE PROFILE =====
export const updateProfile = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

        if (newPassword) {
            if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password_hash))) {
                return res.status(401).json({ error: 'Invalid current password' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashedPassword, req.user.id);
        }

        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
};
