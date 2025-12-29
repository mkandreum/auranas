import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, HardDrive, Cloud, Clock, Star } from 'lucide-react';

// Specialized Sidebar Item
const NavItem = ({ label, icon: Icon, active, onClick, depth = 0, hasChildren, expanded, onToggle }) => (
    <div
        className={`
            flex items-center gap-2 py-1 cursor-pointer select-none transition-all
            ${active ? 'bg-cyan-900/40 text-cyan-400 border-r-2 border-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={onClick}
    >
        {hasChildren ? (
            <div onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-0.5 hover:bg-white/10 rounded text-gray-500 hover:text-white">
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>
        ) : (
            <div className="w-4" /> // Spacer
        )}

        <Icon size={16} className={active ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-cyan-800'} />
        <span className="text-xs font-medium tracking-wide truncate">{label}</span>
    </div>
);

export default function NavigationPane({ currentPath, onNavigate }) {
    // Hardcoded structure for now, ideally this would be recursive based on actual FS
    const [expanded, setExpanded] = useState({ 'root': true, 'media': true });

    const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="flex-1 overflow-y-auto py-2 scroller-thin">

            {/* Quick Access Section */}
            <div className="mb-4">
                <div className="px-4 text-[10px] font-bold text-cyan-900 uppercase tracking-widest mb-1 opacity-70">
                    QUICK_ACCESS
                </div>
                <NavItem icon={HomeItem} label="Home" active={currentPath === '/'} onClick={() => onNavigate('/')} />
                <NavItem icon={Clock} label="Recent" />
                <NavItem icon={Star} label="Favorites" />
            </div>

            {/* Drives / Folders */}
            <div className="mb-2">
                <div className="px-4 text-[10px] font-bold text-cyan-900 uppercase tracking-widest mb-1 opacity-70">
                    SYSTEM_DRIVE
                </div>

                <NavItem
                    icon={HardDrive}
                    label="Local Disk (C:)"
                    active={currentPath === '/'}
                    onClick={() => onNavigate('/')}
                    hasChildren
                    expanded={expanded['root']}
                    onToggle={() => toggle('root')}
                />

                {expanded['root'] && (
                    <>
                        <NavItem depth={1} icon={Folder} label="Photos" active={currentPath === '/Photos'} onClick={() => onNavigate('/Photos')} />
                        <NavItem depth={1} icon={Folder} label="Music" active={currentPath === '/Music'} onClick={() => onNavigate('/Music')} />
                        <NavItem depth={1} icon={Folder} label="Videos" active={currentPath === '/Videos'} onClick={() => onNavigate('/Videos')} />
                        <NavItem depth={1} icon={Folder} label="Documents" active={currentPath === '/Documents'} onClick={() => onNavigate('/Documents')} />
                        <NavItem depth={1} icon={Folder} label="Downloads" active={currentPath === '/Downloads'} onClick={() => onNavigate('/Downloads')} />
                    </>
                )}
            </div>

            <NavItem icon={Cloud} label="Network" />
        </div>
    );
}

const HomeItem = (props) => <Folder {...props} />;
