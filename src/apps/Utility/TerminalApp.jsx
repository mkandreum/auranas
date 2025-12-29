import React, { useState, useRef, useEffect } from 'react';
import useFileSystem from '../../store/useFileSystem';

export default function TerminalApp() {
    const { loadFiles, files, currentPath, loading } = useFileSystem();
    const [history, setHistory] = useState([
        { type: 'output', content: 'NetRunner v2.1.0 [Connected]' },
        { type: 'output', content: `Logged in as root@auranos` },
        { type: 'output', content: 'Type "help" for commands.' },
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);

    // Initial load
    useEffect(() => {
        if (files.length === 0) loadFiles('/');
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleCommand = async (e) => {
        if (e.key === 'Enter') {
            const cmdLine = input.trim();
            if (!cmdLine) {
                setHistory(prev => [...prev, { type: 'input', content: '' }]);
                return;
            }

            const newHistory = [...history, { type: 'input', content: cmdLine }];
            const args = cmdLine.split(' ');
            const cmd = args[0].toLowerCase();
            let output = '';

            try {
                switch (cmd) {
                    case 'help':
                        output = 'Commands: ls, cd [path], pwd, clear, whoami, date, echo [text]';
                        break;
                    case 'clear':
                        setHistory([]);
                        setInput('');
                        return;
                    case 'pwd':
                        output = currentPath;
                        break;
                    case 'ls':
                        // Fetch fresh files for current path if needed or use store
                        // For terminal accuracy we might want to ensure store is fresh, but store is ok
                        output = files.map(f => (f.type === 'directory' ? f.name + '/' : f.name)).join('  ');
                        if (files.length === 0) output = '(empty)';
                        break;
                    case 'cd':
                        const target = args[1];
                        if (!target || target === '/') {
                            loadFiles('/');
                            output = '/';
                        } else if (target === '..') {
                            // Parent directory logic needed here or use store navigateUp if exposed
                            // We exposed navigateUp but it doesn't take args. We can calculate parent.
                            const parent = currentPath === '/' ? '/' : currentPath.split('/').slice(0, -1).join('/') || '/';
                            loadFiles(parent);
                            output = parent;
                        } else {
                            // Check if directory exists in current view
                            const exists = files.find(f => f.name === target && f.type === 'directory');
                            if (exists) {
                                const newPath = currentPath === '/' ? `/${target}` : `${currentPath}/${target}`;
                                loadFiles(newPath);
                                output = newPath;
                            } else {
                                // Try absolute path?
                                if (target.startsWith('/')) {
                                    loadFiles(target);
                                    output = target;
                                } else {
                                    output = `cd: ${target}: No such directory`;
                                }
                            }
                        }
                        break;
                    case 'whoami':
                        output = 'root';
                        break;
                    case 'date':
                        output = new Date().toString();
                        break;
                    case 'echo':
                        output = args.slice(1).join(' ');
                        break;
                    default:
                        output = `Command not found: ${cmd}`;
                }
            } catch (err) {
                output = `Error: ${err.message}`;
            }

            if (output) {
                newHistory.push({ type: 'output', content: output });
            }

            setHistory(newHistory);
            setInput('');
        }
    };

    return (
        <div className="h-full bg-black/95 text-green-500 font-mono p-4 text-sm overflow-auto" onClick={() => document.getElementById('term-input').focus()}>
            {history.map((line, i) => (
                <div key={i} className={`mb-1 break-all ${line.type === 'input' ? 'text-white font-bold' : 'text-green-400/90'}`}>
                    {line.type === 'input' && <span className="text-yellow-500 mr-2">{`root@auranos:${currentPath}$`}</span>}
                    {line.content}
                </div>
            ))}
            <div className="flex items-center">
                <span className="text-yellow-500 mr-2">{`root@auranos:${currentPath}$`}</span>
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
