import './globals.css';

export const metadata = {
    title: 'Easy Doc Tools',
    description: 'Mobile-friendly text cleaner and PDF tool',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="bg-gray-50 text-gray-900">{children}</body>
        </html>
    );
}