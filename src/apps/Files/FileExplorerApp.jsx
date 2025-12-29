import React, { useState, useEffect } from 'react';
import useFileSystem from '../../store/useFileSystem';
import FileGrid from '../../components/FileGrid';
import { HardDrive, Folder, ChevronRight, ChevronDown, RefreshCw, Home } from 'lucide-react';

export default function FileExplorerApp() {
    const { loadFiles, files } = useFileSystem();
    const [currentPath, setCurrentPath] = useState('/');

    // Simulate initial load
    useEffect(() => {
        loadFiles('/');
    }, []);

    // Placeholder Tree Item
    const TreeItem = ({ label, depth = 0, active }) => (
        <div
            className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-white/5 ${active ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400'}`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
            <ChevronRight size={12} className="text-gray-600" />
            <Folder size={14} className={active ? 'text-blue-400' : 'text-yellow-500'} />
            <span className="truncate">{label}</span>
        </div>
    );

    return (
        <div className="flex h-full flex-col bg-[#1e1e1e] text-gray-200 font-sans text-sm">
            {/* Toolbar */}
            <div className="h-9 bg-[#2d2d2d] border-b border-black flex items-center px-2 gap-2 shadow-sm">
                <button className="p-1 hover:bg-white/10 rounded text-gray-400"><RefreshCw size={14} /></button>
                <div className="flex-1 flex gap-2 items-center bg-[#1a1a1a] border border-[#3d3d3d] rounded px-2 py-0.5 text-xs text-gray-300">
                    <HardDrive size={12} />
                    <span>My NAS</span>
                    <span className="text-gray-600">/</span>
                    <span>home</span>
                    <span className="text-gray-600">/</span>
                    <span>Documents</span>
                </div>
                <div className="bg-[#1a1a1a] border border-[#3d3d3d] rounded px-2 py-0.5 text-xs w-48 text-gray-500">
                    Search...
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Tree */}
                <div className="w-56 bg-[#252526] border-r border-[#3e3e42] flex flex-col py-2 select-none">
                    <TreeItem label="My Files" active />
                    <TreeItem label="Photos" depth={1} />
                    <TreeItem label="Documents" depth={1} />
                    <TreeItem label="Music" depth={1} />
                    <TreeItem label="Collaborative" />
                    <TreeItem label="USB Share 1" />
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-[#1e1e1e] relative flex flex-col overflow-hidden">
                    {/* Using FileGrid but ideally adapted for "List" vs "Grid" view in the explorer context */}
                    {/* For now basic usage */}
                    <FileGrid />
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-xs">
                <span>5 items selected</span>
                <span>2.4 GB</span>
            </div>
        </div>
    );
}
