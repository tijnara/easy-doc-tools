'use client';
import { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
    const [progress, setProgress] = useState(0);
    const [isAppLoaded, setIsAppLoaded] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const handleLoad = () => setIsAppLoaded(true);

        if (document.readyState === 'complete') {
            setIsAppLoaded(true);
        } else {
            window.addEventListener('load', handleLoad);
            return () => window.removeEventListener('load', handleLoad);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (isAppLoaded) {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setFadeOut(true), 200);
                        setTimeout(() => onFinish(), 700);
                        return 100;
                    }
                    return Math.min(100, prev + 10);
                }

                if (prev < 90) {
                    return prev + 3;
                }

                return prev;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [isAppLoaded, onFinish]);

    return (
        <div
            className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-purple-950 text-white transition-opacity duration-700 ease-in-out ${
                fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            {/* Animated Glowing Aura & Logo Box */}
            <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-28 h-28 bg-amber-400/25 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-tr from-purple-800 via-violet-600 to-amber-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/20 animate-bounce border border-amber-300/30">
                    <svg
                        className="w-10 h-10 text-amber-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
            </div>

            {/* App Branding */}
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-violet-300 mb-2 drop-shadow-sm">
                Workspace Kit
            </h1>
            <p className="text-xs text-purple-300/80 mb-8 font-medium tracking-wide">
                Preparing your workspace...
            </p>

            {/* Progress Bar */}
            <div className="w-56 h-1.5 bg-purple-900/80 border border-purple-800 rounded-full overflow-hidden relative shadow-inner">
                <div
                    className="h-full bg-gradient-to-r from-purple-600 via-violet-500 to-amber-400 rounded-full transition-all duration-100 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Percentage Counter */}
            <span className="text-[11px] font-mono text-amber-300/90 mt-2 font-semibold">
        {progress}%
      </span>

            {/* Animated Developer Watermark Badge */}
            <div className="absolute bottom-8 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 bg-purple-900/60 border border-purple-700/50 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                    <div className="relative flex items-center justify-center w-4 h-4">
                        <span className="absolute inset-0 bg-amber-400/30 rounded-full animate-ping"></span>
                        <svg
                            className="w-3.5 h-3.5 text-amber-300 relative z-10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="5" r="2" />
                            <path d="M8 11a4 4 0 0 1 8 0" />
                            <rect x="6.5" y="10.5" width="11" height="6.5" rx="1" fill="#581c87" stroke="#f59e0b" />
                            <line x1="8.5" y1="12.5" x2="12" y2="12.5" stroke="#f59e0b" strokeWidth="1.2" className="animate-pulse" />
                            <line x1="8.5" y1="14.5" x2="15.5" y2="14.5" stroke="#c084fc" strokeWidth="1.2" className="animate-pulse" />
                            <path d="M4.5 18h15" stroke="#f59e0b" strokeWidth="2" />
                        </svg>
                    </div>
                    <span className="text-xs text-purple-200/80 font-medium">by</span>
                    <span className="text-xs font-bold text-amber-300 tracking-wide">tijnara</span>
                </div>
            </div>
        </div>
    );
}