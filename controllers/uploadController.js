import fs from 'fs-extra';
import path from 'path';
import db from '../services/db.js';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_ROOT = path.join(__dirname, '../storage');
const TEMP_DIR = path.join(__dirname, '../storage/.temp');

fs.ensureDirSync(TEMP_DIR);

// ===== INIT UPLOAD SESSION =====
export const initUpload = (req, res) => {
    try {
        const { fileName, totalSize, totalChunks } = req.body;
        const sessionId = uuidv4();

        db.prepare(`
            INSERT INTO upload_sessions (id, user_id, file_name, total_size, total_chunks, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
        `).run(sessionId, req.user.id, fileName, totalSize, totalChunks, Date.now(), Date.now());

        res.json({ sessionId, status: 'initialized' });
    } catch (e) {
        res.status(500).json({ error: 'Init failed' });
    }
};

// ===== GET UPLOAD STATUS =====
export const getUploadStatus = (req, res) => {
    try {
        const session = db.prepare('SELECT * FROM upload_sessions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        res.json({
            ...session,
            progress: session.total_chunks > 0 ? Math.round((session.chunks_received / session.total_chunks) * 100) : 0
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
};

// ===== CHUNKED UPLOAD =====
export const uploadChunk = async (req, res) => {
    try {
        const { fileName, chunkIndex, totalChunks, fileId, sessionId } = req.body;
        const chunk = req.file;
        const user = req.user;

        if (!chunk || !fileName || !user) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const currentChunk = parseInt(chunkIndex);
        const total = parseInt(totalChunks);
        const tempFilePath = path.join(TEMP_DIR, `${user.id}-${fileId || sessionId}-${fileName}`);

        // Clear if first chunk
        if (currentChunk === 0 && await fs.pathExists(tempFilePath)) {
            await fs.unlink(tempFilePath);
        }

        // Append chunk
        await fs.appendFile(tempFilePath, fs.readFileSync(chunk.path));
        await fs.unlink(chunk.path);

        // Update session if exists
        if (sessionId) {
            db.prepare('UPDATE upload_sessions SET chunks_received = ?, updated_at = ? WHERE id = ?')
                .run(currentChunk + 1, Date.now(), sessionId);
        }

        console.log(`[Upload] User ${user.username}: Chunk ${currentChunk + 1}/${total} for ${fileName}`);

        // Final chunk - move to permanent storage
        if (currentChunk === total - 1) {
            // Get user defined path or default to root
            // Sanitize path to prevent directory traversal
            let targetDir = req.body.path || '/';
            // Remove leading/trailing slashes and resolve relative segments
            targetDir = path.normalize(targetDir).replace(/^(\.\.[\/\\])+/, '');
            if (targetDir === '.') targetDir = '/';
            if (!targetDir.startsWith('/')) targetDir = '/' + targetDir;

            const userDir = path.join(STORAGE_ROOT, user.username, targetDir);
            await fs.ensureDir(userDir);

            let finalPath = path.join(userDir, fileName);

            // Handle duplicates
            if (await fs.pathExists(finalPath)) {
                const parsed = path.parse(fileName);
                finalPath = path.join(userDir, `${parsed.name}_${Date.now()}${parsed.ext}`);
            }

            await fs.move(tempFilePath, finalPath, { overwrite: true });

            const stats = await fs.stat(finalPath);
            const virtualParentPath = targetDir;

            // Detect file type for ALL formats
            const ext = path.extname(fileName).toLowerCase();

            // Comprehensive MIME type detection
            const imageMimes = {
                '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
                '.webp': 'image/webp', '.avif': 'image/avif', '.bmp': 'image/bmp', '.ico': 'image/x-icon',
                '.tiff': 'image/tiff', '.tif': 'image/tiff', '.svg': 'image/svg+xml',
                '.heic': 'image/heic', '.heif': 'image/heif',
                '.raw': 'image/x-raw', '.cr2': 'image/x-canon-cr2', '.cr3': 'image/x-canon-cr3',
                '.nef': 'image/x-nikon-nef', '.arw': 'image/x-sony-arw', '.dng': 'image/x-adobe-dng',
                '.orf': 'image/x-olympus-orf', '.rw2': 'image/x-panasonic-rw2', '.pef': 'image/x-pentax-pef',
                '.psd': 'image/vnd.adobe.photoshop'
            };

            const videoMimes = {
                '.mp4': 'video/mp4', '.mkv': 'video/x-matroska', '.avi': 'video/x-msvideo',
                '.mov': 'video/quicktime', '.wmv': 'video/x-ms-wmv', '.flv': 'video/x-flv',
                '.webm': 'video/webm', '.m4v': 'video/x-m4v', '.mpg': 'video/mpeg', '.mpeg': 'video/mpeg',
                '.3gp': 'video/3gpp', '.ts': 'video/mp2t', '.mts': 'video/mp2t', '.m2ts': 'video/mp2t',
                '.ogv': 'video/ogg', '.vob': 'video/dvd'
            };

            let mimeType = imageMimes[ext] || videoMimes[ext] || 'application/octet-stream';
            let fileType = 'file';
            if (imageMimes[ext]) fileType = 'image';
            else if (videoMimes[ext]) fileType = 'video';

            const insert = db.prepare(`
                INSERT INTO files (user_id, parent_path, name, path, size, type, mime_type, created_at, modified_at)
                VALUES (@userId, @parentPath, @name, @path, @size, 'file', @mimeType, @now, @now)
            `);

            const insertParams = {
                userId: user.id,
                parentPath: virtualParentPath,
                name: path.basename(finalPath),
                path: finalPath,
                size: stats.size,
                mimeType,
                now: Date.now()
            };

            console.log(`[Upload] Saving file: ${insertParams.name}, Size: ${insertParams.size} bytes (${(insertParams.size / 1024 / 1024).toFixed(2)} MB)`);

            const result = insert.run(insertParams);

            // Update session status
            if (sessionId) {
                db.prepare('UPDATE upload_sessions SET status = ?, updated_at = ? WHERE id = ?')
                    .run('completed', Date.now(), sessionId);
            }

            return res.status(200).json({
                status: 'completed',
                fileId: result.lastInsertRowid,
                path: finalPath,
                size: stats.size
            });
        }

        res.json({
            status: 'chunk_received',
            chunkIndex: currentChunk,
            progress: Math.round(((currentChunk + 1) / total) * 100)
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
};

// ===== BATCH UPLOAD (Multiple files at once) =====
export const batchUpload = async (req, res) => {
    try {
        const files = req.files;
        const user = req.user;
        const results = [];

        for (const file of files) {
            const date = new Date();
            const year = date.getFullYear().toString();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');

            const userDir = path.join(STORAGE_ROOT, user.username, year, month);
            await fs.ensureDir(userDir);

            let finalPath = path.join(userDir, file.originalname);
            if (await fs.pathExists(finalPath)) {
                const parsed = path.parse(file.originalname);
                finalPath = path.join(userDir, `${parsed.name}_${Date.now()}${parsed.ext}`);
            }

            await fs.move(file.path, finalPath);
            const stats = await fs.stat(finalPath);

            const result = db.prepare(`
                INSERT INTO files (user_id, parent_path, name, path, size, type, mime_type, created_at, modified_at)
                VALUES (?, ?, ?, ?, ?, 'file', ?, ?, ?)
            `).run(user.id, `/${year}/${month}`, path.basename(finalPath), finalPath, stats.size, file.mimetype, Date.now(), Date.now());

            results.push({ id: result.lastInsertRowid, name: file.originalname, size: stats.size });
        }

        res.json({ status: 'ok', uploaded: results.length, files: results });
    } catch (error) {
        res.status(500).json({ error: 'Batch upload failed' });
    }
};
