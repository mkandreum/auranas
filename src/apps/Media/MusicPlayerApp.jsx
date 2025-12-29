import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Music } from 'lucide-react';
import { getDownloadUrl, fetchFiles, getThumbnailUrl } from '../../lib/api';

export default function MusicPlayerApp({ file }) {
    const [playlist, setPlaylist] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [loading, setLoading] = useState(true);

    const audioRef = useRef(null);
    const currentTrack = playlist[currentTrackIndex];

    useEffect(() => {
        const loadMusic = async () => {
            setLoading(true);
            try {
                if (file) {
                    setPlaylist([{
                        id: file.id,
                        title: file.name,
                        artist: 'Unknown Artist',
                        src: getDownloadUrl(file.id),
                        cover: getThumbnailUrl(file.path)
                    }]);
                } else {
                    // Try to load from /Music first
                    let files = [];
                    try {
                        const res = await fetchFiles('/Music');
                        files = res.files;
                    } catch {
                        // If /Music doesn't exist, try root
                        const res = await fetchFiles('/');
                        files = res.files;
                    }

                    const audioFiles = files.filter(f => f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)).map(f => ({
                        id: f.id,
                        title: f.name,
                        artist: 'Unknown Artist',
                        src: getDownloadUrl(f.id),
                        cover: getThumbnailUrl(f.path)
                    }));

                    if (audioFiles.length > 0) {
                        setPlaylist(audioFiles);
                    } else {
                        // Fallback sample if absolutely nothing found, to show UI
                        setPlaylist([]);
                    }
                }
            } catch (error) {
                console.error("Failed to load music:", error);
            } finally {
                setLoading(false);
            }
        };
        loadMusic();
    }, [file]);

    useEffect(() => {
        if (playing && audioRef.current) {
            audioRef.current.play().catch(e => {
                console.warn("Autoplay blocked or failed", e);
                setPlaying(false);
            });
        }
    }, [currentTrackIndex, playing]);

    const updateProgress = () => {
        if (audioRef.current) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        if (repeat) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        } else if (shuffle) {
            let nextIndex = Math.floor(Math.random() * playlist.length);
            while (nextIndex === currentTrackIndex && playlist.length > 1) {
                nextIndex = Math.floor(Math.random() * playlist.length);
            }
            setCurrentTrackIndex(nextIndex);
        } else {
            nextTrack();
        }
    };

    const togglePlay = () => setPlaying(!playing);

    const nextTrack = () => {
        if (playlist.length <= 1) return;
        setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
        setPlaying(true);
    };

    const prevTrack = () => {
        if (playlist.length <= 1) return;
        setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
        setPlaying(true);
    };

    const handleSeek = (e) => {
        const seekTime = (e.target.value / 100) * duration;
        audioRef.current.currentTime = seekTime;
        setProgress(e.target.value);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-black text-cyan-500 font-mono">
            LOADING LIBRARY...
        </div>
    );

    if (playlist.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center bg-black text-gray-500 font-mono p-6 text-center">
            <Music size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl mb-2">No Audio Files Found</h3>
            <p className="text-sm">Upload .mp3 or .wav files to your /Music folder.</p>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white font-mono overflow-hidden">
            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
                {/* Visualizer bars simulation */}
                <div className="absolute inset-x-0 bottom-0 h-32 flex items-end justify-between px-8 opacity-30 gap-1 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div key={i}
                            className="w-full bg-cyan-500 transition-all duration-100 ease-in-out shadow-[0_0_10px_cyan]"
                            style={{
                                height: playing ? `${Math.random() * 80 + 20}%` : '10%',
                                animationDelay: `${i * 0.05}s`
                            }}
                        />
                    ))}
                </div>

                <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-cyan-500/30 overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.3)] ${playing ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                    {currentTrack.cover ? (
                        <img
                            src={currentTrack.cover}
                            alt="Album Art"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                    ) : null}
                    {/* Fallback pattern */}
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center" style={{ display: currentTrack.cover ? 'none' : 'flex' }}>
                        <Music size={64} className="text-cyan-500/50" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 mix-blend-overlay"></div>
                    {/* Vinyl hole */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black rounded-full border border-gray-700"></div>
                </div>
            </div>

            {/* Info */}
            <div className="px-6 py-2 text-center z-10">
                <h2 className="text-xl font-bold text-cyan-400 truncate tracking-wide">{currentTrack.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{currentTrack.artist}</p>
            </div>

            {/* Controls */}
            <div className="bg-black/80 backdrop-blur-md p-6 pb-8 rounded-t-2xl border-t border-white/10 relative z-20">
                {/* Progress */}
                <div className="mb-4 group">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 group-hover:h-2 transition-all"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                        <span>{formatTime(audioRef.current?.currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <button onClick={() => setShuffle(!shuffle)} className={`${shuffle ? 'text-cyan-400 shadow-[0_0_10px_cyan]' : 'text-gray-500'} hover:text-white transition-all`}>
                        <Shuffle size={18} />
                    </button>

                    <button onClick={prevTrack} className="text-gray-300 hover:text-white hover:scale-110 transition-transform">
                        <SkipBack size={24} fill="currentColor" />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-14 h-14 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-[0_0_20px_cyan] hover:scale-105 transition-all text-white border border-white/20"
                    >
                        {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                    </button>

                    <button onClick={nextTrack} className="text-gray-300 hover:text-white hover:scale-110 transition-transform">
                        <SkipForward size={24} fill="currentColor" />
                    </button>

                    <button onClick={() => setRepeat(!repeat)} className={`${repeat ? 'text-cyan-400 shadow-[0_0_10px_cyan]' : 'text-gray-500'} hover:text-white transition-all`}>
                        <Repeat size={18} />
                    </button>
                </div>

                {/* Volume (Hidden on small screens, shown desktop) */}
                <div className="hidden md:flex items-center gap-2 mt-4 justify-center w-1/2 mx-auto">
                    <button onClick={() => setIsMuted(!isMuted)}>
                        {isMuted ? <VolumeX size={16} className="text-gray-500" /> : <Volume2 size={16} className="text-gray-300" />}
                    </button>
                    <input
                        type="range" min="0" max="1" step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => { setVolume(e.target.value); if (audioRef.current) audioRef.current.volume = e.target.value; setIsMuted(e.target.value === '0'); }}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
            </div>

            <audio
                ref={audioRef}
                src={currentTrack.src}
                onTimeUpdate={updateProgress}
                onEnded={handleEnded}
            />
        </div>
    );
}
