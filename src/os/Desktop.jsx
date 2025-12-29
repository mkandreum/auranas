import React, { useState, useEffect } from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import useOS from './useOS';
import Window from './Window';
import Taskbar from './Taskbar';
import * as LucideIcons from 'lucide-react';
import { getApp } from '../apps/registry.jsx';
import { ClockWidget, SystemWidget } from './DesktopWidgets';

const Wallpaper = () => (
    <div className="absolute inset-0 overflow-hidden z-0">
        <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2564"
            className="w-full h-full object-cover scale-105 pointer-events-none select-none"
            alt="Wallpaper"
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
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
        <div className="h-screen w-screen overflow-hidden bg-black text-white relative font-sans select-none">
            {/* Wallpaper & Effects */}
            <Wallpaper />

            {/* Desktop Widgets Layer */}
            {!isMobile && (
                <div className="absolute top-8 right-8 flex flex-col items-end gap-6 z-0 pointer-events-none hidden md:flex drop-shadow-lg">
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
                    // Dynamic Colors for icons based on category (placeholder logic)
                    const iconColor = app.category === 'Media' ? 'text-pink-400' :
                        app.category === 'Productivity' ? 'text-blue-400' :
                            app.category === 'System' ? 'text-cyan-400' : 'text-emerald-400';

                    return (
                        <div
                            key={iconConfig.id}
                            className={`group flex flex-col items-center justify-center transition-all duration-200 relative
                                ${isMobile
                                    ? 'active:scale-95'
                                    : 'hover:scale-105 cursor-pointer p-2 rounded-xl hover:bg-white/10 hover:backdrop-blur-md border border-transparent hover:border-white/20'
                                }
                            `}
                            onClick={isMobile ? () => openWindow(iconConfig.app, app) : undefined}
                            onDoubleClick={!isMobile ? () => openWindow(iconConfig.app, app) : undefined}
                        >
                            <div className={`flex items-center justify-center mb-2 relative z-10 ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} drop-shadow-2xl`}>
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-full"></div>
                                <Icon strokeWidth={1.5} size={isMobile ? 32 : 48} className={`${isMobile ? 'text-white' : 'text-white'} transition-colors filter drop-shadow-lg`} />
                            </div>

                            <span className={`text-center font-medium tracking-wide leading-tight z-10 
                                ${isMobile
                                    ? 'text-[11px] text-white truncate w-full px-1 drop-shadow-md'
                                    : 'text-[13px] text-white drop-shadow-md px-2 py-0.5 rounded-md'
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
