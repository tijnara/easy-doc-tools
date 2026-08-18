'use client';
import { useState } from 'react';
import { convertImagesToPdf, convertTextToPdf } from '../lib/pdfUtils';

export default function PdfConverter() {
    const [mode, setMode] = useState('office');
    const [images, setImages] = useState([]);
    const [officeFile, setOfficeFile] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    };

    const handleConvert = async () => {
        setLoading(true);
        setErrorMessage('');

        try {
            if (mode === 'office') {
                if (!officeFile) {
                    setErrorMessage('Please select a Word (.docx) or Excel (.xlsx) file.');
                    setLoading(false);
                    return;
                }

                // Send Word/Excel file to your Puppeteer API route
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
        } catch (err) {
            console.error(err);
            setErrorMessage(`Conversion Error: ${err.message || 'Failed to process document.'}`);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Convert to PDF</h2>

            {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    {errorMessage}
                </div>
            )}

            {/* Mode Selector */}
            <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-xl gap-1">
                <button
                    onClick={() => {
                        setMode('office');
                        setErrorMessage('');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                        mode === 'office' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
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
                        mode === 'image' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
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
                        mode === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                    }`}
                >
                    Text
                </button>
            </div>

            {/* Input Views */}
            {mode === 'office' && (
                <div className="flex flex-col gap-3">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                        <span className="text-sm font-semibold text-blue-600">Select Word or Excel Document</span>
                        <span className="text-xs text-gray-400 mt-1">Supports .docx and .xlsx</span>
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
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-700 truncate">📄 {officeFile.name}</p>
                        </div>
                    )}
                </div>
            )}

            {mode === 'image' && (
                <div className="flex flex-col gap-3">
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                        <span className="text-sm font-semibold text-blue-600">Select Images (JPG / PNG)</span>
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
                        <p className="text-xs text-gray-600 font-semibold">{images.length} image(s) selected</p>
                    )}
                </div>
            )}

            {mode === 'text' && (
                <textarea
                    className="w-full h-40 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none text-gray-800"
                    placeholder="Enter text to convert into a PDF document..."
                    value={textInput}
                    onChange={(e) => {
                        setTextInput(e.target.value);
                        setErrorMessage('');
                    }}
                />
            )}

            <button
                onClick={handleConvert}
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold active:scale-95 transition disabled:bg-gray-300"
            >
                {loading ? 'Rendering Pixel-Perfect PDF...' : 'Convert & Download PDF'}
            </button>
        </div>
    );
}