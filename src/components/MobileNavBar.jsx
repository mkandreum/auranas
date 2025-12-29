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
        <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-safe">
            {/* Main Navigation Bar */}
            {/* Main Navigation Bar */}
            <div
                className="w-[95%] max-w-lg mx-auto mb-4 flex items-center justify-center gap-2 px-2 py-2"
                style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(252, 211, 77, 0.3)',
                    borderRadius: '24px',
                    boxShadow: '0 0 20px rgba(252, 211, 77, 0.15), inset 0 0 10px rgba(252, 211, 77, 0.05)'
                }}
            >
                {/* Nav Items - CENTERED */}
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = currentView === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onNavigate(id)}
                            className={cn(
                                "flex flex-col items-center justify-center px-3 py-2 transition-all duration-200 relative",
                                isActive
                                    ? "text-yellow-400"
                                    : "text-slate-500 active:text-yellow-400"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-5 h-5 mb-0.5 transition-all",
                                    isActive && "drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]"
                                )}
                            />
                            <span className="text-[9px] font-mono tracking-wider uppercase">
                                {label}
                            </span>
                            {isActive && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full" />
                            )}
                        </button>
                    );
                })}

                {/* Upload Button */}
                <button
                    onClick={onUploadClick}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ml-2"
                    style={{
                        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                        boxShadow: '0 0 20px rgba(252, 211, 77, 0.4)'
                    }}
                >
                    <Upload className="w-4 h-4" />
                </button>
            </div>

            {/* Mini Logo */}
            <div className="flex items-center gap-1.5 mb-2 opacity-60">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-mono tracking-widest text-yellow-400/80">
                    AURA<span className="text-red-500">NAS</span>
                </span>
            </div>
        </div>
    );
}
