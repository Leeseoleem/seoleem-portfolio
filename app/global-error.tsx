'use client';

import './globals.css';
import { ErrorScreen } from '@/components/desk/ErrorScreen';

/**
 * 루트 레이아웃까지 깨졌을 때. 레이아웃이 그려지지 않으므로 html·body와 스타일을 직접 든다.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">
        <ErrorScreen code={error.digest} />
      </body>
    </html>
  );
}
