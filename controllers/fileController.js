import db from '../services/db.js';
import path from 'path';
import fs from 'fs-extra';
import sharp from 'sharp';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';

// ===== HELPER FUNCTIONS =====
const sendError = (res, statusCode, message, details = null) => {
    const response = { error: message };
    if (details && process.env.NODE_ENV === 'development') {
        response.details = details;
    }
    return res.status(statusCode).json(response);
};

const removePhysicalFile = async (filePath) => {
    try {
        if (await fs.pathExists(filePath)) await fs.remove(filePath);
    } catch (e) {
        console.error(`Failed to remove file ${filePath}:`, e);
    }
};

// ===== FILE LISTING =====
export const listFiles = (req, res) => {
    try {
        const { path: queryPath = '/', trash = 'false', favorites = 'false', tag, albumId } = req.query;
        const user = req.user;
        const isTrash = trash === 'true';
        const isFav = favorites === 'true';

        let query = 'SELECT f.* FROM files f';
        const params = [];

        // Join for tags if filtering by tag
        if (tag) {
            query += ' JOIN file_tags ft ON f.id = ft.file_id JOIN tags t ON ft.tag_id = t.id';
        }

        query += ' WHERE f.user_id = ?';
        params.push(user.id);

        if (isTrash) {
            query += ' AND f.is_deleted = 1';
        } else {
            query += ' AND f.is_deleted = 0';
            if (isFav) query += ' AND f.is_favorite = 1';
            if (tag) {
                query += ' AND t.name = ?';
                params.push(tag);
            }
            if (queryPath && queryPath !== '/' && !tag && !isFav) {
                // Normalize path: strip trailing slashes, resolve . and ..
                let safePath = path.normalize(queryPath).replace(/^(\.\.[\/\\])+/, '').replace(/[\/\\]$/, '').replace(/\\/g, '/');
                if (safePath === '.') safePath = '';
                if (!safePath.startsWith('/')) safePath = '/' + safePath;
                if (safePath === '/') safePath = '/'; // Root special case

                query += ' AND f.parent_path = ?';
                params.push(safePath);
            }
        }

        query += ' ORDER BY f.created_at DESC';
        const files = db.prepare(query).all(...params);
        res.json({ path: queryPath, files });
    } catch (error) {
        console.error('List files error:', error);
        return sendError(res, 500, 'Failed to list files', error.message);
    }
};

