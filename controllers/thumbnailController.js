import path from 'path';
import fs from 'fs-extra';
import sharp from 'sharp';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_ROOT = path.join(__dirname, '../storage');
const CACHE_DIR = path.join(__dirname, '../cache');

fs.ensureDirSync(CACHE_DIR);

// Generate short hash for cache filename
const getCacheKey = (filePath) => {
    return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 16);
};

// All common image formats
const IMAGE_EXTENSIONS_LIST = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
    '.tiff', '.tif', '.bmp', '.ico',
    '.heic', '.heif',
    '.raw', '.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.pef', '.srw',
    '.svg', '.eps', '.ai', '.psd'
];

// All common video formats
const VIDEO_EXTENSIONS_LIST = [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
    '.m4v', '.mpg', '.mpeg', '.m2ts', '.mts', '.ts',
    '.3gp', '.3g2', '.prores', '.mxf', '.vob', '.ogv', '.divx', '.asf', '.rm', '.rmvb'
];

const getFileTypeFn = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (IMAGE_EXTENSIONS_LIST.includes(ext)) return 'image';
    if (VIDEO_EXTENSIONS_LIST.includes(ext)) return 'video';
    return 'other';
};

export const getThumbnail = async (req, res) => {
    try {
        const { path: encodedFilePath } = req.query;
        const user = req.user;

        if (!user) return res.status(401).send('Unauthorized');
        if (!encodedFilePath) return res.status(400).send('Missing parameter');

        const filePath = decodeURIComponent(encodedFilePath);

        console.log(`[Thumbnail] Request for: ${path.basename(filePath)}`);

        // SECURITY: Strict path validation
        const expectedPrefix = path.join(STORAGE_ROOT, user.username);
        const normalizedPath = path.normalize(filePath);

        if (!normalizedPath.startsWith(expectedPrefix)) {
            console.warn(`[SECURITY] User ${user.username} attempted to access: ${filePath}`);
            return res.status(403).send('Access Denied');
        }

        if (!await fs.pathExists(filePath)) {
            console.error(`[Thumbnail] File not found: ${filePath}`);
            return res.status(404).send('File not found');
        }

        // Generate cache key from path (short hash)
        const cacheKey = getCacheKey(filePath);
        const cachePath = path.join(CACHE_DIR, `${cacheKey}.jpg`);

        // Return cached if exists
        if (await fs.pathExists(cachePath)) {
            console.log(`[Thumbnail] Serving cached: ${path.basename(filePath)}`);
            return res.sendFile(cachePath);
        }

        const fileType = getFileTypeFn(filePath);

        // ===== IMAGE THUMBNAIL =====
        if (fileType === 'image') {
            try {
                console.log(`[Thumbnail] Generating for: ${path.basename(filePath)}`);

                await sharp(filePath, {
                    failOnError: false,
                    limitInputPixels: false // Allow large images
                })
                    .rotate() // Auto-rotate based on EXIF
                    .resize(400, 400, {
                        fit: 'cover',
                        withoutEnlargement: true,
                        fastShrinkOnLoad: true
                    })
                    .jpeg({ quality: 75, progressive: true })
                    .toFile(cachePath);

                console.log(`[Thumbnail] Generated: ${path.basename(filePath)}`);
                return res.sendFile(cachePath);

            } catch (sharpError) {
                console.error(`[Thumbnail] Sharp error for ${path.basename(filePath)}:`, sharpError.message);

                // Fallback: serve original file as-is for web-compatible formats
                const ext = path.extname(filePath).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                    console.log(`[Thumbnail] Serving original as fallback: ${path.basename(filePath)}`);
                    return res.sendFile(filePath);
                }

                // Return a placeholder for unsupported formats
                return res.status(500).send('Cannot generate thumbnail');
            }
        }

        // ===== VIDEO THUMBNAIL =====
        if (fileType === 'video') {
            // For videos, try to serve first frame or return placeholder
            // FFmpeg would be needed for proper video thumbnails
            console.log(`[Thumbnail] Video thumbnail not supported yet: ${path.basename(filePath)}`);
            return res.status(415).send('Video thumbnails not supported');
        }

        // ===== UNSUPPORTED =====
        return res.status(415).send('Unsupported format');

    } catch (error) {
        console.error('[Thumbnail] Error:', error);
        res.status(500).send('Server Error');
    }
};

export const IMAGE_EXTENSIONS = IMAGE_EXTENSIONS_LIST;
export const VIDEO_EXTENSIONS = VIDEO_EXTENSIONS_LIST;
export const getFileType = getFileTypeFn;
