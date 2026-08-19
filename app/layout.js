import './globals.css';

export const viewport = {
    themeColor: '#020617',
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
        icon: '/icon.svg',
        apple: '/icon.svg',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <head>
            <link rel="icon" href="/icon.svg" type="image/svg+xml" />
            <link rel="apple-touch-icon" href="/icon.svg" />
        </head>
        <body className="bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {children}
        </body>
        </html>
    );
}