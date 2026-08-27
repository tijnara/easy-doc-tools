'use client';
import { useState, useEffect } from 'react';

export default function DateConverter() {
    const [input, setInput] = useState('13 August 2026');
    const [convertedResult, setConvertedResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    // Flexible Date Parser converting any valid date string to DD/MM/YYYY
    const convertToDmy = (rawText) => {
        if (!rawText || !rawText.trim()) return '';

        const lines = rawText.split('\n');
        const convertedLines = lines.map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return '';

            // 1. Direct regex check for already formatted DD/MM/YYYY or DD-MM-YYYY
            const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
            if (dmyMatch) {
                const day = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
                const month = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
                const year = dmyMatch[3];
                return `${day}/${month}/${year}`;
            }

            // 2. Direct regex check for ISO YYYY-MM-DD
            const isoMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
            if (isoMatch) {
                const year = isoMatch[1];
                const month = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
                const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
                return `${day}/${month}/${year}`;
            }

            // 3. Fallback to JS Date object parsing for textual month formats
            // E.g. "13 August 2026", "August 13, 2026", "13 Aug 2026"
            const parsedDate = new Date(trimmed);
            if (!isNaN(parsedDate.getTime())) {
                const day = String(parsedDate.getDate()).padStart(2, '0');
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const year = parsedDate.getFullYear();
                return `${day}/${month}/${year}`;
            }

            return '⚠️ Could not parse date format';
        });

        return convertedLines.join('\n');
    };

    // Auto-update converted output whenever input changes
    useEffect(() => {
        setConvertedResult(convertToDmy(input));
    }, [input]);

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text') || '';
        setInput(pastedText);
        showToast('Pasted & Converted!');
    };

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 2500);
    };

    const handleCopy = () => {
        if (!convertedResult) return;
        navigator.clipboard.writeText(convertedResult);
        setCopied(true);
        showToast('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white select-text cursor-text">
                        Date Converter
                    </h2>
                    {toastMsg && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50">
                            ✓ {toastMsg}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition select-none"
                >
                    {copied ? '✓ Copied!' : '📋 Copy Result'}
                </button>
            </div>

            {/* Input & Output Section */}
            <div className="grid grid-cols-1 gap-4">
                {/* Raw Date Input Field */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-text cursor-text">
                        Original Date / Dates (Paste Any Format)
                    </label>
                    <textarea
                        rows={3}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onPaste={handlePaste}
                        placeholder="e.g. 13 August 2026, Aug 13 2026, 2026-08-13 (one per line)..."
                        className="w-full p-3 border rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition select-text cursor-text resize-none"
                    />
                </div>

                {/* Standardized DD/MM/YYYY Output Preview */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider select-text cursor-text">
                        Converted Date (DD/MM/YYYY)
                    </label>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 border border-blue-100 dark:border-slate-800 rounded-xl flex items-center justify-between min-h-[56px] select-text">
                        <pre className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white font-mono select-text cursor-text whitespace-pre-wrap">
                            {convertedResult || '00/00/0000'}
                        </pre>
                        <button
                            onClick={handleCopy}
                            title="Copy converted date"
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs select-none"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            </div>

            {/* Supported Examples Indicator */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-bold text-gray-700 dark:text-gray-300">Supported input examples:</span>{' '}
                <span className="font-mono">13 August 2026</span>, <span className="font-mono">August 13, 2026</span>, <span className="font-mono">2026-08-13</span>, <span className="font-mono">13-08-2026</span>
            </div>
        </div>
    );
}