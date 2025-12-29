import React, { useState, useEffect } from 'react';
import { getSystemStats, getActivityLog, fetchUsers } from '../lib/api';
import { Users, HardDrive, FileImage, Activity, TrendingUp, Clock, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, a] = await Promise.all([getSystemStats(), getActivityLog()]);
                setStats(s);
                setActivity(a);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-400">Failed to load stats</div>;

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-white">System Dashboard</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="blue" />
                <StatCard icon={FileImage} label="Total Files" value={stats.totalFiles.toLocaleString()} color="green" />
                <StatCard icon={HardDrive} label="Storage Used" value={formatBytes(stats.totalSize)} color="purple" />
                <StatCard icon={Trash2} label="Trash Size" value={formatBytes(stats.trashSize)} color="red" />
            </div>

            {/* Recent uploads */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Recent Uploads (24h)
                    </h3>
                    <span className="text-2xl font-bold text-emerald-400">{stats.recentUploads}</span>
                </div>
            </div>

            {/* Top Users */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Top Users by Storage
                </h3>
                <div className="space-y-2">
                    {stats.topUsers?.map((user, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {user.username[0].toUpperCase()}
                            </span>
                            <span className="flex-1 text-slate-300 text-sm">{user.username}</span>
                            <span className="text-slate-500 text-xs">{user.file_count} files</span>
                            <span className="text-slate-400 text-sm font-medium">{formatBytes(user.used_bytes)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity Log */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Recent Activity
                </h3>
                <div className="max-h-64 overflow-auto space-y-2">
                    {activity.slice(0, 20).map((a, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
                            <span className="text-slate-500">—</span>
                            <span className="text-slate-300">{a.username}</span>
                            <span className="text-slate-500 truncate flex-1">{a.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const colors = {
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-green-500 to-emerald-500',
        purple: 'from-purple-500 to-pink-500',
        red: 'from-red-500 to-orange-500',
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${colors[color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    );
}
