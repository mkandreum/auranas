import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';

export default function VideoPlayerApp({ src = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm" }) {
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
            setProgress((video.currentTime / video.duration) * 100);
            setDuration(video.duration);
        };

        video.addEventListener('timeupdate', updateProgress);
        return () => video.removeEventListener('timeupdate', updateProgress);
    }, []);

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setPlaying(true);
        } else {
            videoRef.current.pause();
            setPlaying(false);
        }
    };

    const handleSeek = (e) => {
        const seekTime = (e.target.value / 100) * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
        setProgress(e.target.value);
    };

    const formatTime = (seconds) => {
        if (!seconds) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="h-full flex flex-col bg-black relative group">
            {/* Video Area */}
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    src={src}
                    onClick={togglePlay}
                    loop
                />

                {/* Play Overlay */}
                {!playing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                        <div className="w-16 h-16 rounded-full border-2 border-yellow-500/50 flex items-center justify-center">
                            <Play className="text-yellow-500 ml-1" size={32} />
                        </div>
                    </div>
                )}
            </div>

            {/* Controls - Shows on hover */}
            <div className="h-14 bg-black/80 backdrop-blur-md border-t border-yellow-500/20 flex flex-col px-4 pb-2 absolute bottom-0 left-0 right-0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                {/* Progress Bar */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-2accent-yellow-500 hover:h-2 transition-all"
                    style={{ accentColor: '#eab308' }}
                />

                <div className="flex items-center justify-between text-yellow-100">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="hover:text-yellow-400">
                            {playing ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <div className="flex items-center gap-2 text-sm font-mono">
                            <span>{formatTime(videoRef.current?.currentTime)}</span>
                            <span className="text-gray-500">/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={() => setMuted(!muted)} className="hover:text-yellow-400">
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
                                    videoRef.current.volume = e.target.value;
                                    setMuted(e.target.value === 0);
                                }}
                                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
