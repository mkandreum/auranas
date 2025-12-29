import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { getDownloadUrl } from '../../lib/api';

export default function VideoPlayerApp({ file }) {
    const defaultSrc = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";
    const src = file ? getDownloadUrl(file.id) : defaultSrc;
    const title = file ? file.name : "Demo Video";

    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            if (video.duration) {
                setProgress((video.currentTime / video.duration) * 100);
                setDuration(video.duration);
            }
        };

        const handleEnded = () => setPlaying(false);

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('ended', handleEnded);
        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setPlaying(true);
        } else {
            videoRef.current.pause();
            setPlaying(false);
        }
    };

    const handleSeek = (e) => {
        if (!videoRef.current) return;
        const seekTime = (e.target.value / 100) * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
        setProgress(e.target.value);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="h-full flex flex-col bg-black relative group font-mono">
            {/* Title Bar Overlay (Fades out) */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <h2 className="text-white text-sm font-bold tracking-wider truncate">{title}</h2>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden" onClick={togglePlay}>
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    src={src}
                    loop={false}
                />

                {/* Play Overlay */}
                {!playing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none backdrop-blur-[1px]">
                        <div className="w-20 h-20 rounded-full border-2 border-yellow-500/50 flex items-center justify-center bg-black/50 hover:scale-110 transition-transform duration-300">
                            <Play className="text-yellow-500 ml-2" size={40} />
                        </div>
                    </div>
                )}
            </div>

            {/* Controls - Shows on hover */}
            <div className="h-16 bg-black/90 backdrop-blur-md border-t border-yellow-500/20 flex flex-col px-4 pb-2 absolute bottom-0 left-0 right-0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30">
                {/* Progress Bar */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-3 accent-yellow-500 hover:h-2 transition-all mt-[-4px]"
                />

                <div className="flex items-center justify-between text-yellow-100">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="hover:text-yellow-400 hover:scale-110 transition-transform">
                            {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>

                        <div className="flex items-center gap-1 text-xs font-mono text-gray-400">
                            <span className="text-white">{formatTime(videoRef.current?.currentTime)}</span>
                            <span>/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={() => setMuted(!muted)} className="hover:text-yellow-400">
                                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={muted ? 0 : volume}
                                onChange={(e) => {
                                    setVolume(e.target.value);
                                    if (videoRef.current) videoRef.current.volume = e.target.value;
                                    setMuted(e.target.value === '0');
                                }}
                                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                        </div>
                        <button className="hover:text-yellow-400 ml-2">
                            <Maximize size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
