import { initUpload, uploadChunk } from './api';

export const uploadFile = async (file, targetPath, onProgress) => {
    const chunkSize = 1024 * 1024 * 2; // 2MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    try {
        // 1. Init Session
        // Note: We pass fileName. If server utilizes relative path in init, we might try combining path + filename, 
        // but typically init manages the session and chunks carry the destination or finalization does.
        // We will try to pass path in formData of chunks as "best effort" if server lacks explicit finish endpoint.
        const initRes = await initUpload(file.name, file.size, totalChunks);
        const sessionId = initRes.sessionId;

        // 2. Upload Chunks
        for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(file.size, start + chunkSize);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('chunk', chunk);
            formData.append('sessionId', sessionId);
            formData.append('chunkIndex', i.toString());
            formData.append('totalChunks', totalChunks.toString());
            formData.append('fileName', file.name);
            formData.append('path', targetPath); // Target directory

            await uploadChunk(formData);

            if (onProgress) {
                const percent = Math.round(((i + 1) / totalChunks) * 100);
                onProgress(percent);
            }
        }

        return true;
    } catch (error) {
        console.error("Upload failed", error);
        throw error;
    }
};
