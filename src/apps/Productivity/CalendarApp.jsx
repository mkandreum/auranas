import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function CalendarApp() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([
        { id: 1, date: new Date(2025, 11, 25), title: 'Christmas', color: 'red' },
        { id: 2, date: new Date(2025, 11, 31), title: 'New Year Eve', color: 'yellow' },
    ]);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getEventsForDate = (date) => {
        if (!date) return [];
        return events.filter(e => e.date.toDateString() === date.toDateString());
    };

    const days = getDaysInMonth(currentDate);

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a] text-white p-4 font-mono">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-yellow-500">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h1>
                    <p className="text-xs text-gray-500">TIME SYNC v2.0</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded">
                        <ChevronRight size={20} />
                    </button>
                    <button className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-black font-bold text-sm flex items-center gap-1">
                        <Plus size={16} /> EVENT
                    </button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-yellow-500 p-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 flex-1">
                {days.map((date, i) => {
                    const dayEvents = getEventsForDate(date);
                    return (
                        <div
                            key={i}
                            className={`
                                border border-white/10 rounded p-2 relative
                                ${date ? 'hover:bg-white/5 cursor-pointer' : 'bg-transparent border-transparent'}
                                ${isToday(date) ? 'border-yellow-500 bg-yellow-500/10' : ''}
                            `}
                        >
                            {date && (
                                <>
                                    <div className={`text-sm font-bold ${isToday(date) ? 'text-yellow-500' : 'text-gray-300'}`}>
                                        {date.getDate()}
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className={`text-xs px-1 rounded truncate ${event.color === 'red' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
                                                    }`}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Quick Stats */}
            <div className="mt-4 flex gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-gray-400">Today</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-400">Events</span>
                </div>
            </div>
        </div>
    );
}
