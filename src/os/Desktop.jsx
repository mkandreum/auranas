import React, { useState, useEffect } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import useOS from './useOS';
import Window from './Window';
import Taskbar from './Taskbar';
import * as LucideIcons from 'lucide-react';
import { getApp } from '../apps/registry.jsx';
import { ClockWidget, SystemWidget } from './DesktopWidgets';

const GridBackground = ({ isMobile }) => (
    <div className="absolute inset-0 bg-[#050505] overflow-hidden">
        {/* Cyberpunk Grid - Simplificar en mobile */}
        <div className="absolute inset-0"
            style={{
                backgroundImage: `
                     linear-gradient(rgba(234, 179, 8, 0.1) 1px, transparent 1px),
                     linear-gradient(90deg, rgba(234, 179, 8, 0.1) 1px, transparent 1px)
                 `,
                backgroundSize: isMobile ? '30px 30px' : '50px 50px',
                transform: isMobile ? 'none' : 'perspective(100vh) rotateX(60deg) translateY(-100px) scale(3)',
                transformOrigin: 'top center',
                opacity: 0.15,
                maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
            }}
        />

        {/* Moving Particles */}
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-yellow-500 rounded-full blur-[2px] animate-ping" style={{ animationDuration: '3s' }}></div>
            {!isMobile && (
                <>
                    <div className="absolute top-[60%] left-[80%] w-1.5 h-1.5 bg-purple-500 rounded-full blur-[1px] animate-ping" style={{ animationDuration: '5s' }}></div>
                    <div className="absolute top-[80%] left-[30%] w-1 h-1 bg-blue-500 rounded-full blur-[1px] animate-ping" style={{ animationDuration: '4s' }}></div>
                </>
            )}
        </div>

        {/* Vignette & Noise */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)]pointer-events-none"></div>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
);

export default function Desktop() {
    const { windows, desktopIcons, openWindow, updateWindowPosition } = useOS();

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(globalThis.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(globalThis.innerWidth < 768);
        globalThis.addEventListener('resize', handleResize);
        return () => globalThis.removeEventListener('resize', handleResize);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const handleDragEnd = (event) => {
        const { active, delta } = event;
        if (active.data.current?.type === 'window') {
            const windowId = active.id;
            const win = windows.find(w => w.id === windowId);
            if (win) {
                updateWindowPosition(windowId, {
                    x: win.position.x + delta.x,
                    y: win.position.y + delta.y
                });
            }
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden bg-black text-white relative font-mono select-none">
            {/* Wallpaper & Effects */}
            <GridBackground isMobile={isMobile} />

            {/* Desktop Widgets Layer */}
            {!isMobile && (
                <div className="absolute top-8 right-8 flex flex-col items-end gap-6 z-0 mix-blend-lighten pointer-events-none hidden md:flex">
                    <ClockWidget />
                    <div className="pointer-events-auto">
                        <SystemWidget />
                    </div>
                </div>
            )}

            {/* Mobile Clock (Center Top if mobile) */}
            {isMobile && (
                <div className="absolute top-8 left-0 right-0 flex justify-center z-0 opacity-50 pointer-events-none">
                    <ClockWidget />
                </div>
            )}

            {/* Desktop Icons Area */}
            <div className={`absolute inset-0 p-6 grid content-start items-start z-0 overflow-auto
                ${isMobile
                    ? 'grid-cols-4 gap-4 pb-24' // Mobile: 4 cols tight, padding bottom for taskbar
                    : 'grid-cols-[repeat(auto-fill,100px)] grid-rows-[repeat(auto-fill,110px)] gap-6' // Desktop
                }
            `}>
                {desktopIcons.map(iconConfig => {
                    const app = getApp(iconConfig.app);
                    if (!app) return null;

                    const Icon = LucideIcons[app.icon] || LucideIcons.File;
                    return (
                        <div
                            key={iconConfig.id}
                            className={`group flex flex-col items-center justify-center rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200 border border-transparent hover:border-white/10
                                ${isMobile ? 'p-2 active:scale-95' : 'p-3 hover:scale-105'}
                            `}
                            onClick={isMobile ? () => openWindow(iconConfig.app, app) : undefined}
                            onDoubleClick={!isMobile ? () => openWindow(iconConfig.app, app) : undefined}
                        >
                            <div className={`flex items-center justify-center mb-2 relative ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}`}>
                                <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/20 blur-xl transition-all duration-500 rounded-full"></div>
                                <Icon size={isMobile ? 32 : 36} className="text-gray-300 group-hover:text-yellow-400 transition-colors drop-shadow-lg" />
                            </div>
                            <span className="text-[11px] text-center text-gray-300 group-hover:text-white font-medium tracking-wide leading-tight drop-shadow-md bg-black/50 px-2 py-0.5 rounded truncate w-full">
                                {app.title}
                            </span>
                        </div>
                    )
                })}
            </div>

            {/* Window Manager Layer */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="absolute inset-0 pointer-events-none z-10">
                    {windows.map(win => (
                        <div key={win.id} className="pointer-events-auto contents">
                            <Window window={win} />
                        </div>
                    ))}
                </div>
            </DndContext>

            {/* Taskbar */}
            <Taskbar />
        </div>
    );
}
