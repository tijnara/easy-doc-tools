'use client';
import { useState, useEffect, useRef } from 'react';
import { removeExtraSpaces } from '../lib/textUtils';
import { supabase } from '../lib/supabase';

export default function LineDeleter() {
    const [input, setInput] = useState('');
    const [feedback, setFeedback] = useState('');
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const textareaRef = useRef(null);

    // Fetch last 10 history items on load
    useEffect(() => {
        fetchHistory();
    }, []);

    // Auto-adjust textarea height dynamically when input changes
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.max(176, textareaRef.current.scrollHeight)}px`;
        }
    }, [input]);

    const fetchHistory = async () => {
        const { data, error } = await supabase
            .from('text_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setHistory(data);
        }
    };

    const handleCleanAndCopy = async () => {
        if (!input.trim()) return;

        const cleanedText = removeExtraSpaces(input, 'blank-lines');
        setInput(cleanedText);

        // Auto-copy to clipboard
        navigator.clipboard.writeText(cleanedText);
        showToast('Cleaned & Copied!');

        // Save to Supabase database
        const { data, error } = await supabase
            .from('text_history')
            .insert([{ cleaned_text: cleanedText }])
            .select();

        if (!error && data) {
            setHistory((prev) => [data[0], ...prev.slice(0, 9)]);
        }
    };

    const handleClear = () => {
        setInput('');
        showToast('Cleared!');
    };

    const handleCopyOnly = () => {
        if (!input.trim()) return;
        navigator.clipboard.writeText(input);
        showToast('Copied to clipboard!');
    };

    const showToast = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 2500);
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Clean Up Text</h2>
                {feedback && (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50">
                        ✓ {feedback}
                    </span>
                )}
            </div>

            <textarea
                ref={textareaRef}
                className="w-full min-h-[176px] p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-y text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all overflow-hidden"
                placeholder="Paste messy text with extra line spaces here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />

            {/* Button Actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
                <button
                    onClick={handleCleanAndCopy}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold active:scale-95 transition shadow-sm shadow-blue-500/20"
                >
                    Remove Blank Lines
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={handleCopyOnly}
                        className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold active:scale-95 transition"
                    >
                        Copy
                    </button>

                    <button
                        onClick={handleClear}
                        className="py-3.5 px-4 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-semibold active:scale-95 transition border border-red-100 dark:border-red-900/40"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* History Drawer */}
            <div className="mt-2 border-t pt-3 border-gray-100 dark:border-slate-800">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex justify-between items-center w-full text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 uppercase tracking-wider py-1 transition"
                >
                    <span>Recent History ({history.length}/10)</span>
                    <span>{showHistory ? '▲ Hide' : '▼ Show'}</span>
                </button>

                {showHistory && (
                    <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                        {history.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">No history saved yet.</p>
                        ) : (
                            history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setInput(item.cleaned_text);
                                        showToast('Loaded from history!');
                                    }}
                                    className="p-3 bg-gray-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/60 cursor-pointer active:scale-98 transition"
                                >
                                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 font-mono">
                                        {item.cleaned_text}
                                    </p>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}