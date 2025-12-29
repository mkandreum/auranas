import React, { useState, useEffect } from 'react';
import useOS from '../../os/useOS';
import { Activity, XSquare, AppWindow, Cpu } from 'lucide-react';
import { getSystemStats } from '../../lib/api';

export default function TaskManagerApp() {
    const { windows, closeWindow, focusWindow } = useOS();
    const [stats, setStats] = useState({ cpu: 0, ram: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getSystemStats();
                // If API returns valid data use it, else keep 0 or fallback
                if (data) {
                    setStats({
                        cpu: data.cpu || 0,
                        ram: data.memory?.usedPercent || 0
                    });
                }
            } catch (e) {
                console.warn("Stats fetch failed", e);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-white font-mono">
            {/* Header Stats (Real) */}
            <div className="h-24 bg-[#252526] border-b border-[#3e3e42] p-4 grid grid-cols-3 gap-4">
                <div className="bg-[#111] p-3 rounded border border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
                        <Cpu size={14} /> CPU
                    </div>
                    <div className="text-2xl font-bold">{Math.round(stats.cpu)}%</div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-900">
                        <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${stats.cpu}%` }}></div>
                    </div>
                </div>
                <div className="bg-[#111] p-3 rounded border border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-xs text-purple-400 mb-1">
                        <Activity size={14} /> RAM
                    </div>
                    <div className="text-2xl font-bold">{Math.round(stats.ram)}%</div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-900">
                        <div className="h-full bg-purple-400 transition-all duration-500" style={{ width: `${stats.ram}%` }}></div>
                    </div>
                </div>
                <div className="bg-[#111] p-3 rounded border border-white/5 flex flex-col justify-center items-center">
                    <div className="text-xs text-gray-500 uppercase">Processes</div>
                    <div className="text-2xl font-bold">{windows.length}</div>
                </div>
            </div>

            {/* Process List */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-[#2d2d2d] text-gray-400 sticky top-0">
                        <tr>
                            <th className="p-2 pl-4 font-normal">Process Name</th>
                            <th className="p-2 font-normal">ID</th>
                            <th className="p-2 font-normal">Status</th>
                            <th className="p-2 font-normal text-right pr-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3e3e42]">
                        {windows.map(win => (
                            <tr key={win.id} className="hover:bg-white/5 group">
                                <td className="p-2 pl-4 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                                        <AppWindow size={16} className="text-yellow-500" />
                                    </div>
                                    <span className="font-bold text-gray-200">{win.title}</span>
                                </td>
                                <td className="p-2 text-gray-500 font-mono text-xs">{win.id.slice(0, 8)}...</td>
                                <td className="p-2">
                                    <span className={`px-2 py-0.5 rounded textxs ${win.isMinimized ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {win.isMinimized ? 'Background' : 'Active'}
                                    </span>
                                </td>
                                <td className="p-2 text-right pr-4">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => focusWindow(win.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs">Switch To</button>
                                        <button onClick={() => closeWindow(win.id)} className="px-3 py-1 bg-red-900/50 text-red-400 hover:bg-red-800 hover:text-white rounded text-xs flex items-center gap-1">
                                            <XSquare size={12} /> Kill
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
