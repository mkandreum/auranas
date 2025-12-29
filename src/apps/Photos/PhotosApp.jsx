import React, { useEffect, useState } from 'react';
import useFileSystem from '../../store/useFileSystem';
import { getThumbnailUrl } from '../../lib/api';
import { Image, Maximize2, X, RefreshCw } from 'lucide-react';

export default function PhotosApp() {
    const { loadFiles, files, loading, viewMode, setViewMode } = useFileSystem();
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        // Force timeline view to get all photos
        setViewMode('timeline');
        loadFiles();

        // Cleanup: reset to normal mode when traversing away might be good, 
        // but for now we keep it simple
    }, []);

    // Filter only images just in case
    const imageFiles = files.filter(f => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f.name.split('.').pop().toLowerCase()));

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-200">
            {/* Toolbar */}
            <div className="h-12 bg-[#2d2d2d] border-b border-black flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <Image className="text-yellow-500" size={20} />
                    <span className="font-bold text-lg">Aura Photos</span>
                </div>
                <button
                    onClick={() => loadFiles()}
                    className={`p-2 hover:bg-white/10 rounded transition-colors ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-4">
                {files.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                        <Image size={64} />
                        <span className="mt-4 text-xl">No photos found</span>
                        <span className="text-sm">Upload images to see them here</span>
                    </div>
                )}

                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                    {imageFiles.map(file => (
                        <div
                            key={file.id}
                            className="aspect-square bg-black rounded-lg overflow-hidden relative group cursor-pointer border border-transparent hover:border-yellow-500"
                            onClick={() => setSelectedImage(file)}
                        >
                            <img
                                src={getThumbnailUrl(file.path)}
                                alt={file.name}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="text-white drop-shadow-lg" size={24} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
                    <div className="h-12 flex items-center justify-end px-4 absolute top-0 right-0 w-full z-10 bg-gradient-to-b from-black/50 to-transparent">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="p-2 hover:bg-white/10 rounded-full text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <img
                            src={getThumbnailUrl(selectedImage.path)} // Use thumbnail for now as it's faster, or real url if needed
                            alt={selectedImage.name}
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                    </div>
                    <div className="h-16 bg-black/50 flex items-center justify-center text-white backdrop-blur-md">
                        <span className="font-mono">{selectedImage.name}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
