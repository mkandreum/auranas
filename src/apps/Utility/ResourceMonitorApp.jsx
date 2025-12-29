import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Cpu, Zap, Activity } from 'lucide-react';

export default function ResourceMonitorApp() {
    const [data, setData] = useState([]);
    const [stats, setStats] = useState({ cpu: 0, ram: 0, net: 0 });

    useEffect(() => {
        // Mock data generator
        const interval = setInterval(() => {
            const now = new Date();
            const time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
            const cpu = Math.floor(Math.random() * 30) + 10; // 10-40% base
            const ram = Math.floor(Math.random() * 20) + 40; // 40-60% base

            setStats({ cpu, ram, net: Math.floor(Math.random() * 100) });

            setData(current => {
                const newData = [...current, { time, cpu, ram }];
                if (newData.length > 20) newData.shift();
                return newData;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col bg-[#0d0d0d] p-4 font-mono text-yellow-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-500">
                <Activity /> SYSTEM DIAGNOSTICS
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1a1a1a] p-4 rounded border border-yellow-500/20">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400 flex items-center gap-2"><Cpu size={16} /> CPU LOAD</span>
                        <span className="text-2xl font-bold text-yellow-400">{stats.cpu}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${stats.cpu}%` }}></div>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded border border-purple-500/20">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400 flex items-center gap-2"><Zap size={16} /> RAM USAGE</span>
                        <span className="text-2xl font-bold text-purple-400">{stats.ram}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${stats.ram}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-[#1a1a1a] p-4 rounded border border-white/10 relative">
                <div className="absolute top-2 right-4 flex gap-4 text-xs">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> CPU</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> RAM</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} stroke="#666" fontSize={10} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="cpu" stroke="#eab308" fillOpacity={1} fill="url(#colorCpu)" />
                        <Area type="monotone" dataKey="ram" stroke="#a855f7" fillOpacity={1} fill="url(#colorRam)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Activity size={12} className="animate-pulse text-green-500" />
                NETWORK: {stats.net} MB/s
            </div>
        </div>
    );
}
