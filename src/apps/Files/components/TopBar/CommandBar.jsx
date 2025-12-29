import React from 'react';
import {
    FolderPlus, FilePlus, Copy, Scissors, Trash2,
    Grid, List, SlidersHorizontal, Download, Edit2, Menu
} from 'lucide-react';

export default function CommandBar({
    onCreateFolder,
    onUpload,
    onDelete,
    viewMode,
    setViewMode,
    uploading,
    progress,
    selectionCount,
    onMobileMenuToggle
}) {
    const fileInputRef = React.useRef(null);

    return (
        <div className="h-12 bg-[#1a1a1a]/50 border-b border-cyan-900/30 flex items-center px-4 gap-2 overflow-x-auto scroller-none">

            <button onClick={onMobileMenuToggle} className="md:hidden p-2 text-cyan-500 hover:bg-cyan-500/10 rounded mr-2">
                <Menu size={20} />
            </button>

            {/* Creation Group */}
            <div className="flex items-center gap-1 pr-2 border-r border-gray-800">
                <ToolbarButton icon={FolderPlus} label="New Folder" onClick={onCreateFolder} primary />
                <div className="relative">
                    <ToolbarButton icon={FilePlus} label={uploading ? `${progress}%` : "Upload"} onClick={() => fileInputRef.current?.click()} />
                    <input ref={fileInputRef} type="file" className="hidden" onChange={onUpload} />
                    {uploading && <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />}
                </div>
            </div>

            {/* Action Group */}
            <div className="flex items-center gap-1 px-2 border-r border-gray-800">
                <ToolbarButton icon={Edit2} onClick={() => { }} disabled={selectionCount !== 1} title="Rename" />
                <ToolbarButton icon={Copy} onClick={() => { }} disabled={selectionCount === 0} title="Copy" />
                <ToolbarButton icon={Scissors} onClick={() => { }} disabled={selectionCount === 0} title="Cut" />
                <ToolbarButton icon={Trash2} onClick={onDelete} disabled={selectionCount === 0} color="text-red-500 hover:text-red-400" title="Delete" />
            </div>

            {/* View Group */}
            <div className="flex items-center gap-1 px-2">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-cyan-900/30 text-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <Grid size={18} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-cyan-900/30 text-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <List size={18} />
                </button>
            </div>

        </div>
    );
}

const ToolbarButton = ({ icon: Icon, label, onClick, disabled, primary, color = "text-gray-300", title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
            flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all text-xs font-medium uppercase tracking-wider
            ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/5 active:scale-95'}
            ${primary ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]' : color}
        `}
    >
        <Icon size={16} />
        {label && <span className="hidden lg:inline">{label}</span>}
    </button>
);
