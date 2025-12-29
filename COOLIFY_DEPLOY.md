# AuraOS Ultimate Edition - Deployment Guide

This guide is optimized for deploying **AuraOS** (formerly AuraNAS) on **Coolify** using Docker Compose.

## 🚀 Optimization Highlights
The "Ultimate Edition" introduces a massive Web Desktop architecture. To ensure it runs smoothly on your Coolify instance (even on smaller VPS), we have implemented:

1.  **Lazy Loading (Code Splitting)**: Apps like "Video Player", "Terminal", and "Resource Monitor" are **only loaded when opened**. This keeps the initial load time blazing fast (< 1s).
2.  **Multi-Stage Docker Build**: The final image contains *only* production assets. Node development tools are discarded, reducing image size by ~400MB.
3.  **Vendor Chunking**: Heavy libraries (React, Recharts, Lucide) are split into separate cached files.

---

## 🛠️ Deployment Steps (Coolify)

### 1. Select Build Pack
*   **Method**: Docker Compose
*   **File**: `docker-compose.yml` (Coolify usually auto-detects this)

### 2. Environment Variables
Ensure these are set in Coolify:
*   `NODE_ENV=production`
*   `JWT_SECRET` (Generate a secure random string)
*   `ADMIN_REGISTRATION_KEY` (For creating the first admin user)

### 3. Persistent Storage (Volumes)
**CRITICAL**: You must map these volumes in Coolify to prevent data loss.
*   `auranas_storage` -> `/app/storage` (User files)
*   `auranas_cache` -> `/app/cache` (Thumbnails)
*   `auranas_data` -> `/app/data` (Database)

### 4. Build Resources (Optional Optimization)
If your build fails due to memory (OOM), try one of these:
*   **Increase Swap**: Ensure your VPS has at least 1GB swap.
*   **Coolify Build Memory**: In Coolify settings for this resource, increase "Build Memory Limit" if possible.
*   *Note*: The runtime memory usage is very low (~150MB RAM idle) due to the optimized architecture.

---

## 🛑 Troubleshooting

### "Build Failed: Heatheap out of memory"
This happens if `vite build` runs out of RAM during the optimization step.
**Fix**: Add `NODE_OPTIONS=--max-old-space-size=4096` to your Build Environment Variables.

### "App Crash / Reboot Loop"
Check the logs. If you see `SqliteError: attempt to write a readonly database`:
**Fix**: Your volumes are not writable. Run "Cleanup" in Coolify and redeploy, or check file permissions on the host.
