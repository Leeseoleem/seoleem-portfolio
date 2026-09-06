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

/** 링크를 붙였을 때 미리보기 카드에 그대로 나오는 글. 사이트 설명이 아니라 사람 소개다 */
const SITE_TITLE = 'seoleem desk';
const SITE_DESCRIPTION = '반복되는 문제를 구조로 해결하는 프론트엔드 개발자 이서림의 포트폴리오';

/**
 * 공유 카드 이미지 같은 상대 주소를 절대 주소로 만들 때 쓰는 기준. 상대 주소로 두면 카카오톡, 슬랙 등이 이미지를 못 가져온다.
 * Vercel이 넣어 주는 프로덕션 도메인을 쓰고, 도메인을 따로 붙이면 NEXT_PUBLIC_SITE_URL로 덮는다.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'ko_KR',
    // 공유 이미지. 책상 전체 시점을 1200×630으로 캡처한 것이다(public/og.png). 씬이 크게 바뀌면 다시 캡처한다
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'seoleem desk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  // globals.css의 --brand-ink와 같은 값. 메타데이터는 CSS 변수를 읽을 수 없어 값을 직접 둔다
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/**
 * Pretendard. 핸드폰 화면과 XP 창처럼 현대 UI 글꼴이 필요한 곳에 쓴다.
 * 파일을 직접 두지 않고 CDN의 동적 서브셋을 쓴다. 한글 전체(2MB대)를 미리 받지 않고
 * 화면에 실제 쓰인 글자 묶음만 받아 오기 때문이다.
 */
const PRETENDARD_CSS = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${stardust.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD_CSS} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
