'use client';
import { useState, useEffect, useCallback } from 'react';

export default function Calculator() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

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

    // Listen for physical keyboard and Numpad events
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Skip calculator inputs if user is currently typing inside an input/textarea elsewhere
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                return;
            }

            const { key } = e;

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
        <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto w-full">
            <h2 className="text-xl font-bold text-gray-800">Basic Calculator</h2>

            {/* Screen Display */}
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col justify-between items-end min-h-[84px]">
                <div className="text-sm font-medium text-gray-400 overflow-x-auto max-w-full whitespace-nowrap">
                    {input || '0'}
                </div>
                <div className="text-2xl font-bold text-gray-800 overflow-x-auto max-w-full whitespace-nowrap">
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
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : btn.type === 'operator'
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    : btn.type === 'equals'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 font-bold'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Keyboard Shortcuts Helper */}
            <div className="mt-2 pt-3 border-t border-gray-100 text-xs text-gray-500 flex flex-col gap-1.5">
                <p className="font-semibold text-gray-700">⌨️ Keyboard Shortcuts:</p>
                <ul className="space-y-1 text-[11px] leading-snug text-gray-500">
                    <li><span className="font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Enter</span> or <span className="font-semibold text-gray-700 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">=</span> : Computes the expression</li>
                    <li><span className="font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Backspace</span> : Deletes the last entered character</li>
                    <li><span className="font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Esc</span> or <span className="font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">C</span> : Clears the display screen</li>
                </ul>
            </div>
        </div>
    );
}