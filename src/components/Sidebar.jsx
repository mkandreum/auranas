import React, { useEffect, useState } from 'react';
import useFileSystem from '../store/useFileSystem';
import useAuth from '../store/useAuth';
import { fetchStats } from '../lib/api';
import { cn } from '../lib/utils';
import {
    Camera, BookOpen, Star, Trash2,
    HardDrive, Zap, Grid3X3
} from 'lucide-react';

export default function Sidebar({ onNavigate, currentView }) {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    // Auto-refresh stats every 30 seconds
    useEffect(() => {
        fetchStats().then(setStats).catch(() => { });
        const interval = setInterval(() => {
            fetchStats().then(setStats).catch(() => { });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const usedDisplay = stats ? formatSize(stats.totalSize) : '0 B';
    const usedPercent = stats?.totalSize ? Math.min(100, (stats.totalSize / (100 * 1024 * 1024 * 1024)) * 100) : 0;

    const navItems = [
        { id: 'timeline', label: 'FOTOS', icon: Camera },
        { id: 'albums', label: 'ÁLBUMS', icon: BookOpen },
        { id: 'favorites', label: 'FAVS', icon: Star },
        { id: 'trash', label: 'TRASH', icon: Trash2 },
    ];

    return (
        <aside className="w-64 bg-[#0d0d0d] border-r border-yellow-500/20 flex flex-col relative overflow-hidden">
            {/* Cyber grid background */}
            <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

            {/* Logo - Cyberpunk 2077 Style */}
            <div className="p-6 relative z-10">
                <h1 className="text-2xl font-bold flex items-center gap-3 tracking-wider">
                    <Zap className="w-8 h-8 text-yellow-400" style={{ filter: 'drop-shadow(0 0 10px rgba(252, 211, 77, 0.8))' }} />
                    <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-red-500 bg-clip-text text-transparent" style={{ textShadow: '0 0 30px rgba(252, 211, 77, 0.5)' }}>
                        AURA<span className="text-red-500">NAS</span>
                    </span>
                </h1>
                <div className="text-[10px] text-yellow-500/50 uppercase tracking-[0.3em] mt-1">
                    NEURAL ARCHIVE SYSTEM
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 relative z-10">
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = currentView === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onNavigate(id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 relative group",
                                "font-mono text-sm tracking-widest uppercase",
                                isActive
                                    ? "text-yellow-400 bg-yellow-500/10 border-l-2 border-yellow-400"
                                    : "text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/5 border-l-2 border-transparent hover:border-yellow-500/50"
                            )}
                            style={isActive ? { boxShadow: 'inset 0 0 30px rgba(252, 211, 77, 0.1)' } : {}}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]")} />
                            <span>{label}</span>
                            {isActive && (
                                <div className="absolute right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Storage */}
            <div className="p-4 m-4 relative z-10 card-cyber">
                <div className="flex items-center gap-2 mb-3 text-xs text-yellow-400/80 uppercase tracking-wider font-mono">
                    <HardDrive className="w-4 h-4" />
                    <span>STORAGE.SYS</span>
                </div>
                <div className="w-full h-2 bg-black overflow-hidden relative" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% 100%, 0 100%, 0 4px)' }}>
                    <div
                        className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-1000"
                        style={{
                            width: `${usedPercent}%`,
                            boxShadow: '0 0 10px rgba(252, 211, 77, 0.8)'
                        }}
                    />
                    {/* Animated scanline */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-mono">
                    <span className="text-yellow-400">{usedDisplay}</span>
                    <span className="text-slate-600">// 100 GB MAX</span>
                </div>
            </div>

            {/* User */}
            <div className="p-4 border-t border-yellow-500/10 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-yellow-500 to-red-600 flex items-center justify-center text-black font-bold text-lg relative" style={{ clipPath: 'polygon(0 4px, 4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)' }}>
                        {user?.username?.[0]?.toUpperCase() || '?'}
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                    </div>
                    <div>
                        <p className="text-sm font-mono text-yellow-400 tracking-wider">{user?.username || 'GUEST'}</p>
                        <p className="text-[10px] text-yellow-500/50 uppercase">{user?.role || 'USER'}.ACCESS</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

