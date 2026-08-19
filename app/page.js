'use client';
import { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import LineDeleter from '@/components/LineDeleter';
import PdfConverter from '@/components/PdfConverter';
import PdfMerger from '@/components/PdfMerger';
import DueDateCalculator from '@/components/DueDateCalculator';
import Calculator from '@/components/Calculator';

export default function Home() {
    const [showSplash, setShowSplash] = useState(true);
    const [activeTab, setActiveTab] = useState('cleaner');
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        if (darkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setDarkMode(true);
        }
    };

    return (
        <div className={darkMode ? 'dark' : ''}>
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 flex flex-col justify-between relative transition-colors duration-300">

                {/* Top Floating Dark Mode Toggle */}
                <div className="absolute top-6 right-6 z-10">
                    <button
                        onClick={toggleDarkMode}
                        className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                        aria-label="Toggle Dark Mode"
                    >
                        {darkMode ? (
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>

                <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">

                    {/* Header */}
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
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Workspace Kit</h1>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Essential text, document, PDF, due date, and calculation tools</p>
                    </div>

                    {/* Side-by-Side Main Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* Calculator Section */}
                        <div className="order-1 lg:order-2 lg:col-span-5 w-full">
                            <Calculator />
                        </div>

                        {/* Document & Due Date Tools Section */}
                        <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col gap-4">
                            {/* Tool Navigation Tabs (4 Tabs) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 bg-gray-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1">
                                <button
                                    onClick={() => setActiveTab('cleaner')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'cleaner'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Clean Text
                                </button>
                                <button
                                    onClick={() => setActiveTab('converter')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'converter'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Convert
                                </button>
                                <button
                                    onClick={() => setActiveTab('merger')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'merger'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Merge
                                </button>
                                <button
                                    onClick={() => setActiveTab('duedate')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'duedate'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Due Date
                                </button>
                            </div>

                            {/* Active Tool Views */}
                            {activeTab === 'cleaner' && <LineDeleter />}
                            {activeTab === 'converter' && <PdfConverter />}
                            {activeTab === 'merger' && <PdfMerger />}
                            {activeTab === 'duedate' && <DueDateCalculator />}
                        </div>

                    </div>
                </div>

                {/* Footer Author Badge */}
                <footer className="mt-12 text-center text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center">
                    <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-violet-300 dark:hover:border-violet-600 transition-colors">
                        <div className="relative flex items-center justify-center w-5 h-5">
                            <span className="absolute inset-0 bg-violet-400/20 rounded-full animate-ping"></span>
                            <svg
                                className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400 relative z-10"
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

                        <span className="text-gray-500 dark:text-gray-400">by</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 tracking-wide">tijnara</span>
                    </div>
                </footer>

                {/* Corner Watermark Badge */}
                <div className="fixed bottom-3 right-4 pointer-events-none opacity-40 hover:opacity-100 transition-opacity hidden sm:block">
          <span className="text-[10px] font-mono tracking-widest uppercase text-gray-400 dark:text-gray-500 select-none">
            Author: tijnara
          </span>
                </div>
            </main>
        </div>
    );
}