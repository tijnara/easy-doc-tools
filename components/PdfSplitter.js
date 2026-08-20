'use client';
import { useState, useEffect } from 'react';
import { splitPdfPages, getPdfPageCount, parsePageRanges } from '../lib/pdfUtils';

export default function PdfSplitter() {
    const [file, setFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [rangeInput, setRangeInput] = useState('1-5');
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal Preview & Custom Naming state
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewBlob, setPreviewBlob] = useState(null);
    const [outputFileName, setOutputFileName] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Manage Object URL for uploaded PDF to render visual page cards
    useEffect(() => {
        if (!file) {
            if (fileUrl) URL.revokeObjectURL(fileUrl);
            setFileUrl(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setFileUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [file]);

    // Silent server logging
    const saveToHistory = async (fileName, rangeStr) => {
        try {
            await fetch('/api/log-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'split',
                    payload: { file_name: fileName, split_range: rangeStr },
                }),
            });
        } catch (err) {
            // Silently ignore logging failures
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

    // Parse currently selected page indices (zero-indexed)
    const selectedIndices = totalPages > 0 ? parsePageRanges(rangeInput, totalPages) : [];

    // Toggle individual page selection by clicking on its card
    const handleTogglePage = (pageZeroIndex) => {
        const currentSet = new Set(selectedIndices);
        if (currentSet.has(pageZeroIndex)) {
            currentSet.delete(pageZeroIndex);
        } else {
            currentSet.add(pageZeroIndex);
        }

        const sortedPageNumbers = Array.from(currentSet)
            .sort((a, b) => a - b)
            .map((i) => i + 1);

        if (sortedPageNumbers.length === 0) {
            setRangeInput('');
        } else {
            setRangeInput(sortedPageNumbers.join(', '));
        }
    };

    // Open Real Preview Modal
    const handlePreviewSplit = async () => {
        if (!file) return;

        setPreviewLoading(true);
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
        } catch (err) {
            console.error(err);
            setErrorMessage(err.message || 'Failed to extract specified page ranges.');
        } finally {
            setPreviewLoading(false);
        }
    };

    // Direct Split & Download (keeps uploaded file intact)
    const handleSplitPdf = async () => {
        if (!file) return;

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            let downloadUrl = previewUrl;
            let freshUrl = false;

            if (!downloadUrl || !showPreviewModal) {
                const splitBytes = await splitPdfPages(file, rangeInput);
                const blob = new Blob([splitBytes], { type: 'application/pdf' });
                downloadUrl = URL.createObjectURL(blob);
                freshUrl = true;
            }

            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const cleanName = outputFileName.trim() || `${baseName}_pages_${rangeInput.replace(/\s+/g, '')}`;
            const finalFileName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = finalFileName;
            a.click();

            if (freshUrl) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            }

            await saveToHistory(file.name, rangeInput);
            setSuccessMessage(`Pages extracted successfully as "${finalFileName}"!`);
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

    const handleModalDownload = async () => {
        if (!previewBlob || !previewUrl) return;

        const cleanName = outputFileName.trim() || 'extracted-document';
        const finalFileName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = finalFileName;
        a.click();

        await saveToHistory(file ? file.name : finalFileName, rangeInput);
        handleClosePreview();
    };

    const clearFile = () => {
        setFile(null);
        setTotalPages(0);
        setErrorMessage('');
        setSuccessMessage('');
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewBlob(null);
        setShowPreviewModal(false);
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

            {/* Page Range Selection Controls */}
            <div className="flex flex-col gap-2 pt-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        Page Selection Range or Keyword:
                    </label>
                    {totalPages > 0 && (
                        <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">
                            {selectedIndices.length} / {totalPages} Pages Selected
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
                    {totalPages > 0 && (
                        <button
                            type="button"
                            onClick={() => setRangeInput(`1-${totalPages}`)}
                            title="Select all pages"
                            className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-bold transition"
                        >
                            Select All
                        </button>
                    )}
                </div>
            </div>

            {/* Upload File Box (Shown when no file is loaded) */}
            {!file && (
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
            )}

            {/* Active Document Info Bar & Page Cards Visual Grid */}
            {file && (
                <div className="flex flex-col gap-3">
                    {/* Header Bar */}
                    <div
                        title={`Full Filename: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60"
                    >
                        <div className="truncate pr-2">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                📄 {file.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB {totalPages > 0 ? `• ${totalPages} total pages` : ''}
                            </p>
                        </div>
                        <button
                            onClick={clearFile}
                            title="Remove selected file"
                            className="text-xs text-red-500 font-bold hover:text-red-700 transition"
                        >
                            Change File
                        </button>
                    </div>

                    {/* Interactive Visual Page Cards Preview Grid */}
                    {totalPages > 0 && fileUrl && (
                        <div className="flex flex-col gap-2.5 bg-gray-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800">
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                💡 Click any page card below to toggle its selection:
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                                {Array.from({ length: totalPages }, (_, idx) => {
                                    const pageNum = idx + 1;
                                    const isSelected = selectedIndices.includes(idx);

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleTogglePage(idx)}
                                            title={`Click to ${isSelected ? 'deselect' : 'select'} Page ${pageNum}`}
                                            className={`relative flex flex-col bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all select-none cursor-pointer ${
                                                isSelected
                                                    ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20'
                                                    : 'border-gray-200 dark:border-slate-800 opacity-60 grayscale-[30%]'
                                            }`}
                                        >
                                            {/* Page Number & Status Overlay */}
                                            <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-center pointer-events-none">
                                                <span className="font-mono font-extrabold text-[11px] bg-slate-900/80 text-white dark:bg-slate-800/90 dark:text-gray-100 px-2 py-0.5 rounded-full shadow-xs">
                                                    Page {pageNum}
                                                </span>

                                                <span
                                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs ${
                                                        isSelected
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-gray-300 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {isSelected ? '✓ Selected' : 'Excluded'}
                                                </span>
                                            </div>

                                            {/* Page Thumbnail View */}
                                            <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-slate-800/60">
                                                <iframe
                                                    src={`${fileUrl}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0`}
                                                    className="w-full h-full pointer-events-none select-none border-0"
                                                    title={`Preview Page ${pageNum}`}
                                                />
                                            </div>

                                            {/* Card Label */}
                                            <div className="p-2 bg-white dark:bg-slate-900 text-center">
                                                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                                    Page {pageNum}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons Group */}
            <div className="flex flex-col gap-2 pt-1">
                {/* Real Modal Preview Button */}
                <button
                    onClick={handlePreviewSplit}
                    disabled={previewLoading || !file || selectedIndices.length === 0}
                    type="button"
                    title="Open live preview window of extracted pages"
                    className="w-full py-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span>👁️</span>
                    <span>{previewLoading ? 'Generating Preview...' : 'Preview Extracted PDF'}</span>
                </button>

                {/* Extract & Download PDF Button */}
                <button
                    onClick={handleSplitPdf}
                    disabled={loading || !file || selectedIndices.length === 0}
                    title="Process PDF file and extract specified pages"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white rounded-xl font-semibold active:scale-95 transition shadow-sm shadow-blue-500/20 disabled:cursor-not-allowed"
                >
                    {loading
                        ? 'Extracting PDF Pages...'
                        : `Extract Pages (${rangeInput || 'None'})`}
                </button>
            </div>

            {/* Real Full-Screen Extracted Document Preview Modal */}
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
                                    Extracted Document Preview
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
                                    onClick={handleModalDownload}
                                    title="Download PDF to device"
                                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition shadow-sm shadow-green-500/20 active:scale-95"
                                >
                                    📥 Download Extracted PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}