import React, { useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import useFileSystem from '../store/useFileSystem';
import { getThumbnailUrl } from '../lib/api';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

// Media Item
const MediaItem = ({ file, size, onClick, isSelected }) => {
    if (!file) return <div style={{ width: size, height: size }} />;

    // ALL supported image extensions
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'tif', 'ico', 'svg', 'heic', 'heif', 'raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'rw2', 'pef', 'psd'];
    // ALL supported video extensions
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', 'm2ts', 'mts', 'ts', '3gp', 'ogv', 'vob'];

    const ext = file.name.split('.').pop().toLowerCase();
    const isMedia = imageExts.includes(ext) || videoExts.includes(ext);
    const isVideo = videoExts.includes(ext);

    return (
        <div style={{ width: size, height: size }} className="p-0.5">
            <div
                className={cn(
                    "w-full h-full bg-black relative cursor-pointer group overflow-hidden transition-all",
                    isSelected ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-black scale-95" : "hover:ring-1 hover:ring-yellow-500/30"
                )}
                onClick={(e) => onClick(file, e)}
            >
                {isMedia && (
                    <img
                        src={getThumbnailUrl(file.path)}
                        alt={file.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                {/* Selection indicator */}
                {isSelected && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-yellow-400 flex items-center justify-center" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                )}

                {/* Video indicator */}
                {isVideo && (
                    <div className="absolute bottom-2 right-2">
                        <div className="bg-black/80 backdrop-blur px-1.5 py-0.5 border border-yellow-500/30">
                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                    </div>
                )}

                {/* Favorite indicator */}
                {file.is_favorite === 1 && (
                    <div className="absolute top-2 right-2">
                        <span className="text-yellow-400 drop-shadow-[0_0_4px_rgba(252,211,77,0.8)]">★</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Row Component
const Row = ({ index, style, data }) => {
    const { rows, columnCount, width, onFileClick, selectedIds } = data;
    const rowData = rows[index];

    if (rowData.type === 'header') {
        return (
            <div style={style} className="px-4 py-4 flex items-end">
                <span className="text-lg font-bold text-yellow-400 font-mono">{rowData.date}</span>
                <span className="text-xs text-yellow-500/50 ml-2 font-mono">{rowData.count} items</span>
            </div>
        );
    }

    const itemSize = width / columnCount;

    return (
        <div style={style} className="flex px-2">
            {rowData.items.map((file, i) => (
                <MediaItem
                    key={file ? file.id : `ghost-${index}-${i}`}
                    file={file}
                    size={itemSize}
                    onClick={onFileClick}
                    isSelected={file && selectedIds.has(file.id)}
                />
            ))}
        </div>
    );
};

export default function FileGrid({ onFileClick, selectedFiles = [] }) {
    const { files, loading } = useFileSystem();
    const selectedIds = useMemo(() => new Set(selectedFiles.map(f => f.id)), [selectedFiles]);

    const processedData = useMemo(() => {
        if (!files.length) return { rows: [], columnCount: 5 };

        const groups = {};
        files.forEach(file => {
            if (file.type === 'directory') return;
            const date = file.created_at ? format(new Date(file.created_at), 'MMMM d, yyyy') : 'Unknown Date';
            if (!groups[date]) groups[date] = [];
            groups[date].push(file);
        });

        const rows = [];
        const COLUMN_COUNT = 5;

        Object.keys(groups).forEach(date => {
            rows.push({ type: 'header', date, count: groups[date].length, height: 60 });

            const items = groups[date];
            for (let i = 0; i < items.length; i += COLUMN_COUNT) {
                const chunk = items.slice(i, i + COLUMN_COUNT);
                while (chunk.length < COLUMN_COUNT) chunk.push(null);
                rows.push({ type: 'row', items: chunk, height: 0 });
            }
        });

        return { rows, columnCount: COLUMN_COUNT };
    }, [files]);

    const getItemSize = (width) => (index) => {
        const row = processedData.rows[index];
        if (row.type === 'header') return 60;
        return width / processedData.columnCount;
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center text-yellow-500/50">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent mx-auto mb-4" style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}></div>
                    <p className="font-mono uppercase tracking-wider text-sm">Loading archives...</p>
                </div>
            </div>
        );
    }

    if (!files.length) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-yellow-500/50 gap-4">
                <svg className="w-24 h-24 text-yellow-500/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-mono uppercase">No archives found</p>
                <p className="text-sm text-yellow-500/30 font-mono">Drag & drop files or click upload to begin</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full w-full bg-[#0d0d0d]">
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        itemCount={processedData.rows.length}
                        itemSize={getItemSize(width)}
                        width={width}
                        itemData={{
                            rows: processedData.rows,
                            columnCount: processedData.columnCount,
                            width,
                            onFileClick,
                            selectedIds
                        }}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
}

