import React, { useState, useEffect, useRef } from 'react';
import useFileSystem from '../../store/useFileSystem';
import { getThumbnailUrl } from '../../lib/api';
import { uploadFile } from '../../lib/fileTransfer';
import { Image as ImageIcon, Maximize2, X, Upload, Video, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhotosApp() {
    const { files, loadFiles, loading: fsLoading } = useFileSystem();
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const fileInputRef = useRef(null);

    // Initial Load: Default to /Photos
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadFiles('/Photos');
            setLoading(false);
        };
        init();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (files) {
            const media = files.filter(f => {
                const ext = f.name.split('.').pop().toLowerCase();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov'].includes(ext);
            });
            setMediaFiles(media);
        }
    }, [files]);

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);

        try {
            await uploadFile(file, '/Photos', (pct) => setProgress(pct));

            // Refresh view
            await loadFiles('/Photos');
            // Toast or non-intrusive alert? keeping simple.
            // alert('Upload Complete'); // Removed alert to be smoother
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isVideo = (file) => ['mp4', 'webm', 'mov'].includes(file.name.split('.').pop().toLowerCase());

    return (
        <div className="h-full bg-[#0d0d0d] flex flex-col text-white font-sans">
            {/* Toolbar */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#111]">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-500">
                        <ImageIcon size={20} />
                    </div>
                    <div>
                        <div className="font-bold tracking-wide text-sm">AURA PHOTOS</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Neural Gallery</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />

                    {uploading ? (
                        <div className="flex items-center gap-2 bg-blue-600/20 px-3 py-2 rounded text-blue-400 border border-blue-500/30">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-xs font-bold">{progress}%</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleUploadClick}
                            className="bg-yellow-500 text-black px-4 py-2 rounded text-xs font-bold hover:bg-yellow-400 flex items-center gap-2 transition-all"
                        >
                            <Upload size={14} /> IMPORT
                        </button>
                    )}

                    <div className="bg-white/5 px-3 py-1.5 rounded text-xs text-gray-400 border border-white/10">
                        {mediaFiles.length} MEDIA
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-6 bg-[#0a0a0a]">
                {loading || fsLoading ? (
                    <div className="flex h-full items-center justify-center flex-col gap-4 text-gray-500 animate-pulse">
                        <ImageIcon size={48} className="opacity-20" />
                        <span className="text-xs uppercase tracking-widest">Scanning Storage Matrix...</span>
                    </div>
                ) : (
                    mediaFiles.length === 0 ? (
                        <div className="flex h-full items-center justify-center flex-col gap-4 text-gray-600">
                            <span className="text-sm">No media found in /Photos</span>
                            <button onClick={() => loadFiles('/')} className="text-yellow-500 text-xs hover:underline">Scan Root?</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
                            {mediaFiles.map((file, idx) => (
                                <div
                                    key={file.id || idx}
                                    className="aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden cursor-pointer relative group border border-white/5 hover:border-yellow-500/50 transition-all shadow-lg hover:shadow-yellow-500/10"
                                    onClick={() => setLightboxIndex(idx)}
                                >
                                    {isVideo(file) ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-600 group-hover:text-yellow-500 transition-colors">
                                            <Video size={40} />
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px] text-white font-bold border border-white/10">VIDEO</div>
                                        </div>
                                    ) : (
                                        <img
                                            src={getThumbnailUrl(file.id)}
                                            alt={file.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                            loading="lazy"
                                        />
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-xs truncate translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-between items-end">
                                        <span className="text-gray-200">{file.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <button
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white hover:bg-white/10 p-3 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>

                    <div className="w-full h-full flex items-center justify-center relative p-8">
                        {isVideo(mediaFiles[lightboxIndex]) ? (
                            <video
                                src={getThumbnailUrl(mediaFiles[lightboxIndex].id).replace('/thumbnail/', '/download/')} // Quick hack, assuming API structure. 
                                controls
                                className="max-w-full max-h-full rounded-lg shadow-2xl outline-none"
                            />
                        ) : (
                            <img
                                src={getThumbnailUrl(mediaFiles[lightboxIndex].id).replace('/thumbnail/', '/download/')}
                                alt="Fullscreen"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                        )}
                    </div>

                    <div className="absolute bottom-8 flex gap-8">
                        <button
                            disabled={lightboxIndex === 0}
                            onClick={() => setLightboxIndex(i => i - 1)}
                            className="text-white hover:text-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                        >
                            <ChevronLeft size={32} />
                        </button>
                        <div className="text-gray-500 font-mono text-xs flex items-center bg-black/50 px-3 rounded-full border border-white/10">
                            {lightboxIndex + 1} / {mediaFiles.length}
                        </div>
                        <button
                            disabled={lightboxIndex === mediaFiles.length - 1}
                            onClick={() => setLightboxIndex(i => i + 1)}
                            className="text-white hover:text-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 transition-transform"
                        >
                            <ChevronRight size={32} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
