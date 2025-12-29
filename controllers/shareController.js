import db from '../services/db.js';
import path from 'path';
import fs from 'fs-extra';
import AppError from '../utils/AppError.js';

// Get Shared Content Metadata
export const getSharedContent = (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.query; // Simple password pass for now

        const link = db.prepare('SELECT * FROM shared_links WHERE id = ?').get(token);

        if (!link) {
            return next(new AppError('Link not found or invalid', 404));
        }

        // Check expiration
        if (link.expires_at < Date.now()) {
            return next(new AppError('Link has expired', 410));
        }

        // Check Password
        if (link.password) {
            if (!password) {
                return res.json({ protected: true, name: 'Protected Content' });
            }
            if (link.password !== password) {
                return next(new AppError('Incorrect password', 401));
            }
        }

        // Fetch Content Details
        if (link.file_id) {
            const file = db.prepare('SELECT id, name, size, mime_type, created_at, parent_path FROM files WHERE id = ?').get(link.file_id);
            if (!file) return next(new AppError('File content not found', 404));

            // Increment view
            db.prepare('UPDATE shared_links SET views = views + 1 WHERE id = ?').run(token);

            return res.json({
                protected: false,
                type: 'file',
                data: file,
                allowDownload: link.allow_download
            });
        }

        if (link.album_id) {
            const album = db.prepare('SELECT id, name, description, created_at FROM albums WHERE id = ?').get(link.album_id);
            if (!album) return next(new AppError('Album content not found', 404));

            // Get files in album
            const files = db.prepare(`
                SELECT f.id, f.name, f.size, f.mime_type, f.thumbnail_path, f.created_at 
                FROM files f
                JOIN album_files af ON f.id = af.file_id
                WHERE af.album_id = ? AND f.is_deleted = 0
             `).all(link.album_id);

            db.prepare('UPDATE shared_links SET views = views + 1 WHERE id = ?').run(token);

            return res.json({
                protected: false,
                type: 'album',
                data: album,
                files: files,
                allowDownload: link.allow_download
            });
        }

        return next(new AppError('Empty link', 404));

    } catch (e) {
        next(e);
    }
};

// Download Shared File
export const downloadSharedFile = (req, res, next) => {
    try {
        const { token } = req.params;
        const { fileId, password } = req.query; // If album, need specific fileId

        const link = db.prepare('SELECT * FROM shared_links WHERE id = ?').get(token);
        if (!link || link.expires_at < Date.now()) return next(new AppError('Link invalid or expired', 410));

        if (link.password && link.password !== password) {
            return next(new AppError('Unauthorized', 401));
        }

        if (!link.allow_download) {
            return next(new AppError('Downloads disabled for this link', 403));
        }

        let targetFileId = link.file_id;

        // If it's an album, we need the specific file requested, valid only if in that album
        if (link.album_id && fileId) {
            const inAlbum = db.prepare('SELECT 1 FROM album_files WHERE album_id = ? AND file_id = ?').get(link.album_id, fileId);
            if (!inAlbum) return next(new AppError('File not in this album', 404));
            targetFileId = fileId;
        }

        const file = db.prepare('SELECT * FROM files WHERE id = ?').get(targetFileId);
        if (!file || !fs.existsSync(file.path)) return next(new AppError('File not found', 404));

        res.download(file.path, file.name);

    } catch (e) {
        next(e);
    }
};

// Get Shared Thumbnail
export const getSharedThumbnail = (req, res, next) => {
    try {
        const { token } = req.params;
        const { fileId, password } = req.query;

        const link = db.prepare('SELECT * FROM shared_links WHERE id = ?').get(token);
        if (!link || link.expires_at < Date.now()) return res.sendStatus(404); // No error for images, just 404

        // Simple password check (optional for thumbnails? maybe strict for privacy)
        if (link.password && link.password !== password) return res.sendStatus(401);

        let targetFileId = link.file_id;
        if (link.album_id && fileId) targetFileId = fileId;

        const file = db.prepare('SELECT thumbnail_path, path, mime_type FROM files WHERE id = ?').get(targetFileId);
        if (!file) return res.sendStatus(404);

        if (file.thumbnail_path && fs.existsSync(file.thumbnail_path)) {
            res.sendFile(file.thumbnail_path);
        } else if (file.mime_type.startsWith('image/') && fs.existsSync(file.path)) {
            // Serve original if no thumbnail (careful with size)
            res.sendFile(file.path);
        } else {
            res.sendStatus(404);
        }
    } catch (e) {
        res.sendStatus(500);
    }
};
