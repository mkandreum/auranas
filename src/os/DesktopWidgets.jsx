import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Calendar, Clock } from 'lucide-react';
import { getSystemStats } from '../lib/api';

export const ClockWidget = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');

    // Cyberpunk date format
    const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <div className="flex flex-col items-end text-right font-mono select-none pointer-events-none p-4">
            <div className="text-6xl font-black text-yellow-500 tracking-tighter drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] leading-none">
                {hours}:{minutes}
            </div>
            <div className="text-xl text-yellow-100/60 uppercase tracking-widest mt-2 flex items-center gap-2 justify-end">
                <span>{dateStr}</span>
                <Calendar size={18} />
            </div>
            <div className="h-1 w-32 bg-yellow-500/30 mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 animate-pulse w-2/3 ml-auto"></div>
            </div>
        </div>
    );
};

export const SystemWidget = () => {
    const [stats, setStats] = useState({ cpu: 0, ram: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Try real stats, fallback to mock if fails (e.g. non-admin)
                const sys = await getSystemStats().catch(() => ({}));
                setStats({
                    cpu: sys.cpu || Math.floor(Math.random() * 20 + 5),
                    ram: sys.memory?.usedPercent || Math.floor(Math.random() * 30 + 30)
                });
            } catch (e) {
                // Fallback simulation
                setStats({
                    cpu: Math.floor(Math.random() * 20 + 5),
                    ram: Math.floor(Math.random() * 30 + 30)
                });
            }
        };

        fetchStats(); // Initial
        const timer = setInterval(fetchStats, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-lg w-64 font-mono select-none">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-bold border-b border-white/10 pb-1">System Status</div>

            <div className="mb-3">
                <div className="flex justify-between items-center text-xs text-yellow-500 mb-1">
                    <span className="flex items-center gap-1"><Cpu size={12} /> CPU LOAD</span>
                    <span>{stats.cpu}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000" style={{ width: `${stats.cpu}%` }} />
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center text-xs text-purple-400 mb-1">
                    <span className="flex items-center gap-1"><Zap size={12} /> MEMORY</span>
                    <span>{stats.ram}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000" style={{ width: `${stats.ram}%` }} />
                </div>
            </div>
        </div>
    );
};
