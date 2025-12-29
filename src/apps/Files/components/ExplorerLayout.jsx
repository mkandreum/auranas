import React from 'react';
import { X } from 'lucide-react';

export default function ExplorerLayout({
    topBar,
    sideBar,
    mainContent,
    statusBar,
    mobileMenuOpen,
    setMobileMenuOpen
}) {
    return (
        <div className="flex h-full flex-col bg-[#050505] text-gray-200 font-mono overflow-hidden relative selection:bg-cyan-500/30">
            {/* Cyberpunk Grid Background Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            </div>

            {/* Header / Top Bar Area */}
            <div className="shrink-0 z-20 bg-[#0f0f0f]/90 border-b border-cyan-900/30 backdrop-blur-md">
                {topBar}
            </div>

            {/* Main Body */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Sidebar (Desktop) */}
                <div className="hidden md:flex w-60 bg-[#0a0a0a50] border-r border-cyan-900/20 flex-col shrink-0 backdrop-blur-sm">
                    {sideBar}
                </div>

                {/* Mobile Sidebar Drawer */}
                {mobileMenuOpen && (
                    <div className="absolute inset-0 z-50 flex md:hidden">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                        <div className="w-[80%] max-w-xs bg-[#0f0f0f] h-full shadow-[0_0_30px_rgba(0,255,255,0.1)] relative flex flex-col pt-safe animate-in slide-in-from-left duration-200 border-r border-cyan-500/30">
                            <div className="p-4 border-b border-cyan-900/30 flex justify-between items-center bg-cyan-950/20">
                                <span className="text-cyan-400 font-bold tracking-widest text-lg">NET_NAV</span>
                                <button onClick={() => setMobileMenuOpen(false)} className="text-red-500 hover:text-red-400"><X /></button>
                            </div>
                            {sideBar}
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 bg-transparent relative flex flex-col min-w-0">
                    {mainContent}
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-7 bg-[#0a0a0a] border-t border-cyan-900/30 shrink-0 z-20">
                {statusBar}
            </div>
        </div>
    );
}
