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
                    bg-[#0a0a0a]/90 backdrop-blur-xl 
                    border border-yellow-500/30 
                    clip-tech-border
                    shadow-[0_0_20px_rgba(252,211,77,0.15)]
                    relative
                ">
                    {/* Background Detail */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>

                    {/* Start Button Area (Left) */}
                    <div className="mr-4 flex items-center">
                        <button
                            className="group relative w-10 h-10 flex items-center justify-center hover:bg-yellow-500/10 transition-all clip-path-[polygon(20%_0,100%_0,100%_100%,0%_100%,0%_20%)]"
                            onClick={() => setStartOpen(!startOpen)}
                        >
                            <div className="absolute inset-0 border border-yellow-500/30 group-hover:border-yellow-500/80 transition-colors"></div>
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-sm grid place-items-center group-hover:rotate-45 transition-transform"></div>
                            <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-500"></div>
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
                                    onClick={() => focusWindow(windowId)} // Simplified click
                                    className={`
                                        group relative w-10 h-10 flex items-center justify-center 
                                        transition-all duration-300
                                        ${isActive ? 'scale-110' : 'opacity-70 hover:opacity-100'}
                                    `}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-yellow-500/20 blur-md rounded-full animate-pulse"></div>
                                    )}
                                    <div className={`p-2 rounded bg-black/50 border ${isActive ? 'border-yellow-500 text-yellow-500' : 'border-white/10 text-gray-400 group-hover:text-white group-hover:border-white/30'} clip-tech-border transition-colors`}>
                                        <Icon size={20} />
                                    </div>

                                    {/* Active Indicator */}
                                    {isActive && <div className="absolute -bottom-1 w-8 h-0.5 bg-yellow-500 shadow-[0_0_5px_#eab308]"></div>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Separator */}
                    <div className="w-px h-8 bg-white/10 mx-2"></div>

                    {/* System Tray (Right) */}
                    <div className="flex items-center gap-3 pl-2">
                        <div className="flex items-center gap-2 text-yellow-500/80">
                            <Wifi size={14} />
                            <Volume2 size={14} />
                            <Battery size={14} />
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <Clock />
                    </div>
                </div>

                {/* Decorative Bottom Line */}
                <div className="absolute bottom-[-10px] w-[80%] h-1 bg-yellow-500/20 rounded-full blur-sm"></div>
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
