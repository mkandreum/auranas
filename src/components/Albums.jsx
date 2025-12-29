import React, { useState, useEffect } from 'react';
import { fetchAlbums, createAlbum } from '../lib/api';
import { Plus, BookOpen } from 'lucide-react';

export default function Albums({ onSelect }) {
    const [albums, setAlbums] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState('');

    const load = async () => setAlbums(await fetchAlbums());

    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        await createAlbum(newAlbumName);
        setNewAlbumName('');
        setIsCreating(false);
        load();
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-indigo-400" /> Albums
                </h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> New Album
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="Album Name"
                        value={newAlbumName}
                        onChange={e => setNewAlbumName(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white w-full mb-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white px-3 py-1 text-sm">Cancel</button>
                        <button type="submit" className="bg-white text-indigo-900 px-3 py-1 rounded-lg text-sm font-bold shadow hover:bg-slate-200">Create</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {albums.map(album => (
                    <div
                        key={album.id}
                        onClick={() => onSelect(album)}
                        className="aspect-square bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-105 group relative overflow-hidden flex flex-col items-center justify-center p-4 text-center"
                    >
                        <BookOpen className="w-12 h-12 text-slate-600 group-hover:text-indigo-400 transition-colors mb-2" />
                        <h3 className="text-white font-medium truncate w-full">{album.name}</h3>
                        <p className="text-xs text-slate-500">{album.count || 0} items</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
