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
            {/* Custom Flight Keyframe Animations */}
            <style>{`
        @keyframes origamiFly {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1);
          }
          25% {
            transform: translateY(-12px) translateX(8px) rotate(5deg) scale(1.04);
          }
          50% {
            transform: translateY(-20px) translateX(0px) rotate(-2deg) scale(1.06);
          }
          75% {
            transform: translateY(-8px) translateX(-8px) rotate(-6deg) scale(1.02);
          }
        }
        @keyframes windStream {
          0% {
            opacity: 0;
            transform: translateY(-10px) scaleX(0.5);
          }
          50% {
            opacity: 0.7;
            transform: translateY(12px) scaleX(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(24px) scaleX(0.5);
          }
        }
        .animate-flying-plane {
          animation: origamiFly 3.5s ease-in-out infinite;
        }
        .animate-wind-trail-1 {
          animation: windStream 1.8s ease-in-out infinite;
        }
        .animate-wind-trail-2 {
          animation: windStream 1.8s ease-in-out infinite 0.6s;
        }
      `}</style>

            {/* Animated Flying Container */}
            <div className="relative flex flex-col items-center justify-center mb-6">
                {/* Background Glowing Aura */}
                <div className="absolute w-32 h-32 bg-amber-400/20 rounded-full blur-2xl animate-pulse"></div>

                {/* Flying Origami Badge */}
                <div className="animate-flying-plane relative w-20 h-20 bg-purple-900/90 border border-purple-700/60 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/25 backdrop-blur-md">
                    {/* Origami Document Transformer Icon */}
                    <svg className="w-12 h-12 drop-shadow-md" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="splashGoldWing" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="35%" stopColor="#fef08a" />
                                <stop offset="100%" stopColor="#eab308" />
                            </linearGradient>
                            <linearGradient id="splashVioletBody" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#e9d5ff" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                            <linearGradient id="splashLeftWing" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#d8b4fe" />
                                <stop offset="40%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                        </defs>
                        <path d="M 16 4 L 5 22 L 13 19 Z" fill="url(#splashLeftWing)" />
                        <path d="M 16 4 L 27 22 L 19 19 Z" fill="url(#splashGoldWing)" />
                        <path d="M 16 4 L 19 19 L 16 27 L 13 19 Z" fill="url(#splashVioletBody)" />
                        <line x1="16" y1="4" x2="16" y2="27" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
                        <line x1="16" y1="4" x2="10.5" y2="20.5" stroke="#e0e7ff" strokeWidth="0.6" opacity="0.7" />
                        <line x1="16" y1="4" x2="21.5" y2="20.5" stroke="#d97706" strokeWidth="0.6" opacity="0.7" />
                        <circle cx="16" cy="27" r="1.2" fill="#fbbf24" />
                    </svg>
                </div>

                {/* Animated Flying Wind Streams */}
                <div className="absolute -bottom-4 flex flex-col items-center gap-1 pointer-events-none">
                    <div className="animate-wind-trail-1 w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full"></div>
                    <div className="animate-wind-trail-2 w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent rounded-full"></div>
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