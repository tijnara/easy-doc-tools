import './globals.css';

export const metadata = {
    title: 'Workspace Kit',
    description: 'Mobile-friendly text cleaner and PDF tool',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="bg-gray-50 text-gray-900">{children}</body>
        </html>
    );
}