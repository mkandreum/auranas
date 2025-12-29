import React from 'react';
import { Camera, BookOpen, Star, Trash2, Upload, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export default function MobileNavBar({ onNavigate, currentView, onUploadClick }) {
    const navItems = [
        { id: 'timeline', label: 'FOTOS', icon: Camera },
        { id: 'albums', label: 'ÁLBUMS', icon: BookOpen },
        { id: 'favorites', label: 'FAVS', icon: Star },
        { id: 'trash', label: 'TRASH', icon: Trash2 },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pb-safe pointer-events-none">
            {/* Gradient fade at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent h-32 bottom-0 z-0 pointer-events-none" />

            {/* Main Navigation Bar */}
            <div
                className="w-[95%] max-w-lg mx-auto mb-3 flex items-center justify-between px-1 py-1 relative z-10 pointer-events-auto"
                style={{
                    background: 'rgba(5, 5, 5, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(250, 204, 21, 0.2)',
                    clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                    boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(250, 204, 21, 0.05)'
                }}
            >
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-500/50" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-500/50" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-500/50" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-500/50" />

                {/* Nav Items */}
                <div className="flex-1 flex justify-between px-2">
                    {navItems.map(({ id, label, icon: Icon }) => {
                        const isActive = currentView === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onNavigate(id)}
                                className={cn(
                                    "flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 relative group min-w-[60px]",
                                    isActive
                                        ? "text-yellow-400"
                                        : "text-slate-500 hover:text-yellow-200"
                                )}
                            >
                                <div className="relative">
                                    <Icon
                                        className={cn(
                                            "w-5 h-5 mb-1 transition-all duration-300",
                                            isActive && "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-110"
                                        )}
                                    />
                                    {isActive && (
                                        <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-40 animate-pulse" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-mono tracking-widest uppercase transition-all duration-300",
                                    isActive ? "text-yellow-400 font-bold" : "scale-90 opacity-70"
                                )}>
                                    {label}
                                </span>

                                {/* Active Indicator Line */}
                                {isActive && (
                                    <>
                                        <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400/20 rounded-full blur-xl pointer-events-none" />
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Upload Button */}
                <button
                    onClick={onUploadClick}
                    className="ml-2 w-12 h-10 flex items-center justify-center bg-yellow-500 text-black font-bold transition-all active:scale-95 hover:bg-yellow-400 relative overflow-hidden group"
                    style={{
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), 0 100%, 0 0)'
                    }}
                >
                    <Upload className="w-5 h-5 relative z-10 group-hover:-translate-y-1 transition-transform" />
                    {/* Scan effect */}
                    <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
            </div>

            {/* Bottom HUD info */}
            <div className="flex items-center gap-4 opacity-40 mb-1">
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
                    <span className="text-[8px] font-mono tracking-[0.2em] text-yellow-400">
                        ONLINE
                    </span>
                </div>
                <div className="h-[2px] w-12 bg-yellow-500/20" />
                <span className="text-[8px] font-mono text-yellow-500">V2.0.77</span>
            </div>
        </div>
    );
}
