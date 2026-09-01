import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// PF스타더스트 3.0. 픽셀 폰트라 부팅 화면과 HUD의 레트로 톤을 담당한다.
const stardust = localFont({
  src: [
    { path: './fonts/PFStardust-Regular.woff', weight: '400', style: 'normal' },
    { path: './fonts/PFStardust-Bold.woff', weight: '700', style: 'normal' },
    { path: './fonts/PFStardust-ExtraBold.woff', weight: '800', style: 'normal' },
  ],
  variable: '--font-stardust',
  display: 'swap',
  fallback: ['Tahoma', 'Malgun Gothic', 'Apple SD Gothic Neo', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'seoleem desk',
  description: 'Windows XP 부팅 화면에서 3D 책상으로 이어지는 seoleem의 인터랙티브 포트폴리오',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${stardust.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
