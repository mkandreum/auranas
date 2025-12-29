# AuraNAS - Cyberpunk Edition

A modern, self-hosted NAS (Network Attached Storage) application with a stunning Cyberpunk 2077-inspired interface.

## Features

- 📁 **File Management**: Upload, organize, and manage your files
- 🖼️ **Media Gallery**: Beautiful gallery view for photos and videos
- 🎬 **Video Thumbnails**: Automatic thumbnail generation with FFmpeg
- 👥 **Multi-User**: User management with admin controls
- 🔒 **Secure**: JWT authentication, bcrypt password hashing
- 📊 **Analytics**: Storage usage statistics and activity logs
- 🏷️ **Tags & Albums**: Organize files with tags and albums
- ⭐ **Favorites**: Mark important files
- 🗑️ **Trash**: Soft delete with restore functionality
- 🔗 **Sharing**: Create shareable links for files
- 🔍 **Search**: Fast file search and duplicate detection
- 📱 **Responsive**: Works on desktop, tablet, and mobile

### Production Features

- 🚀 **Optimized Build**: Code splitting and minification
- 📦 **Compression**: Gzip compression for faster responses
- 📊 **Monitoring**: Enhanced health checks with metrics
- 📝 **Logging**: HTTP request logging with Morgan
- 🛡️ **Security**: Helmet security headers, rate limiting
- 🔄 **Graceful Shutdown**: Clean server shutdown handling
- 🐳 **Docker Ready**: Production-optimized Dockerfile with FFmpeg

## Deployment

### Coolify (Recommended)

See [COOLIFY_DEPLOY.md](./COOLIFY_DEPLOY.md) for detailed Coolify deployment instructions.

**Quick Start:**
1. Create new application in Coolify
2. Select this repository
3. Choose Dockerfile build pack
4. Configure environment variables and volumes
5. Deploy!

### Docker Compose (Local Development)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Docker

```bash
# Build the image
docker build -t auranas .

# Run the container
docker run -d \
  -p 5000:5000 \
  -v auranas_storage:/app/storage \
  -v auranas_cache:/app/cache \
  -v auranas_data:/app/data \
  -e JWT_SECRET=your-secret-key \
  -e ADMIN_REGISTRATION_KEY=your-admin-key \
  --name auranas \
  auranas
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `ADMIN_REGISTRATION_KEY` | Yes | Key required to register admin users |
| `PORT` | No | Application port (default: 5000) |
| `NODE_ENV` | No | Environment mode (default: production) |

## Tech Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Framer Motion
- Zustand (state management)

**Backend:**
- Node.js + Express
- SQLite (sql.js)
- FFmpeg (video thumbnails)
- Sharp (image processing)
- JWT authentication

## Development

## Development

```bash
# Install dependencies (Unified for client and server)
npm install

# Run development servers (Run in separate terminals)

# 1. Start Backend (Port 5000)
npm start

# 2. Start Frontend (Port 3000/5173 with proxy)
npm run dev

# Build for Production
npm run build
```

## License

ISC

## Version

2.0.0 - Cyberpunk Edition
