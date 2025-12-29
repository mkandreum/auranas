# AuraNAS - Coolify Deployment Guide

This guide explains how to deploy AuraNAS on Coolify using the included Dockerfile.

## Prerequisites
- Coolify instance running
- Git repository with your AuraNAS code

## Deployment Steps

### 1. Create New Application in Coolify

1. Go to your Coolify dashboard
2. Click **+ New Resource** → **Application**
3. Select your Git repository or use **Public Repository**
4. Choose **Dockerfile** as the build pack

### 2. Configure Build Settings

- **Dockerfile Location**: `./Dockerfile` (default)
- **Build Context**: `.` (root directory)
- **Port**: `5000`

### 2a. Alternative: Docker Compose (Recommended)

If you prefer using Docker Compose:

1. In Coolify, go to **Settings** > **Build Pack**
2. Select **Docker Compose**
3. Ensure **Docker Compose Location** is `./docker-compose.yml`
4. **IMPORTANT**: When using Docker Compose in Coolify, **volumes are essential**.
   - Coolify will automatically recognize the volumes defined in `docker-compose.yml` (`auranas_storage`, `auranas_cache`, `auranas_data`).
   - You **must** still ensure they are listed in the Storage tab if they don't appear automatically.

### 3. Environment Variables

Add the following environment variables in Coolify:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-change-this` |
| `ADMIN_REGISTRATION_KEY` | Key required to register admin users | `your-admin-registration-key` |
| `PORT` | Application port (optional, defaults to 5000) | `5000` |
| `NODE_ENV` | Environment mode | `production` |

> [!IMPORTANT]
> **CHANGE THE DEFAULT SECRETS!** Use strong, random values for `JWT_SECRET` and `ADMIN_REGISTRATION_KEY` in production.

### 4. Persistent Storage (Volumes)

Configure the following persistent volumes to preserve your data:

| Container Path | Description | Recommended Size |
|----------------|-------------|------------------|
| `/app/storage` | User uploaded files | 50GB+ |
| `/app/cache` | Thumbnail cache | 5GB |
| `/app/data` | SQLite database | 1GB |

**In Coolify:**
1. Go to **Storage** tab
2. Click **+ Add Volume**
3. Add each volume with the paths above

### 5. Health Check

The Dockerfile includes a built-in health check that pings `/api/health` every 30 seconds. Coolify will automatically use this to monitor your application.

### 6. Deploy

Click **Deploy** and wait for the build to complete. The first build may take 5-10 minutes as it:
- Installs FFmpeg (required for video thumbnails)
- Builds the React frontend
- Installs Node.js dependencies

## Post-Deployment

### First Login

1. Visit your deployed application URL
2. Click **Register** (first user becomes admin)
3. Enter your details and the `ADMIN_REGISTRATION_KEY` you configured
4. Login with your new credentials

### Verify FFmpeg

To verify FFmpeg is working (required for video thumbnails):
1. Upload a video file
2. Check if a thumbnail is generated
3. If not, check the container logs in Coolify

## Troubleshooting

### Container Won't Start
- Check environment variables are set correctly
- Verify volumes are mounted properly
- Check logs in Coolify for specific errors

### Files Not Persisting
- Ensure `/app/storage`, `/app/cache`, and `/app/data` volumes are configured
- Check volume permissions (container runs as `node` user)

### Video Thumbnails Not Working
- FFmpeg should be installed automatically
- Check container logs for FFmpeg errors
- Verify the video format is supported (MP4, MOV, AVI, MKV)

### Database Issues
- Ensure `/app/data` volume is persistent
- Check if `users.db` file exists in the data directory
- Verify write permissions on the data directory

## Security Recommendations

1. **Use HTTPS**: Configure SSL/TLS in Coolify
2. **Strong Secrets**: Use long, random values for `JWT_SECRET` and `ADMIN_REGISTRATION_KEY`
3. **Regular Backups**: Backup the `/app/data` and `/app/storage` volumes regularly
4. **Update Regularly**: Pull latest changes and redeploy to get security updates

## Resource Requirements

**Minimum:**
- CPU: 1 core
- RAM: 512MB
- Storage: 10GB + user data

**Recommended:**
- CPU: 2 cores
- RAM: 1GB
- Storage: 50GB+ for user files

## Support

For issues specific to AuraNAS, check the application logs in Coolify.
For Coolify-specific issues, refer to the [Coolify documentation](https://coolify.io/docs).
