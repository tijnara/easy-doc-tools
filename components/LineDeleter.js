'use client';
import { useState, useEffect, useRef } from 'react';
import { removeExtraSpaces } from '../lib/textUtils';
import { supabase } from '../lib/supabase';

export default function LineDeleter() {
    const [input, setInput] = useState('');
    const [feedback, setFeedback] = useState('');
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    // Initial default dimensions
    const INITIAL_DIMENSIONS = { width: '100%', height: 224 };
    const [boxDimensions, setBoxDimensions] = useState(INITIAL_DIMENSIONS);

    // Typing / Editing Undo-Redo Stack State
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const isUndoRedoRef = useRef(false);

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

    // Update state while recording history step for Undo/Redo
    const handleInputChange = (newValue) => {
        if (!isUndoRedoRef.current && newValue !== input) {
            setUndoStack((prev) => [...prev, input]);
            setRedoStack([]); // Clear redo stack on new typing/edit
        }
        setInput(newValue);
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const previousValue = undoStack[undoStack.length - 1];

        setRedoStack((prev) => [...prev, input]);
        setUndoStack((prev) => prev.slice(0, -1));

        isUndoRedoRef.current = true;
        setInput(previousValue);
        showToast('Undone!');
        setTimeout(() => {
            isUndoRedoRef.current = false;
        }, 50);
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const nextValue = redoStack[redoStack.length - 1];

        setUndoStack((prev) => [...prev, input]);
        setRedoStack((prev) => prev.slice(0, -1));

        isUndoRedoRef.current = true;
        setInput(nextValue);
        showToast('Redone!');
        setTimeout(() => {
            isUndoRedoRef.current = false;
        }, 50);
    };

    // Keyboard Shortcuts Listener for Ctrl+Z (Undo) and Ctrl+Y / Shift+Ctrl+Z (Redo)
    const handleKeyDown = (e) => {
        const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) {
                e.preventDefault();
                handleRedo();
            } else {
                e.preventDefault();
                handleUndo();
            }
        } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            handleRedo();
        }
    };

    const handleMouseDown = (e, direction) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const container = e.currentTarget.parentElement;
        const startWidth = container.offsetWidth;
        const startHeight = container.offsetHeight;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (direction.includes('e')) newWidth = startWidth + deltaX;
            if (direction.includes('w')) newWidth = startWidth - deltaX;
            if (direction.includes('s')) newHeight = startHeight + deltaY;
            if (direction.includes('n')) newHeight = startHeight - deltaY;

            newWidth = Math.max(260, newWidth);
            newHeight = Math.max(120, newHeight);

            setBoxDimensions({
                width: `${newWidth}px`,
                height: `${newHeight}px`,
            });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleCleanAndCopy = async () => {
        if (!input.trim()) return;

        const cleanedText = removeExtraSpaces(input, 'blank-lines');
        handleInputChange(cleanedText);

        navigator.clipboard.writeText(cleanedText);
        showToast('Cleaned & Copied!');

        const { data, error } = await supabase
            .from('text_history')
            .insert([{ cleaned_text: cleanedText }])
            .select();

        if (!error && data) {
            setHistory((prev) => [data[0], ...prev.slice(0, 9)]);
        }
    };

    const handleClear = () => {
        if (!input) return;
        handleInputChange('');
        showToast('Cleared!');
    };

    const handleResetSize = () => {
        setBoxDimensions(INITIAL_DIMENSIONS);
        showToast('Box size reset!');
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
            {/* Header Bar */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Clean Up Text</h2>

                <div className="flex items-center gap-1.5">
                    {feedback && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50 mr-1">
                            ✓ {feedback}
                        </span>
                    )}

                    {/* Undo Button */}
                    <button
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        title="Undo (Ctrl+Z)"
                        className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <span>↩</span>
                        <span className="hidden sm:inline">Undo</span>
                    </button>

                    {/* Redo Button */}
                    <button
                        onClick={handleRedo}
                        disabled={redoStack.length === 0}
                        title="Redo (Ctrl+Y)"
                        className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <span>↪</span>
                        <span className="hidden sm:inline">Redo</span>
                    </button>

                    {/* Dedicated Reset Box Size Button */}
                    <button
                        onClick={handleResetSize}
                        title="Reset text box size to default"
                        className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                        <span>📐</span>
                        <span className="hidden sm:inline">Reset Size</span>
                    </button>
                </div>
            </div>

            {/* Resizable Textarea Container */}
            <div
                className="relative group border rounded-xl overflow-hidden bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 transition-all max-w-full"
                style={{ width: boxDimensions.width, height: boxDimensions.height }}
            >
                <textarea
                    className="w-full h-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-base text-gray-800 dark:text-gray-100 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                    placeholder="Paste messy text with extra line spaces here..."
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                {/* 4 Border Side Drag Handles */}
                <div onMouseDown={(e) => handleMouseDown(e, 'n')} className="absolute top-0 left-3 right-3 h-2 cursor-n-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
                <div onMouseDown={(e) => handleMouseDown(e, 's')} className="absolute bottom-0 left-3 right-3 h-2 cursor-s-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
                <div onMouseDown={(e) => handleMouseDown(e, 'w')} className="absolute top-3 bottom-3 left-0 w-2 cursor-w-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
                <div onMouseDown={(e) => handleMouseDown(e, 'e')} className="absolute top-3 bottom-3 right-0 w-2 cursor-e-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />

                {/* 4 Corner Drag Handles */}
                <div onMouseDown={(e) => handleMouseDown(e, 'nw')} className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nw-resize hover:bg-blue-500/40 active:bg-blue-500/60 rounded-tl transition-colors z-10" />
                <div onMouseDown={(e) => handleMouseDown(e, 'ne')} className="absolute top-0 right-0 w-3.5 h-3.5 cursor-ne-resize hover:bg-blue-500/40 active:bg-blue-500/60 rounded-tr transition-colors z-10" />
                <div onMouseDown={(e) => handleMouseDown(e, 'sw')} className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-sw-resize hover:bg-blue-500/40 active:bg-blue-500/60 rounded-bl transition-colors z-10" />
                <div onMouseDown={(e) => handleMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize hover:bg-blue-500/40 active:bg-blue-500/60 rounded-br transition-colors z-10" />
            </div>

            {/* Actions */}
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
                                        handleInputChange(item.cleaned_text);
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