import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Wind, Droplets, CloudSnow, CloudLightning, CloudFog, MapPin } from 'lucide-react';

const WMO_ICONS = {
    0: Sun, 1: Sun, 2: Cloud, 3: Cloud, // Clear/Cloudy
    45: CloudFog, 48: CloudFog, // Fog
    51: CloudRain, 53: CloudRain, 55: CloudRain, // Drizzle
    61: CloudRain, 63: CloudRain, 65: CloudRain, // Rain
    71: CloudSnow, 73: CloudSnow, 75: CloudSnow, // Snow
    80: CloudRain, 81: CloudRain, 82: CloudRain, // Showers
    95: CloudLightning, 96: CloudLightning, 99: CloudLightning // Thunderstorm
};

export default function WeatherApp() {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState({ name: 'Madrid', lat: 40.4168, lon: -3.7038 });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        name: 'Local Location',
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    });
                },
                (err) => console.warn("Geo access denied, using default"),
                { timeout: 5000 }
            );
        }
    }, []);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
                const data = await res.json();
                setWeather(data);
                setLoading(false);
            } catch (e) {
                console.error("Weather fetch failed", e);
                setLoading(false);
            }
        };
        fetchWeather();
    }, [location]);

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-black text-blue-400 font-mono flex-col gap-2">
            <Cloud className="animate-pulse" size={32} />
            <span className="animate-pulse">Accessing Satellite Feed...</span>
        </div>
    );

    if (!weather?.current) return (
        <div className="h-full flex items-center justify-center bg-black text-red-500 font-mono">
            Signal Lost. Check Connection.
        </div>
    );

    const current = weather.current;
    const daily = weather.daily || { time: [], temperature_2m_max: [], temperature_2m_min: [], weather_code: [] };
    const CurrentIcon = WMO_ICONS[current.weather_code] || Cloud;
    const isNight = current.is_day === 0;

    return (
        <div className={`h-full flex flex-col p-6 text-white overflow-hidden relative transition-colors duration-1000 ${isNight ? 'bg-gradient-to-b from-blue-950 via-slate-900 to-black' : 'bg-gradient-to-br from-blue-400 via-blue-300 to-blue-100'}`}>

            {/* Background Effect */}
            <div className={`absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay ${isNight ? "bg-[url('https://media.giphy.com/media/t7Qb8655Z1VfBGr5XB/giphy.gif')]" : "bg-white"}`}></div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-white/80">
                            <MapPin size={14} />
                            <span className="text-sm font-bold tracking-wider uppercase opacity-80">{location.name}</span>
                        </div>
                        <h1 className={`text-4xl font-bold mt-1 ${isNight ? 'text-white' : 'text-white drop-shadow-md'}`}>
                            {Math.round(current.temperature_2m)}°
                        </h1>
                    </div>
                    <CurrentIcon size={64} className={`${isNight ? 'text-blue-400' : 'text-yellow-300 drop-shadow-lg'} animate-pulse`} />
                </div>

                <div className="flex-1 flex flex-col justify-center py-6">
                    <div className="grid grid-cols-2 gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                        <div className="flex items-center gap-3">
                            <Droplets className="text-blue-300" />
                            <div>
                                <div className="text-xs text-blue-100">Humidity</div>
                                <div className="font-bold text-lg">{current.relative_humidity_2m}%</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Wind className="text-gray-300" />
                            <div>
                                <div className="text-xs text-blue-100">Wind</div>
                                <div className="font-bold text-lg">{current.wind_speed_10m} <span className="text-sm font-normal">km/h</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between border-t border-white/20 pt-4">
                    {daily.time.slice(1, 4).map((date, i) => {
                        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        const code = daily.weather_code[i + 1];
                        const DIcon = WMO_ICONS[code] || Cloud;
                        const max = Math.round(daily.temperature_2m_max[i + 1]);
                        const min = Math.round(daily.temperature_2m_min[i + 1]);

                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <span className="text-xs text-white/70 font-bold">{dayName}</span>
                                <DIcon size={24} className="text-white/90 my-1" />
                                <div className="flex gap-1 text-sm font-bold">
                                    <span>{max}°</span>
                                    <span className="text-white/50">{min}°</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
