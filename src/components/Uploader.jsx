import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, X, FolderOpen, Pause, Play, Trash2 } from 'lucide-react';
import { uploadChunk, initUpload } from '../lib/api';
import useFileSystem from '../store/useFileSystem';
import { cn } from '../lib/utils';

export default function Uploader({ onClose, showCloseButton = false }) {
    const { loadFiles } = useFileSystem();
    const [queue, setQueue] = useState([]); // Upload queue
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

    // Handle file selection
    const handleFiles = (fileList) => {
        const files = Array.from(fileList).map(file => ({
            id: `${Date.now()}-${file.name}`,
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'pending', // pending, uploading, done, error, paused
        }));
        setQueue(prev => [...prev, ...files]);
        setIsExpanded(true);
    };

    // Start/resume uploading
    useEffect(() => {
        const processQueue = async () => {
            const next = queue.find(f => f.status === 'pending');
            if (!next || isUploading) return;

            setIsUploading(true);
            setQueue(q => q.map(f => f.id === next.id ? { ...f, status: 'uploading' } : f));

            try {
                const totalChunks = Math.ceil(next.size / CHUNK_SIZE);

                for (let i = 0; i < totalChunks; i++) {
                    const start = i * CHUNK_SIZE;
                    const end = Math.min(next.size, start + CHUNK_SIZE);
                    const chunk = next.file.slice(start, end);

                    const formData = new FormData();
                    formData.append('chunk', chunk);
                    formData.append('fileName', next.name);
                    formData.append('chunkIndex', i);
                    formData.append('totalChunks', totalChunks);
                    formData.append('fileId', next.id);

                    await uploadChunk(formData);

                    const progress = Math.round(((i + 1) / totalChunks) * 100);
                    setQueue(q => q.map(f => f.id === next.id ? { ...f, progress } : f));
                }

                setQueue(q => q.map(f => f.id === next.id ? { ...f, status: 'done', progress: 100 } : f));
                loadFiles('/');
            } catch (error) {
                console.error('Upload error:', error);
                setQueue(q => q.map(f => f.id === next.id ? { ...f, status: 'error' } : f));
            }

            setIsUploading(false);
        };

        processQueue();
    }, [queue, isUploading]);

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
                        onDragEnter={handleDrag}
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
                    <div className="bg-black border border-yellow-500/30 shadow-2xl overflow-hidden w-96" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
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
                            <div className="max-h-64 overflow-auto">
                                {queue.map((item) => (
                                    <div key={item.id} className="px-4 py-2 border-t border-yellow-500/10 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-yellow-100 truncate font-mono">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1 bg-black overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all duration-300",
                                                            item.status === 'error' ? "bg-red-500" :
                                                                item.status === 'done' ? "bg-green-500" : "bg-gradient-to-r from-yellow-500 to-red-500"
                                                        )}
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-yellow-500/50 w-10 font-mono">{item.progress}%</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {item.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400" />}
                                            {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                                            <button onClick={() => removeFromQueue(item.id)} className="p-1 hover:bg-yellow-500/20 text-yellow-500/50">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add more button */}
                        <label className="block px-4 py-2 border-t border-yellow-500/20 text-center text-yellow-400 hover:bg-yellow-500/10 cursor-pointer text-sm font-mono uppercase">
                            + Add more files
                            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                        </label>
                    </div>
                )}
            </div>
        </>
    );
}