// ===== TIMELINE =====
export const getTimeline = (req, res) => {
    try {
        const { limit = 1000, offset = 0, year, month } = req.query;
        let query = `
            SELECT * FROM files 
            WHERE user_id = ? AND type = 'file' AND is_deleted = 0
        `;
        const params = [req.user.id];

        if (year) {
            query += ` AND strftime('%Y', datetime(created_at/1000, 'unixepoch')) = ?`;
            params.push(year);
        }
        if (month) {
            query += ` AND strftime('%m', datetime(created_at/1000, 'unixepoch')) = ?`;
            params.push(month.padStart(2, '0'));
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const files = db.prepare(query).all(...params);
        const total = db.prepare('SELECT COUNT(*) as count FROM files WHERE user_id = ? AND type = \'file\' AND is_deleted = 0').get(req.user.id).count;

        res.json({ files, total, hasMore: offset + files.length < total });
    } catch (error) {
        console.error('Timeline error:', error);
        return sendError(res, 500, 'Failed to load timeline', error.message);
    }
};

// ===== STATS =====
export const getStats = (req, res) => {
    try {
        const user = req.user;
        const totalSize = db.prepare('SELECT COALESCE(SUM(size), 0) as total FROM files WHERE user_id = ? AND is_deleted = 0').get(user.id).total || 0;
        const count = db.prepare('SELECT COUNT(*) as count FROM files WHERE user_id = ? AND is_deleted = 0').get(user.id).count || 0;
        const imageCount = db.prepare("SELECT COUNT(*) as count FROM files WHERE user_id = ? AND is_deleted = 0 AND (mime_type LIKE 'image%' OR name LIKE '%.jpg' OR name LIKE '%.jpeg' OR name LIKE '%.png' OR name LIKE '%.gif' OR name LIKE '%.webp')").get(user.id).count || 0;
        const videoCount = db.prepare("SELECT COUNT(*) as count FROM files WHERE user_id = ? AND is_deleted = 0 AND (mime_type LIKE 'video%' OR name LIKE '%.mp4' OR name LIKE '%.mkv' OR name LIKE '%.mov')").get(user.id).count || 0;
        const trashCount = db.prepare('SELECT COUNT(*) as count FROM files WHERE user_id = ? AND is_deleted = 1').get(user.id).count || 0;
        const favCount = db.prepare('SELECT COUNT(*) as count FROM files WHERE user_id = ? AND is_favorite = 1 AND is_deleted = 0').get(user.id).count || 0;

        // By year breakdown
        const byYear = db.prepare(`
            SELECT strftime('%Y', datetime(created_at/1000, 'unixepoch')) as year, COUNT(*) as count 
            FROM files WHERE user_id = ? AND is_deleted = 0 AND type = 'file'
            GROUP BY year ORDER BY year DESC
        `).all(user.id);

        res.json({
            totalSize,
            totalFiles: count,
            breakdown: { images: imageCount, videos: videoCount, others: count - imageCount - videoCount },
            trashCount,
            favCount,
            byYear
        });
    } catch (error) {
        console.error('Stats error:', error);
        return sendError(res, 500, 'Failed to retrieve statistics', error.message);
    }
};

// ===== DELETE/RESTORE =====
export const deleteFiles = async (req, res) => {
    try {
        const { ids, permanent } = req.body;
        const user = req.user;

        // Validation
        if (!Array.isArray(ids)) {
            return sendError(res, 400, 'Invalid ids: must be an array');
        }

        if (ids.length === 0) {
            return sendError(res, 400, 'Invalid ids: array cannot be empty');
        }

        if (ids.length > 1000) {
            return sendError(res, 400, 'Too many files: maximum 1000 files per operation');
        }

        if (permanent) {
            const selectStmt = db.prepare('SELECT path, thumbnail_path FROM files WHERE id = ? AND user_id = ?');
            const deleteStmt = db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?');
            for (const id of ids) {
                const file = selectStmt.get(id, user.id);
                if (file) {
                    await removePhysicalFile(file.path);
                    if (file.thumbnail_path) await removePhysicalFile(file.thumbnail_path);
                    deleteStmt.run(id, user.id);
                }
            }
        } else {
            // Soft delete - mark as deleted
            const stmt = db.prepare('UPDATE files SET is_deleted = 1 WHERE id = ? AND user_id = ?');
            for (const id of ids) {
                stmt.run(id, user.id);
            }
        }

        res.json({ status: 'ok', deleted: ids.length });
    } catch (error) {
        console.error('[Delete] Error:', error);
        return sendError(res, 500, 'Delete operation failed', error.message);
    }
};

export const restoreFiles = (req, res) => {
    try {
        const { ids } = req.body;
        const stmt = db.prepare('UPDATE files SET is_deleted = 0 WHERE id = ? AND user_id = ?');
        for (const id of ids) stmt.run(id, req.user.id);
        res.json({ status: 'ok', restored: ids.length });
    } catch (e) {
        console.error('[Restore] Error:', e);
        return sendError(res, 500, 'Restore operation failed', e.message);
    }
};

export const emptyTrash = async (req, res) => {
    try {
        const files = db.prepare('SELECT id, path, thumbnail_path FROM files WHERE user_id = ? AND is_deleted = 1').all(req.user.id);


        let deleted = 0;
        for (const f of files) {

            await removePhysicalFile(f.path);
            if (f.thumbnail_path) await removePhysicalFile(f.thumbnail_path);
            db.prepare('DELETE FROM files WHERE id = ?').run(f.id);
            deleted++;
        }


        res.json({ status: 'ok', removed: deleted });
    } catch (e) {
        console.error('[EmptyTrash] Error:', e);
        return sendError(res, 500, 'Failed to empty trash', e.message);
    }
};

// ===== FAVORITES =====
export const toggleFavorite = (req, res) => {
    try {
        const { id, isFavorite } = req.body;
        db.prepare('UPDATE files SET is_favorite = ? WHERE id = ? AND user_id = ?').run(isFavorite ? 1 : 0, id, req.user.id);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
};

export const bulkFavorite = (req, res) => {
    try {
        const { ids, isFavorite } = req.body;
        const stmt = db.prepare('UPDATE files SET is_favorite = ? WHERE id = ? AND user_id = ?');
        for (const id of ids) stmt.run(isFavorite ? 1 : 0, id, req.user.id);
        res.json({ status: 'ok', updated: ids.length });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== SHARING =====
export const createShareLink = (req, res) => {
    try {
        const { fileId, password, expiresInDays = 7, albumId } = req.body;
        const id = uuidv4();
        const expires = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);

        db.prepare(`
            INSERT INTO shared_links (id, file_id, album_id, user_id, password, created_at, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, fileId || null, albumId || null, req.user.id, password || null, Date.now(), expires);

        res.json({ linkId: id, url: `/s/${id}`, expiresAt: expires });
    } catch (e) {
        res.status(500).json({ error: 'Share failed' });
    }
};

export const getShareLinks = (req, res) => {
    try {
        const links = db.prepare('SELECT * FROM shared_links WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(links);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const deleteShareLink = (req, res) => {
    try {
        db.prepare('DELETE FROM shared_links WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== METADATA =====
export const getMetadata = async (req, res) => {
    try {
        const { id } = req.params;
        const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(id, req.user.id);
        if (!file) return res.status(404).send('Not found');

        let metadata = { size: file.size, name: file.name, created: file.created_at, path: file.parent_path };

        try {
            const imgMeta = await sharp(file.path).metadata();
            metadata = { ...metadata, format: imgMeta.format, width: imgMeta.width, height: imgMeta.height, space: imgMeta.space, density: imgMeta.density };
        } catch (e) { /* Not an image or can't read */ }

        res.json(metadata);
    } catch (e) {
        res.json({ error: 'No metadata' });
    }
};

// ===== DOWNLOAD =====
export const downloadFile = (req, res) => {
    const { id } = req.params;
    const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!file) return res.status(404).send('Not found');
    res.download(file.path, file.name);
};

export const downloadZip = async (req, res) => {
    try {
        const { ids } = req.body;
        const files = db.prepare(`SELECT * FROM files WHERE id IN (${ids.map(() => '?').join(',')}) AND user_id = ?`).all(...ids, req.user.id);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=auranas-download.zip');

        const archive = archiver('zip', { zlib: { level: 5 } });
        archive.pipe(res);

        for (const file of files) {
            if (await fs.pathExists(file.path)) {
                archive.file(file.path, { name: file.name });
            }
        }

        await archive.finalize();
    } catch (e) {
        res.status(500).json({ error: 'Zip failed' });
    }
};

// ===== TAGS =====
export const getTags = (req, res) => {
    try {
        const tags = db.prepare(`
            SELECT t.*, COUNT(ft.file_id) as count 
            FROM tags t 
            LEFT JOIN file_tags ft ON t.id = ft.tag_id 
            WHERE t.user_id = ? 
            GROUP BY t.id ORDER BY count DESC
        `).all(req.user.id);
        res.json(tags);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const createTag = (req, res) => {
    try {
        const { name, color } = req.body;
        const result = db.prepare('INSERT INTO tags (user_id, name, color, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, name, color || '#6366f1', Date.now());
        res.json({ id: result.lastInsertRowid, name, color });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const tagFiles = (req, res) => {
    try {
        const { fileIds, tagId } = req.body;
        const stmt = db.prepare('INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?, ?)');
        for (const fid of fileIds) stmt.run(fid, tagId);
        res.json({ status: 'ok', tagged: fileIds.length });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const untagFiles = (req, res) => {
    try {
        const { fileIds, tagId } = req.body;
        const stmt = db.prepare('DELETE FROM file_tags WHERE file_id = ? AND tag_id = ?');
        for (const fid of fileIds) stmt.run(fid, tagId);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== SEARCH =====
export const search = (req, res) => {
    try {
        const { q, type, minSize, maxSize, startDate, endDate, limit = 100 } = req.query;
        let query = `SELECT * FROM files WHERE user_id = ? AND is_deleted = 0`;
        const params = [req.user.id];

        if (q) {
            query += ` AND name LIKE ?`;
            params.push(`%${q}%`);
        }
        if (type === 'image') {
            query += ` AND (mime_type LIKE 'image%' OR name LIKE '%.jpg' OR name LIKE '%.png' OR name LIKE '%.gif' OR name LIKE '%.webp')`;
        } else if (type === 'video') {
            query += ` AND (mime_type LIKE 'video%' OR name LIKE '%.mp4' OR name LIKE '%.mkv' OR name LIKE '%.mov')`;
        }
        if (minSize) {
            query += ` AND size >= ?`;
            params.push(parseInt(minSize));
        }
        if (maxSize) {
            query += ` AND size <= ?`;
            params.push(parseInt(maxSize));
        }
        if (startDate) {
            query += ` AND created_at >= ?`;
            params.push(new Date(startDate).getTime());
        }
        if (endDate) {
            query += ` AND created_at <= ?`;
            params.push(new Date(endDate).getTime());
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const files = db.prepare(query).all(...params);
        res.json({ results: files, query: q });
    } catch (e) {
        res.status(500).json({ error: 'Search failed' });
    }
};

// ===== DUPLICATES =====
export const findDuplicates = (req, res) => {
    try {
        const user = req.user;

        // More sophisticated duplicate detection using size AND name similarity
        const duplicates = db.prepare(`
            SELECT 
                f1.size,
                f1.name as sample_name,
                COUNT(*) as count, 
                GROUP_CONCAT(f1.id) as ids,
                GROUP_CONCAT(f1.name) as names
            FROM files f1
            WHERE f1.user_id = ? 
                AND f1.is_deleted = 0 
                AND f1.type = 'file' 
                AND f1.size > 0
                AND EXISTS (
                    SELECT 1 FROM files f2 
                    WHERE f2.user_id = f1.user_id 
                        AND f2.id != f1.id 
                        AND f2.size = f1.size
                        AND f2.is_deleted = 0
                )
            GROUP BY f1.size
            ORDER BY f1.size DESC 
            LIMIT 100
        `).all(user.id);

        const result = duplicates.map(d => ({
            size: d.size,
            count: d.count,
            ids: d.ids.split(','),
            names: d.names.split(','),
            sampleName: d.sample_name,
            sizeFormatted: (d.size / 1024 / 1024).toFixed(2) + ' MB',
            potentialSavings: ((d.count - 1) * d.size / 1024 / 1024).toFixed(2) + ' MB'
        }));

        res.json(result);
    } catch (e) {
        console.error('[Duplicates] Error:', e);
        return sendError(res, 500, 'Failed to find duplicates', e.message);
    }
};

// ===== ALBUMS =====
export const createAlbum = (req, res) => {
    try {
        const { name, description } = req.body;
        const result = db.prepare('INSERT INTO albums (user_id, name, description, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, name, description || '', Date.now());
        res.json({ id: result.lastInsertRowid, name });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create album' });
    }
};

export const listAlbums = (req, res) => {
    try {
        const albums = db.prepare(`
            SELECT a.*, COUNT(af.file_id) as count,
                   (SELECT f.id FROM files f JOIN album_files af2 ON f.id = af2.file_id WHERE af2.album_id = a.id LIMIT 1) as cover_file_id
            FROM albums a 
            LEFT JOIN album_files af ON a.id = af.album_id 
            WHERE a.user_id = ? 
            GROUP BY a.id 
            ORDER BY a.created_at DESC
        `).all(req.user.id);
        res.json(albums);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const addToAlbum = (req, res) => {
    try {
        const { albumId, fileIds } = req.body;
        const insert = db.prepare('INSERT OR IGNORE INTO album_files (album_id, file_id, added_at) VALUES (?, ?, ?)');
        const tx = db.transaction((files) => {
            for (const fid of files) insert.run(albumId, fid, Date.now());
        });
        tx(fileIds);
        res.json({ status: 'ok', added: fileIds.length });
    } catch (e) {
        res.status(500).json({ error: 'Failed to add to album' });
    }
};

export const removeFromAlbum = (req, res) => {
    try {
        const { albumId, fileIds } = req.body;
        const stmt = db.prepare('DELETE FROM album_files WHERE album_id = ? AND file_id = ?');
        for (const fid of fileIds) stmt.run(albumId, fid);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getAlbumFiles = (req, res) => {
    try {
        const { id } = req.params;
        const files = db.prepare(`
            SELECT f.* FROM files f
            JOIN album_files af ON f.id = af.file_id
            WHERE af.album_id = ? AND f.user_id = ? AND f.is_deleted = 0
            ORDER BY af.added_at DESC
        `).all(id, req.user.id);
        res.json(files);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const deleteAlbum = (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM albums WHERE id = ? AND user_id = ?').run(id, req.user.id);
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== RECENT ACTIVITY =====
export const getRecent = (req, res) => {
    try {
        const recent = db.prepare(`
            SELECT * FROM files 
            WHERE user_id = ? AND is_deleted = 0 
            ORDER BY created_at DESC LIMIT 50
        `).all(req.user.id);
        res.json(recent);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== BULK OPERATIONS =====
export const bulkMove = (req, res) => {
    try {
        const { ids, targetPath } = req.body;
        const stmt = db.prepare('UPDATE files SET parent_path = ? WHERE id = ? AND user_id = ?');
        for (const id of ids) stmt.run(targetPath, id, req.user.id);
        res.json({ status: 'ok', moved: ids.length });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const bulkAddToAlbum = (req, res) => {
    try {
        const { ids, albumId } = req.body;
        const insert = db.prepare('INSERT OR IGNORE INTO album_files (album_id, file_id, added_at) VALUES (?, ?, ?)');
        for (const id of ids) insert.run(albumId, id, Date.now());
        res.json({ status: 'ok', added: ids.length });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== YEARS/MONTHS NAVIGATION =====
export const getYears = (req, res) => {
    try {
        const years = db.prepare(`
            SELECT DISTINCT strftime('%Y', datetime(created_at/1000, 'unixepoch')) as year, COUNT(*) as count
            FROM files WHERE user_id = ? AND is_deleted = 0 AND type = 'file'
            GROUP BY year ORDER BY year DESC
        `).all(req.user.id);
        res.json(years);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const getMonths = (req, res) => {
    try {
        const { year } = req.params;
        const months = db.prepare(`
            SELECT strftime('%m', datetime(created_at/1000, 'unixepoch')) as month, COUNT(*) as count
            FROM files WHERE user_id = ? AND is_deleted = 0 AND type = 'file'
            AND strftime('%Y', datetime(created_at/1000, 'unixepoch')) = ?
            GROUP BY month ORDER BY month DESC
        `).all(req.user.id, year);
        res.json(months);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== RECALCULATE FILE SIZES =====
export const recalculateSizes = async (req, res) => {
    try {
        const user = req.user;
        const files = db.prepare('SELECT id, path FROM files WHERE user_id = ? AND is_deleted = 0').all(user.id);

        let updated = 0;
        let totalSize = 0;

        for (const file of files) {
            try {
                if (await fs.pathExists(file.path)) {
                    const stats = await fs.stat(file.path);
                    db.prepare('UPDATE files SET size = ? WHERE id = ?').run(stats.size, file.id);
                    totalSize += stats.size;
                    updated++;
                }
            } catch (e) {
                console.error(`Failed to update size for file ${file.id}:`, e.message);
            }
        }

        console.log(`[Admin] Recalculated sizes for ${updated} files, total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        res.json({
            status: 'ok',
            updated,
            totalFiles: files.length,
            totalSize,
            totalSizeFormatted: (totalSize / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        });
    } catch (error) {
        console.error('Recalculate sizes error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== DIRECTORY & RENAME =====
export const createDirectory = (req, res) => {
    try {
        const { name, path: parentPath } = req.body;
        const user = req.user;

        // Validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return sendError(res, 400, 'Invalid directory name');
        }

        if (name.length > 255) {
            return sendError(res, 400, 'Directory name too long (max 255 characters)');
        }

        // Check for invalid characters
        if (/[<>:"\/\\|?*\x00-\x1f]/g.test(name)) {
            return sendError(res, 400, 'Directory name contains invalid characters');
        }

        const id = uuidv4();

        // Normalize parent path
        let normalizedParentPath = path.normalize(parentPath).replace(/^(\.\.[\/\\])+/, '').replace(/[\/\\]$/, '').replace(/\\/g, '/');
        if (normalizedParentPath === '.') normalizedParentPath = '';
        if (!normalizedParentPath.startsWith('/')) normalizedParentPath = '/' + normalizedParentPath;
        if (normalizedParentPath === '/') normalizedParentPath = '/';

        const existing = db.prepare('SELECT id FROM files WHERE user_id = ? AND parent_path = ? AND name = ? AND is_deleted = 0').get(user.id, normalizedParentPath, name);
        if (existing) return res.status(409).json({ error: 'Already exists' });

        db.prepare(`
            INSERT INTO files (id, user_id, name, parent_path, type, mime_type, size, created_at, modified_at, is_deleted, is_favorite)
            VALUES (?, ?, ?, ?, 'directory', 'directory', 0, ?, ?, 0, 0)
        `).run(id, user.id, name, normalizedParentPath, Date.now(), Date.now());

        res.json({ status: 'ok', id, name, path: parentPath });
    } catch (e) {
        console.error('Create directory error:', e);
        return sendError(res, 500, 'Failed to create directory', e.message);
    }
};

export const renameFile = (req, res) => {
    try {
        const { id } = req.params;
        const { name: newName } = req.body;
        const user = req.user;

        // Validation
        if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
            return sendError(res, 400, 'Invalid file name');
        }

        if (newName.length > 255) {
            return sendError(res, 400, 'File name too long (max 255 characters)');
        }

        // Check for invalid characters
        if (/[<>:"\/\\|?*\x00-\x1f]/g.test(newName)) {
            return sendError(res, 400, 'File name contains invalid characters');
        }

        const file = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(id, user.id);
        if (!file) return res.status(404).json({ error: 'Not found' });

        if (file.path && file.type !== 'directory') {
            const dir = path.dirname(file.path);
            const newPath = path.join(dir, newName);
            try {
                if (fs.existsSync(file.path)) fs.renameSync(file.path, newPath);
            } catch (fsErr) {
                console.error("FS rename error:", fsErr);
                return res.status(500).json({ error: 'File system error' });
            }
            db.prepare('UPDATE files SET name = ?, path = ?, modified_at = ? WHERE id = ?').run(newName, newPath, Date.now(), id);
        } else {
            db.prepare('UPDATE files SET name = ?, modified_at = ? WHERE id = ?').run(newName, Date.now(), id);
        }
        res.json({ status: 'ok', name: newName });
    } catch (e) {
        console.error('Rename error:', e);
        return sendError(res, 500, 'Failed to rename file', e.message);
    }
};

