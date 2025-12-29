import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, LogOut, Settings, Tag, CheckSquare, X, Search, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FloatingActionGroup({
    onLogout,
    onSettings,
    onTags,
    onSelectionMode,
    onSearch,
    selectionMode = false
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const actions = [
        { id: 'search', icon: Search, label: 'SCAN_DB', onClick: onSearch, color: 'cyan' },
        { id: 'select', icon: CheckSquare, label: 'MULTI_OPS', onClick: onSelectionMode, color: selectionMode ? 'yellow' : 'slate', active: selectionMode },
        { id: 'tags', icon: Tag, label: 'TAG_DATA', onClick: onTags, color: 'yellow' },
        { id: 'settings', icon: Settings, label: 'SYS_CONFIG', onClick: onSettings, color: 'magenta' },
        { id: 'logout', icon: LogOut, label: 'JACK_OUT', onClick: onLogout, color: 'red' },
    ];

    const getColorClasses = (color, active) => {
        if (active) return "border-yellow-400 text-black bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]";
        switch (color) {
            case 'red': return "border-red-500/50 text-red-500 bg-black/80 hover:bg-red-500/10 hover:border-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)]";
            case 'cyan': return "border-cyan-500/50 text-cyan-400 bg-black/80 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.4)]";
            case 'magenta': return "border-fuchsia-500/50 text-fuchsia-400 bg-black/80 hover:bg-fuchsia-500/10 hover:border-fuchsia-400 hover:shadow-[0_0_10px_rgba(232,121,249,0.4)]";
            case 'yellow': default: return "border-yellow-500/50 text-yellow-400 bg-black/80 hover:bg-yellow-500/10 hover:border-yellow-400 hover:shadow-[0_0_10px_rgba(250,204,21,0.4)]";
        }
    };

    return (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex flex-col gap-2 pointer-events-auto"
                    >
                        {actions.map(({ id, icon: Icon, label, onClick, color, active }) => (
                            <motion.button
                                key={id}
                                initial={{ opacity: 0, x: 20, skewX: -10 }}
                                animate={{ opacity: 1, x: 0, skewX: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20, delay: actions.indexOf(actions.find(a => a.id === id)) * 0.05 }}
                                onClick={() => {
                                    onClick?.();
                                    if (id !== 'select') setIsExpanded(false);
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 border backdrop-blur-md transition-all group relative overflow-hidden",
                                    getColorClasses(color, active)
                                )}
                                style={{
                                    clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                                }}
                            >
                                <Icon className={cn("w-4 h-4", active ? "animate-pulse" : "")} />
                                <span className={cn("text-xs font-mono font-bold tracking-widest uppercase", active && "text-black")}>
                                    {label}
                                </span>
                                {/* Decor line */}
                                {!active && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-current opacity-50" />}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB Trigger */}
            <div className="pointer-events-auto relative">
                {/* Ping effect */}
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping opacity-20" />

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "w-14 h-14 flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                        "bg-black/90 backdrop-blur-xl border-2",
                        isExpanded
                            ? "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] rotate-90"
                            : "border-yellow-500/60 shadow-[0_0_10px_rgba(250,204,21,0.2)] hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                    )}
                    style={{
                        clipPath: 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)'
                    }}
                >
                    {isExpanded ? (
                        <X className="w-6 h-6 text-yellow-500" />
                    ) : (
                        <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
                    )}

                    {/* Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/10 to-transparent animate-scan" style={{ animationDuration: '2s' }} />
                </button>
            </div>
        </div>
    );
}
