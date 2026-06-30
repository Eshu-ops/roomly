import './globals.css';

export const metadata = {
  title: 'Roomly — shared living, settled',
  description: 'Live, cloud-synced roommate expense and meal management',
  manifest: '/manifest.json',
};

export const viewport = { themeColor: '#1F6F54' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
