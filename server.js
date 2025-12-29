import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Services
import { initDb } from './services/db.js';

// Controllers
import * as uploadController from './controllers/uploadController.js';
import * as fileController from './controllers/fileController.js';
import * as thumbnailController from './controllers/thumbnailController.js';
import * as authController from './controllers/authController.js';
import * as userController from './controllers/userController.js';
import * as shareController from './controllers/shareController.js';

// Validations
import { validateRequest } from './middleware/validationMiddleware.js';
import { registerSchema, loginSchema } from './validations/authValidation.js';

// Middleware
import { authMiddleware } from './middleware/auth.js';
import errorHandler from './middleware/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Compression middleware (gzip)
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined')); // Apache-style logging
} else {
    app.use(morgan('dev')); // Colored dev logging
}

// Rate limiting - generous for bulk uploads
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000, // Increased for bulk uploads
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

const upload = multer({ dest: 'storage/.temp_upload_cache/' });

// Directories
const STORAGE_DIR = path.join(__dirname, 'storage');
const CACHE_DIR = path.join(__dirname, 'cache');
const DATA_DIR = path.join(__dirname, 'data');
[STORAGE_DIR, CACHE_DIR, DATA_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Enhanced Health Check
const startTime = Date.now();
app.get('/api/health', (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const memUsage = process.memoryUsage();

    // Check storage directories
    const storageOk = fs.existsSync(STORAGE_DIR) && fs.existsSync(CACHE_DIR) && fs.existsSync(DATA_DIR);

    res.json({
        status: 'ok',
        version: '2.0.0',
        uptime: `${uptime}s`,
        memory: {
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
        },
        storage: storageOk ? 'accessible' : 'error'
    });
});

// ===== AUTH =====
app.post('/api/auth/register', validateRequest(registerSchema), authController.register);
app.post('/api/auth/login', validateRequest(loginSchema), authController.login);

// ===== FILES =====
app.get('/api/files', authMiddleware, fileController.listFiles);
app.get('/api/timeline', authMiddleware, fileController.getTimeline);
app.get('/api/stats', authMiddleware, fileController.getStats);
app.get('/api/recent', authMiddleware, fileController.getRecent);
app.get('/api/years', authMiddleware, fileController.getYears);
app.get('/api/years/:year/months', authMiddleware, fileController.getMonths);

// File Actions
app.post('/api/files/delete', authMiddleware, fileController.deleteFiles);
app.post('/api/files/restore', authMiddleware, fileController.restoreFiles);
app.post('/api/files/directory', authMiddleware, fileController.createDirectory); // New Endpoint
app.put('/api/files/:id/rename', authMiddleware, fileController.renameFile);     // New Endpoint
app.post('/api/files/empty-trash', authMiddleware, fileController.emptyTrash);
app.post('/api/files/favorite', authMiddleware, fileController.toggleFavorite);
app.post('/api/files/bulk-favorite', authMiddleware, fileController.bulkFavorite);
app.post('/api/files/bulk-move', authMiddleware, fileController.bulkMove);
app.post('/api/files/bulk-album', authMiddleware, fileController.bulkAddToAlbum);
app.post('/api/files/recalculate-sizes', authMiddleware, fileController.recalculateSizes);

// Sharing
app.post('/api/share', authMiddleware, fileController.createShareLink);
app.get('/api/share', authMiddleware, fileController.getShareLinks);
app.delete('/api/share/:id', authMiddleware, fileController.deleteShareLink);

// Metadata & Download
app.get('/api/files/:id/metadata', authMiddleware, fileController.getMetadata);
app.get('/api/files/:id/download', authMiddleware, fileController.downloadFile);
app.post('/api/files/download-zip', authMiddleware, fileController.downloadZip);

// Search & Discovery
app.get('/api/search', authMiddleware, fileController.search);
app.get('/api/duplicates', authMiddleware, fileController.findDuplicates);

// Tags
app.get('/api/tags', authMiddleware, fileController.getTags);
app.post('/api/tags', authMiddleware, fileController.createTag);
app.post('/api/tags/add', authMiddleware, fileController.tagFiles);
app.post('/api/tags/remove', authMiddleware, fileController.untagFiles);

// ===== UPLOAD =====
app.post('/api/upload', authMiddleware, upload.single('chunk'), uploadController.uploadChunk);
app.post('/api/upload/init', authMiddleware, uploadController.initUpload);
app.get('/api/upload/status/:id', authMiddleware, uploadController.getUploadStatus);

// ===== THUMBNAILS =====
app.get('/api/thumbnail', authMiddleware, thumbnailController.getThumbnail);

// ===== PUBLIC SHARE =====
app.get('/api/public/share/:token', shareController.getSharedContent);
app.get('/api/public/share/:token/download', shareController.downloadSharedFile);
app.get('/api/public/share/:token/thumbnail', shareController.getSharedThumbnail);

// ===== ALBUMS =====
app.get('/api/albums', authMiddleware, fileController.listAlbums);
app.post('/api/albums', authMiddleware, fileController.createAlbum);
app.post('/api/albums/add', authMiddleware, fileController.addToAlbum);
app.post('/api/albums/remove', authMiddleware, fileController.removeFromAlbum);
app.get('/api/albums/:id', authMiddleware, fileController.getAlbumFiles);
app.delete('/api/albums/:id', authMiddleware, fileController.deleteAlbum);

// ===== USER MANAGEMENT =====
app.get('/api/users', authMiddleware, userController.listUsers);
app.post('/api/users', authMiddleware, userController.createUser);
app.put('/api/users', authMiddleware, userController.updateUser);
app.post('/api/users/delete', authMiddleware, userController.deleteUser);
app.get('/api/users/quota', authMiddleware, userController.checkQuota);
app.put('/api/profile', authMiddleware, userController.updateProfile);

// ===== ADMIN =====
app.get('/api/admin/stats', authMiddleware, userController.getSystemStats);
app.get('/api/admin/activity', authMiddleware, userController.getActivityLog);

// Initialize database and Start Server
// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// ... (routes)

// Catch-all to serve the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

async function startServer() {
    try {
        console.log('⏳ Initializing database...');
        await initDb();
        console.log('✅ Database initialized');

        const server = app.listen(PORT, () => {
            console.log(`🚀 AuraNAS Server v2.0 running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            console.log(`\n⚠️  ${signal} received, starting graceful shutdown...`);

            server.close(() => {
                console.log('✅ HTTP server closed');
                console.log('👋 Shutdown complete');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('❌ Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Global Rejection Handler
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

startServer();

