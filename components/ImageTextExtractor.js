'use client';
import { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';

export default function ImageTextExtractor() {
    const [imagePreview, setImagePreview] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 2500);
    };

    // Process image file or blob through OCR
    const processImageFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            showToast('⚠️ Please provide a valid image file');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setIsProcessing(true);
        setProgress(0);
        setStatusMessage('Initializing OCR engine...');

        try {
            const { data } = await Tesseract.recognize(
                file,
                'eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setStatusMessage('Recognizing text & numbers...');
                            setProgress(Math.round(m.progress * 100));
                        } else if (m.status === 'loading tesseract core') {
                            setStatusMessage('Loading core files...');
                        }
                    }
                }
            );

            // Clean up excessive trailing whitespace and preserve tabular line breaks
            const cleanedText = (data.text || '')
                .split('\n')
                .map((line) => line.trimEnd())
                .join('\n')
                .trim();

            setExtractedText(cleanedText);
            showToast('Text extracted successfully!');
        } catch (err) {
            console.error('OCR Error:', err);
            showToast('Failed to extract text from image');
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    // Global and container-level paste handler for Ctrl + V
    useEffect(() => {
        const handlePaste = (e) => {
            const clipboardData = e.clipboardData;
            if (!clipboardData || !clipboardData.items) return;

            for (let i = 0; i < clipboardData.items.length; i++) {
                const item = clipboardData.items[i];
                if (item.type.indexOf('image') !== -1) {
                    const blob = item.getAsFile();
                    if (blob) {
                        e.preventDefault();
                        processImageFile(blob);
                        showToast('Pasted image detected! Scanning...');
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    // Drag and Drop handlers
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
            processImageFile(e.dataTransfer.files[0]);
        }
    };

    const handleCopy = () => {
        if (!extractedText) return;
        navigator.clipboard.writeText(extractedText);
        setCopied(true);
        showToast('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setExtractedText('');
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors duration-300">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white select-text cursor-text">
                        Extract Data from Image (OCR)
                    </h2>
                    {toastMsg && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50">
                            ✓ {toastMsg}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {(imagePreview || extractedText) && (
                        <button
                            onClick={handleClear}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition border border-red-200 dark:border-red-900/50 select-none"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        disabled={!extractedText}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition border border-blue-200 dark:border-blue-900/50 select-none disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {copied ? '✓ Copied!' : '📋 Copy Data'}
                    </button>
                </div>
            </div>

            {/* Paste & Drop Zone */}
            <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition select-none ${
                    isDragging
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/50 hover:bg-gray-100/60 dark:hover:bg-slate-800/40'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files?.[0]) processImageFile(e.target.files[0]);
                    }}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-1.5 text-center">
                    <span className="text-3xl">📋</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-800 rounded font-mono text-xs">Ctrl + V</kbd> to paste an image screenshot
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        or click / drag and drop image files (.png, .jpg, .webp)
                    </span>
                </div>
            </div>

            {/* OCR Processing Progress Bar */}
            {isProcessing && (
                <div className="flex flex-col gap-1.5 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl">
                    <div className="flex justify-between items-center text-xs font-bold text-blue-700 dark:text-blue-300">
                        <span>{statusMessage}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Two-Column Side-by-Side View (Pasted Image & Extracted Text) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* Pasted Image Preview */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-text cursor-text">
                        Pasted Image Preview
                    </label>
                    <div className="w-full h-72 sm:h-80 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Pasted Screenshot"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-xs"
                            />
                        ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-600 italic select-none">
                                No image pasted yet
                            </span>
                        )}
                    </div>
                </div>

                {/* Extracted Data Result */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-text cursor-text">
                            Extracted Text & Data
                        </label>
                        {extractedText && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                {extractedText.split('\n').length} lines
                            </span>
                        )}
                    </div>
                    <textarea
                        rows={11}
                        value={extractedText}
                        onChange={(e) => setExtractedText(e.target.value)}
                        placeholder="Extracted data, table codes, and amounts will appear here automatically..."
                        className="w-full h-72 sm:h-80 p-3.5 border rounded-xl text-sm font-mono text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition select-text cursor-text resize-none"
                    />
                </div>
            </div>
        </div>
    );
}