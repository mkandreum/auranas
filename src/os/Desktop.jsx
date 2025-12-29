import React from 'react';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import useOS from './useOS';
import Window from './Window';
import Taskbar from './Taskbar';
import * as LucideIcons from 'lucide-react';
import { getApp } from '../apps/registry';

export default function Desktop() {
    const { windows, desktopIcons, openWindow, updateWindowPosition } = useOS();

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
            <div className="absolute inset-0 bg-[#050505]">
                {/* Cyberpunk Grid */}
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: `
                             linear-gradient(rgba(234, 179, 8, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(234, 179, 8, 0.1) 1px, transparent 1px)
                         `,
                        backgroundSize: '40px 40px',
                        transform: 'perspective(500px) rotateX(20deg) scale(1.5)',
                        transformOrigin: 'top center',
                        opacity: 0.2
                    }}
                />

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>

                {/* Noise */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            </div>

            {/* Desktop Icons Area */}
            <div className="absolute inset-0 p-4 grid grid-cols-[repeat(auto-fill,100px)] grid-rows-[repeat(auto-fill,120px)] gap-4 content-start items-start z-0">
                {desktopIcons.map(iconConfig => {
                    const app = getApp(iconConfig.app);
                    if (!app) return null;

                    const Icon = LucideIcons[app.icon] || LucideIcons.File;
                    return (
                        <div
                            key={iconConfig.id}
                            className="group flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 cursor-pointer transition-colors"
                            onDoubleClick={() => openWindow(iconConfig.app)}
                        >
                            <div className="w-16 h-16 flex items-center justify-center mb-2 relative">
                                <div className="absolute inset-0 bg-yellow-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                                <Icon size={40} className="text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                            </div>
                            <span className="text-xs text-center text-yellow-100/80 group-hover:text-yellow-500 leading-tight drop-shadow-md">
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
