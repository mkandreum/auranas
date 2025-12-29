import React, { useState } from 'react';
import { User, Lock, Zap, AlertTriangle } from 'lucide-react';
import { login, register } from '../lib/api';
import useAuth from '../store/useAuth';

export default function Login() {
    const { setAuth } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', key: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let res;
            if (isRegister) {
                res = await register(form.username, form.password, form.key);
            } else {
                res = await login(form.username, form.password);
            }
            setAuth(res.token, res.user);
        } catch (err) {
            setError(err.response?.data?.error || 'SYSTEM ERROR // CONNECTION FAILED');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 cyber-grid opacity-20" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Zap className="w-12 h-12 text-yellow-400" style={{ filter: 'drop-shadow(0 0 20px rgba(252, 211, 77, 0.8))' }} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-wider font-mono">
                        <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-red-500 bg-clip-text text-transparent">
                            AURA<span className="text-red-500">NAS</span>
                        </span>
                    </h1>
                    <p className="text-yellow-500/40 text-xs uppercase tracking-[0.5em] mt-2 font-mono">
                        NEURAL ARCHIVE SYSTEM v2.0
                    </p>
                </div>

                {/* Card */}
                <div className="card-cyber p-8 relative">
                    {/* Corner decorations */}
                    <div className="absolute top-0 right-0 w-16 h-[2px] bg-gradient-to-l from-yellow-400 to-transparent" />
                    <div className="absolute top-0 right-0 w-[2px] h-16 bg-gradient-to-b from-yellow-400 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-16 h-[2px] bg-gradient-to-r from-red-500 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-[2px] h-16 bg-gradient-to-t from-red-500 to-transparent" />

                    <div className="text-center mb-6">
                        <h2 className="text-xl font-mono text-yellow-400 uppercase tracking-widest">
                            {isRegister ? '// NEW_USER' : '// AUTHENTICATE'}
                        </h2>
                        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-2" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/50 group-focus-within:text-yellow-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="USER_ID"
                                required
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="w-full bg-black/80 border border-yellow-500/20 focus:border-yellow-400/50 pl-12 pr-4 py-3 text-yellow-400 placeholder:text-slate-600 font-mono text-sm tracking-wider focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-all"
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                            />
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/50 group-focus-within:text-yellow-400 transition-colors" />
                            <input
                                type="password"
                                placeholder="PASSKEY"
                                required
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-black/80 border border-yellow-500/20 focus:border-yellow-400/50 pl-12 pr-4 py-3 text-yellow-400 placeholder:text-slate-600 font-mono text-sm tracking-wider focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-all"
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                            />
                        </div>

                        {/* Admin Key (Register only) */}
                        {isRegister && (
                            <div className="relative group">
                                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-500/50 group-focus-within:text-yellow-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="ADMIN_KEY (optional)"
                                    value={form.key}
                                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                                    className="w-full bg-black/80 border border-yellow-500/20 focus:border-yellow-400/50 pl-12 pr-4 py-3 text-yellow-400 placeholder:text-slate-600 font-mono text-sm tracking-wider focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-all"
                                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                                />
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/20 px-4 py-2">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="uppercase">{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 font-mono font-bold uppercase tracking-widest text-sm relative overflow-hidden group disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #ef4444 100%)',
                                clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
                            }}
                        >
                            <span className="relative z-10 text-black font-bold">
                                {loading ? '▓▓▓ PROCESSING ▓▓▓' : isRegister ? 'CREATE_IDENTITY' : 'INITIALIZE'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </form>

                    {/* Toggle */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => { setIsRegister(!isRegister); setError(''); }}
                            className="text-yellow-500/60 hover:text-yellow-400 text-xs font-mono uppercase tracking-wider transition-colors"
                        >
                            {isRegister ? '[ EXISTING_USER? LOGIN ]' : '[ NEW_USER? REGISTER ]'}
                        </button>
                    </div>
                </div>

                {/* Version */}
                <p className="text-center mt-6 text-[10px] text-slate-700 font-mono">
                    SYS.VERSION 2.0.0 // CYBERDECK COMPATIBLE
                </p>
            </div>
        </div>
    );
}

