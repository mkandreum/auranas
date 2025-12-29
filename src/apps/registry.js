import React from 'react';
import * as LucideIcons from 'lucide-react';

// Core Apps (Already implemented)
const PhotosApp = React.lazy(() => import('./Photos/PhotosApp'));
const FileExplorerApp = React.lazy(() => import('./Files/FileExplorerApp'));
const SettingsApp = React.lazy(() => import('./Settings/SettingsApp'));
const CalculatorApp = React.lazy(() => import('./Calculator/CalculatorApp'));
const CodeEditorApp = React.lazy(() => import('./Code/CodeEditorApp'));
const VideoPlayerApp = React.lazy(() => import('./Media/VideoPlayerApp'));
const TaskManagerApp = React.lazy(() => import('./System/TaskManagerApp'));
const NotesApp = React.lazy(() => import('./Productivity/NotesApp'));
const TerminalApp = React.lazy(() => import('./Utility/TerminalApp'));
const ResourceMonitorApp = React.lazy(() => import('./Utility/ResourceMonitorApp'));
const WeatherApp = React.lazy(() => import('./Utility/WeatherApp'));

// Placeholder Apps (To be implemented)
// We'll use a generic placeholder for now for the expanded list
const PlaceholderApp = ({ title }) => (
    <div className="flex items-center justify-center h-full bg-[#111] text-gray-400 flex-col font-mono">
        <LucideIcons.Construction size={48} className="mb-4 text-yellow-500 animate-pulse" />
        <h1 className="text-xl text-yellow-500">{title}</h1>
        <p className="text-sm mt-2 opacity-50">UNDER CONSTRUCTION</p>
    </div>
);

export const APP_REGISTRY = {
    // 🔴 SYSTEM
    files: {
        id: 'files',
        title: 'File Station',
        icon: 'Folder',
        category: 'System',
        component: FileExplorerApp,
        width: 1000,
        height: 700
    },
    settings: {
        id: 'settings',
        title: 'Control Panel',
        icon: 'Settings',
        category: 'System',
        component: SettingsApp,
        width: 900,
        height: 600
    },
    taskmanager: {
        id: 'taskmanager',
        title: 'Task Manager',
        icon: 'Activity',
        category: 'System',
        component: TaskManagerApp,
        width: 600,
        height: 500
    },
    trash: {
        id: 'trash',
        title: 'Trash',
        icon: 'Trash2',
        category: 'System',
        component: FileExplorerApp, // Re-use files app with trash param
        width: 800,
        height: 600,
        props: { path: 'trash' }
    },

    // 🟡 MEDIA
    photos: {
        id: 'photos',
        title: 'Aura Photos',
        icon: 'Image',
        category: 'Media',
        component: PhotosApp,
        width: 1100,
        height: 700
    },
    video: {
        id: 'video',
        title: 'Neon Player',
        icon: 'PlayCircle',
        category: 'Media',
        component: VideoPlayerApp,
        width: 800,
        height: 500
    },
    music: {
        id: 'music',
        title: 'Sonic Wave',
        icon: 'Music',
        category: 'Media',
        component: () => <PlaceholderApp title="Sonic Wave" />,
        width: 400,
        height: 600
    },

    // 🟢 PRODUCTIVITY
    notes: {
        id: 'notes',
        title: 'CyberNote',
        icon: 'FileText',
        category: 'Productivity',
        component: NotesApp,
        width: 400,
        height: 500
    },
    code: {
        id: 'code',
        title: 'Code Grid',
        icon: 'Code',
        category: 'Productivity',
        component: CodeEditorApp,
        width: 1000,
        height: 800
    },
    calculator: {
        id: 'calculator',
        title: 'Calc 2077',
        icon: 'Calculator',
        category: 'Productivity',
        component: CalculatorApp,
        width: 300,
        height: 450
    },
    calendar: {
        id: 'calendar',
        title: 'Time Sync',
        icon: 'Calendar',
        category: 'Productivity',
        component: () => <PlaceholderApp title="Time Sync" />,
        width: 800,
        height: 600
    },

    // 🔵 UTILITIES
    terminal: {
        id: 'terminal',
        title: 'NetRunner',
        icon: 'Terminal',
        category: 'Utility',
        component: TerminalApp,
        width: 700,
        height: 450
    },
    monitor: {
        id: 'monitor',
        title: 'Res. Monitor',
        icon: 'BarChart2',
        category: 'Utility',
        component: ResourceMonitorApp,
        width: 700,
        height: 500
    },
    browser: {
        id: 'browser',
        title: 'Browser',
        icon: 'Globe',
        category: 'Utility',
        component: () => <PlaceholderApp title="Internal Browser" />,
        width: 1000,
        height: 700
    },
    weather: {
        id: 'weather',
        title: 'Weather',
        icon: 'CloudRain',
        category: 'Utility',
        component: WeatherApp,
        width: 400,
        height: 500
    },
    ai: {
        id: 'ai',
        title: 'Construct AI',
        icon: 'Bot',
        category: 'Utility',
        component: () => <PlaceholderApp title="Construct AI" />,
        width: 500,
        height: 700
    }
};

export const getAllApps = () => Object.values(APP_REGISTRY);
export const getApp = (id) => APP_REGISTRY[id];
