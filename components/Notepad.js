'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Notepad() {
    const [title, setTitle] = useState('Quick Note');
    const [content, setContent] = useState('');
    const [feedback, setFeedback] = useState('');
    const [copied, setCopied] = useState(false);

    // Load active note from this PC's localStorage on mount
    useEffect(() => {
        const savedNote = localStorage.getItem('notepad_content_local');
        const savedTitle = localStorage.getItem('notepad_title_local');

        if (savedNote !== null) setContent(savedNote);
        if (savedTitle !== null) setTitle(savedTitle);
    }, []);

    // Auto-save active note content locally on every keystroke
    const handleContentChange = (val) => {
        setContent(val);
        localStorage.setItem('notepad_content_local', val);
    };

    const handleTitleChange = (val) => {
        setTitle(val);
        localStorage.setItem('notepad_title_local', val);
    };

    // Silent database logging (Supabase)
    const saveToHistory = async (noteTitle, noteContent) => {
        try {
            await supabase
                .from('notepad_history')
                .insert([{ title: noteTitle.trim() || 'Untitled Note', content: noteContent }]);
        } catch (err) {
            console.error('Supabase database sync error:', err);
        }
    };

    const handleDownloadTxt = async () => {
        if (!content.trim()) return;

        const cleanTitle = (title.trim() || 'quick_note').replace(/[^a-z0-9_-]/gi, '_');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${cleanTitle}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Saved & Downloaded!');

        // Silent save to Supabase
        await saveToHistory(title, content);
    };

    const handleCopy = () => {
        if (!content.trim()) return;
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        if (!content) return;
        setContent('');
        localStorage.removeItem('notepad_content_local');
        showToast('Cleared note!');
    };

    const showToast = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 2500);
    };

    // Live Metrics
    const charCount = content.length;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lineCount = content ? content.split('\n').length : 0;

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 max-w-md mx-auto w-full transition-colors duration-300">
            {/* Header & Editable Title */}
            <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">📝</span>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Note Title..."
                        title="Click to edit note title"
                        className="font-bold text-lg text-gray-800 dark:text-white bg-transparent focus:outline-none focus:border-b border-blue-500 w-full truncate"
                    />
                </div>

                {feedback && (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-900/50 shrink-0">
                        ✓ {feedback}
                    </span>
                )}
            </div>

            {/* Note Editor Area */}
            <div className="flex flex-col bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80 rounded-xl overflow-hidden">
                <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Type or paste quick notes here... (Auto-saves locally on this PC)"
                    rows={7}
                    title="Quick workspace notepad"
                    className="w-full p-3 bg-transparent text-sm font-mono text-gray-800 dark:text-gray-100 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none transition-colors"
                />

                {/* Footer Metrics Bar */}
                <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-900/80 border-t border-gray-200 dark:border-slate-800/60 flex justify-between items-center text-[11px] font-mono text-gray-500 dark:text-gray-400 select-none">
                    <span>{wordCount} Words | {charCount} Chars</span>
                    <span>{lineCount} Lines</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={handleCopy}
                    disabled={!content.trim()}
                    title="Copy note to clipboard"
                    className="py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-40 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition active:scale-95 disabled:cursor-not-allowed"
                >
                    {copied ? '✓ Copied' : '📋 Copy'}
                </button>
                <button
                    onClick={handleDownloadTxt}
                    disabled={!content.trim()}
                    title="Download note as .txt document"
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-sm shadow-blue-500/20 disabled:cursor-not-allowed"
                >
                    💾 Save .txt
                </button>
                <button
                    onClick={handleClear}
                    disabled={!content}
                    title="Clear current note text"
                    className="py-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-40 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl transition border border-red-100 dark:border-red-900/40 active:scale-95 disabled:cursor-not-allowed"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}