'use client';
import { useState, useEffect, useCallback } from 'react';

export default function Calculator() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);

    const handleClick = useCallback((value) => {
        setInput((prev) => prev + value);
    }, []);

    const handleClear = useCallback(() => {
        setInput('');
        setResult('');
    }, []);

    const handleDelete = useCallback(() => {
        setInput((prev) => prev.slice(0, -1));
    }, []);

    const handleCalculate = useCallback(() => {
        setInput((currentInput) => {
            if (!currentInput) return currentInput;
            try {
                const sanitized = currentInput.replace(/×/g, '*').replace(/÷/g, '/');
                if (/[^0-9+\-*/.%()\s]/.test(sanitized)) {
                    setResult('Error');
                    return currentInput;
                }
                const evalResult = new Function(`return ${sanitized}`)();
                setResult(String(evalResult));
            } catch {
                setResult('Error');
            }
            return currentInput;
        });
    }, []);

    const handleCopyResult = () => {
        const textToCopy = result !== '' ? result : input;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Keyboard listener for physical keyboard & Numpad
    useEffect(() => {
        const handleKeyDown = (e) => {
            const { key, target } = e;

            // If user is inside the calculator input, allow standard Enter to compute
            if (target?.id === 'calc-input') {
                if (key === 'Enter' || key === '=') {
                    e.preventDefault();
                    handleCalculate();
                }
                return;
            }

            // Skip keyboard listener if user is typing in another input/textarea
            if (['INPUT', 'TEXTAREA'].includes(target?.tagName)) {
                return;
            }

            if (/^[0-9.]$/.test(key)) {
                handleClick(key);
            } else if (key === '+') {
                handleClick('+');
            } else if (key === '-') {
                handleClick('-');
            } else if (key === '*') {
                handleClick('×');
            } else if (key === '/') {
                e.preventDefault();
                handleClick('÷');
            } else if (key === '%') {
                handleClick('%');
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                handleCalculate();
            } else if (key === 'Backspace') {
                handleDelete();
            } else if (key === 'Escape' || key.toLowerCase() === 'c') {
                handleClear();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClick, handleClear, handleDelete, handleCalculate]);

    const buttons = [
        { label: 'C', onClick: handleClear, type: 'action' },
        { label: '⌫', onClick: handleDelete, type: 'action' },
        { label: '%', onClick: () => handleClick('%'), type: 'operator' },
        { label: '÷', onClick: () => handleClick('÷'), type: 'operator' },
        { label: '7', onClick: () => handleClick('7'), type: 'num' },
        { label: '8', onClick: () => handleClick('8'), type: 'num' },
        { label: '9', onClick: () => handleClick('9'), type: 'num' },
        { label: '×', onClick: () => handleClick('×'), type: 'operator' },
        { label: '4', onClick: () => handleClick('4'), type: 'num' },
        { label: '5', onClick: () => handleClick('5'), type: 'num' },
        { label: '6', onClick: () => handleClick('6'), type: 'num' },
        { label: '-', onClick: () => handleClick('-'), type: 'operator' },
        { label: '1', onClick: () => handleClick('1'), type: 'num' },
        { label: '2', onClick: () => handleClick('2'), type: 'num' },
        { label: '3', onClick: () => handleClick('3'), type: 'num' },
        { label: '+', onClick: () => handleClick('+'), type: 'operator' },
        { label: '0', onClick: () => handleClick('0'), type: 'num', span: 'col-span-2' },
        { label: '.', onClick: () => handleClick('.'), type: 'num' },
        { label: '=', onClick: handleCalculate, type: 'equals' },
    ];

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 max-w-md mx-auto w-full transition-colors duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Basic Calculator</h2>
                <button
                    onClick={handleCopyResult}
                    className="px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition"
                >
                    {copied ? '✓ Copied!' : '📋 Copy Result'}
                </button>
            </div>

            {/* Interactive Screen Display (Editable & Copy/Pasteable) */}
            <div className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80 p-3 rounded-xl flex flex-col gap-1 transition-colors">
                <input
                    id="calc-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-right text-sm font-mono text-gray-500 dark:text-gray-400 focus:outline-none placeholder:text-gray-400"
                />
                <div className="text-right text-2xl font-bold font-mono text-gray-800 dark:text-white truncate min-h-[32px]">
                    {result !== '' ? result : ''}
                </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-4 gap-2">
                {buttons.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={btn.onClick}
                        className={`py-3 rounded-xl font-semibold text-base transition active:scale-95 ${
                            btn.span || ''
                        } ${
                            btn.type === 'action'
                                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-transparent dark:border-red-900/40'
                                : btn.type === 'operator'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-transparent dark:border-blue-900/40'
                                    : btn.type === 'equals'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-sm shadow-blue-500/20'
                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Keyboard Shortcuts Helper */}
            <div className="mt-2 pt-3 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1.5">
                <p className="font-semibold text-gray-700 dark:text-gray-300">⌨️ Keyboard Shortcuts:</p>
                <ul className="space-y-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                    <li><span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">Enter</span> or <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-gray-200 dark:border-slate-700">=</span> : Computes the expression</li>
                    <li><span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">Backspace</span> : Deletes character</li>
                    <li><span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">Esc</span> or <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">C</span> : Clears screen</li>
                </ul>
            </div>
        </div>
    );
}