import React, { useState } from 'react';
import { Delete } from 'lucide-react';

export default function CalculatorApp() {
    const [display, setDisplay] = useState('0');
    const [history, setHistory] = useState('');
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const [pendingOp, setPendingOp] = useState(null);
    const [val, setVal] = useState(null);

    const digit = (d) => {
        if (waitingForOperand) {
            setDisplay(String(d));
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? String(d) : display + d);
        }
    };

    const op = (operator) => {
        const nextVal = parseFloat(display);

        const operations = {
            '/': (a, b) => a / b,
            '*': (a, b) => a * b,
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '=': (a, b) => b
        };

        if (val == null) {
            setVal(nextVal);
        } else if (pendingOp) {
            const currentValue = val || 0;
            const computed = operations[pendingOp](currentValue, nextVal);
            setVal(computed);
            setDisplay(String(computed));
        }

        setWaitingForOperand(true);
        setPendingOp(operator);
        setHistory(operator !== '=' ? `${display} ${operator}` : '');
    };

    const clear = () => {
        setDisplay('0');
        setVal(null);
        setPendingOp(null);
        setWaitingForOperand(false);
        setHistory('');
    };

    const backspace = () => {
        setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    };

    const btnClass = "bg-[#222] hover:bg-[#333] active:bg-yellow-500/20 active:text-yellow-500 text-white font-mono text-xl transition-colors rounded shadow-sm border border-white/5";
    const opClass = "bg-yellow-600/20 text-yellow-500 hover:bg-yellow-500/40 border-yellow-500/30";

    return (
        <div className="h-full flex flex-col bg-[#111] p-4 font-mono select-none">
            <div className="flex-1 bg-black/50 rounded-lg mb-4 p-4 border border-yellow-500/20 flex flex-col justify-end items-end shadow-inner relative overflow-hidden">
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%]"></div>
                <div className="text-xs text-yellow-600 mb-1 h-4">{history}</div>
                <div className="text-4xl text-yellow-400 font-bold tracking-widest">{display}</div>
            </div>

            <div className="grid grid-cols-4 gap-3 h-3/5">
                <button onClick={clear} className={`${btnClass} text-red-400 col-span-2`}>AC</button>
                <button onClick={backspace} className={`${btnClass} text-red-300`}><Delete size={20} className="mx-auto" /></button>
                <button onClick={() => op('/')} className={`${btnClass} ${opClass}`}>/</button>

                <button onClick={() => digit(7)} className={btnClass}>7</button>
                <button onClick={() => digit(8)} className={btnClass}>8</button>
                <button onClick={() => digit(9)} className={btnClass}>9</button>
                <button onClick={() => op('*')} className={`${btnClass} ${opClass}`}>*</button>

                <button onClick={() => digit(4)} className={btnClass}>4</button>
                <button onClick={() => digit(5)} className={btnClass}>5</button>
                <button onClick={() => digit(6)} className={btnClass}>6</button>
                <button onClick={() => op('-')} className={`${btnClass} ${opClass}`}>-</button>

                <button onClick={() => digit(1)} className={btnClass}>1</button>
                <button onClick={() => digit(2)} className={btnClass}>2</button>
                <button onClick={() => digit(3)} className={btnClass}>3</button>
                <button onClick={() => op('+')} className={`${btnClass} ${opClass}`}>+</button>

                <button onClick={() => digit(0)} className={`${btnClass} col-span-2`}>0</button>
                <button onClick={() => digit('.')} className={btnClass}>.</button>
                <button onClick={() => op('=')} className={`${btnClass} bg-yellow-600 text-black font-bold border-none hover:bg-yellow-500`}>=</button>
            </div>
        </div>
    );
}
