'use client';
import { useState, useEffect, useRef } from 'react';
import { removeExtraSpaces, cleanPastedText } from '../lib/textUtils';

export default function LineDeleter() {
    const [input, setInput] = useState('');
    const [feedback, setFeedback] = useState('');

    const INITIAL_DIMENSIONS = { width: '100%', height: 224 };
    const [boxDimensions, setBoxDimensions] = useState(INITIAL_DIMENSIONS);

    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const isUndoRedoRef = useRef(false);

    const containerRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Restore saved text from localStorage on mount
    useEffect(() => {
        const savedText = localStorage.getItem('clean_text_input');
        if (savedText) {
            setInput(savedText);
        }
    }, []);

    const saveToHistory = async (cleanedText) => {
        try {
            await fetch('/api/log-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'text',
                    payload: { cleaned_text: cleanedText },
                }),
            });
        } catch (err) {
            // Silently ignore logging failures
        }
    };

    const handleInputChange = (newValue) => {
        if (!isUndoRedoRef.current && newValue !== input) {
            setUndoStack((prev) => [...prev, input]);
            setRedoStack([]);
        }
        setInput(newValue);
        localStorage.setItem('clean_text_input', newValue);
    };

    // Intercept paste: Reads plain text directly to guarantee 100% original line breaks & spacing
    const handlePaste = (e) => {
        e.preventDefault();

        // Reading plain text directly prevents HTML parsers from collapsing paragraphs into single lines
        const rawText = e.clipboardData.getData('text/plain') || '';

        // Strip Outlook glyphs (), stars (★), AI disclaimers, and logo descriptions without altering layout
        const cleanText = cleanPastedText(rawText);

        const target = e.target;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const currentVal = input;

        const newValue = currentVal.substring(0, start) + cleanText + currentVal.substring(end);
        handleInputChange(newValue);

        setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + cleanText.length;
        }, 0);

        showToast('Pasted (Original Layout Preserved)!');
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const previousValue = undoStack[undoStack.length - 1];

        setRedoStack((prev) => [...prev, input]);
        setUndoStack((prev) => prev.slice(0, -1));

        isUndoRedoRef.current = true;
        setInput(previousValue);
        localStorage.setItem('clean_text_input', previousValue);
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
        localStorage.setItem('clean_text_input', nextValue);
        showToast('Redone!');
        setTimeout(() => {
            isUndoRedoRef.current = false;
        }, 50);
    };

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
        e.stopPropagation();

        const container = containerRef.current;
        if (!container) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = container.offsetWidth;
        const startHeight = container.offsetHeight;

        const cursorMap = {
            n: 'ns-resize', s: 'ns-resize',
            e: 'ew-resize', w: 'ew-resize',
            ne: 'nesw-resize', sw: 'nesw-resize',
            nw: 'nwse-resize', se: 'nwse-resize'
        };

        document.body.style.userSelect = 'none';
        document.body.style.cursor = cursorMap[direction] || 'default';

        let currentWidth = startWidth;
        let currentHeight = startHeight;

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (direction.includes('e')) newWidth = startWidth + deltaX;
            if (direction.includes('w')) newWidth = startWidth - deltaX;
            if (direction.includes('s')) newHeight = startHeight + deltaY;
            if (direction.includes('n')) newHeight = startHeight - deltaY;

            const parentWidth = container.parentElement ? container.parentElement.offsetWidth : 1000;
            newWidth = Math.min(Math.max(260, newWidth), parentWidth);
            newHeight = Math.max(120, newHeight);

            currentWidth = newWidth;
            currentHeight = newHeight;

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            animationFrameRef.current = requestAnimationFrame(() => {
                if (container) {
                    container.style.width = `${currentWidth}px`;
                    container.style.height = `${currentHeight}px`;
                }
            });
        };

        const handleMouseUp = () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            document.body.style.userSelect = '';
            document.body.style.cursor = '';

            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);

            setBoxDimensions({
                width: `${currentWidth}px`,
                height: `${currentHeight}px`,
            });
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleCleanAndCopy = async () => {
        if (!input.trim()) return;

        const cleanedText = removeExtraSpaces(input, 'blank-lines');
        handleInputChange(cleanedText);

        navigator.clipboard.writeText(cleanedText);
        showToast('Cleaned & Copied!');

        await saveToHistory(cleanedText);
    };

    const handleStripBulletsAndCopy = async () => {
        if (!input.trim()) return;

        const cleanedText = removeExtraSpaces(input, 'strip-bullets');
        handleInputChange(cleanedText);

        navigator.clipboard.writeText(cleanedText);
        showToast('Bullets & Stars Removed!');

        await saveToHistory(cleanedText);
    };

    const handleClear = () => {
        if (!input) return;
        handleInputChange('');
        localStorage.removeItem('clean_text_input');
        showToast('Cleared!');
    };

    const handleResetSize = () => {
        setBoxDimensions(INITIAL_DIMENSIONS);
        if (containerRef.current) {
            containerRef.current.style.width = INITIAL_DIMENSIONS.width;
            containerRef.current.style.height = `${INITIAL_DIMENSIONS.height}px`;
        }
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
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Clean Up Text</h2>

                <div className="flex items-center gap-1.5">
                    {feedback && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50 mr-1">
                            ✓ {feedback}
                        </span>
                    )}

                    <button
                        onClick={handleUndo}
                        disabled={undoStack.length === 0}
                        title="Undo (Ctrl+Z)"
                        className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <span>↩</span>
                        <span className="hidden sm:inline">Undo</span>
                    </button>

                    <button
                        onClick={handleRedo}
                        disabled={redoStack.length === 0}
                        title="Redo (Ctrl+Y)"
                        className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <span>↪</span>
                        <span className="hidden sm:inline">Redo</span>
                    </button>

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

            <div
                ref={containerRef}
                className="relative group border rounded-xl overflow-hidden bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 max-w-full"
                style={{ width: boxDimensions.width, height: boxDimensions.height }}
            >
                <textarea
                    className="w-full h-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-base text-gray-800 dark:text-gray-100 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                    placeholder="Paste messy text with extra line spaces or bullet stars here..."
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                />

                <div onMouseDown={(e) => handleMouseDown(e, 'n')} className="absolute top-0 left-3 right-3 h-2 cursor-ns-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
                <div onMouseDown={(e) => handleMouseDown(e, 's')} className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
                <div onMouseDown={(e) => handleMouseDown(e, 'w')} className="absolute top-3 bottom-3 left-0 w-2 cursor-ew-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
                <div onMouseDown={(e) => handleMouseDown(e, 'e')} className="absolute top-3 bottom-3 right-0 w-2 cursor-ew-resize hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />

                <div onMouseDown={(e) => handleMouseDown(e, 'nw')} className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nwse-resize hover:bg-blue-500/40 active:bg-blue-500/60 rounded-tl transition-colors z-10" />
                <div onMouseDown={(e) => handleMouseDown(e, 'ne')} className="absolute top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize hover:bg-blue-500/40 active:bg-blue-500/60 rounded-tr transition-colors z-10" />
                <div onMouseDown={(e) => handleMouseDown(e, 'sw')} className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize hover:bg-blue-500/40 active:bg-blue-500/60 rounded-bl transition-colors z-10" />
                <div onMouseDown={(e) => handleMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize hover:bg-blue-500/40 active:bg-blue-500/60 rounded-br transition-colors z-10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <button
                    onClick={handleCleanAndCopy}
                    className="sm:col-span-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold active:scale-95 transition shadow-sm shadow-blue-500/20 text-xs sm:text-sm"
                >
                    Remove Blank Lines
                </button>

                <button
                    onClick={handleStripBulletsAndCopy}
                    title="Remove leading star icons (★), dots (•), and dashes from lines"
                    className="sm:col-span-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold active:scale-95 transition shadow-sm shadow-indigo-500/20 text-xs sm:text-sm"
                >
                    Strip Bullets & Stars
                </button>

                <button
                    onClick={handleCopyOnly}
                    className="sm:col-span-2 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold active:scale-95 transition text-xs sm:text-sm"
                >
                    Copy
                </button>

                <button
                    onClick={handleClear}
                    className="sm:col-span-2 py-3.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-semibold active:scale-95 transition border border-red-100 dark:border-red-900/40 text-xs sm:text-sm"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}