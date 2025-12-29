import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'CONFIRMACIÓN',
    message = '¿Estás seguro?',
    confirmText = 'CONFIRMAR',
    cancelText = 'CANCELAR',
    type = 'warning' // 'warning', 'danger', 'info'
}) {
    if (!isOpen) return null;

    const typeColors = {
        warning: { accent: 'yellow', bgGlow: 'rgba(252, 211, 77, 0.1)' },
        danger: { accent: 'red', bgGlow: 'rgba(239, 68, 68, 0.1)' },
        info: { accent: 'cyan', bgGlow: 'rgba(6, 182, 212, 0.1)' }
    };

    const colors = typeColors[type] || typeColors.warning;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-[#0d0d0d] border-2 border-yellow-500/40"
                    style={{
                        clipPath: 'polygon(0 20px, 20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                        boxShadow: `0 0 40px ${colors.bgGlow}, inset 0 0 60px ${colors.bgGlow}`
                    }}
                >
                    {/* Decorative corners */}
                    <div className="absolute top-0 left-5 w-20 h-[2px] bg-gradient-to-r from-yellow-500 to-transparent" />
                    <div className="absolute top-5 left-0 w-[2px] h-20 bg-gradient-to-b from-yellow-500 to-transparent" />
                    <div className="absolute bottom-0 right-5 w-20 h-[2px] bg-gradient-to-l from-yellow-500 to-transparent" />
                    <div className="absolute bottom-5 right-0 w-[2px] h-20 bg-gradient-to-t from-yellow-500 to-transparent" />

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-yellow-500/20">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className={`w-6 h-6 ${type === 'danger' ? 'text-red-500' : 'text-yellow-400'}`}
                                style={{ filter: `drop-shadow(0 0 10px ${type === 'danger' ? 'rgba(239,68,68,0.8)' : 'rgba(252,211,77,0.8)'})` }}
                            />
                            <h3 className={`text-lg font-bold font-mono tracking-wider uppercase ${type === 'danger' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-500 hover:text-yellow-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-yellow-100/80 font-mono text-sm leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 p-4 pt-0">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 font-mono font-bold uppercase tracking-wider text-sm
                                       bg-transparent border-2 border-slate-600 text-slate-400
                                       hover:border-slate-500 hover:text-slate-300 transition-all"
                            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className={`flex-1 py-3 px-4 font-mono font-bold uppercase tracking-wider text-sm
                                       transition-all ${type === 'danger'
                                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400'
                                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500'
                                }`}
                            style={{
                                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                                boxShadow: type === 'danger' ? '0 0 20px rgba(239,68,68,0.4)' : '0 0 20px rgba(252,211,77,0.4)'
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
