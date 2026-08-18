'use client';
import { useState } from 'react';
import { mergePdfFiles } from '../lib/pdfUtils';

export default function PdfMerger() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

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
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                    className="hidden"
                />
            </label>

            {files.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700/60">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Selected ({files.length}):
                    </p>
                    <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 max-h-28 overflow-y-auto pr-1">
                        {files.map((file, idx) => (
                            <li key={idx} className="truncate">
                                📄 {file.name}
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