import React, { useState, useEffect, useRef } from 'react';
import { Download, Edit2, Trash2, Copy, Scissors, Star } from 'lucide-react';
import { getDownloadUrl } from '../../../../lib/api';
import FileIcon from './FileIcon';
import InputModal from '../../../../components/ui/InputModal';

export default function ContextMenu({ x, y, file, onClose, explorer }) {
    const menuRef = useRef(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [renameValue, setRenameValue] = useState(file ? file.name : '');
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showNewFolderModal) return; // Don't close if modal is open
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (isRenaming) {
                    setIsRenaming(false);
                } else {
                    onClose();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose, isRenaming]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleDownload = () => {
        const url = getDownloadUrl(file.id);
        window.open(url, '_blank');
        onClose();
    };

    const handleDelete = async () => {
        if (confirm(`Delete "${file.name}"?`)) {
            await explorer.handleDelete([file.id]);
            onClose();
        }
    };

    const handleRenameSubmit = async (e) => {
        e.preventDefault();
        if (renameValue && renameValue !== file.name) {
            const success = await explorer.handleRename(file, renameValue);
            if (success) {
                onClose();
            }
        } else {
            setIsRenaming(false);
        }
    };

    const startRename = () => {
        setIsRenaming(true);
    };

    const handleCopy = async () => {
        try {
            // Copy file path to clipboard
            const textToCopy = file.path || file.name;
            await navigator.clipboard.writeText(textToCopy);
            onClose();
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = file.path || file.name;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                onClose();
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
        }
    };

    // Adjust position if menu would go off-screen
    const adjustedStyle = {
        top: y,
        left: x
    };

    if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            adjustedStyle.left = window.innerWidth - rect.width - 10;
        }
        if (rect.bottom > window.innerHeight) {
            adjustedStyle.top = window.innerHeight - rect.height - 10;
        }
    }

    // BACKGROUND MENU (No file selected)
    if (!file) {
        return (
            <>
                <div
                    ref={menuRef}
                    className="fixed bg-[#0f0f0f] border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.2)] py-1 rounded-sm w-56 z-[100] backdrop-blur-md"
                    style={adjustedStyle}
                >
                    <div className="px-3 py-2 border-b border-cyan-900/30 mb-1 flex items-center gap-2 bg-cyan-950/20">
                        <span className="text-xs font-bold text-cyan-200">Folder Options</span>
                    </div>
                    <MenuOption icon={Star} label="New Folder" onClick={() => setShowNewFolderModal(true)} />
                    <MenuOption icon={Download} label="Upload Files" onClick={() => { document.getElementById('upload-trigger')?.click(); onClose(); }} />
                    <div className="h-px bg-cyan-900/30 my-1 mx-2"></div>
                    <MenuOption icon={Scissors} label="Refresh" onClick={() => { explorer.navigate(explorer.currentPath); onClose(); }} />
                </div>

                <InputModal
                    isOpen={showNewFolderModal}
                    title="New Folder"
                    placeholder="Enter folder name..."
                    onClose={() => { setShowNewFolderModal(false); onClose(); }}
                    onSubmit={(name) => {
                        explorer.handleCreateFolder(name);
                        setShowNewFolderModal(false);
                        onClose();
                    }}
                />
            </>
        );
    }

    return (
        <div
            ref={menuRef}
            className="fixed bg-[#0f0f0f] border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.2)] py-1 rounded-sm w-64 z-[100] backdrop-blur-md"
            style={adjustedStyle}
        >
            {/* Header */}
            <div className="px-3 py-2 border-b border-cyan-900/30 mb-1 flex items-center gap-2 bg-cyan-950/20">
                <FileIcon file={file} size={16} />
                {isRenaming ? (
                    <form onSubmit={handleRenameSubmit} className="flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => setIsRenaming(false)}
                            className="w-full bg-black/50 border border-cyan-500/50 rounded px-2 py-0.5 text-xs text-cyan-100 focus:border-cyan-400 outline-none"
                        />
                    </form>
                ) : (
                    <span className="text-xs font-bold text-cyan-200 truncate">{file.name}</span>
                )}
            </div>

            {/* Menu Options */}
            {!isRenaming && (
                <>
                    {file.type !== 'directory' && (
                        <MenuOption icon={Download} label="Download" onClick={handleDownload} />
                    )}
                    <MenuOption icon={Edit2} label="Rename" onClick={startRename} />
                    <MenuOption icon={Copy} label="Copy Path" onClick={handleCopy} />

                    <div className="h-px bg-cyan-900/30 my-1 mx-2"></div>

                    <MenuOption
                        icon={Trash2}
                        label="Delete"
                        onClick={handleDelete}
                        color="text-red-400 hover:bg-red-900/20"
                    />
                </>
            )}
        </div>
    );
}

const MenuOption = ({ icon: Icon, label, onClick, color = 'text-cyan-200' }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 hover:bg-cyan-900/20 ${color} flex items-center gap-3 text-xs transition-all font-medium tracking-wide group`}
    >
        <Icon size={14} className="group-hover:scale-110 transition-transform" />
        {label}
    </button>
);
