'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function Calculator() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);

    // Local Device History state
    const [localHistory, setLocalHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load local history ONLY from this specific PC on mount
    useEffect(() => {
        const saved = localStorage.getItem('calculator_history_local');
        if (saved) {
            try {
                setLocalHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse local calculator history:', e);
            }
        }
    }, []);

    // Save history to local PC AND silently upload to Supabase
    const recordCalculation = async (expr, res) => {
        const newEntry = {
            id: Date.now(),
            expression: expr,
            result: res,
            created_at: new Date().toISOString(),
        };

        // 1. Save to THIS computer's browser storage
        setLocalHistory((prev) => {
            const updated = [newEntry, ...prev.filter((i) => i.id !== newEntry.id).slice(0, 9)];
            localStorage.setItem('calculator_history_local', JSON.stringify(updated));
            return updated;
        });

        // 2. Silent database logging (Supabase)
        try {
            await supabase
                .from('calculator_history')
                .insert([{ expression: expr, result: res }]);
        } catch (err) {
            console.error('Supabase database sync error:', err);
        }
    };

    const clearLocalHistory = () => {
        localStorage.removeItem('calculator_history_local');
        setLocalHistory([]);
    };

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

    const handleCalculate = useCallback(async () => {
        if (!input) return;
        try {
            const sanitized = input.replace(/×/g, '*').replace(/÷/g, '/');
            if (/[^0-9+\-*/.%()\s]/.test(sanitized)) {
                setResult('Error');
                return;
            }
            const evalResult = new Function(`return ${sanitized}`)();
            const resStr = String(evalResult);
            setResult(resStr);
            await recordCalculation(input, resStr);
        } catch {
            setResult('Error');
        }
    }, [input]);

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
        { label: 'C', onClick: handleClear, type: 'action', title: 'Clear screen (Esc / C)' },
        { label: '⌫', onClick: handleDelete, type: 'action', title: 'Delete last character (Backspace)' },
        { label: '%', onClick: () => handleClick('%'), type: 'operator', title: 'Percentage (%)' },
        { label: '÷', onClick: () => handleClick('÷'), type: 'operator', title: 'Divide (/)' },
        { label: '7', onClick: () => handleClick('7'), type: 'num', title: 'Input 7' },
        { label: '8', onClick: () => handleClick('8'), type: 'num', title: 'Input 8' },
        { label: '9', onClick: () => handleClick('9'), type: 'num', title: 'Input 9' },
        { label: '×', onClick: () => handleClick('×'), type: 'operator', title: 'Multiply (*)' },
        { label: '4', onClick: () => handleClick('4'), type: 'num', title: 'Input 4' },
        { label: '5', onClick: () => handleClick('5'), type: 'num', title: 'Input 5' },
        { label: '6', onClick: () => handleClick('6'), type: 'num', title: 'Input 6' },
        { label: '-', onClick: () => handleClick('-'), type: 'operator', title: 'Subtract (-)' },
        { label: '1', onClick: () => handleClick('1'), type: 'num', title: 'Input 1' },
        { label: '2', onClick: () => handleClick('2'), type: 'num', title: 'Input 2' },
        { label: '3', onClick: () => handleClick('3'), type: 'num', title: 'Input 3' },
        { label: '+', onClick: () => handleClick('+'), type: 'operator', title: 'Add (+)' },
        { label: '0', onClick: () => handleClick('0'), type: 'num', span: 'col-span-2', title: 'Input 0' },
        { label: '.', onClick: () => handleClick('.'), type: 'num', title: 'Decimal point (.)' },
        { label: '=', onClick: handleCalculate, type: 'equals', title: 'Calculate result (Enter / =)' },
    ];

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 max-w-md mx-auto w-full transition-colors duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white" title="Interactive calculator with local history">
                    Basic Calculator
                </h2>
                <button
                    onClick={handleCopyResult}
                    title="Copy current result or input value to clipboard"
                    className="px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition"
                >
                    {copied ? '✓ Copied!' : '📋 Copy Result'}
                </button>
            </div>

            {/* Interactive Screen Display */}
            <div className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80 p-3 rounded-xl flex flex-col gap-1 transition-colors">
                <input
                    id="calc-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="0"
                    title="Type or edit calculation expression"
                    className="w-full bg-transparent text-right text-sm font-mono text-gray-500 dark:text-gray-400 focus:outline-none placeholder:text-gray-400"
                />
                <div
                    title={`Calculated result: ${result || '0'}`}
                    className="text-right text-2xl font-bold font-mono text-gray-800 dark:text-white truncate min-h-[32px]"
                >
                    {result !== '' ? result : ''}
                </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-4 gap-2">
                {buttons.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={btn.onClick}
                        title={btn.title}
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

            {/* Local Computer History Drawer */}
            <div className="mt-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center py-1">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        title="Toggle recent calculations created on this computer"
                        className="flex justify-between items-center w-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 uppercase tracking-wider transition"
                    >
                        <span>Recent Calculations on this PC ({localHistory.length}/10)</span>
                        <span>{showHistory ? '▲ Hide' : '▼ Show'}</span>
                    </button>

                    {localHistory.length > 0 && showHistory && (
                        <button
                            onClick={clearLocalHistory}
                            title="Clear local calculator history from this computer"
                            className="text-[10px] text-red-500 hover:text-red-700 font-bold shrink-0 ml-2 transition"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {showHistory && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                        {localHistory.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">
                                No calculations saved on this computer.
                            </p>
                        ) : (
                            localHistory.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setInput(item.result);
                                        setResult('');
                                    }}
                                    title={`Click to load result "${item.result}" back into calculator`}
                                    className="p-2.5 bg-gray-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/60 cursor-pointer active:scale-98 transition flex justify-between items-center"
                                >
                                    <div className="flex flex-col gap-0.5 truncate pr-2">
                                        <span className="text-[10px] text-gray-400 font-mono truncate">
                                            {item.expression} =
                                        </span>
                                        <span className="text-xs font-bold font-mono text-gray-800 dark:text-gray-200">
                                            {item.result}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Keyboard Shortcuts Helper */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1.5">
                <p className="font-semibold text-gray-700 dark:text-gray-300">⌨️ Keyboard Shortcuts:</p>
                <ul className="space-y-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                    <li><span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">Enter</span> or <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-gray-200 dark:border-slate-700">=</span> : Computes expression</li>
                    <li><span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">Backspace</span> : Deletes character</li>
                    <li><span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">Esc</span> or <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">C</span> : Clears screen</li>
                </ul>
            </div>
        </div>
    );
}