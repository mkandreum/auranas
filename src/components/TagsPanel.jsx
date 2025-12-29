import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Check } from 'lucide-react';
import { fetchTags, createTag, tagFiles, untagFiles } from '../lib/api';

export default function TagsPanel({ selectedFiles = [], onTagsChanged }) {
    const [tags, setTags] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newTag, setNewTag] = useState({ name: '', color: '#6366f1' });

    const loadTags = async () => {
        const data = await fetchTags();
        setTags(data);
    };

    useEffect(() => { loadTags(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTag.name.trim()) return;
        await createTag(newTag.name, newTag.color);
        setNewTag({ name: '', color: '#6366f1' });
        setShowCreate(false);
        loadTags();
    };

    const handleTagFiles = async (tagId) => {
        if (selectedFiles.length === 0) return;
        await tagFiles(selectedFiles.map(f => f.id), tagId);
        onTagsChanged?.();
    };

    const colors = [
        '#ef4444', '#f97316', '#eab308', '#22c55e',
        '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-400" />
                    Tags
                </h3>
                <button onClick={() => setShowCreate(!showCreate)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <form onSubmit={handleCreate} className="mb-4 p-3 bg-slate-800 rounded-lg">
                    <input
                        type="text"
                        placeholder="Tag name"
                        value={newTag.name}
                        onChange={e => setNewTag({ ...newTag, name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white mb-2"
                        autoFocus
                    />
                    <div className="flex gap-1 mb-2">
                        {colors.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setNewTag({ ...newTag, color: c })}
                                className={`w-6 h-6 rounded-full transition-transform ${newTag.color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-1 text-slate-400 text-sm">Cancel</button>
                        <button type="submit" className="flex-1 py-1 bg-indigo-600 text-white rounded text-sm">Create</button>
                    </div>
                </form>
            )}

            {/* Tag list */}
            <div className="space-y-1">
                {tags.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">No tags yet</p>
                ) : (
                    tags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => handleTagFiles(tag.id)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                                <span className="text-slate-300 text-sm">{tag.name}</span>
                            </div>
                            <span className="text-xs text-slate-500">{tag.count || 0}</span>
                        </button>
                    ))
                )}
            </div>

            {/* Selection hint */}
            {selectedFiles.length > 0 && (
                <div className="mt-4 p-2 bg-indigo-600/20 rounded-lg text-center">
                    <p className="text-indigo-300 text-xs">{selectedFiles.length} files selected - click tag to apply</p>
                </div>
            )}
        </div>
    );
}
