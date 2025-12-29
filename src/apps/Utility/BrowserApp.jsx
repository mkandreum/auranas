import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock } from 'lucide-react';

export default function BrowserApp() {
    const [url, setUrl] = useState('https://www.example.com');
    const [inputUrl, setInputUrl] = useState('https://www.example.com');
    const [loading, setLoading] = useState(false);

    const navigate = (newUrl) => {
        setLoading(true);
        setUrl(newUrl);
        setInputUrl(newUrl);
        setTimeout(() => setLoading(false), 500);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let finalUrl = inputUrl;
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        navigate(finalUrl);
    };

    const quickLinks = [
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
        { name: 'MDN', url: 'https://developer.mozilla.org' },
    ];

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e]">
            {/* Browser Chrome */}
            <div className="bg-[#252526] border-b border-[#3e3e42] p-2 flex items-center gap-2">
                {/* Navigation */}
                <div className="flex gap-1">
                    <button className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                        <ArrowLeft size={18} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                        <ArrowRight size={18} />
                    </button>
                    <button onClick={() => navigate(url)} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                        <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => navigate('https://www.example.com')} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                        <Home size={18} />
                    </button>
                </div>

                {/* URL Bar */}
                <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 bg-[#1e1e1e] rounded px-3 py-1.5">
                    <Lock size={14} className="text-green-500" />
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-white"
                        placeholder="Enter URL..."
                    />
                </form>
            </div>

            {/* Quick Links Bar */}
            <div className="bg-[#2d2d2d] border-b border-[#3e3e42] px-4 py-2 flex gap-3">
                {quickLinks.map(link => (
                    <button
                        key={link.name}
                        onClick={() => navigate(link.url)}
                        className="text-xs text-gray-400 hover:text-white px-2 py-1 hover:bg-white/10 rounded"
                    >
                        {link.name}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-white">
                {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <RotateCw className="animate-spin text-white" size={32} />
                    </div>
                )}
                <iframe
                    src={url}
                    className="w-full h-full border-none"
                    title="Browser Content"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>

            {/* Status Bar */}
            <div className="bg-[#007acc] text-white px-3 py-1 text-xs flex items-center justify-between">
                <span>Ready</span>
                <span>{url}</span>
            </div>
        </div>
    );
}
