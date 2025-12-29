import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
    try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const { state } = JSON.parse(storage);
            if (state?.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
            }
        }
    } catch (e) { }
    return config;
});

// ===== AUTH =====
export const login = async (username, password) => (await api.post('/auth/login', { username, password })).data;
export const register = async (username, password, key) => (await api.post('/auth/register', { username, password, key })).data;

// ===== FILES =====
export const fetchFiles = async (path = '/', options = {}) => {
    const params = new URLSearchParams({ path, ...options });
    return (await api.get(`/files?${params}`)).data;
};
export const fetchTimeline = async (limit = 1000, offset = 0, year, month) => {
    const params = new URLSearchParams({ limit, offset });
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    return (await api.get(`/timeline?${params}`)).data;
};
export const fetchStats = async () => (await api.get('/stats')).data;
export const fetchRecent = async () => (await api.get('/recent')).data;
export const fetchYears = async () => (await api.get('/years')).data;
export const fetchMonths = async (year) => (await api.get(`/years/${year}/months`)).data;

// ===== FILE ACTIONS =====
export const deleteFiles = async (ids, permanent = false) => (await api.post('/files/delete', { ids, permanent })).data;
export const restoreFiles = async (ids) => (await api.post('/files/restore', { ids })).data;
export const createDirectory = async (path, name) => (await api.post('/files/directory', { path, name })).data;
export const renameFile = async (id, newName) => (await api.put(`/files/${id}/rename`, { name: newName })).data;
export const emptyTrash = async () => (await api.post('/files/empty-trash')).data;
export const toggleFavorite = async (id, isFavorite) => (await api.post('/files/favorite', { id, isFavorite })).data;
export const bulkFavorite = async (ids, isFavorite) => (await api.post('/files/bulk-favorite', { ids, isFavorite })).data;
export const bulkMove = async (ids, targetPath) => (await api.post('/files/bulk-move', { ids, targetPath })).data;
export const bulkAddToAlbum = async (ids, albumId) => (await api.post('/files/bulk-album', { ids, albumId })).data;

// ===== SHARING =====
export const createShareLink = async (fileId, options = {}) => (await api.post('/share', { fileId, ...options })).data;
export const getShareLinks = async () => (await api.get('/share')).data;
export const deleteShareLink = async (id) => (await api.delete(`/share/${id}`)).data;

// ===== METADATA & DOWNLOAD =====
export const getMetadata = async (id) => (await api.get(`/files/${id}/metadata`)).data;
export const downloadZip = async (ids) => {
    const response = await api.post('/files/download-zip', { ids }, { responseType: 'blob' });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auranas-download.zip';
    a.click();
    window.URL.revokeObjectURL(url);
};

// ===== SEARCH =====
export const search = async (query) => (await api.get(`/search?${new URLSearchParams(query)}`)).data;
export const findDuplicates = async () => (await api.get('/duplicates')).data;

// ===== TAGS =====
export const fetchTags = async () => (await api.get('/tags')).data;
export const createTag = async (name, color) => (await api.post('/tags', { name, color })).data;
export const tagFiles = async (fileIds, tagId) => (await api.post('/tags/add', { fileIds, tagId })).data;
export const untagFiles = async (fileIds, tagId) => (await api.post('/tags/remove', { fileIds, tagId })).data;

// ===== ALBUMS =====
export const fetchAlbums = async () => (await api.get('/albums')).data;
export const createAlbum = async (name, description) => (await api.post('/albums', { name, description })).data;
export const addToAlbum = async (albumId, fileIds) => (await api.post('/albums/add', { albumId, fileIds })).data;
export const removeFromAlbum = async (albumId, fileIds) => (await api.post('/albums/remove', { albumId, fileIds })).data;
export const getAlbumFiles = async (id) => (await api.get(`/albums/${id}`)).data;
export const deleteAlbum = async (id) => (await api.delete(`/albums/${id}`)).data;

// ===== UPLOAD =====
export const initUpload = async (fileName, totalSize, totalChunks) => (await api.post('/upload/init', { fileName, totalSize, totalChunks })).data;
export const getUploadStatus = async (sessionId) => (await api.get(`/upload/status/${sessionId}`)).data;
export const uploadChunk = async (formData) => {
    const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

// ===== USERS & ADMIN =====
export const fetchUsers = async () => (await api.get('/users')).data;
export const createUser = async (data) => (await api.post('/users', data)).data;
export const updateUser = async (data) => (await api.put('/users', data)).data;
export const deleteUser = async (id, deleteFiles = false) => (await api.post('/users/delete', { id, deleteFiles })).data;
export const checkQuota = async () => (await api.get('/users/quota')).data;
export const updateProfile = async (data) => (await api.put('/profile', data)).data;
export const getSystemStats = async () => (await api.get('/admin/stats')).data;
export const getActivityLog = async () => (await api.get('/admin/activity')).data;

// ===== URL GENERATORS =====
export const getThumbnailUrl = (filePath) => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const { state } = JSON.parse(storage);
            if (state?.token) {
                return `${baseUrl}/thumbnail?path=${encodeURIComponent(filePath)}&token=${state.token}`;
            }
        }
    } catch (e) { }
    return `${baseUrl}/thumbnail?path=${encodeURIComponent(filePath)}`;
};

export const getDownloadUrl = (fileId) => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const { state } = JSON.parse(storage);
            return `${baseUrl}/files/${fileId}/download?token=${state.token}`;
        }
    } catch (e) { }
    return `${baseUrl}/files/${fileId}/download`;
};

export default api;
