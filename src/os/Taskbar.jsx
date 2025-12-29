import React, { useState, useEffect } from 'react';
import useOS from './useOS';
import StartMenu from './StartMenu';
import * as LucideIcons from 'lucide-react';
import { format } from 'date-fns';

export default function Taskbar() {
    const { windows, activeWindowId, minimizeWindow, restoreWindow, focusWindow } = useOS();
    const [time, setTime] = useState(new Date());
    const [startMenuOpen, setStartMenuOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        const handleClickOutside = () => setStartMenuOpen(false);
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(timer);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleTaskClick = (win) => {
        if (win.isMinimized) {
            restoreWindow(win.id);
        } else if (activeWindowId === win.id) {
            minimizeWindow(win.id);
        } else {
            focusWindow(win.id);
        }
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#0a0a0a]/95 border-t border-yellow-500/20 backdrop-blur-md flex items-center px-2 z-[1000] justify-between">
            {/* Start Button */}
            <div className="flex items-center" onMouseDown={e => e.stopPropagation()}>
                {startMenuOpen && <StartMenu onClose={() => setStartMenuOpen(false)} />}

                <button
                    onClick={() => setStartMenuOpen(!startMenuOpen)}
                    className={`w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 mr-4 group relative start-button ${startMenuOpen ? 'bg-white/10' : ''}`}
                >
                    <LucideIcons.Command size={24} className="text-yellow-500 group-hover:rotate-90 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-yellow-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>


                {/* Open Apps List */}
                <div className="flex items-center gap-1">
                    {windows.map(win => {
                        const Icon = LucideIcons[win.icon] || LucideIcons.AppWindow;
                        const isActive = activeWindowId === win.id && !win.isMinimized;
                        return (
                            <button
                                key={win.id}
                                onClick={() => handleTaskClick(win)}
                                className={`
                                    h-10 px-3 flex items-center gap-2 rounded transition-all relative overflow-hidden group min-w-[140px] max-w-[200px]
                                    ${isActive ? 'bg-white/10 border-b-2 border-yellow-500' : 'hover:bg-white/5 opacity-70 hover:opacity-100'}
                                `}
                            >
                                <Icon size={16} className={`${isActive ? 'text-yellow-500' : 'text-gray-400'}`} />
                                <span className={`text-xs truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                    {win.title}
                                </span>
                                {isActive && <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* System Tray */}
            <div className="flex items-center gap-4 px-2">
                {/* Stats */}
                <div className="hidden md:flex items-center gap-3 text-[10px] text-yellow-500/60 font-mono">
                    <div className="flex flex-col items-end leading-none">
                        <span>CPU 12%</span>
                        <div className="w-12 h-1 bg-gray-800 rounded-full mt-0.5"><div className="w-[12%] h-full bg-yellow-500/50 rounded-full"></div></div>
                    </div>
                    <div className="flex flex-col items-end leading-none">
                        <span>RAM 4.2GB</span>
                        <div className="w-12 h-1 bg-gray-800 rounded-full mt-0.5"><div className="w-[45%] h-full bg-cyan-500/50 rounded-full"></div></div>
                    </div>
                </div>

                <div className="h-6 w-px bg-white/10 mx-2"></div>

                {/* Clock */}
                <div className="flex flex-col items-end text-right mr-2 cursor-default group">
                    <span className="text-sm font-bold text-yellow-100 group-hover:text-yellow-500 transition-colors">
                        {format(time, 'HH:mm')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {format(time, 'MMM dd, yyyy')}
                    </span>
                </div>

                <button className="p-2 hover:bg-white/10 rounded-full relative">
                    <LucideIcons.Bell size={18} className="text-gray-400" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
            </div>
        </div>
    );
}
