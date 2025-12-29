import React, { useState } from 'react';
import { Plus, Trash2, Save, FileText } from 'lucide-react';

export default function NotesApp() {
    const [notes, setNotes] = useState([
        { id: 1, title: 'Project Aurora', content: '# Project Aurora\n\nObjective: Create the ultimate web desktop.\n\n- [x] Boot sequence\n- [x] Kernel initialization\n- [ ] UI Polish' },
        { id: 2, title: 'Groceries', content: '- Synthetic Milk\n- Ramen packs\n- Energy drinks' }
    ]);
    const [activeNoteId, setActiveNoteId] = useState(1);

    const activeNote = notes.find(n => n.id === activeNoteId);

    const updateNote = (content) => {
        setNotes(notes.map(n => n.id === activeNoteId ? { ...n, content } : n));
    };

    const createNote = () => {
        const newNote = { id: Date.now(), title: 'New Entry', content: '# New Entry\n\nStart typing...' };
        setNotes([...notes, newNote]);
        setActiveNoteId(newNote.id);
    };

    const deleteNote = (e, id) => {
        e.stopPropagation();
        setNotes(notes.filter(n => n.id !== id));
        if (activeNoteId === id) setActiveNoteId(notes[0]?.id || null);
    };

    return (
        <div className="h-full flex bg-[#1e1e1e] text-gray-200 font-sans">
            {/* Sidebar */}
            <div className="w-48 bg-[#252526] border-r border-[#3e3e42] flex flex-col">
                <div className="p-3 border-b border-[#3e3e42] flex justify-between items-center bg-[#2d2d2d]">
                    <span className="font-bold text-xs uppercase text-gray-400">CyberNotes</span>
                    <button onClick={createNote} className="p-1 hover:bg-white/10 rounded text-yellow-500"><Plus size={16} /></button>
                </div>
                <div className="flex-1 overflow-auto">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            onClick={() => setActiveNoteId(note.id)}
                            className={`p-3 border-b border-[#333] cursor-pointer hover:bg-white/5 group ${activeNoteId === note.id ? 'bg-[#37373d] border-l-2 border-yellow-500' : 'border-l-2 border-transparent'}`}
                        >
                            <h4 className={`text-sm font-bold truncate ${activeNoteId === note.id ? 'text-white' : 'text-gray-400'}`}>{note.content.split('\n')[0].replace('# ', '') || 'Untitled'}</h4>
                            <p className="text-xs text-gray-500 truncate mt-1">{note.content.split('\n')[2] || 'No preview'}</p>
                            <button onClick={(e) => deleteNote(e, note.id)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 p-1 hover:bg-red-900/30 rounded">
                                {/* Trash icon functionality added via absolute positioning relative to parent if needed, simplified here */}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                {!activeNote ? (
                    <div className="flex-1 flex items-center justify-center text-gray-600 flex-col">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <p>Select a note or create a new one</p>
                    </div>
                ) : (
                    <>
                        <div className="h-10 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-end px-4 gap-2">
                            <div className="mr-auto text-xs text-gray-500">{new Date().toLocaleString()}</div>
                            <button className="text-xs flex items-center gap-1 text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5">
                                <Save size={14} /> SAVED
                            </button>
                            <button onClick={(e) => deleteNote(e, activeNoteId)} className="text-xs flex items-center gap-1 text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-900/10">
                                <Trash2 size={14} /> DELETE
                            </button>
                        </div>
                        <textarea
                            className="flex-1 w-full bg-transparent p-6 outline-none resize-none font-mono text-gray-300 leading-relaxed"
                            value={activeNote.content}
                            onChange={(e) => updateNote(e.target.value)}
                            placeholder="Start typing..."
                        />
                    </>
                )}
            </div>
        </div>
    );
}
