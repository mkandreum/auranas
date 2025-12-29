import { useState, useEffect, useCallback } from 'react';
import useFileSystem from '../../../store/useFileSystem';
import useOS from '../../../os/useOS';
import { deleteFiles, createDirectory, renameFile, uploadFile } from '../../../lib/api';

export default function useFileExplorer(initialPath = '/') {
    // Core System Hooks
    const { loadFiles, files, currentPath, navigateUp, loading, error } = useFileSystem();
    const { openWindow } = useOS();

    // Local State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [selection, setSelection] = useState([]); // Array of file IDs
    const [history, setHistory] = useState([initialPath]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Operation State
    const [statusMsg, setStatusMsg] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Initial Load
    useEffect(() => {
        loadFiles(currentPath);
        // Reset selection on path change
        setSelection([]);
    }, [currentPath]);

    // Navigation Wrappers
    const navigate = useCallback((path) => {
        if (path === currentPath) return;
        loadFiles(path);
        // Simple history tracking (could be improved)
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [currentPath, history, historyIndex, loadFiles]);

    const goBack = useCallback(() => {
        if (historyIndex > 0) {
            const prevPath = history[historyIndex - 1];
            loadFiles(prevPath);
            setHistoryIndex(historyIndex - 1);
        }
    }, [history, historyIndex, loadFiles]);

    const goForward = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextPath = history[historyIndex + 1];
            loadFiles(nextPath);
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex, loadFiles]);

    const goUp = useCallback(() => {
        if (currentPath !== '/') {
            navigateUp();
            // Up is separate from back/forward history usually, or treated as a new nav
        }
    }, [currentPath, navigateUp]);

    // Selection Handling
    const toggleSelection = (fileId, multiSelect = false) => {
        setSelection(prev => {
            if (multiSelect) {
                return prev.includes(fileId)
                    ? prev.filter(id => id !== fileId)
                    : [...prev, fileId];
            }
            return [fileId];
        });
    };

    const clearSelection = () => setSelection([]);

    // File Operations
    const handleOpen = (file) => {
        if (file.type === 'directory') {
            navigate(file.path);
        } else {
            const ext = file.name.split('.').pop().toLowerCase();
            const props = { title: file.name, params: { file } };
            // Simple mapping - can be expanded
            const appMap = {
                'jpg': 'photos', 'png': 'photos', 'gif': 'photos', 'mp4': 'video',
                'mp3': 'music', 'txt': 'code', 'js': 'code', 'json': 'code'
            };
            openWindow(appMap[ext] || 'code', props);
        }
    };

    const handleCreateFolder = async (name) => {
        if (!name) return;
        try {
            await createDirectory(currentPath, name);
            loadFiles(currentPath);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const handleDelete = async (fileIds) => {
        if (!fileIds.length) return;
        try {
            await deleteFiles(fileIds, true); // Perm delete for now
            loadFiles(currentPath);
            setSelection([]);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        setStatusMsg(`Uploading ${file.name}...`);
        try {
            await uploadFile(file, currentPath, setProgress);
            await loadFiles(currentPath);
            setStatusMsg('Upload complete');
        } catch (e) {
            setStatusMsg('Error uploading');
            console.error(e);
        } finally {
            setUploading(false);
            setTimeout(() => setStatusMsg(''), 2000);
        }
    };

    const handleRename = async (file, newName) => {
        if (!file || !newName || file.name === newName) return;
        try {
            await renameFile(file.id, newName);
            loadFiles(currentPath);
            setSelection([]); // Clear selection to avoid confusion
            return true;
        } catch (e) {
            console.error(e);
            setStatusMsg('Error renaming file');
            setTimeout(() => setStatusMsg(''), 2000);
            return false;
        }
    };

    // Filtered Files
    const displayedFiles = files
        ? files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    return {
        // State
        currentPath,
        files: displayedFiles,
        loading,
        error,
        viewMode,
        selection,
        searchTerm,
        statusMsg,
        uploading,
        progress,
        historyState: { canBack: historyIndex > 0, canForward: historyIndex < history.length - 1 },

        // Setters
        setViewMode,
        setSearchTerm,
        toggleSelection,
        clearSelection,

        // Actions
        navigate,
        goBack,
        goForward,
        goUp,
        handleOpen,
        handleCreateFolder,
        handleDelete,
        handleRename,
        handleUpload
    };
}
