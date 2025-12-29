import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const useOS = create((set, get) => ({
    windows: [],
    activeWindowId: null,
    highestZIndex: 100,

    // Desktop Icons - Configurable, defaulting to some key apps
    desktopIcons: [
        { id: 'photos', app: 'photos' },
        { id: 'settings', app: 'settings' },
        { id: 'terminal', app: 'terminal' },
        { id: 'trash', app: 'trash' }
    ],

    // Window Actions
    openWindow: (appId, config = {}) => {
        const { windows, highestZIndex } = get();

        // Check if single instance app is already open (optional, but good practice)
        // For now we allow multiples unless specified, but we need the config passed in.

        const id = uuidv4();
        const newZ = highestZIndex + 1;

        const newWindow = {
            id,
            app: appId,
            title: config.title || 'Application',
            icon: config.icon || 'AppWindow',
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            zIndex: newZ,
            position: { x: 50 + (windows.length * 20), y: 50 + (windows.length * 20) },
            size: { width: config.width || 800, height: config.height || 600 },
            params: { ...(config.props || {}), ...(config.params || {}) }
        };

        set({
            windows: [...windows, newWindow],
            activeWindowId: id,
            highestZIndex: newZ
        });
    },

    closeWindow: (id) => {
        set((state) => ({
            windows: state.windows.filter(w => w.id !== id),
            activeWindowId: state.windows.length > 1 ? state.windows[state.windows.length - 2].id : null
        }));
    },

    minimizeWindow: (id) => {
        set((state) => ({
            windows: state.windows.map(w => w.id === id ? { ...w, isMinimized: true } : w),
            activeWindowId: null
        }));
    },

    restoreWindow: (id) => {
        const { highestZIndex } = get();
        set((state) => ({
            windows: state.windows.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: highestZIndex + 1 } : w),
            activeWindowId: id,
            highestZIndex: highestZIndex + 1
        }));
    },

    maximizeWindow: (id) => {
        set((state) => ({
            windows: state.windows.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)
        }));
    },

    focusWindow: (id) => {
        const { highestZIndex, activeWindowId } = get();
        if (activeWindowId === id) return;

        set((state) => ({
            windows: state.windows.map(w => w.id === id ? { ...w, zIndex: highestZIndex + 1 } : w),
            activeWindowId: id,
            highestZIndex: highestZIndex + 1
        }));
    },

    updateWindowPosition: (id, position) => {
        set((state) => ({
            windows: state.windows.map(w => w.id === id ? { ...w, position } : w)
        }));
    },

    updateWindowSize: (id, size) => {
        set((state) => ({
            windows: state.windows.map(w => w.id === id ? { ...w, size } : w)
        }));
    },
}));

export default useOS;
