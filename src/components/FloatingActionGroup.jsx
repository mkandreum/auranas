import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, LogOut, Settings, Tag, CheckSquare, X, Search } from 'lucide-react';
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
        { id: 'search', icon: Search, label: 'Buscar', onClick: onSearch, color: 'yellow' },
        { id: 'select', icon: CheckSquare, label: 'Seleccionar', onClick: onSelectionMode, color: selectionMode ? 'yellow' : 'slate', active: selectionMode },
        { id: 'tags', icon: Tag, label: 'Etiquetas', onClick: onTags, color: 'yellow' },
        { id: 'settings', icon: Settings, label: 'Ajustes', onClick: onSettings, color: 'yellow' },
        { id: 'logout', icon: LogOut, label: 'Salir', onClick: onLogout, color: 'red' },
    ];

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="flex flex-col gap-2 mb-2"
                    >
                        {actions.map(({ id, icon: Icon, label, onClick, color, active }) => (
                            <motion.button
                                key={id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: actions.indexOf(actions.find(a => a.id === id)) * 0.05 }}
                                onClick={() => {
                                    onClick?.();
                                    if (id !== 'select') setIsExpanded(false);
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                                    "bg-[#0d0d0d]/95 backdrop-blur-sm border",
                                    active
                                        ? "border-yellow-500 text-yellow-400 bg-yellow-500/10"
                                        : color === 'red'
                                            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                            : "border-yellow-500/30 text-yellow-400/80 hover:bg-yellow-500/10"
                                )}
                                style={{
                                    clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-xs font-mono uppercase tracking-wider whitespace-nowrap">
                                    {label}
                                </span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-12 h-12 flex items-center justify-center transition-all duration-300",
                    "bg-[#0d0d0d]/95 backdrop-blur-sm border-2",
                    isExpanded
                        ? "border-yellow-400 text-yellow-400 rotate-90"
                        : "border-yellow-500/40 text-yellow-400/80 hover:border-yellow-400"
                )}
                style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                    boxShadow: isExpanded
                        ? '0 0 20px rgba(252, 211, 77, 0.3)'
                        : '0 4px 20px rgba(0,0,0,0.5)'
                }}
            >
                {isExpanded ? (
                    <X className="w-5 h-5" />
                ) : (
                    <MoreVertical className="w-5 h-5" />
                )}
            </button>
        </div>
    );
}
