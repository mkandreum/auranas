import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react';

export default function MusicPlayerApp() {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [muted, setMuted] = useState(false);
    const [repeat, setRepeat] = useState(false);
    const [shuffle, setShuffle] = useState(false);

    // Demo playlist
    const playlist = [
        { id: 1, title: 'Neon Dreams', artist: 'Cyber Collective', duration: '3:45', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { id: 2, title: 'Digital Rain', artist: 'Night City Orchestra', duration: '4:12', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { id: 3, title: 'Chrome Sunset', artist: 'Synth Wave', duration: '3:58', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    ];

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setProgress((audio.currentTime / audio.duration) * 100 || 0);
        };

        const handleEnded = () => {
            if (repeat) {
                audio.currentTime = 0;
                audio.play();
            } else {
                nextTrack();
            }
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [repeat, currentTrack]);

    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setPlaying(true);
        } else {
            audioRef.current.pause();
            setPlaying(false);
        }
    };

    const nextTrack = () => {
        const next = shuffle
            ? Math.floor(Math.random() * playlist.length)
            : (currentTrack + 1) % playlist.length;
        setCurrentTrack(next);
        setPlaying(true);
        setTimeout(() => audioRef.current?.play(), 100);
    };

    const prevTrack = () => {
        const prev = (currentTrack - 1 + playlist.length) % playlist.length;
        setCurrentTrack(prev);
        setPlaying(true);
        setTimeout(() => audioRef.current?.play(), 100);
    };

    const handleSeek = (e) => {
        const seekTime = (e.target.value / 100) * audioRef.current.duration;
        audioRef.current.currentTime = seekTime;
        setProgress(e.target.value);
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white">
            <audio ref={audioRef} src={playlist[currentTrack].url} />

            {/* Visualizer Effect */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="h-full flex items-end justify-around gap-1 p-4">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t animate-pulse"
                            style={{
                                height: `${playing ? Math.random() * 100 : 20}%`,
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: `${0.5 + Math.random()}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-6">
                {/* Current Track */}
                <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                        <div className={`text-6xl ${playing ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>🎵</div>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{playlist[currentTrack].title}</h2>
                    <p className="text-purple-300">{playlist[currentTrack].artist}</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: '#a855f7' }}
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>{playlist[currentTrack].duration}</span>
                        <span>-{playlist[currentTrack].duration}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    <button onClick={() => setShuffle(!shuffle)} className={`${shuffle ? 'text-purple-400' : 'text-gray-400'} hover:text-white`}>
                        <Shuffle size={20} />
                    </button>
                    <button onClick={prevTrack} className="hover:text-purple-400">
                        <SkipBack size={24} />
                    </button>
                    <button onClick={togglePlay} className="w-14 h-14 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center">
                        {playing ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>
                    <button onClick={nextTrack} className="hover:text-purple-400">
                        <SkipForward size={24} />
                    </button>
                    <button onClick={() => setRepeat(!repeat)} className={`${repeat ? 'text-purple-400' : 'text-gray-400'} hover:text-white`}>
                        <Repeat size={20} />
                    </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3 justify-center">
                    <button onClick={() => setMuted(!muted)}>
                        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={muted ? 0 : volume}
                        onChange={(e) => {
                            setVolume(e.target.value);
                            audioRef.current.volume = e.target.value;
                            setMuted(e.target.value == 0);
                        }}
                        className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: '#a855f7' }}
                    />
                </div>
            </div>

            {/* Playlist */}
            <div className="bg-black/40 backdrop-blur-sm p-4 max-h-32 overflow-auto">
                {playlist.map((track, i) => (
                    <div
                        key={track.id}
                        onClick={() => { setCurrentTrack(i); setPlaying(true); setTimeout(() => audioRef.current?.play(), 100); }}
                        className={`flex justify-between items-center p-2 rounded cursor-pointer hover:bg-white/10 ${i === currentTrack ? 'bg-purple-600/30' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">{i + 1}</span>
                            <div>
                                <div className="text-sm font-bold">{track.title}</div>
                                <div className="text-xs text-gray-400">{track.artist}</div>
                            </div>
                        </div>
                        <span className="text-xs text-gray-500">{track.duration}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
