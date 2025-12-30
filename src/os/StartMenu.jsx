import React, { useState, useMemo } from 'react';
import { getAllApps } from '../apps/registry';
import * as LucideIcons from 'lucide-react';
import { Search, Power, LogOut, User, Settings } from 'lucide-react';
import useOS from './useOS';

export default function StartMenu({ onClose }) {
    const { openWindow } = useOS();
    const [searchTerm, setSearchTerm] = useState('');
    const allApps = getAllApps();

    const filteredApps = useMemo(() => {
        if (!searchTerm) return allApps;
        return allApps.filter(app =>
            app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allApps]);

    const handleAppClick = (app) => {
        openWindow(app.id, app);
        onClose();
    };

    return (
        <div className="absolute bottom-20 left-4 w-[400px] h-[500px] bg-[#0a0a0a]/95 border border-yellow-500/30 clip-tech-border backdrop-blur-xl z-50 flex flex-col text-white shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 duration-200">
            {/* Header / Profile */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gradient-to-tr from-yellow-500 to-red-600 flex items-center justify-center font-bold text-black border border-yellow-500/50">
                        <User size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-yellow-500 text-sm">ADMIN_USER</div>
                        <div className="text-[10px] text-gray-400 tracking-wider">LEVEL 5 ACCESS</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white">
                        <Settings size={18} />
                    </button>
                    <button className="p-2 hover:bg-red-900/50 rounded transition-colors text-gray-400 hover:text-red-400">
                        <Power size={18} />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-3">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search system..."
                        className="w-full bg-black/50 border border-white/10 rounded py-2 pl-9 pr-4 text-sm focus:border-yellow-500/50 focus:outline-none focus:bg-black/80 transition-all placeholder:text-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Apps Grid */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-yellow-900/50 scrollbar-track-transparent">
                <div className="text-[10px] text-gray-500 font-bold mb-2 px-2 uppercase tracking-widest">
                    {searchTerm ? 'Search Results' : 'Applications'}
                </div>

                <div className="grid grid-cols-4 gap-1">
                    {filteredApps.map(app => {
                        const Icon = LucideIcons[app.icon] || LucideIcons.Box;
                        return (
                            <button
                                key={app.id}
                                onClick={() => handleAppClick(app)}
                                className="flex flex-col items-center gap-2 p-3 hover:bg-white/5 rounded transition-all group hover:scale-105"
                            >
                                <div className="w-10 h-10 rounded bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 group-hover:text-yellow-500 group-hover:border-yellow-500/30 group-hover:bg-yellow-500/10 transition-all">
                                    <Icon size={20} />
                                </div>
                                <span className="text-[10px] text-gray-400 text-center truncate w-full group-hover:text-white transition-colors">
                                    {app.title}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {filteredApps.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-600 gap-2">
                        <Search size={24} className="opacity-20" />
                        <span className="text-xs">No results found</span>
                    </div>
                )}
            </div>

            {/* Bottom Status */}
            <div className="p-2 border-t border-white/10 bg-black/20 text-[10px] text-gray-600 flex justify-between px-4 font-mono">
                <span>AURA.OS v2.4</span>
                <span className="text-yellow-500/50">SYSTEM STABLE</span>
            </div>

            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                <div className="absolute top-0 right-0 w-2 h-[1px] bg-yellow-500"></div>
                <div className="absolute top-0 right-0 w-[1px] h-2 bg-yellow-500"></div>
            </div>
        </div>
    );
}
