'use client';
import { useState } from 'react';
import { mergePdfFiles } from '../lib/pdfUtils';

export default function PdfMerger() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

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

    const handleMerge = async () => {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to combine.');
            return;
        }
        setLoading(true);
        try {
            const mergedBytes = await mergePdfFiles(files);
            const blob = new Blob([mergedBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'combined-document.pdf';
            a.click();
        } catch (err) {
            alert('Error combining PDFs. Please check if your files are valid.');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Combine PDFs</h2>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
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

            {/* Rearrangeable Lineup List */}
            {files.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Lineup Order ({files.length}):
                        </p>
                        <button
                            onClick={() => setFiles([])}
                            className="text-xs text-red-500 hover:text-red-600 font-semibold"
                        >
                            Clear All
                        </button>
                    </div>

                    <ul className="text-xs space-y-2 max-h-56 overflow-y-auto pr-1">
                        {files.map((file, idx) => (
                            <li
                                key={idx}
                                className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xs"
                            >
                                <div className="flex items-center gap-2 truncate pr-2">
                                    <span className="font-mono font-bold text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50">
                                        #{idx + 1}
                                    </span>
                                    <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
                                        📄 {file.name}
                                    </span>
                                </div>

                                {/* Order & Delete Controls */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => moveFile(idx, -1)}
                                        disabled={idx === 0}
                                        title="Move Up"
                                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        onClick={() => moveFile(idx, 1)}
                                        disabled={idx === files.length - 1}
                                        title="Move Down"
                                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        ▼
                                    </button>
                                    <button
                                        onClick={() => removeFile(idx)}
                                        title="Remove File"
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

            <button
                onClick={handleMerge}
                disabled={loading || files.length < 2}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold active:scale-95 transition disabled:bg-gray-300 dark:disabled:bg-slate-800 dark:disabled:text-gray-600 disabled:cursor-not-allowed shadow-sm shadow-green-500/20"
            >
                {loading ? 'Combining Files...' : 'Combine & Download PDF'}
            </button>
        </div>
    );
}