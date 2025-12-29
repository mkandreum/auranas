import React from 'react';
import FileIcon from './FileIcon';

export default function FileView({
    files,
    viewMode,
    selection,
    onFileClick,
    onSelectionChange,
    onContextMenu
}) {
    const handleBackgroundClick = (e) => {
        // If clicking background (not file), ensure context menu can still close or trigger background menu
        if (e.target === e.currentTarget) {
            onSelectionChange?.([], false);
        }
    };

    const handleItemClick = (e, file) => {
        e.stopPropagation();

        // Multi-select logic (Ctrl/Cmd)
        // For simple mobile/touch, we might just select on click if not opening
        const isMulti = e.ctrlKey || e.metaKey;

        onSelectionChange?.(file.id, isMulti);

        // Double click equivalent for now is just handle via parent (or we add dblclick handler)
        // Here we just select, parent handles navigation if it's a directory or open if file
    };

    const handleDoubleClick = (e, file) => {
        e.stopPropagation();
        onFileClick(file);
    };

    if (!files || files.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-cyan-900/40 select-none" onClick={handleBackgroundClick}>
                <div className="w-24 h-24 border border-cyan-900/30 rounded flex items-center justify-center mb-4">
                    <div className="w-16 h-1 bg-cyan-900/30 rotate-45"></div>
                    <div className="w-16 h-1 bg-cyan-900/30 -rotate-45 absolute"></div>
                </div>
                <p className="font-mono text-sm tracking-widest">NO_DATA_FOUND</p>
                <div className="text-[10px] opacity-50 mt-2">DIRECTORY IS EMPTY</div>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="p-2 min-h-full" onClick={handleBackgroundClick}>
                {/* Header */}
                <div className="grid grid-cols-12 px-4 py-2 text-[10px] uppercase font-bold text-cyan-700 border-b border-cyan-900/30 select-none sticky top-0 bg-[#0f0f0f]/90 backdrop-blur z-10">
                    <div className="col-span-6 md:col-span-6">Name</div>
                    <div className="col-span-3 md:col-span-4">Date Modified</div>
                    <div className="col-span-3 md:col-span-2 text-right">Size</div>
                </div>
                {/* List Items */}
                <div className="flex flex-col gap-[1px] mt-1">
                    {files.map(file => {
                        const isSelected = selection.includes(file.id);
                        return (
                            <div
                                key={file.id}
                                onClick={(e) => handleItemClick(e, file)}
                                onDoubleClick={(e) => handleDoubleClick(e, file)}
                                onContextMenu={(e) => onContextMenu?.(e, file)}
                                className={`
                                    grid grid-cols-12 items-center px-4 py-2 cursor-pointer transition-all border border-transparent
                                    ${isSelected
                                        ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-100 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]'
                                        : 'hover:bg-white/5 hover:border-white/5 text-gray-400'}
                                `}
                            >
                                <div className="col-span-6 md:col-span-6 flex items-center gap-3 overflow-hidden">
                                    <FileIcon file={file} size={16} />
                                    <span className={`truncate text-sm font-medium ${isSelected ? 'text-cyan-200' : ''}`}>{file.name}</span>
                                </div>
                                <div className="col-span-3 md:col-span-4 text-xs font-mono opacity-70">
                                    {new Date(file.updatedAt || Date.now()).toLocaleDateString()}
                                </div>
                                <div className="col-span-3 md:col-span-2 text-xs font-mono opacity-70 text-right">
                                    {file.size ? (file.size / 1024).toFixed(1) + ' KB' : '-'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // GRID VIEW
    return (
        <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 content-start min-h-full" onClick={handleBackgroundClick}>
            {files.map(file => {
                const isSelected = selection.includes(file.id);
                return (
                    <div
                        key={file.id}
                        onClick={(e) => handleItemClick(e, file)}
                        onDoubleClick={(e) => handleDoubleClick(e, file)}
                        onContextMenu={(e) => onContextMenu?.(e, file)}
                        className={`
                            group flex flex-col items-center p-3 rounded-sm cursor-pointer border transition-all duration-200 relative overflow-hidden
                            ${isSelected
                                ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}
                        `}
                    >
                        {/* Selection Corner Accent */}
                        {isSelected && <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400"></div>}
                        {isSelected && <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400"></div>}

                        <FileIcon file={file} size={42} className="mb-3 transition-transform group-hover:scale-105" />

                        <span className={`
                            text-xs text-center break-all line-clamp-2 px-1 rounded
                            ${isSelected ? 'text-cyan-100 font-semibold bg-cyan-950/50' : 'text-gray-300 group-hover:text-white'}
                        `}>
                            {file.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
