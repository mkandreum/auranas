import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function InputModal({ isOpen, title, defaultValue = '', placeholder = '', onClose, onSubmit }) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(value);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-96 bg-[#0f0f0f] border border-cyan-500/30 rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/30 bg-cyan-950/20">
                    <h3 className="text-cyan-100 font-bold text-sm tracking-wide">{title}</h3>
                    <button onClick={onClose} className="text-cyan-700 hover:text-cyan-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-black/50 border border-cyan-900/50 rounded p-2 text-cyan-50 placeholder-cyan-900/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all font-mono text-sm"
                    />

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded text-xs font-medium text-cyan-700 hover:text-cyan-400 hover:bg-cyan-900/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 rounded text-xs font-bold bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 hover:border-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                        >
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
