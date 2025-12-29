import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Home, RefreshCw, ArrowUp, ArrowLeft, ArrowRight, Search } from 'lucide-react';

export default function AddressBar({ currentPath, onNavigate, onRefresh, loading, searchTerm, onSearchChange, historyState, onBack, onForward, onUp }) {
    const parts = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean);
    const searchInputRef = useRef(null);

    return (
        <div className="flex flex-col gap-2 p-2">

            {/* Navigation Row */}
            <div className="flex items-center gap-2">

                {/* Back/Forward Controls */}
                <div className="flex items-center gap-1 text-cyan-400">
                    <button onClick={onBack} disabled={!historyState.canBack}
                        className="p-1.5 hover:bg-cyan-900/30 rounded disabled:opacity-30 transition-colors">
                        <ArrowLeft size={16} />
                    </button>
                    <button onClick={onForward} disabled={!historyState.canForward}
                        className="p-1.5 hover:bg-cyan-900/30 rounded disabled:opacity-30 transition-colors">
                        <ArrowRight size={16} />
                    </button>
                    <button onClick={onUp} disabled={currentPath === '/'}
                        className="p-1.5 hover:bg-cyan-900/30 rounded disabled:opacity-30 transition-colors">
                        <ArrowUp size={16} />
                    </button>
                </div>

                {/* Address Bar Input */}
                <div className="flex-1 h-9 bg-black/40 border border-cyan-900/50 rounded flex items-center px-3 hover:border-cyan-500/50 focus-within:border-cyan-400 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] group relative overflow-hidden">
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 pointer-events-none"></div>

                    <button onClick={() => onNavigate('/')} className="hover:bg-cyan-500/10 p-1 rounded px-2 text-yellow-400 font-bold transition-colors flex items-center gap-2 mr-1">
                        <Home size={14} /> <span className="text-xs tracking-wider">ROOT</span>
                    </button>

                    {parts.map((part, index) => {
                        const fullPath = '/' + parts.slice(0, index + 1).join('/');
                        return (
                            <React.Fragment key={fullPath}>
                                <ChevronRight size={14} className="text-cyan-700/50 mx-0.5" />
                                <button
                                    onClick={() => onNavigate(fullPath)}
                                    className="hover:bg-cyan-500/10 p-1 px-2 rounded text-cyan-100 hover:text-white transition-colors truncate max-w-[150px] text-xs font-medium tracking-wide"
                                >
                                    {part}
                                </button>
                            </React.Fragment>
                        );
                    })}

                    <div className="flex-1"></div>

                    <button onClick={onRefresh} className={`p-1.5 hover:bg-cyan-500/20 rounded text-cyan-500 transition-colors ${loading ? 'animate-spin' : ''}`}>
                        <RefreshCw size={14} />
                    </button>
                </div>

                {/* Search Box */}
                <div className="relative w-48 hidden md:block group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-700 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="SEARCH_FILES..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full h-9 bg-black/40 border border-cyan-900/50 rounded pl-9 pr-3 text-xs text-cyan-100 placeholder:text-cyan-900 focus:border-cyan-400 outline-none transition-all shadow-inner"
                    />
                </div>

            </div>
        </div>
    );
}
