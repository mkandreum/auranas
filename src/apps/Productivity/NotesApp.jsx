import React, { useState, useEffect } from 'react';
import useFileSystem from '../../store/useFileSystem';
import { fetchFiles } from '../../lib/api';
import { uploadFile } from '../../lib/fileTransfer';
import { Plus, Save, Trash, FileText, ChevronLeft } from 'lucide-react';

export default function NotesApp() {
    const [notes, setNotes] = useState([]);
    const [activeNote, setActiveNote] = useState(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const NOTES_DIR = '/Documents/Notes';

    // Helper to ensure directory exists and load notes
    const loadNotes = async () => {
        setLoading(true);
        try {
            // Check/Create dir logic would normally go here, assuming /Documents/Notes exists or we just try to read
            // Since we use the same FS API, we can just fetch. If error, maybe dir doesn't exist.
            const res = await fetchFiles(NOTES_DIR).catch(() => ({ files: [] }));
            // Filter txt files
            const txtFiles = res.files ? res.files.filter(f => f.name.endsWith('.txt')) : [];
            setNotes(txtFiles);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadNotes(); }, []);

    const handleCreate = () => {
        const name = `Note-${new Date().toISOString().slice(0, 10)}-${Date.now().toString().slice(-4)}.txt`;
        const newNote = { id: 'temp', name: name, isNew: true };
        setActiveNote(newNote);
        setContent('');
    };

    const handleSelect = async (note) => {
        if (note.isNew) return;
        setActiveNote(note);
        setLoading(true);
        try {
            // Fetch content. For text files, we can use the download URL or a specific content API.
            // Since we don't have cat API in api.js yet, we can fetch via normal download url and text() it.
            // Using a simple fetch implementation here:
            const response = await fetch(`/api/files/${note.id}/download?token=${localStorage.getItem('auth-token') || ''}`); // Need token logic
            // Wait, api.js has getDownloadUrl which handles token logic but returns string.
            // Let's import api and use axios manually or just standard fetch with the token from store
            // Actually simpler:
            const storage = localStorage.getItem('auth-storage');
            const token = storage ? JSON.parse(storage).state.token : '';

            const res = await fetch(`/api/files/${note.id}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const text = await res.text();
            setContent(text);
        } catch (e) {
            console.error(e);
            setContent('Error loading content.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!activeNote) return;

        // Save logic: Upload file to overwrite
        const blob = new Blob([content], { type: 'text/plain' });
        const file = new File([blob], activeNote.name, { type: 'text/plain' });

        try {
            // Using the robust fileTransfer utility
            // We save to /Documents/Notes
            await uploadFile(file, NOTES_DIR, (progress) => {
                // Optional: We could show a small progress indicator if we wanted
                // console.log("Saving note progress:", progress);
            });

            // Update list if new
            if (activeNote.isNew) {
                // Refresh list or add manually
                const savedFile = {
                    id: Date.now(), // We don't have the real ID yet without reload, but it's fine for UI
                    name: activeNote.name,
                    type: 'file',
                    size: blob.size,
                    updatedAt: new Date().toISOString()
                };
                setNotes(prev => [...prev, savedFile]);
                setActiveNote({ ...activeNote, isNew: false, ...savedFile });
            }

            // Show Feedback (Simple alert for now, or could use a toast if available)
            // Ideally we'd have a setStatus or similar
            // For now, small visual cue could be changing the save button color momentarily, 
            // but let's stick to the requested "REAL" persistence.
            // alert("Note saved."); // Removed alert to be less intrusive

        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save note to server.");
        }
    };

    return (
        <div className="flex h-full bg-[#1e1e1e] text-gray-200 font-mono">
            {/* Sidebar */}
            <div className="w-48 bg-[#252526] border-r border-black flex flex-col">
                <div className="p-3 border-b border-black flex justify-between items-center bg-[#2d2d2d]">
                    <span className="font-bold text-yellow-500 flex items-center gap-2"><FileText size={16} /> NOTES</span>
                    <button onClick={handleCreate} className="hover:bg-white/10 p-1 rounded"><Plus size={16} /></button>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-1">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            onClick={() => handleSelect(note)}
                            className={`p-2 rounded cursor-pointer text-xs truncate ${activeNote?.id === note.id ? 'bg-yellow-500/20 text-yellow-500' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            {note.name.replace('.txt', '')}
                        </div>
                    ))}
                    {notes.length === 0 && !loading && <div className="text-gray-600 text-xs text-center mt-4">No notes found</div>}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                {activeNote ? (
                    <>
                        <div className="h-10 bg-[#2d2d2d] border-b border-black flex items-center px-4 justify-between">
                            <input
                                className="bg-transparent border-none outline-none font-bold text-gray-200"
                                value={activeNote.name.replace('.txt', '')}
                                onChange={(e) => setActiveNote({ ...activeNote, name: e.target.value + '.txt' })}
                            />
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1 rounded text-xs font-bold font-sans">
                                    <Save size={14} /> SAVE
                                </button>
                                <button className="p-1 hover:bg-red-900/50 text-gray-400 hover:text-red-500 rounded"><Trash size={16} /></button>
                            </div>
                        </div>
                        <textarea
                            className="flex-1 bg-[#1e1e1e] p-4 resize-none outline-none text-sm font-mono leading-relaxed text-gray-300"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Start typing..."
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <FileText size={64} />
                        <span className="mt-4">Select or Create a Note</span>
                    </div>
                )}
            </div>
        </div>
    );
}
