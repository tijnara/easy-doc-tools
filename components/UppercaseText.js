'use client';
import { useState } from 'react';

export default function UppercaseText() {
    const [text, setText] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setText('');
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white select-text">
                    Auto-Capitalize Text
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClear}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition border border-red-200 dark:border-red-900/50"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition border border-blue-200 dark:border-blue-900/50"
                    >
                        {copied ? '✓ Copied!' : '📋 Copy Text'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-text">
                    Text Content
                </label>
                <textarea
                    value={text}
                    // Instantly forces all input to uppercase
                    onChange={(e) => setText(e.target.value.toUpperCase())}
                    placeholder="Type or paste text here. It will instantly convert to UPPERCASE..."
                    className="w-full h-80 p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors uppercase shadow-inner"
                />
            </div>

            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                    {text.length} Characters
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                    {text.split(/\s+/).filter(Boolean).length} Words
                </span>
            </div>
        </div>
    );
}