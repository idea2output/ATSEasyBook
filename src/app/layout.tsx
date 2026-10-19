import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ATS Tech — The Engineering Platform for Modern Print & Publishing Technology',
  description:
    'Comprehensive technology platform for automated book design, accurate text-flow pagination, FOGRA39 CMYK prepress, commercial press imposition, and multilingual RTL publishing.',
  keywords: [
    'ATS Tech',
    'ATS EasyBook',
    'ATS Imposition',
    'print prepress',
    'book pagination',
    'CMYK PDF/X-4',
    'press imposition',
    'multilingual publishing',
    'Arabic publishing',
    'Urdu Nastaliq',
  ],
  authors: [{ name: 'ATS Tech Team' }],
  openGraph: {
    title: 'ATS Tech — Engineering Foundation for Modern Print & Publishing',
    description:
      'From structured manuscript typography and automated reflow to commercial press imposition and certified CMYK PDF/X-4 prepress.',
    url: 'https://atstech.io',
    siteName: 'ATS Tech',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ATS Tech — Modern Print & Publishing Technology',
    description:
      'Automated book design, certified prepress, accurate text flow, and commercial press imposition.',
  },
  metadataBase: new URL('http://localhost:3008'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ATS Tech Platform',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web, Cloud',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ATS Tech',
      brand: 'ATS Tech',
    },
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans selection:bg-rose-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
