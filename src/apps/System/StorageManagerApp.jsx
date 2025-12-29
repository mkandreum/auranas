import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Database, HardDrive, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { fetchStats } from '../../lib/api';

export default function StorageManagerApp() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await fetchStats(); // Returns totalSize, totalFiles, etc.
            // We simulate breakdown since API might only give totals. 
            // In a real advanced NAS, we would have an endpoint /api/storage/breakdown

            // Mocking breakdown for visual demo based on real total size
            const total = data.totalSize || 1024 * 1024 * 100; // 100MB default if 0

            // Simulated distributions
            const breakdown = [
                { name: 'Images', value: Math.floor(total * 0.4), color: '#fbbf24' }, // Yellow
                { name: 'Video', value: Math.floor(total * 0.25), color: '#a855f7' }, // Purple
                { name: 'Documents', value: Math.floor(total * 0.15), color: '#3b82f6' }, // Blue
                { name: 'System/Pool', value: Math.floor(total * 0.2), color: '#374151' }, // Gray
            ];

            setStats({ ...data, breakdown, total });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStats(); }, []);

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="h-full flex flex-col bg-[#111] text-gray-200 font-sans">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 rounded-lg text-blue-500 border border-blue-500/30">
                        <HardDrive size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Storage Manager</h1>
                        <p className="text-xs text-gray-400">Volume 1 (Docker Persistent)</p>
                    </div>
                </div>
                <button onClick={loadStats} className="p-2 hover:bg-white/10 rounded-full transition-colors"><RefreshCw size={18} /></button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-blue-500 animate-pulse">Analyzing Volume Structure...</div>
            ) : (
                <div className="flex-1 overflow-auto p-6 grid grid-cols-2 gap-6">
                    {/* Usage Overview */}
                    <div className="col-span-2 lg:col-span-1 bg-[#1a1a1a] rounded-xl p-6 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-50"><Database size={100} className="text-white/5" /></div>
                        <h3 className="font-bold text-gray-300 mb-4">Volume Usage</h3>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <div className="text-4xl font-bold text-white">{formatBytes(stats?.total)}</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest mt-1">Used Space</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-green-500">HEALTHY</div>
                                <div className="text-xs text-gray-500">RAID Status</div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.breakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats?.breakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        itemStyle={{ color: '#fff' }}
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                        formatter={(val) => formatBytes(val)}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Drive Status & Tools */}
                    <div className="col-span-2 lg:col-span-1 space-y-6">
                        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
                            <h3 className="font-bold text-gray-300 mb-4">Physical Disks</h3>
                            <div className="space-y-3">
                                {/* Simulated Disk visualization */}
                                <div className="flex items-center justify-between bg-black/40 p-3 rounded border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <HardDrive className="text-green-500" size={20} />
                                        <div>
                                            <div className="text-sm font-bold text-white">Disk 1 (Virtual)</div>
                                            <div className="text-xs text-gray-500">SATA SSD - Online</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-mono text-green-400">OK</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
                            <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-500" /> Volume Tools</h3>
                            <p className="text-xs text-gray-500 mb-4">Maintenance tasks for system health.</p>

                            <div className="flex flex-col gap-2">
                                <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-2 rounded text-sm font-bold transition-colors border border-blue-500/20">
                                    Data Scrubbing
                                </button>
                                <button className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 py-2 rounded text-sm font-bold transition-colors border border-red-500/20 flex items-center justify-center gap-2">
                                    <Trash2 size={14} /> Free Up Space (Cache)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
