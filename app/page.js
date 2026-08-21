'use client';
import { useState, useEffect, useRef } from 'react';
import SplashScreen from '@/components/SplashScreen';
import LineDeleter from '@/components/LineDeleter';
import PdfConverter from '@/components/PdfConverter';
import PdfMerger from '@/components/PdfMerger';
import PdfSplitter from '@/components/PdfSplitter';
import DueDateCalculator from '@/components/DueDateCalculator';
import Calculator from '@/components/Calculator';
import Notepad from '@/components/Notepad';

const THEMES = [
    {
        id: 'dark',
        name: 'Slate Dark',
        icon: '🌙',
        isDark: true,
        bgClass: 'bg-slate-950 text-gray-100',
        badgeColor: 'bg-slate-800 text-slate-200 border-slate-700',
        dotColor: 'bg-slate-400'
    },
    {
        id: 'violet',
        name: 'Midnight Violet',
        icon: '🌌',
        isDark: true,
        bgClass: 'bg-[#0d071b] text-purple-100',
        badgeColor: 'bg-purple-950 text-purple-200 border-purple-800',
        dotColor: 'bg-purple-500'
    },
    {
        id: 'sakura-bloom',
        name: 'Sakura Bloom',
        icon: '🌸',
        isDark: false,
        bgClass: 'bg-[#fff0f5] text-rose-950',
        badgeColor: 'bg-white text-rose-900 border-rose-200',
        dotColor: 'bg-rose-300'
    },
    {
        id: 'peony-petal',
        name: 'Peony Petal',
        icon: '🦢',
        isDark: false,
        bgClass: 'bg-[#fce7f3] text-pink-950',
        badgeColor: 'bg-white text-pink-900 border-pink-300',
        dotColor: 'bg-pink-400'
    },
    {
        id: 'bubblegum-pop',
        name: 'Bubblegum Pop',
        icon: '🎀',
        isDark: false,
        bgClass: 'bg-[#fbcfe8] text-pink-950',
        badgeColor: 'bg-white text-pink-950 border-pink-400',
        dotColor: 'bg-pink-500'
    },
    {
        id: 'quartz-desert',
        name: 'Quartz Desert',
        icon: '🏜️',
        isDark: false,
        bgClass: 'bg-[#f6efe6] text-stone-900',
        badgeColor: 'bg-white text-stone-800 border-stone-300',
        dotColor: 'bg-amber-600'
    },
    {
        id: 'coral-reef',
        name: 'Coral Reef',
        icon: '🪸',
        isDark: true,
        bgClass: 'bg-[#180912] text-rose-100',
        badgeColor: 'bg-rose-950 text-rose-200 border-rose-800',
        dotColor: 'bg-rose-500'
    },
    {
        id: 'petal-blush',
        name: 'Petal Blush',
        icon: '🌷',
        isDark: false,
        bgClass: 'bg-[#fcf2f4] text-pink-950',
        badgeColor: 'bg-white text-pink-900 border-pink-200',
        dotColor: 'bg-pink-400'
    },
    {
        id: 'berry-bramble',
        name: 'Berry Bramble',
        icon: '🫐',
        isDark: true,
        bgClass: 'bg-[#120311] text-fuchsia-100',
        badgeColor: 'bg-fuchsia-950 text-fuchsia-200 border-fuchsia-900',
        dotColor: 'bg-fuchsia-600'
    },
    {
        id: 'mystic-orchid',
        name: 'Mystic Orchid',
        icon: '🔮',
        isDark: true,
        bgClass: 'bg-[#14081c] text-fuchsia-100',
        badgeColor: 'bg-fuchsia-950 text-fuchsia-200 border-fuchsia-800',
        dotColor: 'bg-fuchsia-500'
    },
    {
        id: 'twilight-magenta',
        name: 'Twilight Magenta',
        icon: '🌆',
        isDark: true,
        bgClass: 'bg-[#1a0518] text-pink-100',
        badgeColor: 'bg-pink-950 text-pink-200 border-pink-800',
        dotColor: 'bg-pink-500'
    },
    {
        id: 'cotton-nebula',
        name: 'Cotton Nebula',
        icon: '☁️',
        isDark: true,
        bgClass: 'bg-[#0f1126] text-indigo-100',
        badgeColor: 'bg-indigo-950 text-indigo-200 border-indigo-800',
        dotColor: 'bg-indigo-400'
    },
    {
        id: 'emerald',
        name: 'Emerald Forest',
        icon: '🌲',
        isDark: true,
        bgClass: 'bg-[#03170e] text-emerald-100',
        badgeColor: 'bg-emerald-950 text-emerald-200 border-emerald-800',
        dotColor: 'bg-emerald-500'
    },
    {
        id: 'amber',
        name: 'Sunset Amber',
        icon: '🌅',
        isDark: true,
        bgClass: 'bg-[#1a0e05] text-amber-100',
        badgeColor: 'bg-amber-950 text-amber-200 border-amber-800',
        dotColor: 'bg-amber-500'
    },
    {
        id: 'ocean',
        name: 'Deep Ocean',
        icon: '🌊',
        isDark: true,
        bgClass: 'bg-[#031321] text-cyan-100',
        badgeColor: 'bg-cyan-950 text-cyan-200 border-cyan-800',
        dotColor: 'bg-cyan-500'
    },
    {
        id: 'light',
        name: 'Light Clean',
        icon: '☀️',
        isDark: false,
        bgClass: 'bg-slate-50 text-slate-900',
        badgeColor: 'bg-white text-slate-800 border-gray-200',
        dotColor: 'bg-amber-400'
    }
];

