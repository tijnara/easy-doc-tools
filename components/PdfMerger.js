'use client';
import { useState } from 'react';
import { mergePdfFiles } from '../lib/pdfUtils';

export default function PdfMerger() {
    const [files, setFiles] = useState([]);
    const [outputFileName, setOutputFileName] = useState('combined-document');
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // Merged Preview Modal State
    const [mergedPreviewUrl, setMergedPreviewUrl] = useState(null);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
        e.target.value = ''; // Reset input selection
    };

    // Format output file name with .pdf extension
    const getFinalFileName = () => {
        const trimmed = outputFileName.trim() || 'combined-document';
        return trimmed.endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
    };

    // Generate merged PDF blob in memory
    const generateMergedBlob = async () => {
        const mergedBytes = await mergePdfFiles(files);
        const blob = new Blob([mergedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        return { blob, url };
    };

    // Open Merged PDF Preview Modal
    const handlePreviewMerged = async () => {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to combine.');
            return;
        }
        setPreviewLoading(true);
        try {
            if (mergedPreviewUrl) URL.revokeObjectURL(mergedPreviewUrl);
            const { url } = await generateMergedBlob();
            setMergedPreviewUrl(url);
        } catch (err) {
            alert('Error generating preview. Please check if your files are valid.');
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

        setFiles(updated);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Directional arrow shift
    const moveFile = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= files.length) return;

        const updated = [...files];
        const [movedItem] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, movedItem);
        setFiles(updated);
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // Generate merged PDF and open preview modal
    const handleMergeAndDownload = async () => {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to combine.');
            return;
        }
        setLoading(true);
        try {
            if (mergedPreviewUrl) URL.revokeObjectURL(mergedPreviewUrl);
            const { url } = await generateMergedBlob();
            setMergedPreviewUrl(url);
        } catch (err) {
            alert('Error combining PDFs. Please check if your files are valid.');
        }
        setLoading(false);
    };

    // Download combined PDF and reset state
    const handleFinalDownload = () => {
        if (!mergedPreviewUrl) return;

        const a = document.createElement('a');
        a.href = mergedPreviewUrl;
        a.download = getFinalFileName();
        a.click();

        // Reset lineup files, output filename, and close preview modal
        handleClosePreview();
        setFiles([]);
        setOutputFileName('combined-document');
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white" title="Combine multiple PDF files into one single document">
                Combine PDFs
            </h2>

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
                title="Click to select PDF files from your device"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
            >
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Tap to select PDF files</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">(Select 2 or more files)</span>
                <input
                    type="file"
                    multiple
                    accept="application/pdf"
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
                            onClick={() => setFiles([])}
                            title="Remove all selected PDF files from lineup"
                            className="text-xs text-red-500 hover:text-red-600 font-semibold transition"
                        >
                            Clear All
                        </button>
                    </div>

                    <ul className="text-xs space-y-2 max-h-64 overflow-y-auto pr-1">
                        {files.map((file, idx) => (
                            <li
                                key={idx}
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDrop={(e) => handleDrop(e, idx)}
                                onDragEnd={handleDragEnd}
                                title={`Full Filename: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type || 'PDF Document'}`}
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
                                        📄 {file.name}
                                    </span>
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
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={handlePreviewMerged}
                    disabled={previewLoading || files.length < 2}
                    type="button"
                    title="Open live preview window without downloading immediately"
                    className="w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span>👁️</span>
                    <span>{previewLoading ? 'Building Preview...' : 'Preview Merged PDF'}</span>
                </button>

                <button
                    onClick={handleMergeAndDownload}
                    disabled={loading || files.length < 2}
                    title="Combine PDFs, open live preview window, and rename before final download"
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold active:scale-95 transition disabled:bg-gray-300 dark:disabled:bg-slate-800 dark:disabled:text-gray-600 disabled:cursor-not-allowed shadow-sm shadow-green-500/20"
                >
                    {loading ? 'Combining Files...' : 'Combine & Download PDF'}
                </button>
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