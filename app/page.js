'use client';
import { useState } from 'react';
import LineDeleter from '../components/LineDeleter';
import PdfMerger from '../components/PdfMerger';
import PdfConverter from '../components/PdfConverter';

export default function Home() {
    const [activeTab, setActiveTab] = useState('text');

    return (
        <main className="min-h-screen max-w-md mx-auto p-4 sm:max-w-2xl">
            <header className="text-center my-6">
                <h1 className="text-2xl font-black text-gray-900">Easy Doc Tools</h1>
                <p className="text-sm text-gray-500">Quick text cleaner and PDF utility</p>
            </header>

            {/* Responsive 3-Tab Header */}
            <div className="flex bg-gray-200 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition ${
                        activeTab === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                    }`}
                >
                    Clean Text
                </button>
                <button
                    onClick={() => setActiveTab('convert')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition ${
                        activeTab === 'convert' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                    }`}
                >
                    Convert
                </button>
                <button
                    onClick={() => setActiveTab('merge')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition ${
                        activeTab === 'merge' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                    }`}
                >
                    Merge
                </button>
            </div>

            {activeTab === 'text' && <LineDeleter />}
            {activeTab === 'convert' && <PdfConverter />}
            {activeTab === 'merge' && <PdfMerger />}
        </main>
    );
}