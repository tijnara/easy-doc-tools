'use client';
import { useState, useEffect } from 'react';

export default function Notepad() {
    const [note, setNote] = useState('');
    const [feedback, setFeedback] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [filename, setFilename] = useState('');

    // Restore note from localStorage on mount
    useEffect(() => {
        const savedNote = localStorage.getItem('quick_note_content');
        if (savedNote) setNote(savedNote);
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setNote(val);
        localStorage.setItem('quick_note_content', val);
    };

    const showToast = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 2500);
    };

    const handleCopy = () => {
        if (!note.trim()) return;
        navigator.clipboard.writeText(note);
        showToast('Copied to clipboard!');
    };

    const handleClear = () => {
        if (!note) return;
        setNote('');
        localStorage.removeItem('quick_note_content');
        showToast('Note cleared!');
    };

    // Open filename modal with a smart default name
    const handleOpenSaveModal = () => {
        if (!note.trim()) return;
        const dateStr = new Date().toISOString().slice(0, 10);
        setFilename(`quick-note_${dateStr}`);
        setShowSaveModal(true);
    };

    const handleConfirmSave = () => {
        if (!note.trim()) return;

        const cleanName = filename.trim() || 'quick-note';
        const finalFileName = cleanName.endsWith('.txt') ? cleanName : `${cleanName}.txt`;

        const blob = new Blob([note], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFileName;
        a.click();
        URL.revokeObjectURL(url);

        setShowSaveModal(false);
        showToast('Saved as .txt!');
    };

    return (
        <div className="flex flex-col gap-3 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span>📝</span>
                    <span>Quick Note</span>
                </h2>

                {feedback && (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-0.5 rounded-full border border-green-200 dark:border-green-900/50">
                        ✓ {feedback}
                    </span>
                )}
            </div>

            <textarea
                value={note}
                onChange={handleChange}
                placeholder="Jot down quick thoughts, temporary text, or code snippets here..."
                className="w-full h-40 p-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-mono text-gray-800 dark:text-gray-100 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
            />

            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">
                    {note.length} characters
                </span>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        disabled={!note.trim()}
                        title="Copy note text to clipboard"
                        className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Copy
                    </button>

                    <button
                        onClick={handleOpenSaveModal}
                        disabled={!note.trim()}
                        title="Specify filename and save note as a .txt file"
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                        💾 Save .txt
                    </button>

                    <button
                        onClick={handleClear}
                        disabled={!note}
                        title="Clear notepad"
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition border border-red-100 dark:border-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Save Filename Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                                <span>💾</span>
                                <span>Save Text File</span>
                            </h3>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                Enter Filename:
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirmSave();
                                    }}
                                    autoFocus
                                    placeholder="my-note"
                                    className="w-full p-2.5 border rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-xs font-bold text-gray-400">.txt</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs active:scale-95"
                            >
                                Download .txt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}