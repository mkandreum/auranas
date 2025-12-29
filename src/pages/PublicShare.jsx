import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Download, Folder, File, Lock, AlertTriangle, Eye, Grid, List } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicShare() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const [passwordRequired, setPasswordRequired] = useState(false);

    const fetchContent = async (pwd = '') => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`/api/public/share/${token}`, {
                params: { password: pwd }
            });

            if (res.data.protected) {
                setPasswordRequired(true);
                setLoading(false);
            } else {
                setData(res.data);
                setPasswordRequired(false);
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                setError('Incorrect password');
            } else if (err.response?.status === 410) {
                setError('Link has expired');
            } else {
                setError('Link invalid or content unavailable');
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [token]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        fetchContent(password);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-yellow-500 font-mono">
                <div className="animate-pulse">ACCESSING SECURE LINK...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center text-red-500 font-mono p-4">
                <AlertTriangle size={64} className="mb-4 text-red-600 animate-pulse" />
                <h1 className="text-2xl mb-2 text-center">{error}</h1>
                <p className="text-gray-500">ACCESS DENIED</p>
            </div>
        );
    }

    if (passwordRequired) {
        return (
            <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center font-mono p-4 relative overflow-hidden">
                {/* Cyberpunk Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(13,13,13,0.9),rgba(13,13,13,0.9)),url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 0, .03) 25%, rgba(255, 255, 0, .03) 26%, transparent 27%, transparent 74%, rgba(255, 255, 0, .03) 75%, rgba(255, 255, 0, .03) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 0, .03) 25%, rgba(255, 255, 0, .03) 26%, transparent 27%, transparent 74%, rgba(255, 255, 0, .03) 75%, rgba(255, 255, 0, .03) 76%, transparent 77%, transparent)',
                    backgroundSize: '50px 50px'
                }}></div>

                <form onSubmit={handlePasswordSubmit} className="relative z-10 bg-black/80 border border-yellow-500/50 p-8 rounded max-w-md w-full backdrop-blur-md shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                    <div className="flex justify-center mb-6">
                        <Lock size={48} className="text-yellow-500" />
                    </div>
                    <h2 className="text-xl text-yellow-500 mb-6 text-center tracking-widest">SECURE LINK</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ENTER PASSWORD"
                        className="w-full bg-[#1a1a1a] border border-yellow-500/30 rounded p-3 text-yellow-100 placeholder-yellow-500/30 focus:outline-none focus:border-yellow-500 mb-4 font-mono text-center"
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-yellow-500 text-black font-bold py-3 rounded hover:bg-yellow-400 transition-all uppercase tracking-wider relative overflow-hidden group">
                        <span className="relative z-10">DECRYPT</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </form>
            </div>
        );
    }

    const isAlbum = data.type === 'album';
    const content = data.data;

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-gray-200 font-mono relative overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-black/80 border-b border-yellow-500/20 p-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500/10 rounded border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                        {isAlbum ? <Folder size={20} /> : <File size={20} />}
                    </div>
                    <div>
                        <h1 className="text-yellow-500 font-bold text-lg truncate max-w-[200px] md:max-w-md">{content.name}</h1>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">{isAlbum ? 'SHARED ALBUM' : 'SHARED FILE'}</p>
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-xs text-yellow-500/50">AURANAS SECURE SHARE</div>
                    <div className="text-[10px] text-gray-600">ENCRYPTED CONNECTION</div>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.05) 0%, transparent 50%)'
                }}></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    {!isAlbum ? (
                        // SINGLE FILE VIEW
                        <div className="flex flex-col items-center justify-center min-h-[50vh]">
                            <div className="bg-[#1a1a1a] border border-yellow-500/20 p-1 md:p-2 rounded-lg mb-8 shadow-2xl max-w-2xl w-full">
                                {content.mime_type?.startsWith('image/') ? (
                                    <img
                                        src={`/api/public/share/${token}/thumbnail?fileId=${content.id}${password ? `&password=${password}` : ''}`}
                                        alt={content.name}
                                        className="w-full h-auto rounded border border-white/5"
                                    />
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center bg-black/50 rounded border border-white/5 text-gray-500">
                                        <File size={64} className="mb-4 text-yellow-500/50" />
                                        <p>{content.mime_type}</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-gray-400 mb-2">{(content.size / 1024 / 1024).toFixed(2)} MB • {format(new Date(content.created_at), 'MMM d, yyyy')}</p>
                                {data.allowDownload && (
                                    <a
                                        href={`/api/public/share/${token}/download?${password ? `password=${password}` : ''}`}
                                        className="inline-flex items-center gap-2 bg-yellow-500 text-black font-bold px-8 py-3 rounded hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)]"
                                    >
                                        <Download size={20} />
                                        DOWNLOAD FILE
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        // ALBUM GRID VIEW
                        <div>
                            <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-gray-400 text-sm max-w-2xl">{content.description || 'No description provided.'}</p>
                                </div>
                                <div className="text-yellow-500 font-mono text-sm">
                                    {data.files.length} ITEMS
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {data.files.map(file => (
                                    <div key={file.id} className="group relative bg-[#1a1a1a] rounded border border-white/10 overflow-hidden hover:border-yellow-500/50 transition-all">
                                        <div className="aspect-square bg-black/50 relative">
                                            {file.mime_type?.startsWith('image/') ? (
                                                <img
                                                    src={`/api/public/share/${token}/thumbnail?fileId=${file.id}${password ? `&password=${password}` : ''}`}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    <File size={32} />
                                                </div>
                                            )}

                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                {data.allowDownload && (
                                                    <a href={`/api/public/share/${token}/download?fileId=${file.id}${password ? `&password=${password}` : ''}`} className="p-2 bg-yellow-500 rounded-full text-black hover:scale-110 transition-transform" title="Download">
                                                        <Download size={18} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs truncate text-gray-300 group-hover:text-yellow-100">{file.name}</p>
                                            <p className="text-[10px] text-gray-600">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 text-center text-xs text-gray-600 mt-auto">
                POWERED BY AURANAS SYSTEM • V2.0.0
            </div>
        </div>
    );
}
