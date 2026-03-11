import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AI } from './action';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vercel AI SDK PoC',
  description: 'Proof of concept for state poisoning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AI>
          {children}
        </AI>
      </body>
    </html>
  );
}
