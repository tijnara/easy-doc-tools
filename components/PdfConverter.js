'use client';
import { useState, useEffect, useCallback } from 'react';
import { convertImagesToPdf, convertTextToPdf } from '../lib/pdfUtils';

export default function PdfConverter() {
    const [mode, setMode] = useState('office');
    const [images, setImages] = useState([]);
    const [officeFile, setOfficeFile] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [liveCredits, setLiveCredits] = useState(null);
    const [fetchingCredits, setFetchingCredits] = useState(true);

    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewBlob, setPreviewBlob] = useState(null);
    const [outputFileName, setOutputFileName] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const saveToHistory = async (fileName, typeLabel) => {
        try {
            await fetch('/api/log-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'convert',
                    payload: { file_name: fileName, conversion_type: typeLabel },
                }),
            });
        } catch (err) {
            // Silently ignore logging failures
        }
    };

    const getILovePdfUrl = (file = officeFile) => {
        if (file) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (['xlsx', 'xls'].includes(ext) || file.type.includes('excel') || file.type.includes('spreadsheet')) {
                return 'https://www.ilovepdf.com/excel_to_pdf';
            }
        }
        return 'https://www.ilovepdf.com/word_to_pdf';
    };

    const redirectToILovePdf = (file = officeFile) => {
        const targetUrl = getILovePdfUrl(file);
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    const fetchLiveCredits = useCallback(async (isInitial = false) => {
        if (isInitial) setFetchingCredits(true);
        try {
            const res = await fetch('/api/credits');
            const data = await res.json();
            if (res.ok && data.remaining !== undefined) {
                setLiveCredits(data.remaining);
                if (data.remaining <= 0 && mode === 'office') {
                    redirectToILovePdf();
                }
            }
        } catch (err) {
            console.error('Failed to fetch live credits:', err);
        } finally {
            if (isInitial) setFetchingCredits(false);
        }
    }, [mode]);

    useEffect(() => {
        fetchLiveCredits(true);

        const interval = setInterval(() => {
            fetchLiveCredits(false);
        }, 10000);

        const handleFocus = () => {
            fetchLiveCredits(false);
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchLiveCredits]);

    const isWordOrExcel = (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['docx', 'xlsx', 'xls', 'doc'].includes(ext) ||
            file.type.includes('word') || file.type.includes('excel') || file.type.includes('spreadsheet');
    };

    const isImage = (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        return file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext);
    };

    const isText = (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        return file.type.startsWith('text/') || ['txt', 'csv', 'md', 'json', 'log'].includes(ext);
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    const handleSmartFileSelect = (fileList) => {
        if (!fileList || fileList.length === 0) return;
        const selected = Array.from(fileList);
        const firstFile = selected[0];

        setErrorMessage('');

        if (isWordOrExcel(firstFile)) {
            setOfficeFile(firstFile);
            if (mode !== 'office') {
                setMode('office');
                showToast(`↗ Switched to Word/Excel tab for "${firstFile.name}"`);
            }
            return;
        }

        if (isImage(firstFile)) {
            const validImages = selected.filter(isImage);
            setImages(validImages);
            if (mode !== 'image') {
                setMode('image');
                showToast(`↗ Switched to Image tab for ${validImages.length} image(s)`);
            }
            return;
        }

        if (isText(firstFile)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setTextInput(e.target.result);
                if (mode !== 'text') {
                    setMode('text');
                    showToast(`↗ Switched to Text tab for "${firstFile.name}"`);
                }
            };
            reader.readAsText(firstFile);
            return;
        }

        setErrorMessage(`"${firstFile.name}" is not supported here. For PowerPoint, video, PDF, or other files, please click the redirect button below.`);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleSmartFileSelect(e.dataTransfer.files);
        }
    };

    const handleConvert = async () => {
        if (mode === 'office' && liveCredits !== null && liveCredits <= 0) {
            redirectToILovePdf(officeFile);
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            let blob;
            let defaultName = 'converted-document';

            if (mode === 'office') {
                if (!officeFile) {
                    setErrorMessage('Please select a Word (.docx) or Excel (.xlsx) file.');
                    setLoading(false);
                    return;
                }

                const formData = new FormData();
                formData.append('file', officeFile);

                const response = await fetch('/api/convert', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Backend conversion failed.');
                }

                blob = await response.blob();
                defaultName = `${officeFile.name.replace(/\.[^/.]+$/, '')}_converted`;

            } else if (mode === 'image') {
                if (images.length === 0) {
                    setErrorMessage('Please select at least one image.');
                    setLoading(false);
                    return;
                }
                const pdfBytes = await convertImagesToPdf(images);
                blob = new Blob([pdfBytes], { type: 'application/pdf' });
                defaultName = 'converted_images';

            } else {
                if (!textInput.trim()) {
                    setErrorMessage('Type or paste text to convert.');
                    setLoading(false);
                    return;
                }
                const pdfBytes = await convertTextToPdf(textInput);
                blob = new Blob([pdfBytes], { type: 'application/pdf' });
                defaultName = 'converted_text_document';
            }

            const url = URL.createObjectURL(blob);

            if (previewUrl) URL.revokeObjectURL(previewUrl);

            setPreviewBlob(blob);
            setPreviewUrl(url);
            setOutputFileName(defaultName);
            setShowPreviewModal(true);

            fetchLiveCredits(false);
        } catch (err) {
            console.error(err);
            setErrorMessage(`Conversion Error: ${err.message || 'Failed to process document.'}`);
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

        const cleanName = outputFileName.trim() || 'converted-document';
        const finalFileName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = finalFileName;
        a.click();

        let typeLabel = mode === 'office' ? 'Office to PDF' : mode === 'image' ? 'Image to PDF' : 'Text to PDF';
        let loggedName = mode === 'office' && officeFile ? officeFile.name : mode === 'image' ? `${images.length} Image(s)` : finalFileName;
        await saveToHistory(loggedName, typeLabel);

        handleClosePreview();
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border transition-colors duration-300 ${
                isDragging ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500/50' : 'border-gray-100 dark:border-slate-800'
            }`}
        >
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white" title="Convert Office documents, images, or text to PDF">
                    Convert to PDF
                </h2>

                {mode === 'office' && (
                    <div
                        title="When credits reach 0, you will be redirected to an official page where you can continue converting your Word and/or Excel files."
                        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                            fetchingCredits
                                ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700'
                                : liveCredits > 100
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                    : liveCredits > 0
                                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60'
                                        : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${fetchingCredits ? 'bg-gray-400 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></span>
                        <span>
                            {fetchingCredits
                                ? 'Syncing Credits...'
                                : liveCredits !== null
                                    ? liveCredits > 0
                                        ? `⚡ ${liveCredits.toLocaleString()} Live Credits Remaining`
                                        : '⚡ 0 Credits — Redirecting...'
                                    : 'iLoveAPI Connected'}
                        </span>
                    </div>
                )}
            </div>

            {toastMessage && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 animate-fadeIn">
                    {toastMessage}
                </div>
            )}

            {errorMessage && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <span className="leading-relaxed">{errorMessage}</span>
                    <button
                        onClick={() => redirectToILovePdf(officeFile)}
                        title={`Open ${getILovePdfUrl(officeFile)} in a new tab`}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shrink-0 transition active:scale-95 shadow-xs"
                    >
                        Convert Other File Formats Here →
                    </button>
                </div>
            )}

            <div className="grid grid-cols-3 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                <button
                    onClick={() => {
                        setMode('office');
                        setErrorMessage('');
                    }}
                    title="Convert Word (.docx) or Excel (.xlsx) files to PDF"
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                        mode === 'office'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    Word / Excel
                </button>
                <button
                    onClick={() => {
                        setMode('image');
                        setErrorMessage('');
                    }}
                    title="Convert JPG or PNG images into a PDF document (Unlimited)"
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                        mode === 'image'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    Image
                </button>
                <button
                    onClick={() => {
                        setMode('text');
                        setErrorMessage('');
                    }}
                    title="Convert plain text directly into a PDF file (Unlimited)"
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                        mode === 'text'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    Text
                </button>
            </div>

            {mode === 'office' && (
                <div className="flex flex-col gap-3">
                    <label
                        title="Click or drag Word or Excel document from your device"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                    >
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Select or Drag Word or Excel Document</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Supports .docx and .xlsx</span>
                        <input
                            type="file"
                            onChange={(e) => handleSmartFileSelect(e.target.files)}
                            className="hidden"
                        />
                    </label>
                    {officeFile && (
                        <div
                            title={`Full Filename: ${officeFile.name}\nFile Size: ${(officeFile.size / 1024).toFixed(1)} KB`}
                            className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60 cursor-pointer"
                        >
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">📄 {officeFile.name}</p>
                        </div>
                    )}
                </div>
            )}

            {mode === 'image' && (
                <div className="flex flex-col gap-3">
                    <label
                        title="Click or drag JPG or PNG image files"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                    >
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Select or Drag Images (JPG / PNG)</span>
                        <input
                            type="file"
                            multiple
                            onChange={(e) => handleSmartFileSelect(e.target.files)}
                            className="hidden"
                        />
                    </label>

                    {images.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Selected Images ({images.length}):
                            </p>
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    title={`Full Filename: ${img.name}\nSize: ${(img.size / 1024).toFixed(1)} KB`}
                                    className="p-2 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-100 dark:border-slate-700/60 flex items-center justify-between cursor-pointer"
                                >
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                        🖼️ {img.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {(img.size / 1024).toFixed(0)} KB
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {mode === 'text' && (
                <div className="flex flex-col gap-3">
                    <textarea
                        title="Type or paste the full text content you wish to render into a PDF"
                        className="w-full h-40 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
                        placeholder="Enter text to convert into a PDF document, or choose a text file below..."
                        value={textInput}
                        onChange={(e) => {
                            setTextInput(e.target.value);
                            setErrorMessage('');
                        }}
                    />

                    <label
                        title="Click to import content from a text file (.txt)"
                        className="flex items-center justify-center p-2.5 bg-gray-50 dark:bg-slate-800/60 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">📄 Or upload/drag a text file (.txt)</span>
                        <input
                            type="file"
                            onChange={(e) => handleSmartFileSelect(e.target.files)}
                            className="hidden"
                        />
                    </label>
                </div>
            )}

            <div className="flex flex-col gap-2.5">
                <button
                    onClick={handleConvert}
                    disabled={loading}
                    title="Process selected document and preview output PDF"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold active:scale-95 transition shadow-sm shadow-blue-500/20 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                >
                    {loading
                        ? 'Rendering Pixel-Perfect PDF...'
                        : mode === 'office' && liveCredits !== null && liveCredits <= 0
                            ? '0 Credits — Go to iLovePDF →'
                            : 'Convert to PDF & Preview'}
                </button>

                <button
                    onClick={() => redirectToILovePdf(officeFile)}
                    type="button"
                    title={`Open ${getILovePdfUrl(officeFile)} in a new window`}
                    className="w-full py-3 border border-gray-200 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-xs flex items-center justify-center gap-2 active:scale-95 transition"
                >
                    <span>Visit Official Website for Converting other files to PDF</span>
                    <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </button>
            </div>

            {showPreviewModal && previewUrl && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-[96vw] h-[92vh] max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-900/50">
                                    PDF Ready
                                </span>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                    Converted Document Preview
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

                        <div className="p-2 sm:p-3 bg-gray-100 dark:bg-slate-950 flex-1 w-full h-full min-h-0 overflow-hidden">
                            <iframe
                                src={`${previewUrl}#view=FitH`}
                                className="w-full h-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white"
                                title="PDF Convert Preview"
                            />
                        </div>

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