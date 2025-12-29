import React from 'react';
import { CloudRain, Sun, Cloud, Wind, Droplets } from 'lucide-react';

export default function WeatherApp() {
    // Mock Data for "Night City"
    const current = { temp: 24, condition: 'Rain', humidity: 82, wind: 12 };
    const forecast = [
        { day: 'TOM', temp: 22, icon: Cloud },
        { day: 'WED', temp: 19, icon: CloudRain },
        { day: 'THU', temp: 25, icon: Sun },
    ];

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-blue-900 via-slate-900 to-black p-6 text-white overflow-hidden relative">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/t7Qb8655Z1VfBGr5XB/giphy.gif')] opacity-10 bg-cover pointer-events-none mix-blend-screen"></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-wider">NIGHT CITY</h1>
                        <p className="text-blue-300 text-sm font-mono mt-1">SECTOR 4</p>
                    </div>
                    <CloudRain size={48} className="text-blue-400 animate-pulse" />
                </div>

                <div className="flex-1 flex flex-col justify-center py-6">
                    <div className="text-7xl font-bold flex items-start">
                        {current.temp}
                        <span className="text-4xl text-blue-400 mt-2">°</span>
                    </div>
                    <div className="text-xl text-blue-200 mt-2 font-light">{current.condition}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Droplets className="text-blue-400" />
                        <div>
                            <div className="text-xs text-gray-400">Humidity</div>
                            <div className="font-bold">{current.humidity}%</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Wind className="text-gray-400" />
                        <div>
                            <div className="text-xs text-gray-400">Wind</div>
                            <div className="font-bold">{current.wind} km/h</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between border-t border-white/10 pt-4">
                    {forecast.map((d, i) => {
                        const IconComponent = d.icon;
                        return (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <span className="text-xs text-gray-400 font-bold">{d.day}</span>
                                <IconComponent size={24} className="text-gray-300" />
                                <span className="font-bold">{d.temp}°</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
