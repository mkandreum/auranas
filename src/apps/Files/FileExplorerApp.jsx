import React, { useState, useEffect, useRef } from 'react';
import useFileSystem from '../../store/useFileSystem';
import useOS from '../../os/useOS';
import FileGrid from '../../components/FileGrid';
import {
    HardDrive, Folder, ChevronRight, ChevronLeft, ArrowUp, RefreshCw, Home, Loader2,
    Trash2, Download, Edit, Plus, Grid, List, Search, MoreVertical, LayoutGrid, FilePlus, Menu, X
} from 'lucide-react';
import { uploadFile } from '../../lib/fileTransfer';
import { deleteFiles, getDownloadUrl, createDirectory, renameFile } from '../../lib/api';

// --- SUBCOMPONENTS ---

const Breadcrumbs = ({ path, onNavigate }) => {
    const parts = path === '/' ? [] : path.split('/').filter(Boolean);
    return (
        <div className="flex items-center text-sm font-mono overflow-hidden whitespace-nowrap mask-fade">
            <button
                onClick={() => onNavigate('/')}
                className="hover:bg-white/10 p-1 rounded px-2 text-yellow-500 font-bold transition-colors"
            >
                NAS://
            </button>
            {parts.map((part, index) => {
                const fullPath = '/' + parts.slice(0, index + 1).join('/');
                return (
                    <React.Fragment key={fullPath}>
                        <ChevronRight size={14} className="text-gray-600 mx-0.5" />
                        <button
                            onClick={() => onNavigate(fullPath)}
                            className="hover:bg-white/10 p-1 px-2 rounded text-gray-300 hover:text-white transition-colors truncate max-w-[100px] md:max-w-[150px]"
                        >
                            {part}
                        </button>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default function FileExplorerApp() {
    const { loadFiles, files, currentPath, navigateUp, loading, error } = useFileSystem();
    const { openWindow } = useOS();

    // Local State
    const [viewMode, setViewMode] = useState('grid');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [isRenaming, setIsRenaming] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [statusMsg, setStatusMsg] = useState('');
    const [msgType, setMsgType] = useState('info');

    // Mobile State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const fileInputRef = useRef(null);
    const searchInputRef = useRef(null);

    // Initial Load
    useEffect(() => {
        loadFiles(currentPath);
        setMobileMenuOpen(false); // Close menu on nav
    }, [currentPath]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // --- ACTIONS (Same as before) ---
    const handleNavigate = (path) => loadFiles(path);

    const handleFileClick = (file) => {
        if (file.type === 'directory') {
            loadFiles(file.path);
        } else {
            const ext = file.name.split('.').pop().toLowerCase();
            const props = { title: file.name, params: { file } };
            const appMap = {
                'jpg': 'photos', 'jpeg': 'photos', 'png': 'photos', 'gif': 'photos', 'webp': 'photos',
                'mp3': 'music', 'wav': 'music', 'ogg': 'music',
                'mp4': 'video', 'mkv': 'video', 'webm': 'video', 'mov': 'video',
                'pdf': 'pdf',
                'txt': 'code', 'js': 'code', 'json': 'code', 'css': 'code', 'html': 'code', 'md': 'code', 'jsx': 'code'
            };
            const appId = appMap[ext] || 'code';
            openWindow(appId, props);
        }
    };

    const handleContextMenu = (e, file) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setStatusMsg(`Uploading ${file.name}...`);
        try {
            await uploadFile(file, currentPath, (pct) => setProgress(pct));
            await loadFiles(currentPath);
            setStatusMsg('Upload complete');
            setTimeout(() => setStatusMsg(''), 3000);
        } catch (error) {
            console.error(error);
            setMsgType('error');
            setStatusMsg(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleCreateFolder = async () => {
        const name = prompt("Enter folder name:", "New Folder");
        if (!name) return;
        try {
            await createDirectory(currentPath, name);
            loadFiles(currentPath);
        } catch (error) {
            alert("Failed to create folder: " + (error.message || "Unknown error"));
        }
    };

    const handleDelete = async () => {
        if (!contextMenu?.file) return;
        if (!confirm(`Permanently delete "${contextMenu.file.name}"?`)) return;
        try {
            await deleteFiles([contextMenu.file.id], true);
            loadFiles(currentPath);
        } catch (error) {
            alert("Delete failed: " + error.message);
        }
    };

    const startRename = () => {
        if (!contextMenu?.file) return;
        setIsRenaming(contextMenu.file.id);
        setRenameValue(contextMenu.file.name);
        setContextMenu(null);
    };

    const submitRename = async (e) => {
        e.preventDefault();
        if (!isRenaming) return;
        try {
            await renameFile(isRenaming, renameValue);
            setIsRenaming(null);
            loadFiles(currentPath);
        } catch (error) {
            alert("Rename failed: " + error.message);
        }
    };

    const handleDownload = () => {
        if (!contextMenu?.file) return;
        const url = getDownloadUrl(contextMenu.file.id);
        window.open(url, '_blank');
    };

    const displayedFiles = files
        ? files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    return (
        <div className="flex h-full flex-col bg-[#1e1e1e] text-gray-200 font-sans text-sm select-none" onContextMenu={(e) => e.preventDefault()}>

            {/* --- TOP BAR --- */}
            <div className="h-14 bg-[#252526] border-b border-black flex items-center px-2 md:px-4 gap-2 md:gap-3 shadow-md z-10 shrink-0">
                {/* Mobile Menu Toggle */}
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-white/10 rounded">
                    <Menu size={20} />
                </button>

                {/* Navigation Controls */}
                <div className="flex items-center gap-1 hidden md:flex">
                    <button onClick={() => navigateUp()} disabled={currentPath === '/'} className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30 transition-colors">
                        <ArrowUp size={18} />
                    </button>
                    <button onClick={() => loadFiles(currentPath)} className="p-1.5 hover:bg-white/10 rounded transition-colors group">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'} />
                    </button>
                </div>

                {/* Address Bar */}
                <div className="flex-1 h-9 bg-[#1e1e1e] border border-[#3e3e42] rounded flex items-center px-3 hover:border-gray-500 transition-colors overflow-hidden">
                    <Breadcrumbs path={currentPath} onNavigate={handleNavigate} />
                </div>

                {/* Search (Icon only on mobile) */}
                <div className="relative">
                    <button className="md:hidden p-2 hover:bg-white/10 rounded"><Search size={18} /></button>
                    <div className="hidden md:block w-48 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-8 bg-[#1e1e1e] border border-[#3e3e42] rounded pl-9 pr-3 text-xs focus:border-yellow-500 outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* --- TOOLBAR --- */}
            <div className="h-10 bg-[#2d2d2d] border-b border-[#111] flex items-center px-2 md:px-4 gap-2 text-xs shrink-0 overflow-x-auto">
                <button onClick={handleCreateFolder} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded transition-colors text-gray-300 hover:text-white whitespace-nowrap">
                    <Plus size={14} /> <span className="">Folder</span>
                </button>

                <div className="h-4 w-px bg-gray-600 mx-2 hidden sm:block"></div>

                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded transition-colors text-gray-300 hover:text-white cursor-pointer relative overflow-hidden group whitespace-nowrap">
                    <FilePlus size={14} /> <span className="font-bold">Upload</span>
                    {uploading && <div className="absolute inset-0 bg-blue-500/20" style={{ width: `${progress}%` }}></div>}
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                </label>

                <div className="flex-1"></div>

                <div className="flex bg-[#1a1a1a] rounded p-0.5 border border-[#3e3e42] shrink-0">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                        <Grid size={14} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                        <List size={14} />
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Loader Overlay */}
                {loading && (
                    <div className="absolute top-2 right-4 z-20 flex items-center gap-2 text-xs text-yellow-500 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-yellow-500/30 font-mono animate-in fade-in">
                        <Loader2 size={12} className="animate-spin" /> ACCESSING...
                    </div>
                )}

                {/* Sidebar (Desktop) */}
                <div className="w-48 bg-[#252526] border-r border-[#111] flex flex-col py-4 hidden md:flex shrink-0">
                    <div className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Favorites</div>
                    <SidebarItems currentPath={currentPath} handleNavigate={handleNavigate} />
                </div>

                {/* Mobile Menu / Sidebar Drawer */}
                {mobileMenuOpen && (
                    <div className="absolute inset-0 z-50 flex md:hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                        <div className="w-64 bg-[#252526] h-full shadow-2xl relative flex flex-col pt-4 animate-in slide-in-from-left duration-200">
                            <div className="px-4 flex justify-between items-center mb-6">
                                <span className="font-bold text-yellow-500">NAVIGATION</span>
                                <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
                            </div>
                            <SidebarItems currentPath={currentPath} handleNavigate={handleNavigate} />
                        </div>
                    </div>
                )}

                {/* File View */}
                <div className="flex-1 bg-[#1e1e1e] overflow-y-auto overflow-x-hidden p-2" onClick={() => setContextMenu(null)}>
                    {error ? (
                        <div className="h-full flex flex-col items-center justify-center text-red-500 gap-2">
                            <div className="bg-red-900/20 p-4 rounded-full"><LayoutGrid size={48} /></div>
                            <p>Connection Error</p>
                        </div>
                    ) : (displayedFiles && displayedFiles.length > 0) ? (
                        viewMode === 'grid' ? (
                            <FileGrid
                                files={displayedFiles}
                                onFileClick={handleFileClick}
                                onContextMenu={handleContextMenu}
                            />
                        ) : (
                            // List View Mobile Optimized
                            <div className="flex flex-col gap-1 select-none">
                                <div className="grid grid-cols-12 text-[10px] uppercase text-gray-500 font-bold px-4 py-2 border-b border-[#3e3e42] sticky top-0 bg-[#1e1e1e] z-10">
                                    <div className="col-span-8 md:col-span-6">Name</div>
                                    <div className="hidden md:block col-span-3">Date</div>
                                    <div className="col-span-4 md:col-span-3 text-right md:text-left">Size</div>
                                </div>
                                {displayedFiles.map(file => (
                                    <div
                                        key={file.id}
                                        onClick={() => handleFileClick(file)}
                                        onContextMenu={(e) => handleContextMenu(e, file)}
                                        className="grid grid-cols-12 items-center px-4 py-3 md:py-2 hover:bg-[#2a2d2e] cursor-pointer rounded text-sm group border border-transparent hover:border-[#3e3e42] transition-all"
                                    >
                                        <div className="col-span-8 md:col-span-6 flex items-center gap-3 overflow-hidden">
                                            {file.type === 'directory' ? <Folder size={18} className="text-yellow-500 shrink-0" /> : <div className="w-4 h-4 bg-blue-500/20 rounded shrink-0"></div>}
                                            <span className="truncate text-gray-300 group-hover:text-white font-medium">{file.name}</span>
                                        </div>
                                        <div className="hidden md:block col-span-3 text-xs text-gray-500">
                                            {new Date(file.updatedAt || Date.now()).toLocaleDateString()}
                                        </div>
                                        <div className="col-span-4 md:col-span-3 text-xs text-gray-500 font-mono text-right md:text-left">
                                            {file.size ? (file.size / 1024).toFixed(1) + ' KB' : '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        !loading && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                <Folder size={64} strokeWidth={1} />
                                <p className="mt-4 text-sm font-mono">Empty</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* --- CONTEXT MENU (Mobile friendly?) --- */}
            {contextMenu && (
                <div
                    className="fixed bg-[#252526] border border-[#454545] shadow-2xl py-1 rounded w-56 z-[100]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <div className="px-3 py-2 border-b border-[#3e3e42] mb-1 flex items-center gap-2">
                        {contextMenu.file.type === 'directory' ? <Folder size={14} className="text-yellow-500" /> : <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>}
                        <span className="text-xs font-bold text-gray-200 truncate max-w-[150px]">{contextMenu.file.name}</span>
                    </div>
                    <MenuOption icon={Download} label="Download" onClick={handleDownload} />
                    <MenuOption icon={Edit} label="Rename" onClick={startRename} />
                    <div className="h-px bg-[#3e3e42] my-1"></div>
                    <MenuOption icon={Trash2} label="Delete" color="text-red-400" onClick={handleDelete} />
                </div>
            )}
        </div>
    );
}

// Helpers
const SidebarItems = ({ currentPath, handleNavigate }) => (
    <>
        <SidebarItem icon={Home} label="Root" active={currentPath === '/'} onClick={() => handleNavigate('/')} />
        <SidebarItem icon={Folder} label="Photos" active={currentPath === '/Photos'} onClick={() => handleNavigate('/Photos')} />
        <SidebarItem icon={Folder} label="Music" active={currentPath === '/Music'} onClick={() => handleNavigate('/Music')} />
        <SidebarItem icon={Folder} label="Videos" active={currentPath === '/Videos'} onClick={() => handleNavigate('/Videos')} />
        <SidebarItem icon={Folder} label="Documents" active={currentPath === '/Documents'} onClick={() => handleNavigate('/Documents')} />
    </>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`px-4 py-3 md:py-1.5 flex items-center gap-3 cursor-pointer text-sm transition-colors border-l-2
            ${active ? 'bg-[#37373d] text-white border-yellow-500' : 'text-gray-400 hover:text-white border-transparent hover:bg-white/5'}
        `}
    >
        <Icon size={18} className={active ? 'text-yellow-500' : ''} />
        {label}
    </div>
);

const MenuOption = ({ icon: Icon, label, onClick, color = 'text-gray-200' }) => (
    <button onClick={onClick} className={`w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white ${color} flex items-center gap-3 text-sm transition-colors`}>
        <Icon size={14} /> {label}
    </button>
);
