import React, { useState } from 'react';
import { Save, FileCode, Play } from 'lucide-react';

export default function CodeEditorApp() {
    const [code, setCode] = useState('// Welcome to Code Grid v1.0\n// Start hacking...\n\nfunction helloWorld() {\n    return "Hello, Night City!";\n}\n\nconsole.log(helloWorld());');
    const [output, setOutput] = useState('');

    const runCode = () => {
        try {
            // Unsafe eval for "fun" - in a real app would use a sandboxed runner or iframe
            // But for a personal "OS" mock, capturing console.log is enough
            let logs = [];
            const mockConsole = { log: (...args) => logs.push(args.join(' ')) };
            // eslint-disable-next-line no-new-func
            const runner = new Function('console', code);
            runner(mockConsole);
            setOutput(logs.join('\n') || 'Executed successfully (No output)');
        } catch (e) {
            setOutput(`Error: ${e.message}`);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] font-mono text-sm">
            {/* Toolbar */}
            <div className="h-10 bg-[#252526] border-b border-[#3e3e42] flex items-center px-4 gap-4">
                <div className="flex items-center gap-2 text-blue-400">
                    <FileCode size={16} />
                    <span className="text-xs">script.js</span>
                </div>
                <div className="w-[1px] h-4 bg-gray-600"></div>
                <button className="flex items-center gap-1 text-gray-300 hover:text-white px-2 py-1 hover:bg-white/10 rounded transition-colors text-xs" onClick={() => alert('Saved!')}>
                    <Save size={14} /> SAVE
                </button>
                <button className="flex items-center gap-1 text-green-400 hover:text-green-300 px-2 py-1 hover:bg-white/10 rounded transition-colors text-xs ml-auto" onClick={runCode}>
                    <Play size={14} /> RUN
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Editor Area */}
                <div className="flex-1 relative bg-[#1e1e1e]">
                    <textarea
                        className="w-full h-full bg-transparent text-[#d4d4d4] p-4 outline-none resize-none font-mono leading-relaxed"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        spellCheck="false"
                    />
                </div>

                {/* Output Panel (Right side for now) */}
                {output && (
                    <div className="w-64 bg-[#111] border-l border-[#3e3e42] flex flex-col">
                        <div className="p-2 text-xs uppercase text-gray-500 border-b border-[#333] font-bold">Console Output</div>
                        <div className="p-4 text-xs text-green-400 font-mono whitespace-pre-wrap overflow-auto flex-1">
                            {output}
                        </div>
                        <button className="p-2 text-xs text-gray-500 hover:text-white border-t border-[#333]" onClick={() => setOutput('')}>CLEAR</button>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-xs">
                <span>JavaScript</span>
                <span>Ln {code.split('\n').length}, Col 1</span>
            </div>
        </div>
    );
}
