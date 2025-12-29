import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2, Info, MapPin, Heart, Share2, AlertCircle } from 'lucide-react';
import { getThumbnailUrl, getDownloadUrl, getMetadata, toggleFavorite, deleteFiles, createShareLink } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import ConfirmModal from './ConfirmModal';

export default function MediaViewer({ file, onClose, onNext, onPrev, onDelete }) {
    const [showInfo, setShowInfo] = useState(false);
    const [meta, setMeta] = useState(null);
    const [isFav, setIsFav] = useState(!!file?.is_favorite);
    const [sharedLink, setSharedLink] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (file && showInfo) {
            getMetadata(file.id).then(setMeta);
        }
        setIsFav(!!file?.is_favorite);
        setSharedLink(null);
    }, [file, showInfo]);

    if (!file) return null;

    // ALL supported formats
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'tif', 'heic', 'heif', 'raw', 'cr2', 'nef', 'arw', 'dng'];
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'webm', 'm4v', 'mpg', 'mpeg', 'mts', '3gp'];

    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = imageExts.includes(ext);
    const isVideo = videoExts.includes(ext);

    const handleFavorite = async () => {
        setIsFav(!isFav);
        await toggleFavorite(file.id, !isFav);
    };

    const handleShare = async () => {
        const res = await createShareLink(file.id);
        if (res.url) {
            // In a real app we would copy absolute URL
            const absUrl = window.location.origin + res.url;
            navigator.clipboard.writeText(absUrl);
            setSharedLink("Link copied!");
            setTimeout(() => setSharedLink(null), 2000);
        }
    };

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        // If file is already in trash (is_deleted), delete permanently
        const permanent = !!file.is_deleted;
        await deleteFiles([file.id], permanent);
        onDelete && onDelete(file.id);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                key="media-viewer"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex"
            >
                {/* Main Content */}
                <div className="flex-1 relative flex items-center justify-center p-4 outline-none" tabIndex={0} onClick={(e) => e.target === e.currentTarget && onClose()}>

                    {isImage && (
                        <motion.img
                            key={file.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={getDownloadUrl(file.id)}
                            alt={file.name}
                            className="max-h-full max-w-full object-contain shadow-2xl"
                        />
                    )}

                    {isVideo && (
                        <motion.video
                            key={file.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={getDownloadUrl(file.id)}
                            controls
                            autoPlay
                            className="max-h-full max-w-full shadow-2xl"
                        />
                    )}

                    {/* Nav */}
                    <button onClick={onPrev} className="absolute left-4 p-4 bg-black/40 hover:bg-yellow-500/20 text-yellow-400 backdrop-blur transition-all border border-yellow-500/20" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}><ChevronLeft className="w-8 h-8" /></button>
                    <button onClick={onNext} className="absolute right-4 p-4 bg-black/40 hover:bg-yellow-500/20 text-yellow-400 backdrop-blur transition-all border border-yellow-500/20" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}><ChevronRight className="w-8 h-8" /></button>
                </div>

                {/* Info Panel */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="w-80 bg-[#0d0d0d] border-l border-yellow-500/20 p-6 flex flex-col gap-6 text-yellow-100 shadow-2xl z-20">
                            <div>
                                <h3 className="text-yellow-400 font-bold text-lg mb-1 truncate font-mono" title={file.name}>{file.name}</h3>
                                <p className="text-sm text-yellow-500/50 font-mono">{new Date(file.created_at).toLocaleString()}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Info className="w-5 h-5 text-yellow-400" />
                                    <div>
                                        <p className="text-xs text-yellow-500/50 font-mono uppercase">Size</p>
                                        <p className="text-sm font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                {meta && (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-green-400" />
                                            <div>
                                                <p className="text-xs text-yellow-500/50 font-mono uppercase">Resolution</p>
                                                <p className="text-sm font-mono">{meta.width} x {meta.height}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-red-400" />
                                            <div>
                                                <p className="text-xs text-yellow-500/50 font-mono uppercase">Format</p>
                                                <p className="text-sm uppercase font-mono">{meta.format}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toolbar */}
                <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10">
                    <button onClick={onClose} className="pointer-events-auto p-2 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}><X className="w-6 h-6" /></button>

                    <div className="flex gap-2 pointer-events-auto">
                        {sharedLink && <div className="bg-green-500 text-black text-xs font-bold px-3 py-1 flex items-center animate-pulse font-mono">{sharedLink}</div>}

                        <button onClick={handleShare} className="p-2 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}><Share2 className="w-5 h-5" /></button>

                        <button onClick={handleFavorite} className="p-2 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                            <Heart className={cn("w-5 h-5 transition-colors", isFav ? "fill-yellow-400 text-yellow-400" : "")} />
                        </button>

                        <button onClick={() => setShowInfo(!showInfo)} className={cn("p-2 text-yellow-400 transition-colors border border-yellow-500/20", showInfo ? "bg-yellow-500/20" : "hover:bg-yellow-500/20")} style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                            <Info className="w-5 h-5" />
                        </button>

                        <a href={getDownloadUrl(file.id)} download className="p-2 hover:bg-yellow-500/20 text-yellow-400 block border border-yellow-500/20" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                            <Download className="w-5 h-5" />
                        </a>

                        <button onClick={handleDelete} className="p-2 hover:bg-red-500/20 hover:text-red-400 text-yellow-400 transition-colors border border-yellow-500/20" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="ELIMINAR ARCHIVO"
                message={`¿Estás seguro de que quieres eliminar "${file.name}"? Esta acción moverá el archivo a la papelera.`}
                type="danger"
                confirmText="ELIMINAR"
                cancelText="CANCELAR"
            />
        </AnimatePresence>
    );
}

