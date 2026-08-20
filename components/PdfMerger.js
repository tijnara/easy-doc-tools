'use client';
import { useState, useEffect } from 'react';
import { mergePdfFiles } from '../lib/pdfUtils';

// IndexedDB persistence helpers to keep uploaded files intact when using browser back/forward buttons
const DB_NAME = 'pdf_merger_workspace';
const STORE_NAME = 'lineup_files';

const openDatabase = () => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return reject('IndexedDB not supported');
        }
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveFilesToStorage = async (fileList) => {
    try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(fileList, 'saved_lineup');
        tx.oncomplete = () => db.close();
    } catch (err) {
        console.error('Failed to save lineup to IndexedDB:', err);
    }
};

const loadFilesFromStorage = async () => {
    try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get('saved_lineup');
        return new Promise((resolve) => {
            request.onsuccess = () => {
                db.close();
                const rawItems = request.result || [];
                const restoredFiles = rawItems.map((item) =>
                    item instanceof File
                        ? item
                        : new File([item], item.name, { type: item.type, lastModified: item.lastModified })
                );
                resolve(restoredFiles);
            };
            request.onerror = () => {
                db.close();
                resolve([]);
            };
        });
    } catch (err) {
        return [];
    }
};

const clearFilesFromStorage = async () => {
    try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete('saved_lineup');
        tx.oncomplete = () => db.close();
    } catch (err) {
        console.error('Failed to clear IndexedDB lineup:', err);
    }
};

