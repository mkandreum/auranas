import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, X, FolderOpen, Pause, Play, Trash2 } from 'lucide-react';
import { uploadFile } from '../lib/fileTransfer';
import useFileSystem from '../store/useFileSystem';
import { cn } from '../lib/utils'; // Assuming this exists, based on prev file

export default function Uploader({ onClose, showCloseButton = false, initialFiles = [] }) {
    const { loadFiles, currentPath } = useFileSystem();
    const [queue, setQueue] = useState([]); // Upload queue
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Process initial files on mount
    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            handleFiles(initialFiles);
        }
    }, [initialFiles]);

    // Handle file selection
    const handleFiles = (fileList) => {
        const files = Array.from(fileList).map(file => ({
            id: `${Date.now()}-${file.name}`,
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'pending',
        }));
        setQueue(prev => [...prev, ...files]);
        setIsExpanded(true);
    };

    // Start/resume uploading
    useEffect(() => {
        const processQueue = async () => {
            if (isUploading) return;
            const next = queue.find(f => f.status === 'pending');
            if (!next) return;

            setIsUploading(true);

            // Mark as uploading
            setQueue(q => q.map(f => f.id === next.id ? { ...f, status: 'uploading' } : f));

            try {
                // Use robust uploadFile utility
                // Default to currentPath, or specific path if provided in props (not currently passed)
                // PhotosApp might expect upload to /Photos? 
                // Ideally Uploader should take a 'targetPath' prop.
                // If not provided, use currentPath from store.
                // But PhotosApp keeps store at '/', and just filters. So uploading to / is fine? 
                // Or does PhotosApp navigate to /Photos? 

                // Let's assume currentPath is correct context.
                await uploadFile(next.file, currentPath || '/', (progress) => {
                    setQueue(q => q.map(f => f.id === next.id ? { ...f, progress } : f));
                });

                setQueue(q => q.map(f => f.id === next.id ? { ...f, status: 'done', progress: 100 } : f));
                loadFiles(currentPath || '/');
            } catch (error) {
                console.error('Upload error:', error);
                setQueue(q => q.map(f => f.id === next.id ? { ...f, status: 'error' } : f));
            } finally {
                setIsUploading(false); // Trigger effect again for next file
            }
        };

        processQueue();
    }, [queue, isUploading, currentPath, loadFiles]);

    // Remove from queue
    const removeFromQueue = (id) => {
        setQueue(q => q.filter(f => f.id !== id));
    };

    // Clear completed
    const clearCompleted = () => {
        setQueue(q => q.filter(f => f.status !== 'done'));
    };

    // Calculate totals
    const totalFiles = queue.length;
    const completedFiles = queue.filter(f => f.status === 'done').length;
    const hasQueue = totalFiles > 0;

    // Drag handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // ... (UI remains largely the same, just keeping it consistent)
    return (
        <>
            {/* Drag overlay */}
            {dragActive && (
                <div
                    className="fixed inset-0 z-50 bg-yellow-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="bg-black border-2 border-dashed border-yellow-500 p-12 text-center" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                        <UploadCloud className="w-16 h-16 text-yellow-400 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(252, 211, 77, 0.8))' }} />
                        <p className="text-xl font-bold text-yellow-400 font-mono uppercase">Drop files to upload</p>
                        <p className="text-yellow-500/50 font-mono text-sm">Photos, Videos, any file</p>
                    </div>
                </div>
            )}

            {/* Global drag listener */}
            <div
                className="fixed inset-0 z-40 pointer-events-auto"
                style={{ display: dragActive ? 'block' : 'none' }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            />

            {/* Close button for mobile modal view */}
            {showCloseButton && (
                <button
                    onClick={onClose}
                    className="fixed top-4 left-4 z-60 p-3 bg-black/80 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                    style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            {/* Floating upload button/panel - positioned higher on mobile to avoid nav */}
            <div className={showCloseButton ? "w-full max-w-md" : "fixed bottom-24 lg:bottom-6 right-6 z-50"}>
                {!hasQueue ? (
                    <label
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-red-500 text-black p-4 shadow-lg shadow-yellow-500/30 transition-all hover:scale-110 active:scale-95 flex items-center gap-2 cursor-pointer"
                        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                    >
                        <UploadCloud className="w-6 h-6" />
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                    </label>
                ) : (
                    <div className="bg-black border border-yellow-500/30 shadow-2xl overflow-hidden w-96 rounded-lg font-mono">
                        {/* Header */}
                        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-yellow-400" />
                                <span className="font-medium text-yellow-400 text-sm font-mono uppercase tracking-wider">
                                    Uploading {completedFiles}/{totalFiles}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={clearCompleted} className="p-1 hover:bg-yellow-500/20 text-yellow-400/60 text-xs font-mono">Clear Done</button>
                                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-yellow-500/20 text-yellow-400">
                                    {isExpanded ? '−' : '+'}
                                </button>
                            </div>
                        </div>

                        {/* Queue list */}
                        {isExpanded && (
                            <div className="max-h-64 overflow-auto bg-[#111]">
                                {queue.map((item) => (
                                    <div key={item.id} className="px-4 py-2 border-t border-white/5 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-yellow-100 truncate font-mono">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1 bg-black overflow-hidden rounded-full">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${item.status === 'error' ? "bg-red-500" :
                                                            item.status === 'done' ? "bg-green-500" : "bg-gradient-to-r from-yellow-500 to-red-500"
                                                            }`}
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-yellow-500/50 w-10 font-mono text-right">{item.progress}%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {item.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400" />}
                                            {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                                            <button onClick={() => removeFromQueue(item.id)} className="p-1 hover:bg-white/10 text-gray-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add more button */}
                        <label className="block px-4 py-2 border-t border-white/10 text-center text-yellow-400 hover:bg-yellow-500/10 cursor-pointer text-sm font-mono uppercase bg-[#0a0a0a]">
                            + Add more files
                            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                        </label>
                    </div>
                )}
            </div>
        </>
    );
}
