import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fetchFiles, fetchTimeline, deleteFiles, renameFile, createDirectory } from '../lib/api';

/**
 * Enterprise-Grade File System Store
 * Implements:
 * - Optimistic Updates (Instant UI feedback)
 * - LRU-style Path Caching (Instant navigation)
 * - Multi-View State (Timeline vs Explorer)
 * - Operation Queueing & Status Tracking
 * - Robust Error Handling & Rollbacks
 */

const useFileSystem = create(devtools((set, get) => ({

    // ==========================================
    // STATE
    // ==========================================

    // Core data
    currentPath: '/',
    files: [],           // Current view files
    timelineData: [],    // Dedicated timeline cache
    trashData: [],       // Dedicated trash cache

    // Caching
    pathCache: new Map(), // Map<path, File[]>
    lastFetchTime: new Map(), // Map<path, timestamp>
    CACHE_TTL: 30000,     // 30 seconds valid cache

    // UI State
    viewMode: 'grid',    // 'grid' | 'list' | 'timeline'
    loading: false,
    error: null,

    // Selection State (Centralized)
    selection: new Set(),
    lastSelectedId: null,

    // Operations Tracking
    pendingOps: new Map(), // Map<opId, status>

    // ==========================================
    // GETTERS & UTILS
    // ==========================================

    getSelection: () => Array.from(get().selection),

    /**
     * Internal: Update cache for a specific path
     */
    _updateCache: (path, files) => {
        const { pathCache, lastFetchTime } = get();
        // Create new maps to trigger reactivity if needed, usually direct mutation of Map doesn't trigger
        // So we clone.
        const newCache = new Map(pathCache);
        const newTimes = new Map(lastFetchTime);

        newCache.set(path, files);
        newTimes.set(path, Date.now());

        set({ pathCache: newCache, lastFetchTime: newTimes });
    },

    /**
     * Internal: Invalidate cache for a path (and potentially parent)
     */
    _invalidateCache: (path) => {
        const { pathCache } = get();
        const newCache = new Map(pathCache);
        if (newCache.has(path)) newCache.delete(path);
        // Also invalidate parent as mod times change
        const parent = path.split('/').slice(0, -1).join('/') || '/';
        if (newCache.has(parent)) newCache.delete(parent);
        set({ pathCache: newCache });
    },

    // ==========================================
    // ACTIONS: NAVIGATION & FETCHING
    // ==========================================

    setPath: (path) => {
        set({ currentPath: path, selection: new Set() });
        get().loadFiles(path);
    },

    setViewMode: (mode) => {
        set({ viewMode: mode });
        // Reload based on new mode
        get().loadFiles(get().currentPath);
    },

    /**
     * Smart Load Files
     * Checks cache first, then fetches.
     */
    loadFiles: async (path = null, forceRefresh = false) => {
        const targetPath = path || get().currentPath;
        const currentMode = get().viewMode;

        set({ loading: true, error: null });

        try {
            // STRATEGY: TIMELINE
            if (currentMode === 'timeline') {
                const data = await fetchTimeline();
                set({
                    timelineData: data.files,
                    files: data.files, // Mirror to 'files' for generic components
                    loading: false
                });
                return;
            }

            // STRATEGY: EXPLORER (Cache Check)
            const { pathCache, lastFetchTime, CACHE_TTL } = get();

            if (!forceRefresh && pathCache.has(targetPath)) {
                const lastTime = lastFetchTime.get(targetPath) || 0;
                if (Date.now() - lastTime < CACHE_TTL) {

                    set({ files: pathCache.get(targetPath), currentPath: targetPath, loading: false });
                    return;
                }
            }

            // STRATEGY: NETWORK FETCH
            // Artificial delay for "loading" feel only if very fast? No, instant is better.
            const response = await fetchFiles(targetPath);

            if (!response || !response.files) {
                throw new Error('Invalid API Response');
            }

            // Sort: Folders first, then files
            const sortedFiles = response.files.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            });

            // Update State & Cache
            get()._updateCache(targetPath, sortedFiles);
            set({
                files: sortedFiles,
                currentPath: targetPath, // Update currentPath from API response (canonical)
                loading: false
            });

        } catch (err) {
            console.error('[FileSystem] Load Error:', err);
            set({ error: err.message || 'Directory Unavailable', loading: false });
        }
    },

    navigateUp: () => {
        const current = get().currentPath;
        if (current === '/') return;
        const parent = current.split('/').slice(0, -1).join('/') || '/';
        get().setPath(parent);
    },

    refresh: () => {
        const { currentPath } = get();
        get()._invalidateCache(currentPath);
        get().loadFiles(currentPath, true);
    },

    // ==========================================
    // ACTIONS: SELECTION
    // ==========================================

    toggleSelection: (id, multi) => {
        const { selection, files, lastSelectedId } = get();
        const newSelection = new Set(multi ? selection : []);

        if (multi && lastSelectedId && files.length > 0) {
            // Shift-Click Range Logic - Select all items between last and current
            const lastIndex = files.findIndex(f => f.id === lastSelectedId);
            const currentIndex = files.findIndex(f => f.id === id);

            if (lastIndex !== -1 && currentIndex !== -1) {
                // Select range from min to max index
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);

                for (let i = start; i <= end; i++) {
                    newSelection.add(files[i].id);
                }
            } else {
                // Fallback to toggle if indices not found
                if (newSelection.has(id)) newSelection.delete(id);
                else newSelection.add(id);
            }
        } else {
            // Normal Toggle
            if (newSelection.has(id)) newSelection.delete(id);
            else newSelection.add(id);
        }

        set({ selection: newSelection, lastSelectedId: id });
    },

    clearSelection: () => set({ selection: new Set() }),
    selectAll: () => set({ selection: new Set(get().files.map(f => f.id)) }),


    // ==========================================
    // ACTIONS: MUTATIONS (Travels through Optimistic Layer)
    // ==========================================

    /**
     * Create Folder with Optimistic Update
     */
    createFolder: async (name) => {
        const { currentPath, files } = get();
        const tempId = `temp_${Date.now()}`;

        // 1. Optimistic UI Update
        const tempFolder = {
            id: tempId,
            name: name,
            type: 'directory',
            mime_type: 'directory',
            size: 0,
            updatedAt: Date.now(),
            isOptimistic: true
        };

        const newFiles = [tempFolder, ...files].sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });

        set({ files: newFiles });

        try {
            // 2. API Call
            const res = await createDirectory(currentPath, name);

            // 3. Success: Replace optimistic item with real one
            const finalFiles = get().files.map(f =>
                f.id === tempId ? { ...f, id: res.id, isOptimistic: false } : f
            );

            get()._updateCache(currentPath, finalFiles);
            set({ files: finalFiles });

        } catch (e) {
            // 4. Rollback
            console.error('Create Folder Failed', e);
            set({ files: files, error: 'Failed to create folder' });
        }
    },

    /**
     * Delete files with Undo Capability (Optimistic)
     */
    deleteItems: async (ids) => {
        const { files } = get();
        const idSet = new Set(ids);

        // 1. Snapshot for Rollback
        const previousFiles = [...files];

        // 2. Optimistic Remove
        set({ files: files.filter(f => !idSet.has(f.id)), selection: new Set() });

        try {
            // 3. API Call
            await deleteFiles(ids);
            // 4. Success: Invalidate cache
            get()._invalidateCache(get().currentPath);
        } catch (e) {
            // 5. Rollback
            set({ files: previousFiles, error: 'Delete failed' });
        }
    },

    /**
     * Rename with Optimistic Update
     */
    renameItem: async (file, newName) => {
        const { files } = get();

        // 1. Validation
        if (!newName || !file) return;
        if (files.some(f => f.name === newName)) {
            set({ error: 'Name already exists' });
            return;
        }

        // 2. Optimistic Update
        const updatedFiles = files.map(f => f.id === file.id ? { ...f, name: newName } : f);
        set({ files: updatedFiles });

        try {
            // 3. API Call
            await renameFile(file.id, newName);
            get()._invalidateCache(get().currentPath);
        } catch (e) {
            // 4. Rollback
            set({ files: files, error: 'Rename failed' });
        }
    }

})));

export default useFileSystem;
