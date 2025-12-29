import React from 'react';
import { HardDrive } from 'lucide-react';

export default function StatusBar({ fileCount, selectedCount, loading }) {
    return (
        <div className="flex items-center justify-between px-4 h-full text-[10px] text-cyan-700/70 font-mono tracking-widest uppercase">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                    <HardDrive size={10} /> {fileCount} ITEMS
                </span>
                {selectedCount > 0 && (
                    <span className="text-cyan-400">
                        {selectedCount} SELECTED
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                {loading ? (
                    <span className="text-yellow-500 animate-pulse">:: PROCESSING ::</span>
                ) : (
                    <span className="opacity-50">READY</span>
                )}
            </div>
        </div>
    );
}