export default function Home() {
    const [showSplash, setShowSplash] = useState(false);
    const [activeTab, setActiveTab] = useState('cleaner');
    const [currentTheme, setCurrentTheme] = useState('dark');
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const themeMenuRef = useRef(null);

    const applyTheme = (themeId) => {
        const selected = THEMES.find((t) => t.id === themeId) || THEMES[0];
        setCurrentTheme(selected.id);

        localStorage.setItem('workspace_theme_id', selected.id);
        localStorage.setItem('theme', selected.isDark ? 'dark' : 'light');

        if (selected.isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Restore splash screen, active tab, and last used theme on mount
    useEffect(() => {
        const savedThemeId = localStorage.getItem('workspace_theme_id') || localStorage.getItem('theme') || 'dark';
        applyTheme(savedThemeId);

        const hasSeenSplash = sessionStorage.getItem('has_seen_splash');
        if (!hasSeenSplash) {
            setShowSplash(true);
        }

        const savedTab = sessionStorage.getItem('active_workspace_tab');
        if (savedTab) {
            setActiveTab(savedTab);
        }

        setIsMounted(true);
    }, []);

    // Close theme menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
                setIsThemeMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        sessionStorage.setItem('active_workspace_tab', tabName);
    };

    const handleFinishSplash = () => {
        setShowSplash(false);
        sessionStorage.setItem('has_seen_splash', 'true');
    };

    if (!isMounted) return null;

    const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

    return (
        <div className={activeThemeObj.isDark ? 'dark' : ''}>
            {showSplash && <SplashScreen onFinish={handleFinishSplash} />}

            <main className={`min-h-screen ${activeThemeObj.bgClass} py-10 px-4 flex flex-col justify-between relative transition-colors duration-500`}>

                {/* Top Floating Multi-Theme Palette Selector */}
                <div className="absolute top-6 right-6 z-30" ref={themeMenuRef}>
                    <button
                        onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                        className={`px-3.5 py-2 rounded-2xl border shadow-sm flex items-center gap-2 transition active:scale-95 ${activeThemeObj.badgeColor}`}
                        title="Change Theme Palette"
                    >
                        <span className={`w-2.5 h-2.5 rounded-full ${activeThemeObj.dotColor} animate-pulse`}></span>
                        <span className="text-xs font-bold hidden sm:inline">{activeThemeObj.name}</span>
                        <span className="text-xs">{activeThemeObj.icon}</span>
                    </button>

                    {/* Theme Palette Dropdown Popup */}
                    {isThemeMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 z-40 max-h-80 overflow-y-auto animate-fadeIn">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2.5 py-1">
                                Color Palette
                            </p>
                            {THEMES.map((theme) => {
                                const isSelected = theme.id === currentTheme;
                                return (
                                    <button
                                        key={theme.id}
                                        onClick={() => {
                                            applyTheme(theme.id);
                                            setIsThemeMenuOpen(false);
                                        }}
                                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                                            isSelected
                                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{theme.icon}</span>
                                            <span>{theme.name}</span>
                                        </div>
                                        <span className={`w-2 h-2 rounded-full ${theme.dotColor}`}></span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
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
                            <h1 className="text-3xl font-extrabold tracking-tight">Workspace Kit</h1>
                        </div>
                        <p className="text-sm opacity-70">Essential text, document, PDF, due date, calculation, and notepad tools</p>
                    </div>

                    {/* Side-by-Side Main Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* Always Visible Side Panel: Calculator & Notepad */}
                        <div className="order-1 lg:order-2 lg:col-span-5 w-full flex flex-col gap-6">
                            <Calculator />
                            <Notepad />
                        </div>

                        {/* Main Document & Due Date Tools Section */}
                        <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col gap-4">
                            {/* Tool Navigation Tabs */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 bg-gray-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl gap-1">
                                <button
                                    onClick={() => handleTabChange('cleaner')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'cleaner'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Clean Text
                                </button>
                                <button
                                    onClick={() => handleTabChange('converter')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'converter'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Convert
                                </button>
                                <button
                                    onClick={() => handleTabChange('merger')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'merger'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Merge
                                </button>
                                <button
                                    onClick={() => handleTabChange('splitpdf')}
                                    className={`py-2.5 text-xs font-bold rounded-xl transition ${
                                        activeTab === 'splitpdf'
                                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Split PDF
                                </button>
                                <button
                                    onClick={() => handleTabChange('duedate')}
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
                            {activeTab === 'splitpdf' && <PdfSplitter />}
                            {activeTab === 'duedate' && <DueDateCalculator />}
                        </div>

                    </div>
                </div>

                {/* Footer Author Badge */}
                <footer className="mt-12 text-center text-xs font-medium flex items-center justify-center">
                    <a
                        href="https://portfolio-aranjit-archita.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Visit tijnara's portfolio"
                        className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-gray-200/80 dark:border-slate-800 shadow-sm hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer select-none active:scale-95"
                    >
                        <div className="relative flex items-center justify-center w-5 h-5 pointer-events-none">
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

                        <span className="opacity-60 pointer-events-none">by</span>
                        <span className="font-bold tracking-wide pointer-events-none">tijnara</span>
                    </a>
                </footer>

                {/* Corner Watermark Badge */}
                <div className="fixed bottom-3 right-4 pointer-events-none opacity-40 hover:opacity-100 transition-opacity hidden sm:block">
                    <span className="text-[10px] font-mono tracking-widest uppercase opacity-60 select-none">
                        Author: tijnara
                    </span>
                </div>
            </main>
        </div>
    );
}