import React, { useState, useEffect, useRef } from 'react';
import { Save, Play, Settings, FileCode, FolderOpen } from 'lucide-react';
import { getDownloadUrl } from '../../lib/api';
import { uploadFile } from '../../lib/fileTransfer';

export default function CodeEditorApp({ file }) {
    const [code, setCode] = useState('// Select a file to edit...');
    const [filename, setFilename] = useState(file ? file.name : 'Untitled.js');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (file) {
            loadContent(file);
        }
    }, [file]);

    const loadContent = async (fileObj) => {
        setLoading(true);
        setStatus('Loading...');
        try {
            const storage = localStorage.getItem('auth-storage');
            const token = storage ? JSON.parse(storage).state.token : '';

            const res = await fetch(`/api/files/${fileObj.id}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to load');

            const text = await res.text();
            setCode(text);
            setFilename(fileObj.name);
            setStatus('Ready');
        } catch (e) {
            console.error(e);
            setCode('// Error loading file content');
            setStatus('Error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!file) {
            setStatus('Error: No file context');
            return;
        }

        setStatus('Saving...');
        try {
            // Overwrite file using uploadFile logic
            // Requires path. 'file' should have 'parentPath' or we derive from 'path'.
            // If file.path is '/Photos/script.js', dir is '/Photos'.
            // Check if file object has path. 
            // The file object from 'files' usually has: id, name, size, type, path?
            // If not, we might be saving to root.

            // Assuming file.path is valid or we fallback to root
            let dir = '/';
            if (file.path) {
                const parts = file.path.split('/');
                parts.pop(); // remove filename
                dir = parts.join('/') || '/';
            }

            const blob = new Blob([code], { type: 'text/plain' });
            const fileToUpload = new File([blob], filename, { type: 'text/plain' });

            await uploadFile(fileToUpload, dir);

            setStatus('Saved');
        } catch (e) {
            setStatus('Save Failed');
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm">
            {/* Toolbar */}
            <div className="h-10 bg-[#252526] flex items-center px-4 justify-between border-b border-[#111]">
                <div className="flex items-center gap-2">
                    <FileCode size={16} className="text-blue-400" />
                    <span className="font-bold text-gray-200">{filename}</span>
                    {status && <span className="text-xs text-gray-500 ml-4">[{status}]</span>}
                </div>
                <div className="flex bg-[#333] rounded overflow-hidden">
                    <button onClick={handleSave} className="p-1.5 hover:bg-[#444] transition-colors" title="Save"><Save size={16} /></button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative">
                {loading && (
                    <div className="absolute inset-0 bg-[#1e1e1e] flex items-center justify-center z-10">
                        <span className="text-yellow-500">Loading stream...</span>
                    </div>
                )}
                <textarea
                    className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] p-4 resize-none outline-none leading-relaxed font-mono"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setStatus('Modified'); }}
                    spellCheck="false"
                />
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-xs justify-between">
                <div>JavaScript</div>
                <div>Ln {code.split('\n').length}, Col 1</div>
            </div>
        </div>
    );
}
