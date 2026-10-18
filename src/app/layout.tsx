import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATS EasyBook - Template-Driven Book Publishing',
  description: 'Create manuscripts, format structured blocks, and view live 6x9-inch paginated spreads.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
