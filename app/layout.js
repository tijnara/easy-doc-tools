import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

export const viewport = {
    themeColor: '#090114',
};

export const metadata = {
    title: 'Workspace Kit',
    description: 'Essential text, document, PDF, due date, and calculation tools',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Workspace Kit',
    },
    icons: {
        icon: [
            { url: '/icon.svg', type: 'image/svg+xml' },
            { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcut: '/icon.svg',
        apple: '/icon-192.png',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {children}
        <SpeedInsights />
        <Analytics />
        </body>
        </html>
    );
}