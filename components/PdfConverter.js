'use client';
import { useState, useEffect, useCallback } from 'react';
import { convertImagesToPdf, convertTextToPdf } from '../lib/pdfUtils';

export default function PdfConverter() {
    const [mode, setMode] = useState('office');
    const [images, setImages] = useState([]);
    const [officeFile, setOfficeFile] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [liveCredits, setLiveCredits] = useState(null);
    const [fetchingCredits, setFetchingCredits] = useState(true);

    const redirectToILovePdf = () => {
        window.open('https://www.ilovepdf.com', '_blank', 'noopener,noreferrer');
    };

    // Fetch live remaining credit balance directly from iLoveAPI
    const fetchLiveCredits = useCallback(async () => {
        setFetchingCredits(true);
        try {
            const res = await fetch('/api/credits');
            const data = await res.json();
            if (res.ok && data.remaining !== undefined) {
                setLiveCredits(data.remaining);
                if (data.remaining <= 0) {
                    redirectToILovePdf();
                }
            }
        } catch (err) {
            console.error('Failed to fetch live credits:', err);
        } finally {
            setFetchingCredits(false);
        }
    }, []);

    useEffect(() => {
        fetchLiveCredits();
    }, [fetchLiveCredits]);

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    const handleConvert = async () => {
        if (liveCredits !== null && liveCredits <= 0) {
            redirectToILovePdf();
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
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

                const pdfBlob = await response.blob();
                downloadBlob(pdfBlob, `${officeFile.name.split('.')[0]}.pdf`);
            } else if (mode === 'image') {
                if (images.length === 0) {
                    setErrorMessage('Please select at least one image.');
                    setLoading(false);
                    return;
                }
                const pdfBytes = await convertImagesToPdf(images);
                downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'converted-images.pdf');
            } else {
                if (!textInput.trim()) {
                    setErrorMessage('Type or paste text to convert.');
                    setLoading(false);
                    return;
                }
                const pdfBytes = await convertTextToPdf(textInput);
                downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'converted-text.pdf');
            }

            fetchLiveCredits();
        } catch (err) {
            console.error(err);
            setErrorMessage(`Conversion Error: ${err.message || 'Failed to process document.'}`);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            {/* Header with Live iLoveAPI Account Balance Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Convert to PDF</h2>

                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                    fetchingCredits
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700'
                        : liveCredits > 100
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                            : liveCredits > 0
                                ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60'
                                : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60'
                }`}>
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
            </div>

            {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center justify-between">
                    <span>{errorMessage}</span>
                    {liveCredits !== null && liveCredits <= 0 && (
                        <button
                            onClick={redirectToILovePdf}
                            className="underline font-bold text-red-800 dark:text-red-300 ml-2"
                        >
                            Go to iLovePDF →
                        </button>
                    )}
                </div>
            )}

            {/* Mode Selector */}
            <div className="grid grid-cols-3 bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                <button
                    onClick={() => {
                        setMode('office');
                        setErrorMessage('');
                    }}
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
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                        mode === 'text'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    Text
                </button>
            </div>

            {/* Input Views */}
            {mode === 'office' && (
                <div className="flex flex-col gap-3">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Select Word or Excel Document</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">Supports .docx and .xlsx</span>
                        <input
                            type="file"
                            accept=".docx, .xlsx, .xls"
                            onChange={(e) => {
                                setOfficeFile(e.target.files[0] || null);
                                setErrorMessage('');
                            }}
                            className="hidden"
                        />
                    </label>
                    {officeFile && (
                        <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/60">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">📄 {officeFile.name}</p>
                        </div>
                    )}
                </div>
            )}

            {mode === 'image' && (
                <div className="flex flex-col gap-3">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Select Images (JPG / PNG)</span>
                        <input
                            type="file"
                            multiple
                            accept="image/png, image/jpeg"
                            onChange={(e) => {
                                setImages(Array.from(e.target.files));
                                setErrorMessage('');
                            }}
                            className="hidden"
                        />
                    </label>
                    {images.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{images.length} image(s) selected</p>
                    )}
                </div>
            )}

            {mode === 'text' && (
                <textarea
                    className="w-full h-40 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
                    placeholder="Enter text to convert into a PDF document..."
                    value={textInput}
                    onChange={(e) => {
                        setTextInput(e.target.value);
                        setErrorMessage('');
                    }}
                />
            )}

            {/* Button Actions Group */}
            <div className="flex flex-col gap-2.5">
                <button
                    onClick={handleConvert}
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold active:scale-95 transition shadow-sm shadow-blue-500/20"
                >
                    {loading
                        ? 'Rendering Pixel-Perfect PDF...'
                        : liveCredits !== null && liveCredits <= 0
                            ? '0 Credits — Go to iLovePDF →'
                            : 'Convert & Download PDF'}
                </button>

                {/* Professional Redirect Button */}
                <button
                    onClick={redirectToILovePdf}
                    type="button"
                    className="w-full py-3 border border-gray-200 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-xs flex items-center justify-center gap-2 active:scale-95 transition"
                >
                    <span>Visit Official Website for Converting other files to PDF</span>
                    <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </button>
            </div>
        </div>
    );
}