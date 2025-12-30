import fs from 'fs-extra';
import path from 'path';
import db from '../services/db.js';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sanitizeVirtualPath, getMimeType, getFileType, validateFileName } from '../utils/fileUtils.js';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_ROOT = path.join(__dirname, '../storage');
const TEMP_DIR = '/tmp/auranas_uploads'; // Use local container temp, not bind mount

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
        console.error('[Upload Init] Error:', e);
        res.status(500).json({ error: 'Failed to initialize upload session', details: e.message });
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
        console.error('[Upload Status] Error:', e);
        res.status(500).json({ error: 'Failed to retrieve upload status', details: e.message });
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

        // Validate filename
        if (!validateFileName(fileName)) {
            return res.status(400).json({
                error: 'Invalid filename',
                details: 'Filename contains illegal characters or is reserved'
            });
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



        // Final chunk - move to permanent storage
        if (currentChunk === total - 1) {
            // FIXED: Use centralized path sanitization
            let targetDir = req.body.path || '/';
            const virtualParentPath = sanitizeVirtualPath(targetDir);

            // Build physical path
            const userBaseDir = path.join(STORAGE_ROOT, user.username);
            const userDir = path.join(userBaseDir, virtualParentPath.slice(1)); // Remove leading /

            // Verify the resolved path is within user's directory (security check)
            const resolvedUserDir = path.resolve(userDir);
            const resolvedBaseDir = path.resolve(userBaseDir);
            if (!resolvedUserDir.startsWith(resolvedBaseDir)) {
                throw new Error('Invalid path: directory traversal detected');
            }

            await fs.ensureDir(userDir);

            let finalPath = path.join(userDir, fileName);

            // Handle duplicates
            if (await fs.pathExists(finalPath)) {
                const parsed = path.parse(fileName);
                finalPath = path.join(userDir, `${parsed.name}_${Date.now()}${parsed.ext}`);
            }

            await fs.move(tempFilePath, finalPath, { overwrite: true });

            const stats = await fs.stat(finalPath);

            // FIXED: Use centralized file type detection
            const mimeType = getMimeType(fileName);
            const detectedFileType = getFileType(fileName);

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
        console.error('[Upload Chunk] Error:', error);
        res.status(500).json({
            error: 'Upload failed',
            details: error.message,
            fileName: req.body?.fileName
        });
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
