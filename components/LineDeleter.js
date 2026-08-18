'use client';
import { useState, useEffect } from 'react';
import { removeExtraSpaces } from '../lib/textUtils';
import { supabase } from '../lib/supabase';

export default function LineDeleter() {
    const [input, setInput] = useState('');
    const [feedback, setFeedback] = useState('');
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // Fetch last 10 history items on load
    useEffect(() => {
        fetchHistory();
    }, []);

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
        <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Clean Up Text</h2>
                {feedback && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            ✓ {feedback}
          </span>
                )}
            </div>

            <textarea
                className="w-full h-44 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none text-gray-800"
                placeholder="Paste messy text with extra line spaces here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />

            {/* Button Actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
                <button
                    onClick={handleCleanAndCopy}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold active:scale-95 transition"
                >
                    Remove Blank Lines
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={handleCopyOnly}
                        className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold active:scale-95 transition"
                    >
                        Copy
                    </button>

                    <button
                        onClick={handleClear}
                        className="py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold active:scale-95 transition border border-red-100"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* History Drawer */}
            <div className="mt-2 border-t pt-3 border-gray-100">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex justify-between items-center w-full text-xs font-bold text-gray-500 uppercase tracking-wider py-1"
                >
                    <span>Recent History ({history.length}/10)</span>
                    <span>{showHistory ? '▲ Hide' : '▼ Show'}</span>
                </button>

                {showHistory && (
                    <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2">No history saved yet.</p>
                        ) : (
                            history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setInput(item.cleaned_text);
                                        showToast('Loaded from history!');
                                    }}
                                    className="p-3 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 cursor-pointer active:scale-98 transition"
                                >
                                    <p className="text-xs text-gray-700 line-clamp-2 font-mono">
                                        {item.cleaned_text}
                                    </p>
                                    <span className="text-[10px] text-gray-400 mt-1 block">
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