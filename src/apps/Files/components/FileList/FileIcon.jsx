import React from 'react';
import {
    FileText, Image, Music, Video, Code, File as FileIconGeneric, Folder
} from 'lucide-react';

export default function FileIcon({ file, size = 24, className = "" }) {
    if (file.type === 'directory') {
        return <Folder size={size} className={`text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_15px_rgba(250,204,21,0.2)] ${className}`} />;
    }

    const ext = file.name.split('.').pop().toLowerCase();

    // Style Mapping
    let Icon = FileIconGeneric;
    let color = "text-gray-400";

    switch (ext) {
        case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp':
            Icon = Image; color = "text-purple-400"; break;
        case 'mp3': case 'wav': case 'ogg':
            Icon = Music; color = "text-pink-400"; break;
        case 'mp4': case 'mkv': case 'mov': case 'webm':
            Icon = Video; color = "text-red-400"; break;
        case 'js': case 'jsx': case 'json': case 'css': case 'html':
            Icon = Code; color = "text-blue-400"; break;
        case 'pdf': case 'txt': case 'md':
            Icon = FileText; color = "text-cyan-400"; break;
        default:
            Icon = FileIconGeneric; color = "text-cyan-700"; break;
    }

    return (
        <Icon size={size} className={`${color} ${className}`} />
    );
}
