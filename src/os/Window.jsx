import React, { Suspense, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X, Minus, Square, Maximize2, Loader2, Slash } from 'lucide-react';
import useOS from './useOS';
import { APP_REGISTRY } from '../apps/registry.jsx';
import * as LucideIcons from 'lucide-react';
import 'react-resizable/css/styles.css';

export default function Window({ window }) {
    const { closeWindow, minimizeWindow, maximizeWindow, focusWindow } = useOS();

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(globalThis.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(globalThis.innerWidth < 768);
        globalThis.addEventListener('resize', handleResize);
        return () => globalThis.removeEventListener('resize', handleResize);
    }, []);

    // Get Component from Registry
    const appConfig = APP_REGISTRY[window.app];
    const AppComponent = appConfig?.component;

    // Dynamic Icon
    const IconComponent = LucideIcons[window.icon] || LucideIcons.AppWindow;

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: window.id,
        data: { type: 'window', id: window.id },
        disabled: window.isMaximized || isMobile
    });

    const style = isMobile ? {
        zIndex: window.zIndex,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100% - 56px)', // Adjusted for slightly taller/styled taskbar
    } : {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: window.zIndex,
        position: 'absolute',
        top: window.isMaximized ? 0 : window.position.y,
        left: window.isMaximized ? 0 : window.position.x,
        width: window.isMaximized ? '100vw' : window.size.width,
        height: window.isMaximized ? '100vh' : window.size.height,
    };

    if (window.isMinimized) return null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex flex-col overflow-hidden bg-[#0a0a0a]/95 backdrop-blur-xl shadow-[0_0_80px_rgba(252,211,77,0.15)] transition-all duration-200
                ${isMobile || window.isMaximized
                    ? 'border-0'
                    : 'clip-tech-border border border-yellow-500/40 neon-box'
                }
            `}
            onMouseDown={() => focusWindow(window.id)}
        >
            {/* Cyberpunk Header / Titlebar */}
            <div
                {...listeners}
                {...attributes}
                className={`h-10 bg-gradient-to-r from-yellow-500/10 via-black to-yellow-500/5 border-b border-yellow-500/20 flex items-center justify-between px-3 shrink-0 select-none relative overflow-hidden
                    ${!isMobile && !window.isMaximized ? 'cursor-grab active:cursor-grabbing' : ''}
                `}
                onDoubleClick={() => !isMobile && maximizeWindow(window.id)}
            >
                {/* Decorative scanning line in header */}
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-yellow-500/50"></div>

                <div className="flex items-center gap-3 overflow-hidden z-10">
                    <div className="p-1 bg-yellow-500/20 rounded shadow-[0_0_10px_rgba(252,211,77,0.4)]">
                        <IconComponent size={16} className="text-yellow-400" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.2em] text-yellow-500 uppercase truncate max-w-[200px] glitch-text" data-text={window.title}>
                        {window.title}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 z-10">
                    {/* Decorative Header Elements */}
                    <div className="hidden md:flex items-center gap-1 mr-4 text-[10px] text-yellow-500/30 font-mono">
                        <span>SYS.ID</span>
                        <span>{window.id.toString().slice(-4)}</span>
                    </div>

                    <button onClick={(e) => { e.stopPropagation(); minimizeWindow(window.id); }} className="w-8 h-6 flex items-center justify-center hover:bg-yellow-500/20 text-yellow-500/70 hover:text-yellow-400 skew-x-[-10deg] border border-transparent hover:border-yellow-500/30 transition-all">
                        <Minus size={14} className="skew-x-[10deg]" />
                    </button>
                    {!isMobile && (
                        <button onClick={(e) => { e.stopPropagation(); maximizeWindow(window.id); }} className="w-8 h-6 flex items-center justify-center hover:bg-yellow-500/20 text-yellow-500/70 hover:text-yellow-400 skew-x-[-10deg] border border-transparent hover:border-yellow-500/30 transition-all">
                            {window.isMaximized ? <Maximize2 size={12} className="skew-x-[10deg]" /> : <Square size={12} className="skew-x-[10deg]" />}
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }} className="w-8 h-6 flex items-center justify-center hover:bg-red-500/20 text-red-500/70 hover:text-red-500 skew-x-[-10deg] border border-transparent hover:border-red-500/30 transition-all ml-1">
                        <X size={16} className="skew-x-[10deg]" />
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div className={`flex-1 overflow-hidden relative group bg-[#050505] 
                ${!isMobile && !window.isMaximized ? 'border-l border-r border-yellow-500/10' : ''}
            `}>
                <div className="w-full h-full relative">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center h-full text-yellow-500 font-mono gap-4">
                            <Loader2 className="animate-spin" size={32} />
                            <div className="text-xs tracking-widest animate-pulse">INIT.SYSTEM...</div>
                        </div>
                    }>
                        {AppComponent ? <AppComponent {...window.params} /> : <div className="p-4 text-red-500 font-mono">ERR: MODULE NOT FOUND</div>}
                    </Suspense>

                    {/* Scanline Effect Overlay - Subtle */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%] opacity-[0.1]"></div>

                    {/* Corner decorative detail */}
                    <div className="absolute bottom-0 right-0 p-1 pointer-events-none opacity-20">
                        <Slash size={40} className="text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Resizing Handle (only if not maximized and not mobile) */}
            {!window.isMaximized && !isMobile && (
                <div className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-0.5">
                    <div className="w-2 h-2 bg-yellow-500/50 clip-path-[polygon(100%_0,0_100%,100%_100%)]"></div>
                </div>
            )}
        </div>
    );
}
