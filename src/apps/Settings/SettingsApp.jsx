import React, { useState, useEffect } from 'react';
import useAuth from '../../store/useAuth';
import { User, HardDrive, Shield, Plus, X } from 'lucide-react';
import { fetchUsers, createUser, deleteUser, fetchStats, checkQuota, updateProfile } from '../../lib/api';

// ===== SUB-COMPONENTS =====

const AccountSettings = ({ user }) => {
    const [editing, setEditing] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [message, setMessage] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');
        if (passwords.new !== passwords.confirm) return setMessage('Passwords do not match');
        try {
            await updateProfile({ currentPassword: passwords.current, newPassword: passwords.new });
            setMessage('Password changed successfully!');
            setEditing(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (e) {
            setMessage(e.response?.data?.error || 'Failed to update password');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in text-white font-mono">
            <h2 className="text-xl font-bold text-yellow-500 mb-6 border-b border-yellow-500/20 pb-2">User Account</h2>
            <div className="flex items-center gap-4 bg-white/5 p-6 rounded border border-white/10">
                <div className="w-16 h-16 rounded bg-gradient-to-br from-yellow-500 to-red-600 flex items-center justify-center text-2xl font-bold text-black font-sans">
                    {user.username ? user.username[0].toUpperCase() : '?'}
                </div>
                <div>
                    <p className="text-lg font-bold text-yellow-100">{user.username}</p>
                    <p className="text-slate-400 capitalize text-sm">{user.role} Privilege</p>
                </div>
            </div>

            <div className="bg-white/5 p-6 rounded border border-white/10">
                <div className="flex justify-between mb-4">
                    <label className="text-gray-400 uppercase text-xs tracking-wider">Security</label>
                    <button onClick={() => setEditing(!editing)} className="text-yellow-500 text-xs hover:underline">{editing ? 'CANCEL' : 'CHANGE PASSWORD'}</button>
                </div>
                {editing && (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input
                            className="w-full bg-black/50 border border-white/20 p-2 text-sm text-white focus:border-yellow-500 outline-none"
                            type="password"
                            placeholder="Current Password"
                            value={passwords.current}
                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                        />
                        <input
                            className="w-full bg-black/50 border border-white/20 p-2 text-sm text-white focus:border-yellow-500 outline-none"
                            type="password"
                            placeholder="New Password"
                            value={passwords.new}
                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                        />
                        <input
                            className="w-full bg-black/50 border border-white/20 p-2 text-sm text-white focus:border-yellow-500 outline-none"
                            type="password"
                            placeholder="Confirm Password"
                            value={passwords.confirm}
                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                        />
                        <button className="w-full bg-yellow-500 text-black font-bold py-2 text-sm hover:bg-yellow-400 uppercase tracking-widest">Update Credentials</button>
                    </form>
                )}
                {message && <p className={`text-xs mt-2 ${message.includes('Success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
            </div>
        </div>
    );
};

const StorageSettings = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats().then(setStats).catch(console.error);
    }, []);

    if (!stats) return <div className="p-8 text-center text-gray-500 font-mono animate-pulse">ANALYZING STORAGE ARRAY...</div>;

    const gb = (bytes) => (bytes / 1024 / 1024 / 1024).toFixed(2);

    return (
        <div className="space-y-6 text-white font-mono animate-in fade-in">
            <h2 className="text-xl font-bold text-yellow-500 mb-6 border-b border-yellow-500/20 pb-2">Storage Manager</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 border border-white/10 rounded">
                    <p className="text-xs text-gray-400 uppercase">Total Capacity Used</p>
                    <p className="text-3xl text-yellow-400 font-bold mt-2">{gb(stats.totalSize || 0)} <span className="text-sm text-gray-500">GB</span></p>
                </div>
                <div className="bg-white/5 p-6 border border-white/10 rounded">
                    <p className="text-xs text-gray-400 uppercase">Total Files</p>
                    <p className="text-3xl text-purple-400 font-bold mt-2">{stats.totalFiles || 0}</p>
                </div>
            </div>

            <div className="bg-white/5 p-6 border border-white/10 rounded mt-4">
                <p className="text-xs text-gray-400 uppercase mb-4">Volume Distribution</p>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
                    {/* Simulated visual distribution */}
                    <div className="h-full bg-yellow-500" style={{ width: '60%' }}></div>
                    <div className="h-full bg-purple-500" style={{ width: '25%' }}></div>
                    <div className="h-full bg-blue-500" style={{ width: '15%' }}></div>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Media</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Documents</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> System</span>
                </div>
            </div>
        </div>
    );
}

const UsersSettings = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });

    const loadUsers = () => {
        setLoading(true);
        fetchUsers().then(res => {
            setUsers(res);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { loadUsers(); }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await createUser(newUser);
            setShowAdd(false);
            setNewUser({ username: '', password: '', role: 'user' });
            loadUsers();
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const handleDeleteUser = async (id) => {
        if (confirm('Are you sure? This will delete the user and their files.')) {
            await deleteUser(id, true);
            loadUsers();
        }
    };

    return (
        <div className="h-full flex flex-col font-mono text-white animate-in fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-yellow-500/20 pb-2">
                <h2 className="text-xl font-bold text-yellow-500">User Manager</h2>
                <button onClick={() => setShowAdd(true)} className="bg-yellow-500 text-black px-3 py-1 text-xs font-bold rounded flex items-center gap-1 hover:bg-yellow-400 transition-colors">
                    <Plus size={14} /> NEW USER
                </button>
            </div>

            {showAdd && (
                <div className="mb-6 bg-white/10 p-4 rounded border border-white/20">
                    <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
                        <input className="bg-black/50 border border-white/20 p-2 text-sm text-white" placeholder="Username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
                        <input className="bg-black/50 border border-white/20 p-2 text-sm text-white" type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                        <select className="bg-black/50 border border-white/20 p-2 text-sm text-white" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-green-600 px-4 py-1 text-xs font-bold rounded">SAVE</button>
                            <button type="button" onClick={() => setShowAdd(false)} className="bg-red-600 px-4 py-1 text-xs font-bold rounded">CANCEL</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex-1 overflow-auto bg-white/5 border border-white/10 rounded">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/50 text-gray-400 border-b border-white/10">
                        <tr><th className="p-3">USERNAME</th><th className="p-3">ROLE</th><th className="p-3">USAGE</th><th className="p-3 text-right">ACTION</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 font-bold text-yellow-100 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs">{u.username[0].toUpperCase()}</div>
                                    {u.username}
                                </td>
                                <td className="p-3 text-gray-400 uppercase text-xs tracking-wider">{u.role}</td>
                                <td className="p-3 text-gray-400 font-mono text-xs">{(u.used_bytes / 1024 / 1024).toFixed(1)} MB</td>
                                <td className="p-3 text-right">
                                    {u.role !== 'admin' && (
                                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-400 text-xs hover:underline">REVOKE</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && <div className="p-4 text-center text-gray-500">No users found.</div>}
            </div>
        </div>
    )
}

// ===== MAIN APP =====

export default function SettingsApp() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('account');

    // Default to 'account' if user is missing for some reason
    if (!user) return <div className="p-8 text-center text-red-500">AUTHENTICATION ERROR</div>;

    const menu = [
        { id: 'account', label: 'User Account', icon: User },
        { id: 'storage', label: 'Storage Manager', icon: HardDrive },
        ...(user.role === 'admin' ? [{ id: 'users', label: 'User Manager', icon: Shield }] : [])
    ];

    return (
        <div className="flex h-full bg-[#111] text-gray-200">
            {/* Sidebar */}
            <div className="w-48 bg-[#0a0a0a] border-r border-white/10 flex flex-col p-2 gap-1">
                {menu.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`
                            flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors
                            ${activeTab === item.id ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
                            font-mono
                        `}
                    >
                        <item.icon size={16} />
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-[#111] relative p-6">
                {/* Cyberpunk Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                ></div>

                {activeTab === 'account' && <AccountSettings user={user} />}
                {activeTab === 'storage' && <StorageSettings />}
                {activeTab === 'users' && <UsersSettings />}
            </div>
        </div>
    );
}
