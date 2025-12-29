import React, { useState } from 'react';
import useFileExplorer from './hooks/useFileExplorer';
import ExplorerLayout from './components/ExplorerLayout';
import CommandBar from './components/TopBar/CommandBar';
import AddressBar from './components/TopBar/AddressBar';
import NavigationPane from './components/Sidebar/NavigationPane';
import FileView from './components/FileList/FileView';
import StatusBar from './components/StatusBar';

import ContextMenu from './components/FileList/ContextMenu';

export default function FileExplorerApp({ initialPath = '/' }) {
    const explorer = useFileExplorer(initialPath);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState(null); // { x, y, file }

    const handleContextMenu = (e, file) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            file
        });
    };

    return (
        <>
            <ExplorerLayout
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}

                // --- TOP BAR ---
                topBar={
                    <div className="flex flex-col">
                        <CommandBar
                            onCreateFolder={() => explorer.handleCreateFolder(prompt("Enter folder name:"))}
                            onUpload={(e) => explorer.handleUpload(e.target.files[0])}
                            onDelete={() => {
                                if (confirm("Delete selected items?")) explorer.handleDelete(explorer.selection);
                            }}
                            viewMode={explorer.viewMode}
                            setViewMode={explorer.setViewMode}
                            uploading={explorer.uploading}
                            progress={explorer.progress}
                            selectionCount={explorer.selection.length}
                            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                        />
                        <AddressBar
                            currentPath={explorer.currentPath}
                            onNavigate={explorer.navigate}
                            onRefresh={() => explorer.navigate(explorer.currentPath)}
                            loading={explorer.loading}
                            searchTerm={explorer.searchTerm}
                            onSearchChange={explorer.setSearchTerm}
                            historyState={explorer.historyState}
                            onBack={explorer.goBack}
                            onForward={explorer.goForward}
                            onUp={explorer.goUp}
                        />
                    </div>
                }

                // --- SIDEBAR ---
                sideBar={
                    <NavigationPane
                        currentPath={explorer.currentPath}
                        onNavigate={explorer.navigate}
                    />
                }

                // --- MAIN CONTENT ---
                mainContent={
                    <FileView
                        files={explorer.files}
                        viewMode={explorer.viewMode}
                        selection={explorer.selection}
                        onFileClick={explorer.handleOpen}
                        onSelectionChange={explorer.toggleSelection}
                        onContextMenu={handleContextMenu}
                    />
                }

                // --- STATUS BAR ---
                statusBar={
                    <StatusBar
                        fileCount={explorer.files ? explorer.files.length : 0}
                        selectedCount={explorer.selection.length}
                        loading={explorer.loading}
                    />
                }
            />

            {/* CONTEXT MENU LAYER */}
            {contextMenu && (
                <ContextMenu
                    {...contextMenu}
                    onClose={() => setContextMenu(null)}
                    explorer={explorer}
                />
            )}
        </>
    );
}
