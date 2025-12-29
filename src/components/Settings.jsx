import React, { useState, useEffect } from 'react';
import useAuth from '../store/useAuth';
import { fetchStats, fetchUsers, createUser, deleteUser, updateUser, checkQuota, updateProfile } from '../lib/api';
import { User, HardDrive, Shield, Trash2, Plus, X, Lock, Edit, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import AdminDashboard from './AdminDashboard';
import ConfirmModal from './ConfirmModal';

// ===== ACCOUNT SETTINGS =====
const AccountSettings = ({ user }) => {
    const [editing, setEditing] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [message, setMessage] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMessage('Passwords do not match');
            return;
        }
        try {
            await updateProfile({ currentPassword: passwords.current, newPassword: passwords.new });
            setMessage('Password changed successfully!');
            setEditing(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (e) {
            setMessage(e.response?.data?.error || 'Failed to change password');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-white">My Account</h2>

            {/* Profile Card */}
            <div className="flex items-center gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                    {user.username[0].toUpperCase()}
                </div>
                <div>
                    <p className="text-lg font-medium text-white">{user.username}</p>
                    <p className="text-slate-400 capitalize">{user.role}</p>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium flex items-center gap-2"><Lock className="w-4 h-4" /> Password</h3>
                    <button onClick={() => setEditing(!editing)} className="text-indigo-400 text-sm">
                        {editing ? 'Cancel' : 'Change'}
                    </button>
                </div>

                {editing && (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input type="password" placeholder="Current Password" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
                        <input type="password" placeholder="New Password" required minLength={6} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
                        <input type="password" placeholder="Confirm New Password" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                        {message && <p className="text-sm text-amber-400">{message}</p>}
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium">Save Password</button>
                    </form>
                )}
            </div>
        </div>
    );
};

// ===== STORAGE SETTINGS =====
const StorageSettings = () => {
    const [stats, setStats] = useState(null);
    const [quota, setQuota] = useState(null);

    useEffect(() => {
        const load = () => {
            fetchStats().then(setStats);
            checkQuota().then(setQuota);
        };
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!stats) return <div className="p-4 text-slate-500">Loading analysis...</div>;

    const totalDisplay = formatSize(stats.totalSize);
    const quotaGB = quota?.quota ? (quota.quota / 1024 / 1024 / 1024).toFixed(0) : '∞';

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold text-white">Storage Analysis</h2>

            {/* Usage bar */}
            {quota?.quota && (
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <div className="flex justify-between mb-2">
                        <span className="text-slate-400">Usage</span>
                        <span className="text-white font-medium">{totalDisplay} / {quotaGB} GB</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${quota.percentage}%` }} />
                    </div>
                    <p className="text-sm text-slate-500 mt-2">{quota.percentage}% used</p>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Total Used</p>
                    <p className="text-3xl font-bold text-white">{totalGB} <span className="text-sm font-normal text-slate-500">GB</span></p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Total Files</p>
                    <p className="text-3xl font-bold text-white">{stats.totalFiles}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Favorites</p>
                    <p className="text-3xl font-bold text-white">{stats.favCount || 0}</p>
                </div>
            </div>

            {/* Breakdown */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <h3 className="text-white font-medium mb-4">By Type</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{stats.breakdown?.images || 0}</p>
                        <p className="text-xs text-slate-500">Images</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">{stats.breakdown?.videos || 0}</p>
                        <p className="text-xs text-slate-500">Videos</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-400">{stats.breakdown?.others || 0}</p>
                        <p className="text-xs text-slate-500">Other</p>
                    </div>
                </div>
            </div>

            {/* By Year */}
            {stats.byYear && stats.byYear.length > 0 && (
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-white font-medium mb-4">By Year</h3>
                    <div className="space-y-2">
                        {stats.byYear.map(y => (
                            <div key={y.year} className="flex items-center justify-between">
                                <span className="text-slate-300">{y.year}</span>
                                <span className="text-slate-500">{y.count} files</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ===== USER MANAGEMENT =====
const UsersSettings = () => {
    const [users, setUsers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'user', quotaGB: '' });
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null, username: '' });

    const load = async () => setUsers(await fetchUsers());
    useEffect(() => { load(); }, []);

    const handleDelete = (user) => {
        setDeleteConfirm({ open: true, userId: user.id, username: user.username });
    };

    const confirmDeleteUser = async () => {
        await deleteUser(deleteConfirm.userId);
        setDeleteConfirm({ open: false, userId: null, username: '' });
        load();
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        await createUser(formData);
        setShowAdd(false);
        setFormData({ username: '', password: '', role: 'user', quotaGB: '' });
        load();
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const gb = bytes / 1024 / 1024 / 1024;
        return gb.toFixed(2) + ' GB';
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">User Management</h2>
                <button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add User
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleCreate} className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <input required placeholder="Username" className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                        <input required type="password" placeholder="Password" className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        <select className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <input type="number" placeholder="Quota (GB)" className="bg-slate-900 border border-slate-600 p-2 rounded text-white" value={formData.quotaGB} onChange={e => setFormData({ ...formData, quotaGB: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 px-4 py-2">Cancel</button>
                        <button type="submit" className="bg-white text-black px-4 py-2 rounded font-bold">Create</button>
                    </div>
                </form>
            )}

            <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-slate-200">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Files</th>
                            <th className="p-4">Storage</th>
                            <th className="p-4">Quota</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-800/50">
                                <td className="p-4 font-medium text-white">{u.username}</td>
                                <td className="p-4 capitalize">{u.role}</td>
                                <td className="p-4">{u.file_count || 0}</td>
                                <td className="p-4">{formatBytes(u.used_bytes)}</td>
                                <td className="p-4">{u.quota_bytes ? formatBytes(u.quota_bytes) : '∞'}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDelete(u)} className="text-red-400 hover:bg-red-900/20 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete User Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, userId: null, username: '' })}
                onConfirm={confirmDeleteUser}
                title="ELIMINAR USUARIO"
                message={`¿Estás seguro de que quieres eliminar al usuario "${deleteConfirm.username}"? Sus archivos se conservarán.`}
                type="danger"
                confirmText="ELIMINAR"
                cancelText="CANCELAR"
            />
        </div>
    );
};

// ===== MAIN SETTINGS COMPONENT =====
export default function Settings({ onClose }) {
    const { user } = useAuth();
    const [tab, setTab] = useState('account');

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex overflow-hidden ring-1 ring-white/10">
                {/* Sidebar */}
                <div className="w-56 bg-slate-950 p-6 flex flex-col border-r border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-indigo-500" /> Settings
                    </h2>
                    <nav className="space-y-1 flex-1">
                        <NavButton icon={User} label="Account" active={tab === 'account'} onClick={() => setTab('account')} />
                        <NavButton icon={HardDrive} label="Storage" active={tab === 'storage'} onClick={() => setTab('storage')} />
                        {user.role === 'admin' && (
                            <>
                                <NavButton icon={Shield} label="Users" active={tab === 'users'} onClick={() => setTab('users')} />
                                <NavButton icon={Shield} label="Dashboard" active={tab === 'dashboard'} onClick={() => setTab('dashboard')} />
                            </>
                        )}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-auto bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    {tab === 'account' && <AccountSettings user={user} />}
                    {tab === 'storage' && <StorageSettings />}
                    {tab === 'users' && <UsersSettings />}
                    {tab === 'dashboard' && <AdminDashboard />}
                </div>
            </div>
        </div>
    );
}

function NavButton({ icon: Icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm", active ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800')}>
            <Icon className="w-4 h-4" /> {label}
        </button>
    );
}

function SettingsIcon({ className }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
