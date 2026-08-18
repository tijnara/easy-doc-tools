'use client';
import { useState } from 'react';
import SplashScreen from '@/components/SplashScreen';
import LineDeleter from '@/components/LineDeleter';
import PdfConverter from '@/components/PdfConverter';
import PdfMerger from '@/components/PdfMerger';
import Calculator from '@/components/Calculator';

export default function Home() {
    const [showSplash, setShowSplash] = useState(true);
    const [activeTab, setActiveTab] = useState('cleaner');

    return (
        <>
            {/* Intro Splash Animation */}
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

            <main className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col justify-between relative">
                <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">

                    {/* Header with Integrated Origami Brand Icon */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-purple-950 p-1.5 rounded-xl flex items-center justify-center shadow-md shadow-purple-900/20 border border-purple-800">
                                <svg className="w-full h-full" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="headerGoldWing" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#ffffff" />
                                            <stop offset="35%" stopColor="#fef08a" />
                                            <stop offset="100%" stopColor="#eab308" />
                                        </linearGradient>
                                        <linearGradient id="headerVioletBody" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#e9d5ff" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                        <linearGradient id="headerLeftWing" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#d8b4fe" />
                                            <stop offset="40%" stopColor="#818cf8" />
                                            <stop offset="100%" stopColor="#4f46e5" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M 16 4 L 5 22 L 13 19 Z" fill="url(#headerLeftWing)" />
                                    <path d="M 16 4 L 27 22 L 19 19 Z" fill="url(#headerGoldWing)" />
                                    <path d="M 16 4 L 19 19 L 16 27 L 13 19 Z" fill="url(#headerVioletBody)" />
                                    <line x1="16" y1="4" x2="16" y2="27" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
                                    <line x1="16" y1="4" x2="10.5" y2="20.5" stroke="#e0e7ff" strokeWidth="0.6" opacity="0.7" />
                                    <line x1="16" y1="4" x2="21.5" y2="20.5" stroke="#d97706" strokeWidth="0.6" opacity="0.7" />
                                    <circle cx="16" cy="27" r="1.2" fill="#fbbf24" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Workspace Kit</h1>
                        </div>
                        <p className="text-sm text-gray-500">Essential text, document, PDF, and calculation tools</p>
                    </div>

                    {/* Side-by-Side Main Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* Left Column: Document Tools Section */}
                        <div className="lg:col-span-7 flex flex-col gap-4">
                            {/* Tool Navigation Tabs */}
                            <div className="grid grid-cols-3 bg-gray-200/70 p-1.5 rounded-2xl gap-1">
                                <button
                                    onClick={() => setActiveTab('cleaner')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'cleaner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    Clean Text
                                </button>
                                <button
                                    onClick={() => setActiveTab('converter')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'converter' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    Convert
                                </button>
                                <button
                                    onClick={() => setActiveTab('merger')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'merger' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                                    }`}
                                >
                                    Merge
                                </button>
                            </div>

                            {/* Active Document Tool View */}
                            {activeTab === 'cleaner' && <LineDeleter />}
                            {activeTab === 'converter' && <PdfConverter />}
                            {activeTab === 'merger' && <PdfMerger />}
                        </div>

                        {/* Right Column: Calculator Section */}
                        <div className="lg:col-span-5 w-full">
                            <Calculator />
                        </div>

                    </div>
                </div>

                {/* Footer Author Badge */}
                <footer className="mt-12 text-center text-xs text-gray-500 font-medium flex items-center justify-center">
                    <div className="inline-flex items-center gap-1.5 bg-white px-4 py-2 rounded-full border border-gray-200/80 shadow-sm hover:border-violet-300 transition-colors">
                        <div className="relative flex items-center justify-center w-5 h-5">
                            <span className="absolute inset-0 bg-violet-400/20 rounded-full animate-ping"></span>
                            <svg
                                className="w-4.5 h-4.5 text-violet-600 relative z-10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="5" r="2" />
                                <path d="M8 11a4 4 0 0 1 8 0" />
                                <rect x="6.5" y="10.5" width="11" height="6.5" rx="1" fill="#f3e8ff" stroke="#7c3aed" />
                                <line x1="8.5" y1="12.5" x2="12" y2="12.5" stroke="#7c3aed" strokeWidth="1.2" className="animate-pulse" />
                                <line x1="8.5" y1="14.5" x2="15.5" y2="14.5" stroke="#d97706" strokeWidth="1.2" className="animate-pulse" />
                                <path d="M4.5 18h15" stroke="#7c3aed" strokeWidth="2" />
                            </svg>
                        </div>

                        <span className="text-gray-500">by</span>
                        <span className="font-bold text-gray-800 tracking-wide">tijnara</span>
                    </div>
                </footer>

                {/* Corner Watermark Badge */}
                <div className="fixed bottom-3 right-4 pointer-events-none opacity-40 hover:opacity-100 transition-opacity hidden sm:block">
          <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400 select-none">
            Author: tijnara
          </span>
                </div>
            </main>
        </>
    );
}