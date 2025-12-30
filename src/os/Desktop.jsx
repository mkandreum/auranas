import React, { useState, useEffect } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import useOS from './useOS';
import Window from './Window';
import Taskbar from './Taskbar';
import * as LucideIcons from 'lucide-react';
import { getApp } from '../apps/registry.jsx';
import { ClockWidget, SystemWidget } from './DesktopWidgets';

const CyberHUD = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Top Right Detail */}
        <div className="absolute top-2 right-2 flex flex-col items-end opacity-40">
            <div className="flex gap-1 mb-1">
                <div className="w-16 h-1 bg-yellow-500"></div>
                <div className="w-4 h-1 bg-red-500"></div>
            </div>
            <div className="font-mono text-[10px] text-yellow-500 tracking-[0.2em]">SYSTEM SECURE</div>
        </div>

        {/* Center decorative ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vh] h-[60vh] rounded-full border border-yellow-500/5 rotate-45 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[58vh] h-[58vh] rounded-full border border-dashed border-yellow-500/5 -rotate-12 pointer-events-none animate-spin" style={{ animationDuration: '60s' }}></div>
    </div>
);

const GridBackground = ({ isMobile }) => (
    <div className="absolute inset-0 bg-[#020202] overflow-hidden">
        {/* Cyberpunk Grid - Intense */}
        <div className="absolute inset-0 cyber-grid-intense opacity-40 transform perspective-[1000px] rotate-x-12 scale-110"></div>

        {/* Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-yellow-500/10"></div>
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,transparent_0%,#000_60%)] opacity-60"></div>

        {/* Scanlines Overlay - Light */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[0] bg-[length:100%_2px,3px_100%] opacity-20 pointer-events-none"></div>

        {/* HUD Elements */}
        {!isMobile && <CyberHUD />}
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
                    <div className="pointer-events-auto scale-90 origin-top-right">
                        <SystemWidget />
                    </div>
                </div>
            )}

            {/* Mobile Clock */}
            {isMobile && (
                <div className="absolute top-12 left-0 right-0 flex justify-center z-0 pointer-events-none">
                    <div className="scale-90 origin-top opacity-80"><ClockWidget /></div>
                </div>
            )}

            {/* Desktop Icons Area */}
            <div className={`absolute inset-0 px-6 grid content-start items-start z-0 overflow-y-auto overflow-x-hidden
                ${isMobile
                    ? 'grid-cols-3 gap-y-6 pt-48 pb-24'
                    : 'grid-cols-[repeat(auto-fill,108px)] grid-rows-[repeat(auto-fill,120px)] gap-4 p-8'
                }
            `}>
                {desktopIcons.map(iconConfig => {
                    const app = getApp(iconConfig.app);
                    if (!app) return null;

                    const Icon = LucideIcons[app.icon] || LucideIcons.File;
                    return (
                        <div
                            key={iconConfig.id}
                            className={`group flex flex-col items-center justify-center transition-all duration-200 relative
                                ${isMobile
                                    ? 'active:scale-95'
                                    : 'hover:scale-105 cursor-pointer p-2'
                                }
                            `}
                            onClick={isMobile ? () => openWindow(iconConfig.app, app) : undefined}
                            onDoubleClick={!isMobile ? () => openWindow(iconConfig.app, app) : undefined}
                        >
                            {/* Hover effect background */}
                            <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/10 clip-tech-border transition-all duration-300"></div>

                            <div className={`flex items-center justify-center mb-3 relative z-10 ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}`}>
                                {/* Icon Glow */}
                                <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/20 blur-xl transition-all duration-500 rounded-full"></div>
                                <Icon strokeWidth={1.5} size={isMobile ? 32 : 40} className={`${isMobile ? 'text-yellow-500' : 'text-gray-400 group-hover:text-yellow-400'} transition-colors drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                            </div>

                            <span className={`text-center font-bold tracking-wider leading-tight z-10 uppercase
                                ${isMobile
                                    ? 'text-[10px] text-gray-300 truncate w-full px-1'
                                    : 'text-[11px] text-gray-400 group-hover:text-yellow-500 group-hover:text-shadow-neon transition-colors bg-black/80 px-2 py-0.5 rounded-sm border border-transparent group-hover:border-yellow-500/30'
                                }
                            `}>
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
