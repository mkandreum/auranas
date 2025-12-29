import { create } from 'zustand';
import { fetchFiles, fetchTimeline } from '../lib/api';

const useFileSystem = create((set, get) => ({
    currentPath: '/',
    files: [],
    loading: false,
    error: null,
    viewMode: 'timeline', // 'grid' | 'list' | 'timeline'

    setPath: (path) => set({ currentPath: path }),
    setViewMode: (mode) => set({ viewMode: mode }),

    loadFiles: async (path) => {
        set({ loading: true, error: null });
        try {
            // If Timeline mode, we fetch timeline regardless of path
            // Or we separate loadTimeline method.
            // Let's use loadFiles logic: if user explicitly sets viewMode to folder, we use folder logic.
            // But default is timeline.

            const mode = get().viewMode;
            let data;

            if (mode === 'timeline') {
                const files = await fetchTimeline();
                set({ files: files.files, loading: false }); // Timeline API returns { files: [..] }
            } else {
                data = await fetchFiles(path || get().currentPath);
                // Sort folders first
                const sorted = data.files.sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'directory' ? -1 : 1;
                });
                set({ files: sorted, currentPath: data.path, loading: false });
            }

        } catch (err) {
            console.error(err);
            set({ error: 'Failed to load files', loading: false });
        }
    },

    navigateUp: () => {
        const current = get().currentPath;
        if (current === '/') return;
        const parent = current.split('/').slice(0, -1).join('/') || '/';
        get().loadFiles(parent);
    }
}));

export default useFileSystem;