export default function PdfMerger() {
    const [files, setFiles] = useState([]);
    const [outputFileName, setOutputFileName] = useState('combined-document');
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Merged Preview Modal State
    const [mergedPreviewUrl, setMergedPreviewUrl] = useState(null);

    // Restore cached files from IndexedDB on component mount
    useEffect(() => {
        loadFilesFromStorage().then((restored) => {
            if (restored && restored.length > 0) {
                setFiles(restored);
            }
        });
    }, []);

    // Strict PDF check: detect if any uploaded file in lineup is NOT strictly a .pdf file
    const hasNonPdfFile = files.some((file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ext !== 'pdf';
    });

    // Helper to update state and sync to IndexedDB
    const updateFilesAndSync = (newFiles) => {
        setFiles(newFiles);
        if (newFiles.length > 0) {
            saveFilesToStorage(newFiles);
        } else {
            clearFilesFromStorage();
        }
    };

    // Silent server logging handler
    const saveToHistory = async (fileName, fileCount) => {
        try {
            await fetch('/api/log-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'convert',
                    payload: { file_name: fileName, conversion_type: `MERGED_${fileCount}_FILES` },
                }),
            });
        } catch (err) {
            // Silently ignore logging failures
        }
    };

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files);
        if (selected.length === 0) return;

        setErrorMessage('');
        const updated = [...files, ...selected];
        updateFilesAndSync(updated);
        e.target.value = '';
    };

    const getFinalFileName = () => {
        const trimmed = outputFileName.trim() || 'combined-document';
        return trimmed.endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
    };

    const generateMergedBlob = async () => {
        const mergedBytes = await mergePdfFiles(files);
        const blob = new Blob([mergedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        return { blob, url };
    };

    const handlePreviewMerged = async () => {
        if (files.length < 2) {
            setErrorMessage('Please select at least 2 PDF files to combine.');
            return;
        }
        if (hasNonPdfFile) {
            return;
        }

        setPreviewLoading(true);
        setErrorMessage('');
        try {
            if (mergedPreviewUrl) URL.revokeObjectURL(mergedPreviewUrl);
            const { url } = await generateMergedBlob();
            setMergedPreviewUrl(url);
        } catch (err) {
            setErrorMessage('Error generating preview. Please check if your files are readable.');
        }
        setPreviewLoading(false);
    };

    const handleClosePreview = () => {
        if (mergedPreviewUrl) URL.revokeObjectURL(mergedPreviewUrl);
        setMergedPreviewUrl(null);
    };

    // Drag and Drop reordering handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const updated = [...files];
        const [movedItem] = updated.splice(draggedIndex, 1);
        updated.splice(dropIndex, 0, movedItem);

        updateFilesAndSync(updated);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const moveFile = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= files.length) return;

        const updated = [...files];
        const [movedItem] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, movedItem);
        updateFilesAndSync(updated);
    };

    const removeFile = (index) => {
        const updated = files.filter((_, i) => i !== index);
        updateFilesAndSync(updated);
        setErrorMessage('');
    };

    const clearAllFiles = () => {
        setFiles([]);
        clearFilesFromStorage();
        setErrorMessage('');
    };

    const handleMergeAndDownload = async () => {
        if (files.length < 2) {
            setErrorMessage('Please select at least 2 PDF files to combine.');
            return;
        }
        if (hasNonPdfFile) {
            return;
        }

        setLoading(true);
        setErrorMessage('');
        try {
            if (mergedPreviewUrl) URL.revokeObjectURL(mergedPreviewUrl);
            const { url } = await generateMergedBlob();
            setMergedPreviewUrl(url);
        } catch (err) {
            setErrorMessage('Error combining documents. Please check if your files are readable.');
        }
        setLoading(false);
    };

    const handleFinalDownload = async () => {
        if (!mergedPreviewUrl) return;

        const finalFileName = getFinalFileName();
        const a = document.createElement('a');
        a.href = mergedPreviewUrl;
        a.download = finalFileName;
        a.click();

        await saveToHistory(finalFileName, files.length);

        handleClosePreview();
        clearAllFiles();
        setOutputFileName('combined-document');
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white" title="Combine multiple PDF files into one single document">
                Merge PDF & Word Documents
            </h2>

            {errorMessage && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400">
                    ⚠️ {errorMessage}
                </div>
            )}

            {/* Custom File Name Input */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Output File Name
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={outputFileName}
                        onChange={(e) => setOutputFileName(e.target.value)}
                        placeholder="e.g. quarterly-report-2026"
                        title="Type your custom output filename here before combining"
                        className="w-full p-3 border rounded-xl text-sm font-semibold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">.pdf</span>
                </div>
            </div>

            {/* Upload Selector */}
            <label
                title="Click to select files from your device"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
            >
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Tap to select PDF, Word, or other files</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF files combine locally</span>
                <input
                    type="file"
                    multiple
                    accept=".pdf, .docx, .doc, .pptx, .ppt, .xlsx, .xls, .png, .jpg, .jpeg, .txt"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </label>

            {/* Drag & Drop Lineup List */}
            {files.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <span>Lineup Order ({files.length}):</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal lowercase">(drag to reorder)</span>
                        </p>
                        <button
                            onClick={clearAllFiles}
                            title="Remove all selected files from lineup"
                            className="text-xs text-red-500 hover:text-red-600 font-semibold transition"
                        >
                            Clear All
                        </button>
                    </div>

                    <ul className="text-xs space-y-2 max-h-64 overflow-y-auto pr-1">
                        {files.map((file, idx) => {
                            const ext = file.name.split('.').pop().toLowerCase();
                            const isPdf = ext === 'pdf';

                            return (
                                <li
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    title={`Full Filename: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all select-none cursor-pointer ${
                                        draggedIndex === idx
                                            ? 'opacity-40 bg-blue-50 dark:bg-slate-800 border-dashed border-blue-400 scale-[0.99]'
                                            : dragOverIndex === idx
                                                ? 'border-2 border-blue-500 bg-blue-50/60 dark:bg-blue-950/40'
                                                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700/80 shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 truncate pr-2">
                                        <span
                                            title="Click and drag up/down to reorder file"
                                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-bold text-base cursor-grab active:cursor-grabbing"
                                        >
                                            ⋮⋮
                                        </span>
                                        <span className="font-mono font-bold text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50 shrink-0">
                                            #{idx + 1}
                                        </span>
                                        <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
                                            {isPdf ? '📄' : '📝'} {file.name}
                                        </span>
                                        {!isPdf && (
                                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 shrink-0">
                                                External Format
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => moveFile(idx, -1)}
                                            disabled={idx === 0}
                                            title={`Move "${file.name}" up in sequence`}
                                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() => moveFile(idx, 1)}
                                            disabled={idx === files.length - 1}
                                            title={`Move "${file.name}" down in sequence`}
                                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            ▼
                                        </button>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            title={`Remove "${file.name}" from merge list`}
                                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition ml-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Action Buttons Group */}
            <div className="flex flex-col gap-2.5">
                <button
                    onClick={handlePreviewMerged}
                    disabled={previewLoading || files.length < 2 || hasNonPdfFile}
                    type="button"
                    title="Open live preview window without downloading immediately"
                    className="w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span>👁️</span>
                    <span>{previewLoading ? 'Building Preview...' : 'Preview Merged PDF'}</span>
                </button>

                {/* Local Combine Button — Disabled and grayed out if non-PDF files exist */}
                <button
                    onClick={handleMergeAndDownload}
                    disabled={loading || files.length < 2 || hasNonPdfFile}
                    title={
                        hasNonPdfFile
                            ? 'Disabled because non-PDF files exist in the lineup.'
                            : 'Combine PDF files into one PDF'
                    }
                    className={`w-full py-3.5 rounded-xl font-semibold transition ${
                        hasNonPdfFile || files.length < 2 || loading
                            ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-transparent'
                            : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-sm shadow-blue-500/20'
                    }`}
                >
                    {loading ? 'Combining Files...' : 'Combine & Download PDF'}
                </button>

                {/* External Merge Link Anchor — Supports left click (same tab), middle click (new tab), & right click menu */}
                <a
                    href="https://smallpdf.com/lp/merge-pdf#r=organize-merge"
                    title="Redirects to online merger tool"
                    className={`w-full rounded-xl font-bold transition flex flex-col items-center justify-center gap-0.5 active:scale-95 text-center ${
                        hasNonPdfFile
                            ? 'py-4 bg-green-600 hover:bg-green-700 text-white text-sm shadow-lg shadow-green-500/30 ring-4 ring-green-500/20 animate-pulse'
                            : 'py-3 border border-gray-200 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 text-xs'
                    }`}
                >
                    <div className="flex items-center gap-1.5">
                        <span>Merge Other File Formats Online ↗</span>
                    </div>
                    <span className={`text-[10px] font-normal ${hasNonPdfFile ? 'text-green-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        (Redirects to online tool — select your files there)
                    </span>
                </a>
            </div>

            {/* Full-Screen Merged Document Preview Modal */}
            {mergedPreviewUrl && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-[96vw] h-[92vh] max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-900/50">
                                    Merged Result ({files.length} Files)
                                </span>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                    Document Preview
                                </h3>
                            </div>
                            <button
                                onClick={handleClosePreview}
                                title="Close preview window"
                                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg bg-gray-100 dark:bg-slate-800 transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Embedded PDF Viewer */}
                        <div className="p-2 sm:p-3 bg-gray-100 dark:bg-slate-950 flex-1 w-full h-full min-h-0 overflow-hidden">
                            <iframe
                                src={`${mergedPreviewUrl}#view=FitH`}
                                className="w-full h-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white"
                                title="Merged PDF Preview Document"
                            />
                        </div>

                        {/* Modal Footer with Live Rename & Download */}
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-slate-950 gap-3 shrink-0">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Rename File:</label>
                                <input
                                    type="text"
                                    value={outputFileName}
                                    onChange={(e) => setOutputFileName(e.target.value)}
                                    title="Edit file name before downloading"
                                    className="p-2 border rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-xs font-bold text-gray-400">.pdf</span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={handleClosePreview}
                                    title="Cancel and return to file editor"
                                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold text-xs rounded-xl transition"
                                >
                                    Close
                                </button>

                                <button
                                    onClick={handleFinalDownload}
                                    title={`Download merged PDF as "${getFinalFileName()}" and clear state`}
                                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition shadow-sm shadow-green-500/20 active:scale-95"
                                >
                                    📥 Download Combined PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}