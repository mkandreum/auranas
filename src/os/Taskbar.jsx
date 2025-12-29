import React, { useState } from 'react';
import useOS from './useOS';
import { getApp } from '../apps/registry.jsx';
import * as LucideIcons from 'lucide-react';
import { Calendar, Wifi, Volume2, Battery, ChevronUp } from 'lucide-react';

const Clock = () => {
    const [time, setTime] = React.useState(new Date());
    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col items-end leading-none">
            <span className="text-lg font-bold text-yellow-500 tracking-wider">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-yellow-500/60 uppercase">
                {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '')}
            </span>
        </div>
    );
};

export default function Taskbar() {
    const { windows, openWindow, minimizeWindow, focusWindow } = useOS();
    const [startOpen, setStartOpen] = useState(false);

    // Get unique active apps
    const activeApps = [...new Set(windows.map(w => w.app))].map(appId => {
        const window = windows.find(w => w.app === appId);
        return { appId, windowId: window.id, isMinimized: window.isMinimized, isActive: !window.isMinimized };
    });

    const handleAppClick = (appId) => {
        const appWindows = windows.filter(w => w.app === appId);
        if (appWindows.length === 0) {
            const app = getApp(appId);
            if (app) openWindow(appId, app);
        } else {
            const active = appWindows.find(w => !w.isMinimized);
            if (active) {
                // If active and focused, minimize. If active but not on top, focus.
                // Simple logic: Toggle minimize/focus
                // Ideally we check z-index but let's just toggle
                minimizeWindow(active.id);
            } else {
                // Restore logic needs to become maximizing or un-minimizing
                // Currently 'focusWindow' brings to front, but if minimized we need to unminimize manually in useOS?
                // Assuming focusWindow handles restore or use specific restore function
                // Let's use focusWindow as generic "Activate"
                focusWindow(appWindows[0].id);
            }
        }
    };

    return (
        <>
            {/* Taskbar Container - Floating Dock Style */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto min-w-[300px] max-w-[95vw] h-16 z-50 flex items-end justify-center">

                {/* Main Dock */}
                <div className="
                    h-14 px-4 flex items-center gap-2 
                    bg-white/10 backdrop-blur-2xl 
                    border border-white/20 
                    rounded-2xl
                    shadow-[0_4px_30px_rgba(0,0,0,0.1)]
                    relative
                    transition-all duration-300
                    hover:bg-white/15 hover:border-white/30 hover:scale-[1.01]
                ">
                    {/* Start Button Area (Left) */}
                    <div className="mr-4 flex items-center">
                        <button
                            className="group relative w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-all rounded-xl"
                            onClick={() => setStartOpen(!startOpen)}
                        >
                            <div className="w-5 h-5 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-md shadow-lg group-hover:scale-110 transition-transform"></div>
                            {/* Inner detail */}
                            <div className="absolute w-2 h-2 bg-white/50 rounded-full blur-[1px]"></div>
                        </button>
                    </div>

                    {/* Active Apps Dock */}
                    <div className="flex items-center gap-3">
                        {activeApps.map(({ appId, windowId, isMinimized, isActive }) => {
                            const app = getApp(appId);
                            if (!app) return null;
                            const Icon = LucideIcons[app.icon] || LucideIcons.AppWindow;

                            return (
                                <button
                                    key={appId}
                                    onClick={() => focusWindow(windowId)}
                                    className={`
                                        group relative w-10 h-10 flex items-center justify-center 
                                        transition-all duration-300 rounded-xl
                                        ${isActive ? 'bg-white/20 scale-105 shadow-inner' : 'hover:bg-white/10 hover:scale-110'}
                                    `}
                                >
                                    <div className={`p-1.5 transition-colors text-white drop-shadow-md`}>
                                        <Icon size={22} className={isActive ? 'text-white' : 'text-gray-200'} />
                                    </div>

                                    {/* Active Indicator Dot */}
                                    {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"></div>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Separator */}
                    <div className="w-px h-6 bg-white/20 mx-2"></div>

                    {/* System Tray (Right) */}
                    <div className="flex items-center gap-4 pl-1 text-white/90">
                        <div className="flex items-center gap-3">
                            <Wifi size={16} className="drop-shadow-md" />
                            <Volume2 size={16} className="drop-shadow-md" />
                            <Battery size={16} className="drop-shadow-md" />
                        </div>
                        <Clock />
                    </div>
                </div>
            </div>

            {/* Start Menu Overlay (Placeholder if needed someday) */}
            {startOpen && (
                <div className="absolute bottom-20 left-4 w-64 h-80 bg-black/90 border border-yellow-500/30 clip-tech-border backdrop-blur-xl p-4 z-50 flex flex-col items-center justify-center text-yellow-500 font-mono">
                    <div className="text-xl font-bold mb-4 glitch-text" data-text="AURA.OS">AURA.OS</div>
                    <div className="text-xs text-yellow-500/50">SYSTEM MENU UNDER CONSTRUCTION</div>
                </div>
            )}
        </>
    );
}
