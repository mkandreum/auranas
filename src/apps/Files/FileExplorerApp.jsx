import React, { useState, useEffect } from 'react';
import useFileSystem from '../../store/useFileSystem';
import useOS from '../../os/useOS';
import FileGrid from '../../components/FileGrid';
import { HardDrive, Folder, ChevronRight, ChevronDown, RefreshCw, Home } from 'lucide-react';

export default function FileExplorerApp() {
    const { loadFiles, files, currentPath, navigateUp, loading } = useFileSystem();
    const { openWindow } = useOS(); // Need useOS to open other apps

    const handleFileClick = (file) => {
        if (file.type === 'directory') {
            loadFiles(file.path);
        } else {
            console.log('Opening file:', file);
            const ext = file.name.split('.').pop().toLowerCase();

            // File Associations
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                openWindow('photos', { title: file.name, params: { file } }); // Pass file param if PhotosApp supported it
            } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
                openWindow('music', { title: 'Sonic Wave', params: { file } });
            } else if (['mp4', 'mkv', 'webm'].includes(ext)) {
                openWindow('video', { title: 'Neon Player', params: { file } });
            } else if (ext === 'pdf') {
                openWindow('pdf', { title: file.name, params: { file } });
            } else if (['txt', 'js', 'json', 'css', 'html', 'md'].includes(ext)) {
                openWindow('code', { title: file.name, params: { file } });
            } else {
                alert("No app associated with this file type.");
            }
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        // Simple upload for now - in production use chunked upload from api.js
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', currentPath);

        try {
            // Using direct upload endpoint if available or assume api.uploadChunk handles it
            // api.js uses /upload endpoint. Let's make a direct call or use a simple helper
            // For now, let's mock the success to UI but try to actually call the API if we had a clean one-shot
            // Given api.js structure, let's just refresh for now
            alert("Upload functionality requires connecting the specific upload logic. Refreshing view.");
            loadFiles(currentPath);
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex h-full flex-col bg-[#1e1e1e] text-gray-200 font-sans text-sm">
            {/* Toolbar */}
            <div className="h-10 bg-[#2d2d2d] border-b border-black flex items-center px-2 gap-2 shadow-sm">
                <button
                    onClick={() => navigateUp()}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-300 disabled:opacity-50"
                    disabled={currentPath === '/'}
                >
                    <ChevronDown className="rotate-90" size={16} />
                </button>
                <div className="flex-1 flex gap-2 items-center bg-[#1a1a1a] border border-[#3d3d3d] rounded px-2 py-1 text-xs text-gray-300 font-mono">
                    <span className="text-yellow-500">NAS://</span>
                    <span>{currentPath}</span>
                </div>
                <label className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded cursor-pointer flex items-center gap-2">
                    <span className="text-xs font-bold">{uploading ? '...' : 'Upload'}</span>
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
                <button onClick={() => loadFiles(currentPath)} className="p-1.5 hover:bg-white/10 rounded">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Tree */}
                <div className="w-56 bg-[#252526] border-r border-[#3e3e42] flex flex-col py-2 select-none hidden md:flex">
                    {/* ... (keep existing tree items or dynamic) ... */}
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Favorites</div>
                    <div onClick={() => loadFiles('/')} className="px-4 py-1 hover:bg-white/5 cursor-pointer flex items-center gap-2 cursor-pointer">
                        <Home size={14} /> Home
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-[#1e1e1e] relative flex flex-col overflow-hidden">
                    <FileGrid
                        onFileClick={handleFileClick}
                        files={files} // FileGrid expects data from store usually, but we can pass it if modified
                    />
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-xs">
                <span>{files.length} items</span>
                <span>{loading ? 'Syncing...' : 'Ready'}</span>
            </div>
        </div>
    );
}
