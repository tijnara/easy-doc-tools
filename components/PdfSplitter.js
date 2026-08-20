'use client';
import { useState } from 'react';
import { splitPdfPages, getPdfPageCount } from '../lib/pdfUtils';
import { supabase } from '../lib/supabase';

export default function PdfSplitter() {
    const [file, setFile] = useState(null);
    const [rangeInput, setRangeInput] = useState('1-5');
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Preview Modal & Custom Naming state
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewBlob, setPreviewBlob] = useState(null);
    const [outputFileName, setOutputFileName] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Silent database logging (Supabase)
    const saveToHistory = async (fileName, rangeStr) => {
        try {
            await supabase
                .from('pdf_split_history')
                .insert([{ file_name: fileName, split_range: rangeStr }]);
        } catch (err) {
            console.error('Supabase database sync error:', err);
        }
    };

    const handleFileSelect = async (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        const ext = selected.name.split('.').pop().toLowerCase();

        if (['docx', 'doc'].includes(ext)) {
            setErrorMessage('Word files (.docx) do not store fixed page boundaries in browser memory. Please convert your Word document to PDF using the "Convert" tab first!');
            setFile(null);
            setTotalPages(0);
            e.target.value = '';
            return;
        }

        if (selected.type !== 'application/pdf' && ext !== 'pdf') {
            setErrorMessage('Please select a valid PDF file (.pdf).');
            setFile(null);
            setTotalPages(0);
            e.target.value = '';
            return;
        }

        setErrorMessage('');
        setSuccessMessage('');
        setFile(selected);
        setLoading(true);

        try {
            const count = await getPdfPageCount(selected);
            setTotalPages(count);
            setRangeInput(`1-${Math.min(count, 5)}`);
        } catch (err) {
            console.error('Failed to parse PDF page count:', err);
            setErrorMessage('Could not read PDF page structure. The file might be password protected.');
            setTotalPages(0);
        } finally {
            setLoading(false);
        }

        e.target.value = '';
    };

    const handleSplitPdf = async () => {
        if (!file) return;

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const splitBytes = await splitPdfPages(file, rangeInput);
            const blob = new Blob([splitBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const defaultName = `${baseName}_pages_${rangeInput.replace(/\s+/g, '')}`;

            if (previewUrl) URL.revokeObjectURL(previewUrl);

            setPreviewBlob(blob);
            setPreviewUrl(url);
            setOutputFileName(defaultName);
            setShowPreviewModal(true);
            setSuccessMessage(`Pages extracted successfully! Preview ready below.`);
        } catch (err) {
            console.error(err);
            setErrorMessage(err.message || 'Failed to extract specified page ranges.');
        } finally {
            setLoading(false);
        }
    };

    const handleClosePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewBlob(null);
        setShowPreviewModal(false);
    };

    const handleDownload = async () => {
        if (!previewBlob || !previewUrl) return;

        const cleanName = outputFileName.trim() || 'extracted-document';
        const finalFileName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = finalFileName;
        a.click();

        // Silent save to Supabase database
        await saveToHistory(file ? file.name : finalFileName, rangeInput);

        handleClosePreview();
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white" title="Extract exact page ranges, odd pages, or even pages from PDF files">
                Split PDF
            </h2>

            {errorMessage && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    ⚠️ {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-xl text-xs text-green-700 dark:text-green-300 font-bold">
                    ✓ {successMessage}
                </div>
            )}

            {/* Page Range Input Controls */}
            <div className="flex flex-col gap-2 pt-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        Page Selection Range or Keyword:
                    </label>
                    {totalPages > 0 && (
                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">
                            {totalPages} Total Pages
                        </span>
                    )}
                </div>
                <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="e.g. 1-4, 4, 6-9 or 'odd' or 'even'"
                    title="Enter custom ranges like '1-4, 4, 6-9' or keywords 'odd' / 'even'"
                    className="p-2.5 border rounded-xl text-xs font-mono font-bold text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />

                {/* Preset Shortcut Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                        type="button"
                        onClick={() => setRangeInput('odd')}
                        title="Extract all odd-numbered pages (1, 3, 5, ...)"
                        className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-bold transition"
                    >
                        📄 Odd Pages
                    </button>
                    <button
                        type="button"
                        onClick={() => setRangeInput('even')}
                        title="Extract all even-numbered pages (2, 4, 6, ...)"
                        className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-bold transition"
                    >
                        📄 Even Pages
                    </button>
                </div>
            </div>

            {/* File Upload Selector */}
            <label
                title="Click to select a PDF file to split"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition mt-1"
            >
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Select PDF File
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Processed 100% locally in your browser memory
                </span>
                <input
                    type="file"
                    accept="application/pdf, .pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </label>

            {/* Selected File Details */}
            {file && (
                <div
                    title={`Full Filename: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60"
                >
                    <div className="truncate pr-2">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            📄 {file.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {(file.size / 1024).toFixed(1)} KB {totalPages > 0 ? `• ${totalPages} pages` : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setFile(null);
                            setTotalPages(0);
                        }}
                        title="Remove selected file"
                        className="text-xs text-red-500 font-bold hover:text-red-700 transition"
                    >
                        Change
                    </button>
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleSplitPdf}
                disabled={loading || !file}
                title="Process PDF file and extract specified pages"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white rounded-xl font-semibold active:scale-95 transition shadow-sm shadow-blue-500/20 disabled:cursor-not-allowed"
            >
                {loading
                    ? 'Extracting PDF Pages...'
                    : `Extract Pages (${rangeInput})`}
            </button>

            {/* Preview Modal & File Naming Window */}
            {showPreviewModal && previewUrl && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-[96vw] h-[92vh] max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900/50">
                                    Pages {rangeInput}
                                </span>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                    Document Preview
                                </h3>
                            </div>
                            <button
                                onClick={handleClosePreview}
                                title="Close preview"
                                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg bg-gray-100 dark:bg-slate-800 transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* PDF Preview Frame */}
                        <div className="p-2 sm:p-3 bg-gray-100 dark:bg-slate-950 flex-1 w-full h-full min-h-0 overflow-hidden">
                            <iframe
                                src={`${previewUrl}#view=FitH`}
                                className="w-full h-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white"
                                title="PDF Split Preview"
                            />
                        </div>

                        {/* File Naming & Download Controls */}
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-slate-950 gap-3 shrink-0">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                                    File Name:
                                </label>
                                <div className="flex items-center gap-1 w-full sm:w-64">
                                    <input
                                        type="text"
                                        value={outputFileName}
                                        onChange={(e) => setOutputFileName(e.target.value)}
                                        placeholder="Enter document name"
                                        title="Specify filename before downloading"
                                        className="w-full p-2 border rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-gray-400">.pdf</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    onClick={handleClosePreview}
                                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold text-xs rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDownload}
                                    title="Download PDF to device"
                                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition shadow-sm shadow-green-500/20 active:scale-95"
                                >
                                    📥 Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}