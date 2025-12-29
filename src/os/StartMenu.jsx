import React, { useState } from 'react';
import useOS from './useOS';
import useAuth from '../store/useAuth';
import { getAllApps } from '../apps/registry.jsx';
import * as LucideIcons from 'lucide-react';
import { Search, LogOut, Power } from 'lucide-react';

export default function StartMenu({ onClose }) {
    const { openWindow } = useOS();
    const { user, logout } = useAuth();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const apps = getAllApps();
    const categories = ['All', 'System', 'Media', 'Productivity', 'Utility'];

    const filteredApps = apps.filter(app => {
        const matchesSearch = app.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="absolute bottom-14 left-2 w-[600px] h-[500px] bg-[#0d0d0d]/95 backdrop-blur-xl border border-yellow-500/20 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] flex overflow-hidden z-[2000] animate-in slide-in-from-bottom-5 fade-in duration-200" onMouseDown={e => e.stopPropagation()}>
            {/* Sidebar / Quick Actions */}
            <div className="w-16 bg-black/40 flex flex-col items-center py-4 gap-4 border-r border-white/10">
                <button className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">
                    {user?.username?.[0]?.toUpperCase()}
                </button>
                <div className="flex-1" />
                <button onClick={logout} className="p-3 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                    <LogOut size={20} />
                </button>
                <button className="p-3 text-gray-400 hover:text-red-500 transition-colors mb-2" title="Shut Down">
                    <Power size={20} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-6">
                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search apps..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                        autoFocus
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* App Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-4 content-start gap-4 pr-2">
                    {filteredApps.map(app => {
                        const Icon = LucideIcons[app.icon] || LucideIcons.Package;
                        return (
                            <button
                                key={app.id}
                                onClick={() => { openWindow(app.id, app); onClose(); }}
                                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-white/10 group transition-all"
                            >
                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:bg-yellow-500/20 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                    <Icon className="text-yellow-500" size={24} />
                                </div>
                                <span className="text-xs text-gray-300 text-center leading-tight group-hover:text-white line-clamp-2">{app.title}</span>
                            </button>
                        )
                    })}
                    {filteredApps.length === 0 && (
                        <div className="col-span-4 text-center text-gray-500 py-10">No apps found</div>
                    )}
                </div>
            </div>
        </div>
    );
}
