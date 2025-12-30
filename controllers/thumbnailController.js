import path from 'path';
import fs from 'fs-extra';
import sharp from 'sharp';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import util from 'util';
import { getFileType, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../utils/fileUtils.js';

// Promisify exec for cleaner async/await usage
const execAsync = util.promisify(exec);

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const STORAGE_ROOT = path.join(__dirname, '../storage');
const CACHE_DIR = path.join(__dirname, '../cache');

// Ensure cache directory exists
fs.ensureDirSync(CACHE_DIR);

/**
 * Enterprise-Grade Thumbnail Service
 * Handles queuing, caching, format conversion, and video extraction.
 */
class ThumbnailService {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 4; // Prevent CPU saturation
        this.activeWorkers = 0;
    }

    /**
     * core processing loop
     */
    async processQueue() {
        if (this.queue.length === 0 || this.activeWorkers >= this.maxConcurrent) return;

        this.activeWorkers++;
        const job = this.queue.shift();

        try {
            await job.execute();
        } catch (error) {
            console.error('[ThumbnailService] Job failed:', error);
        } finally {
            this.activeWorkers--;
            this.processQueue();
        }
    }

    /**
     * Helper to add jobs to the queue
     */
    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                execute: async () => {
                    try {
                        const result = await task();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
            this.processQueue();
        });
    }

    /**
     * Generate a deterministic cache key based on file path and specific request parameters
     * Uses file mtime to ensure cache invalidation on file update.
     */
    async getCacheKey(filePath, options) {
        try {
            const stats = await fs.stat(filePath);
            const data = `${filePath}:${stats.mtimeMs}:${options.width}x${options.height}:${options.format}:${options.fit}`;
            return crypto.createHash('md5').update(data).digest('hex');
        } catch (e) {
            // Fallback if fs.stat fails (file might not exist, handled later)
            return crypto.createHash('md5').update(filePath + Date.now()).digest('hex');
        }
    }

    /**
     * Primary entry point for generating a thumbnail
     */
    async generate(filePath, options = {}) {
        return this.enqueue(async () => {
            const width = parseInt(options.width) || 400;
            const height = parseInt(options.height) || 400;
            const format = options.format || 'jpeg'; // jpeg, png, webp
            const quality = parseInt(options.quality) || 80;
            const fit = options.fit || 'cover'; // cover, contain, fill, inside, outside

            // 1. Validate File Existence
            if (!await fs.pathExists(filePath)) {
                throw new Error('FILE_NOT_FOUND');
            }

            // 2. Check Cache
            const cacheKey = await this.getCacheKey(filePath, { width, height, format, fit });
            const cacheFile = path.join(CACHE_DIR, `${cacheKey}.${format}`);

            if (await fs.pathExists(cacheFile)) {
                // Determine if we need to touch the file to update access time (LRU logic could go here)
                return cacheFile; // HIT
            }

            // 3. Determine Format Strategy using centralized utility
            const fileType = getFileType(filePath);

            if (fileType === 'video') {
                await this.processVideo(filePath, cacheFile, width, height);
            } else if (fileType === 'image') {
                await this.processImage(filePath, cacheFile, width, height, { fit, quality, format });
            } else {
                throw new Error('UNSUPPORTED_FILE_TYPE');
            }

            return cacheFile;
        });
    }

    /**
     * Process Image using Sharp
     */
    async processImage(inputPath, outputPath, width, height, options) {
        const pipeline = sharp(inputPath, { failOnError: false });

        // Auto-rotate based on EXIF
        pipeline.rotate();

        // Resize strategy
        pipeline.resize(width, height, {
            fit: options.fit,
            withoutEnlargement: true,
            position: 'entropy' // Smart crop focusing on "interesting" areas
        });

        // Format conversion
        if (options.format === 'webp') {
            pipeline.webp({ quality: options.quality, effort: 4 });
        } else if (options.format === 'png') {
            pipeline.png({ quality: options.quality, compressionLevel: 8 });
        } else {
            pipeline.jpeg({ quality: options.quality, mozjpeg: true });
        }

        await pipeline.toFile(outputPath);
    }

    /**
     * Process Video using FFmpeg
     * Extracts a frame at 10% of duration or 1st second
     */
    async processVideo(inputPath, outputPath, width, height) {
        // Simple extraction at 00:00:01
        // In a real enterprise env, we'd probe duration first to find the middle, but 1s is usually safe
        const command = `ffmpeg -i "${inputPath}" -ss 00:00:01 -vframes 1 -vf "scale=${width}:-1" -q:v 2 "${outputPath}"`;

        try {
            await execAsync(command);
        } catch (error) {
            console.error('FFmpeg extraction failed, generating placeholder');
            // Generate a simple gray placeholder with "VIDEO" text overlay
            const svgBuffer = Buffer.from(`
                <svg width="${width}" height="${height}">
                    <rect width="100%" height="100%" fill="#282828"/>
                    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" 
                          text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-weight="bold">
                        VIDEO
                    </text>
                </svg>
            `);

            await sharp(svgBuffer)
                .resize(width, height)
                .jpeg({ quality: 80 })
                .toFile(outputPath);
        }
    }
}

// Singleton Instance
const service = new ThumbnailService();

// ==========================================
// CONTROLLER HANDLER
// ==========================================

export const getThumbnail = async (req, res) => {
    const startTime = Date.now();
    try {
        const { path: encodedFilePath, w, h, q, fmt } = req.query;
        const user = req.user;

        // 1. Validation
        if (!user) return res.status(401).send('Unauthorized');
        if (!encodedFilePath) return res.status(400).send('Missing path parameter');

        const filePath = decodeURIComponent(encodedFilePath);

        // 2. Security Check (Directory Traversal Prevention)
        // FIXED: Properly enforce security check
        const expectedPrefix = path.join(STORAGE_ROOT, user.username);
        const normalizedPath = path.normalize(filePath);
        const resolvedPath = path.resolve(normalizedPath);

        // Strict user isolation - only allow access to user's own files
        // Admin users could be handled with additional logic here
        if (!resolvedPath.startsWith(expectedPrefix)) {
            // Check if user is admin and accessing shared storage
            const isAdmin = user.role === 'admin';
            const isInStorage = resolvedPath.startsWith(STORAGE_ROOT);

            if (!isAdmin || !isInStorage) {
                return res.status(403).send('Access Denied');
            }
        }

        if (!await fs.pathExists(filePath)) {
            return res.status(404).send('File not found on disk');
        }

        // 3. Generate
        const thumbnailPath = await service.generate(filePath, {
            width: w || 400,
            height: h || 400,
            quality: q || 80,
            format: fmt || 'jpeg',
            fit: 'cover'
        });

        // 4. Serve
        const duration = Date.now() - startTime;
        res.setHeader('X-Processing-Time-Ms', duration);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Aggressive browser caching

        return res.sendFile(thumbnailPath);

    } catch (error) {
        console.error('[ThumbnailController] Fatal Error:', error);

        // Return a generic error image (1x1 pixel) or status
        if (error.message === 'FILE_NOT_FOUND') return res.status(404).send('File missing');
        if (error.message === 'UNSUPPORTED_FILE_TYPE') return res.status(400).send('Unsupported file type');

        return res.status(500).send('Internal Processing Error');
    }
};

// Export for use in other modules
export { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS };
