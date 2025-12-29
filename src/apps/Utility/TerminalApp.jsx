import React, { useState, useRef, useEffect } from 'react';

export default function TerminalApp() {
    const [history, setHistory] = useState([
        { type: 'output', content: 'NetRunner v2.0.77 [Secure Shell]' },
        { type: 'output', content: 'Connection established to local host...' },
        { type: 'output', content: 'Type "help" for a list of commands.' },
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleCommand = (e) => {
        if (e.key === 'Enter') {
            const cmd = input.trim();
            const newHistory = [...history, { type: 'input', content: cmd }];

            let output = '';
            switch (cmd.toLowerCase()) {
                case 'help':
                    output = 'Available commands: help, clear, date, whoami, ls, echo [text], version';
                    break;
                case 'clear':
                    setHistory([]);
                    setInput('');
                    return;
                case 'date':
                    output = new Date().toString();
                    break;
                case 'whoami':
                    output = 'root@auranos';
                    break;
                case 'ls':
                    output = 'Photos/  Documents/  System/  Trash/  config.json';
                    break;
                case 'version':
                    output = 'AuraOS Kernel v1.0.0 (Cyberpunk Edition)';
                    break;
                default:
                    if (cmd.startsWith('echo ')) {
                        output = cmd.slice(5);
                    } else if (cmd === '') {
                        output = '';
                    } else {
                        output = `Command not found: ${cmd}`;
                    }
            }

            if (output) {
                newHistory.push({ type: 'output', content: output });
            }

            setHistory(newHistory);
            setInput('');
        }
    };

    return (
        <div className="h-full bg-black bg-opacity-95 text-green-500 font-mono p-4 text-sm overflow-auto" onClick={() => document.getElementById('term-input').focus()}>
            {history.map((line, i) => (
                <div key={i} className={`mb-1 ${line.type === 'input' ? 'text-white font-bold' : 'text-green-400 opacity-90'}`}>
                    {line.type === 'input' ? <span className="text-yellow-500 mr-2">root@auranos:~$</span> : ''}
                    {line.content}
                </div>
            ))}
            <div className="flex items-center">
                <span className="text-yellow-500 mr-2">root@auranos:~$</span>
                <input
                    id="term-input"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    className="flex-1 bg-transparent border-none outline-none text-white caret-green-500"
                    autoFocus
                    autoComplete="off"
                />
            </div>
            <div ref={bottomRef} />
        </div>
    );
}
