import React, { useState, useEffect } from 'react';
import useFileSystem from '../../store/useFileSystem';
import useOS from '../../os/useOS';
import FileGrid from '../../components/FileGrid';
import { HardDrive, Folder, ChevronRight, ChevronDown, RefreshCw, Home, Loader2 } from 'lucide-react';
import { uploadFile } from '../../lib/fileTransfer';

export default function FileExplorerApp() {
    const { loadFiles, files, currentPath, navigateUp, loading } = useFileSystem();
    const { openWindow } = useOS();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Initial load handled by store? Actually component should trigger load.
    useEffect(() => {
        loadFiles(currentPath);
    }, [currentPath]);

    const handleFileClick = (file) => {
        if (file.type === 'directory') {
            loadFiles(file.path);
        } else {
            console.log('Opening file:', file);
            const ext = file.name.split('.').pop().toLowerCase();

            // File Associations
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                openWindow('photos', { title: file.name, params: { file } });
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
        setProgress(0);

        try {
            await uploadFile(file, currentPath, (pct) => setProgress(pct));
            await loadFiles(currentPath);
        } catch (error) {
            console.error(error);
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
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

                {uploading ? (
                    <div className="flex items-center gap-2 bg-blue-600 px-3 py-1 rounded text-white text-xs font-bold">
                        <Loader2 size={12} className="animate-spin" />
                        {progress}%
                    </div>
                ) : (
                    <label className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded cursor-pointer flex items-center gap-2 transition-colors">
                        <span className="text-xs font-bold">Upload</span>
                        <input type="file" className="hidden" onChange={handleUpload} />
                    </label>
                )}

                <button onClick={() => loadFiles(currentPath)} className="p-1.5 hover:bg-white/10 rounded transition-colors">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Tree */}
                <div className="w-56 bg-[#252526] border-r border-[#3e3e42] flex flex-col py-2 select-none hidden md:flex">
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Storage</div>
                    <div onClick={() => loadFiles('/')} className="px-4 py-1 hover:bg-white/5 cursor-pointer flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                        <Home size={14} /> Root
                    </div>
                    <div onClick={() => loadFiles('/Photos')} className="px-4 py-1 hover:bg-white/5 cursor-pointer flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                        <Folder size={14} /> Photos
                    </div>
                    <div onClick={() => loadFiles('/Documents')} className="px-4 py-1 hover:bg-white/5 cursor-pointer flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
                        <Folder size={14} /> Documents
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-[#1e1e1e] relative flex flex-col overflow-hidden">
                    <FileGrid
                        onFileClick={handleFileClick}
                        files={files}
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
