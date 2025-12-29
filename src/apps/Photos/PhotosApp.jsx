import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import FileGrid from '../../components/FileGrid';
import Albums from '../../components/Albums';
import Uploader from '../../components/Uploader';
import Settings from '../../components/Settings';
import MediaViewer from '../../components/MediaViewer';
import SearchModal from '../../components/SearchModal';
import TagsPanel from '../../components/TagsPanel';
import ConfirmModal from '../../components/ConfirmModal';
import useFileSystem from '../../store/useFileSystem';
import useAuth from '../../store/useAuth';
import { Search, Settings as SettingsIcon, LogOut, Menu, Tag, Download, Trash2, ArrowLeft, CheckSquare } from 'lucide-react';
import { fetchFiles, downloadZip, deleteFiles, bulkFavorite, getAlbumFiles } from '../../lib/api';

// Simplified for Windowed Mode - Always treat as "Desktop" layout for now inside the window
// or we can use container query equivalent later.
const isDesktop = true;

export default function PhotosApp() {
    const { files, loadFiles, setViewMode } = useFileSystem();
    const { user } = useAuth(); // We might not need logout here if OS handles it

    // Upload refs
    const fileInputRef = React.useRef(null);

    const [showSettings, setShowSettings] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [view, setView] = useState('timeline');
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'warning' });
    const [showUploader, setShowUploader] = useState(false);
    const [initialUploadFiles, setInitialUploadFiles] = useState([]);

    // Initial Load
    useEffect(() => {
        handleNavigate('timeline');
    }, []);

    // Keyboard shortcuts (Scoping to window might be tricky with global listeners, 
    // ideally should attach to window container, but for now global is okay if focused)
    useEffect(() => {
        const handleKey = (e) => {
            // Global shortcuts
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'k') { e.preventDefault(); setShowSearch(true); }
                if (e.key === 'a' && files.length) { e.preventDefault(); setSelectedFiles(files); }
            }
            if (selectedFile) {
                if (e.key === 'Escape') setSelectedFile(null);
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'ArrowLeft') handlePrev();
            }
            if (e.key === 'Escape' && !selectedFile) setSelectedFiles([]);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [selectedFile, files]);

    // Navigation
    const handleNavigate = useCallback(async (mode) => {
        setView(mode);
        setSelectedFiles([]);
        setSelectedAlbum(null);

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

    const handleAlbumSelect = async (album) => {
        setSelectedAlbum(album);
        const albumFiles = await getAlbumFiles(album.id);
        useFileSystem.setState({ files: albumFiles, loading: false });
    };

    const handleBackFromAlbum = () => {
        setSelectedAlbum(null);
    };

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

    const handleFileClick = (file, e) => {
        if (e?.shiftKey && selectedFiles.length > 0) {
            const lastIdx = files.findIndex(f => f.id === selectedFiles[selectedFiles.length - 1]?.id);
            const currIdx = files.findIndex(f => f.id === file.id);
            const [start, end] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
            setSelectedFiles(files.slice(start, end + 1));
        } else if (e?.ctrlKey || e?.metaKey) {
            setSelectedFiles(prev =>
                prev.find(f => f.id === file.id)
                    ? prev.filter(f => f.id !== file.id)
                    : [...prev, file]
            );
        } else {
            setSelectedFile(file);
        }
    };

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
                ? `¿Estás seguro de eliminar estos ${selectedFiles.length} archivos permanentemente?`
                : `¿Estás seguro de que quieres eliminar ${selectedFiles.length} archivo(s)?`,
            type: 'danger',
            onConfirm: async () => {
                const permanent = view === 'trash';
                await deleteFiles(selectedFiles.map(f => f.id), permanent);
                if (view === 'trash') {
                    loadFiles('trash');
                } else {
                    useFileSystem.setState(state => ({ files: state.files.filter(f => !selectedFiles.find(sf => sf.id === f.id)) }));
                }
                setSelectedFiles([]);
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

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setInitialUploadFiles(e.target.files);
            setShowUploader(true);
        }
    };

    return (
        <div className="flex h-full bg-[#0d0d0d] text-yellow-100 overflow-hidden font-mono relative">
            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
            {showSearch && <SearchModal onClose={() => setShowSearch(false)} onSelect={setSelectedFile} />}
            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
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

            <Sidebar onNavigate={handleNavigate} currentView={view} />

            <div className="flex-1 flex flex-col h-full relative">
                {/* App Header (Toolbar) */}
                <header className="h-12 border-b border-yellow-500/20 bg-[#0d0d0d] flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="flex items-center gap-2 bg-white/5 border border-yellow-500/30 px-3 py-1 text-yellow-400/70 hover:text-yellow-300 text-xs transition-all uppercase"
                        >
                            <Search className="w-3 h-3" />
                            <span>SEARCH</span>
                        </button>
                    </div>

                    {(selectedFiles.length > 0) && (
                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 px-3 py-1">
                            <span className="text-yellow-400 text-xs uppercase">[{selectedFiles.length}] SELECTED</span>
                            <div className="flex gap-1 ml-2">
                                <button onClick={handleBulkFavorite} className="p-1 hover:bg-yellow-500/20 text-yellow-400">★</button>
                                <button onClick={handleBulkDownload} className="p-1 hover:bg-yellow-500/20 text-yellow-400"><Download className="w-3 h-3" /></button>
                                <button onClick={() => setShowTags(true)} className="p-1 hover:bg-orange-500/20 text-orange-400"><Tag className="w-3 h-3" /></button>
                                <button onClick={handleBulkDelete} className="p-1 hover:bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3" /></button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            hidden
                        />
                        <button onClick={handleUploadClick} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded" title="Upload">
                            <Download className="w-4 h-4 rotate-180" />
                        </button>
                        <button onClick={() => setShowTags(!showTags)} className={`p-2 transition-colors ${showTags ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-orange-400'}`}>
                            <Tag className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-yellow-400 transition-colors">
                            <SettingsIcon className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative flex bg-[#0d0d0d]">
                    <div className="flex-1 overflow-hidden">
                        {view === 'albums' && !selectedAlbum ? (
                            <Albums onSelect={handleAlbumSelect} />
                        ) : view === 'albums' && selectedAlbum ? (
                            <div className="h-full flex flex-col">
                                <div className="p-4 border-b border-yellow-500/20 flex items-center gap-3">
                                    <button onClick={handleBackFromAlbum} className="p-2 hover:bg-yellow-500/10 rounded text-yellow-400">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <h2 className="text-lg font-bold text-yellow-400">{selectedAlbum.name}</h2>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <FileGrid onFileClick={handleFileClick} selectedFiles={selectedFiles} />
                                </div>
                            </div>
                        ) : (
                            <FileGrid onFileClick={handleFileClick} selectedFiles={selectedFiles} />
                        )}
                    </div>

                    {showTags && (
                        <div className="w-64 border-l border-yellow-500/20 p-4 overflow-auto bg-[#0d0d0d]">
                            <TagsPanel
                                selectedFiles={selectedFiles}
                                onTagsChanged={() => { loadFiles('/'); setSelectedFiles([]); }}
                            />
                        </div>
                    )}
                </main>

                {showUploader && (
                    <div className="absolute bottom-4 right-4 z-50">
                        <Uploader
                            onClose={() => { setShowUploader(false); setInitialUploadFiles([]); }}
                            showCloseButton={true}
                            initialFiles={initialUploadFiles}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
