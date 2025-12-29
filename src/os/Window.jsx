import React, { Suspense, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X, Minus, Square, Maximize2, Loader2 } from 'lucide-react';
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
        disabled: window.isMaximized || isMobile // Disable drag on mobile
    });

    const style = isMobile ? {
        zIndex: window.zIndex,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100% - 48px)', // Space for Taskbar
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
            className={`flex flex-col overflow-hidden bg-[#0d0d0d]/95 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.7)] transition-all duration-200
                ${isMobile || window.isMaximized ? 'rounded-none border-0' : 'rounded-lg border border-yellow-500/30'}
            `}
            onMouseDown={() => focusWindow(window.id)}
        >
            {/* Header / Titlebar */}
            <div
                {...listeners}
                {...attributes}
                className={`h-10 bg-white/5 border-b border-white/10 flex items-center justify-between px-3 shrink-0 select-none
                    ${!isMobile && !window.isMaximized ? 'cursor-grab active:cursor-grabbing' : ''}
                `}
                onDoubleClick={() => !isMobile && maximizeWindow(window.id)}
            >
                <div className="flex items-center gap-2 text-yellow-500 overflow-hidden">
                    <IconComponent size={18} className="shrink-0" />
                    <span className="text-xs font-bold tracking-wider uppercase truncate max-w-[200px]">{window.title}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); minimizeWindow(window.id); }} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                        <Minus size={16} />
                    </button>
                    {!isMobile && (
                        <button onClick={(e) => { e.stopPropagation(); maximizeWindow(window.id); }} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                            {window.isMaximized ? <Maximize2 size={14} /> : <Square size={14} />}
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded text-gray-400 transition-colors ml-1">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden relative group bg-[#0d0d0d]">
                <div className="w-full h-full relative">
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full text-yellow-500/50">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    }>
                        {AppComponent ? <AppComponent {...window.params} /> : <div className="p-4 text-red-500">App Crash: Component Not Found</div>}
                    </Suspense>

                    {/* Scanline Effect Overlay (Reduced opacity) */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%] opacity-[0.03]"></div>
                </div>
            </div>

            {/* Resizing Handle (only if not maximized and not mobile) */}
            {!window.isMaximized && !isMobile && (
                <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50">
                    <svg viewBox="0 0 10 10" className="w-full h-full text-yellow-500/50">
                        <path d="M10 10 L0 10 L10 0 Z" fill="currentColor" />
                    </svg>
                </div>
            )}
        </div>
    );
}
