import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import FileGrid from './components/FileGrid';
import Albums from './components/Albums';
import Uploader from './components/Uploader';
import Login from './components/Login';
import Settings from './components/Settings';
import MediaViewer from './components/MediaViewer';
import SearchModal from './components/SearchModal';
import TagsPanel from './components/TagsPanel';
import ConfirmModal from './components/ConfirmModal';
import MobileNavBar from './components/MobileNavBar';
import FloatingActionGroup from './components/FloatingActionGroup';
import useFileSystem from './store/useFileSystem';
import useAuth from './store/useAuth';
import { Search, Settings as SettingsIcon, LogOut, Menu, Tag, Grid, List, Download, Trash2, ArrowLeft, CheckSquare } from 'lucide-react';
import { fetchFiles, fetchTimeline, downloadZip, deleteFiles, bulkFavorite, getAlbumFiles, restoreFiles } from './lib/api';

// Hook para detectar si estamos en modo desktop (ancho > 1024px)
const useIsDesktop = () => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isDesktop;
};

function App() {
    const isDesktop = useIsDesktop();
    const { files, loadFiles, setViewMode } = useFileSystem();
    const { token, logout, user } = useAuth();

    const [showSettings, setShowSettings] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]); // Multi-select
    const [view, setView] = useState('timeline');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedAlbum, setSelectedAlbum] = useState(null); // For album viewing
    const [selectionMode, setSelectionMode] = useState(false); // Mobile selection mode
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'warning' });
    const [showUploader, setShowUploader] = useState(false);

    // Initial Load
    useEffect(() => {
        if (token) handleNavigate('timeline');
    }, [token]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e) => {
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'k') { e.preventDefault(); setShowSearch(true); }
                if (e.key === 'a' && files.length) { e.preventDefault(); setSelectedFiles(files); }
            }

            // MediaViewer shortcuts
            if (selectedFile) {
                if (e.key === 'Escape') setSelectedFile(null);
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'ArrowLeft') handlePrev();
            }

            // Clear selection
            if (e.key === 'Escape' && !selectedFile) setSelectedFiles([]);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [selectedFile, files]);

    // Navigation
    const handleNavigate = useCallback(async (mode) => {
        setView(mode);
        setMobileMenuOpen(false);
        setSelectedFiles([]);
        setSelectedAlbum(null); // Clear album when navigating

        if (mode === 'timeline') {
            setViewMode('timeline');
            loadFiles('/');
        } else if (mode === 'favorites') {
            const data = await fetchFiles('/', { favorites: 'true' });
            useFileSystem.setState({ files: data.files, loading: false });
        } else if (mode === 'trash') {
            const data = await fetchFiles('/', { trash: 'true' });
            useFileSystem.setState({ files: data.files, loading: false });
        }
    }, [loadFiles, setViewMode]);

    // Album selection
    const handleAlbumSelect = async (album) => {
        setSelectedAlbum(album);
        const albumFiles = await getAlbumFiles(album.id);
        useFileSystem.setState({ files: albumFiles, loading: false });
    };

    // Back from album
    const handleBackFromAlbum = () => {
        setSelectedAlbum(null);
    };

    // MediaViewer navigation
    const handleNext = () => {
        if (!selectedFile || !files.length) return;
        const idx = files.findIndex(f => f.id === selectedFile.id);
        if (idx < files.length - 1) setSelectedFile(files[idx + 1]);
    };

    const handlePrev = () => {
        if (!selectedFile || !files.length) return;
        const idx = files.findIndex(f => f.id === selectedFile.id);
        if (idx > 0) setSelectedFile(files[idx - 1]);
    };

    const handleDeleteFromViewer = (id) => {
        useFileSystem.setState(state => ({ files: state.files.filter(f => f.id !== id) }));
        setSelectedFile(null);
    };

    // File selection for bulk ops
    const handleFileClick = (file, e) => {
        // In selection mode (mobile), always toggle selection
        if (selectionMode) {
            setSelectedFiles(prev =>
                prev.find(f => f.id === file.id)
                    ? prev.filter(f => f.id !== file.id)
                    : [...prev, file]
            );
            return;
        }

        // Desktop: Shift+Click for range select
        if (e?.shiftKey && selectedFiles.length > 0) {
            const lastIdx = files.findIndex(f => f.id === selectedFiles[selectedFiles.length - 1]?.id);
            const currIdx = files.findIndex(f => f.id === file.id);
            const [start, end] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
            setSelectedFiles(files.slice(start, end + 1));
        } else if (e?.ctrlKey || e?.metaKey) {
            // Desktop: Ctrl+Click to toggle
            setSelectedFiles(prev =>
                prev.find(f => f.id === file.id)
                    ? prev.filter(f => f.id !== file.id)
                    : [...prev, file]
            );
        } else {
            // Normal click - open viewer
            setSelectedFile(file);
        }
    };

    // Long press for mobile selection mode
    const handleLongPress = (file) => {
        if (!selectionMode) {
            setSelectionMode(true);
            setSelectedFiles([file]);
        }
    };

    // Exit selection mode
    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedFiles([]);
    };

    // Bulk actions
    const handleBulkDownload = async () => {
        if (selectedFiles.length === 0) return;
        await downloadZip(selectedFiles.map(f => f.id));
    };

    const handleBulkDelete = async () => {
        if (selectedFiles.length === 0) return;
        setConfirmModal({
            open: true,
            title: 'ELIMINAR ARCHIVOS',
            message: view === 'trash'
                ? `¿Estás seguro de eliminar estos ${selectedFiles.length} archivos permanentemente? Esta acción NO se puede deshacer.`
                : `¿Estás seguro de que quieres eliminar ${selectedFiles.length} archivo(s)? Esta acción moverá los archivos a la papelera.`,
            type: 'danger',
            onConfirm: async () => {
                const permanent = view === 'trash';
                await deleteFiles(selectedFiles.map(f => f.id), permanent);

                // Refresh view
                if (view === 'trash') {
                    loadFiles('trash');
                } else {
                    useFileSystem.setState(state => ({ files: state.files.filter(f => !selectedFiles.find(sf => sf.id === f.id)) }));
                }

                setSelectedFiles([]);
                exitSelectionMode();
                setConfirmModal(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleBulkFavorite = async () => {
        if (selectedFiles.length === 0) return;
        await bulkFavorite(selectedFiles.map(f => f.id), true);
        loadFiles('/');
        setSelectedFiles([]);
    };

    if (!token) return <Login />;

    return (
        <div className="flex h-screen bg-[#0d0d0d] text-yellow-100 overflow-hidden font-mono relative">

            {/* Modals */}
            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
            {showSearch && <SearchModal onClose={() => setShowSearch(false)} onSelect={setSelectedFile} />}
            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText="ELIMINAR"
                cancelText="CANCELAR"
            />
            {selectedFile && (
                <MediaViewer
                    file={selectedFile}
                    onClose={() => setSelectedFile(null)}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onDelete={handleDeleteFromViewer}
                />
            )}

            {/* Desktop: Sidebar | Mobile: FloatingActionGroup */}
            {isDesktop ? (
                <Sidebar onNavigate={handleNavigate} currentView={view} />
            ) : (
                <>
                    <FloatingActionGroup
                        onLogout={logout}
                        onSettings={() => setShowSettings(true)}
                        onTags={() => setShowTags(true)}
                        onSelectionMode={() => setSelectionMode(!selectionMode)}
                        onSearch={() => setShowSearch(true)}
                        selectionMode={selectionMode}
                    />
                    <MobileNavBar
                        onNavigate={handleNavigate}
                        currentView={view}
                        onUploadClick={() => setShowUploader(true)}
                    />
                </>
            )}

            <div className={`flex-1 flex flex-col h-full relative ${!isDesktop ? 'pb-24' : ''}`}>
                {/* Header - Cyberpunk 2077 Style */}
                <header className="h-14 border-b border-yellow-500/20 bg-[#0d0d0d]/90 backdrop-blur-md flex items-center justify-between px-4 z-10 shrink-0 relative">
                    {/* Gradient line on top */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-60" />

                    <div className="flex items-center gap-3">
                        <button className="md:hidden p-2 text-yellow-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <Menu className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowSearch(true)}
                            className="flex items-center gap-2 bg-black/80 border border-yellow-500/30 px-4 py-1.5 text-yellow-400/70 hover:text-yellow-300 hover:border-yellow-400/50 text-sm transition-all font-mono uppercase tracking-wider"
                            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden md:inline">SEARCH</span>
                            <kbd className="hidden lg:inline text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 border border-yellow-500/30">⌘K</kbd>
                        </button>
                    </div>

                    {/* Selection toolbar - Shows when files selected OR in selection mode */}
                    {(selectedFiles.length > 0 || selectionMode) && (
                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 px-3 py-1" style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
                            <span className="text-yellow-400 text-xs font-mono uppercase">
                                {selectionMode ? '📱 SELECCIÓN' : ''} [{selectedFiles.length}]
                            </span>
                            <div className="flex gap-1.5 ml-2">
                                {selectedFiles.length > 0 && (
                                    <>
                                        <button onClick={handleBulkFavorite} className="p-1.5 hover:bg-yellow-500/20 text-yellow-400 transition-colors" title="Add to favorites">★</button>
                                        <button onClick={handleBulkDownload} className="p-1.5 hover:bg-yellow-500/20 text-yellow-400 transition-colors" title="Download ZIP"><Download className="w-4 h-4" /></button>
                                        <button onClick={() => setShowTags(true)} className="p-1.5 hover:bg-orange-500/20 text-orange-400 transition-colors" title="Add tags"><Tag className="w-4 h-4" /></button>
                                        <button onClick={handleBulkDelete} className="p-1.5 hover:bg-red-500/20 text-red-400 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </>
                                )}
                                <button onClick={() => setSelectedFiles(files)} className="p-1.5 hover:bg-yellow-500/20 text-yellow-400 transition-colors" title="Seleccionar todo">ALL</button>
                                <button onClick={exitSelectionMode} className="p-1.5 hover:bg-red-500/20 text-red-400 ml-1" title="Salir">[X]</button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {/* Mobile selection mode toggle - shown only on desktop (mobile uses FAB) */}
                        <button
                            onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
                            className={`hidden lg:flex p-2 transition-colors ${selectionMode ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                            title={selectionMode ? 'Salir modo selección' : 'Modo selección'}
                        >
                            <CheckSquare className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowTags(!showTags)} className={`hidden lg:flex p-2 transition-colors ${showTags ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-orange-400'}`}>
                            <Tag className="w-4 h-4" />
                        </button>
                        <div className="hidden lg:flex items-center gap-2 mr-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-red-600 flex items-center justify-center font-bold text-black text-xs" style={{ clipPath: 'polygon(0 4px, 4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%)', boxShadow: '0 0 10px rgba(252, 211, 77, 0.5)' }}>
                                {user?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                        </div>
                        <button onClick={() => setShowSettings(true)} className="hidden lg:flex p-2 text-slate-500 hover:text-yellow-400 transition-colors">
                            <SettingsIcon className="w-4 h-4" />
                        </button>
                        <button onClick={logout} className="hidden lg:flex p-2 text-slate-500 hover:text-red-400 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden relative flex bg-[#0d0d0d] cyber-grid">
                    <div className="flex-1 overflow-hidden">
                        {view === 'albums' && !selectedAlbum ? (
                            <Albums onSelect={handleAlbumSelect} />
                        ) : view === 'albums' && selectedAlbum ? (
                            <div className="h-full flex flex-col">
                                <div className="p-4 border-b border-yellow-500/20 flex items-center gap-3">
                                    <button onClick={handleBackFromAlbum} className="p-2 hover:bg-yellow-500/10 rounded-lg text-yellow-400">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-xl font-bold text-yellow-400">{selectedAlbum.name}</h2>
                                    <span className="text-slate-500 text-sm">{files.length} items</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <FileGrid onFileClick={handleFileClick} selectedFiles={selectedFiles} />
                                </div>
                            </div>
                        ) : (
                            <FileGrid
                                onFileClick={handleFileClick}
                                selectedFiles={selectedFiles}
                            />
                        )}
                    </div>

                    {/* Tags Panel - Cyberpunk 2077 */}
                    {showTags && (
                        <div className="w-64 border-l border-yellow-500/20 p-4 overflow-auto bg-[#0d0d0d]">
                            <TagsPanel
                                selectedFiles={selectedFiles}
                                onTagsChanged={() => { loadFiles('/'); setSelectedFiles([]); }}
                            />
                        </div>
                    )}
                </main>

                {/* Uploader - always on desktop, conditional on mobile */}
                {(isDesktop || showUploader) && (
                    <div className={!isDesktop ? 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4' : ''}>
                        <Uploader onClose={() => setShowUploader(false)} showCloseButton={!isDesktop} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;

