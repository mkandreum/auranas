import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { APP_REGISTRY, getApp } from '../apps/registry';

const useOS = create((set, get) => ({
    windows: [],
    activeWindowId: null,
    highestZIndex: 100,

    // Desktop Icons - Configurable, defaulting to some key apps
    desktopIcons: [
        { id: 'photos', app: 'photos' },
        { id: 'files', app: 'files' },
        { id: 'settings', app: 'settings' },
        { id: 'terminal', app: 'terminal' },
        { id: 'trash', app: 'trash' }
    ],

    // Window Actions
    openWindow: (appId, params = {}) => {
        const { windows, highestZIndex } = get();
        const appConfig = getApp(appId);

        if (!appConfig) {
            console.error(`App ${appId} not found in registry`);
            return;
        }

        const id = uuidv4();
        const newZ = highestZIndex + 1;

        const newWindow = {
            id,
            app: appId,
            title: params.title || appConfig.title,
            icon: appConfig.icon,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            zIndex: newZ,
            position: { x: 50 + (windows.length * 20), y: 50 + (windows.length * 20) },
            size: { width: appConfig.width, height: appConfig.height },
            params: { ...appConfig.props, ...params } // Merge registry props with instance params
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
