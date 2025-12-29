import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function AIApp() {
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', content: 'Hello! I am Construct AI, your cyberpunk assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const responses = [
                "That's an interesting question. In the world of cyberpunk, data is the new currency.",
                "I've processed your request. The neural network suggests multiple pathways forward.",
                "Analyzing... The matrix reveals patterns in the chaos. Here's what I found.",
                "Connecting to the mainframe... Your query has been logged and processed.",
                "In Night City, information flows like neon through the streets. Let me illuminate your path."
            ];
            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: responses[Math.floor(Math.random() * responses.length)]
            };
            setMessages(prev => [...prev, aiMessage]);
            setTyping(false);
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-cyan-900 via-black to-purple-900">
            {/* Header */}
            <div className="bg-black/40 backdrop-blur-sm border-b border-cyan-500/30 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot size={24} className="text-white" />
                </div>
                <div>
                    <h2 className="text-white font-bold">Construct AI</h2>
                    <p className="text-xs text-cyan-400">Neural Interface v3.0</p>
                </div>
                <div className="ml-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-400">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot size={18} className="text-white" />
                            </div>
                        )}
                        <div className={`max-w-[70%] rounded-lg p-3 ${msg.role === 'user'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-cyan-500/30'
                            }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User size={18} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}
                {typing && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/30">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-black/40 backdrop-blur-sm border-t border-cyan-500/30 p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none focus:border-cyan-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || typing}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center gap-2"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">AI responses are simulated for demo purposes</p>
            </div>
        </div>
    );
}
