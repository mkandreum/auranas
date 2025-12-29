import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Calendar, Image, Video, Filter, Clock } from 'lucide-react';
import { search } from '../lib/api';
import { format } from 'date-fns';

export default function SearchModal({ onClose, onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ type: '', minSize: '', maxSize: '', startDate: '', endDate: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('auranas-recent-searches');
        if (stored) setRecentSearches(JSON.parse(stored));
    }, []);

    // Save search to recent
    const saveToRecent = (q) => {
        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 10);
        localStorage.setItem('auranas-recent-searches', JSON.stringify(updated));
        setRecentSearches(updated);
    };

    const handleSearch = async (e) => {
        e?.preventDefault();
        if (!query.trim() && !filters.type && !filters.startDate) return;

        setLoading(true);
        try {
            const params = { q: query, ...filters };
            const res = await search(params);
            setResults(res.results || []);
            if (query) saveToRecent(query);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const quickSearch = (q) => {
        setQuery(q);
        setTimeout(() => handleSearch(), 100);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Search Input */}
                <form onSubmit={handleSearch} className="flex items-center gap-3 p-4 border-b border-slate-800">
                    <SearchIcon className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search photos, videos..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                        className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-slate-500"
                    />
                    <button type="button" onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <Filter className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </form>

                {/* Filters */}
                {showFilters && (
                    <div className="p-4 border-b border-slate-800 bg-slate-800/50 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <select
                            value={filters.type}
                            onChange={e => setFilters({ ...filters, type: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        >
                            <option value="">All Types</option>
                            <option value="image">Images</option>
                            <option value="video">Videos</option>
                        </select>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <button onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-medium">
                            Apply
                        </button>
                    </div>
                )}

                {/* Recent Searches */}
                {!results.length && recentSearches.length > 0 && !loading && (
                    <div className="p-4">
                        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Recent</p>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((s, i) => (
                                <button key={i} onClick={() => quickSearch(s)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-sm text-slate-300">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="max-h-96 overflow-auto p-2">
                    {loading && (
                        <div className="flex items-center justify-center p-8 text-slate-500">
                            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}

                    {!loading && results.length === 0 && query && (
                        <div className="p-8 text-center text-slate-500">
                            No results found
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-1">
                        {results.map(file => (
                            <div
                                key={file.id}
                                onClick={() => { onSelect(file); onClose(); }}
                                className="aspect-square bg-slate-800 rounded cursor-pointer overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all"
                            >
                                <img
                                    src={`${import.meta.env.VITE_API_URL || '/api'}/thumbnail?path=${encodeURIComponent(file.path)}`}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick filters */}
                <div className="p-3 border-t border-slate-800 flex gap-2 justify-center">
                    <button onClick={() => { setFilters({ ...filters, type: 'image' }); handleSearch(); }} className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1">
                        <Image className="w-3 h-3" /> Photos only
                    </button>
                    <button onClick={() => { setFilters({ ...filters, type: 'video' }); handleSearch(); }} className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1">
                        <Video className="w-3 h-3" /> Videos only
                    </button>
                </div>
            </div>
        </div>
    );
}
