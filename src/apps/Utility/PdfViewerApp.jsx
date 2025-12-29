import React from 'react';
import { getDownloadUrl } from '../../lib/api';

export default function PdfViewerApp({ file }) { // Expects 'file' prop passed from Open With
    const fileUrl = file ? getDownloadUrl(file.id) : null;

    if (!file) {
        return (
            <div className="h-full flex items-center justify-center bg-[#2d2d2d] text-gray-500">
                No PDF Selected
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="h-10 bg-[#333] flex items-center px-4 text-sm text-gray-200 shadow-md z-10">
                <span className="font-bold truncate">{file.name}</span>
            </div>
            <div className="flex-1 bg-gray-500 relative">
                <iframe
                    src={fileUrl}
                    className="w-full h-full border-0"
                    title="PDF Viewer"
                />
            </div>
        </div>
    );
}
