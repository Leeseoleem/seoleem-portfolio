'use client';

/**
 * 모니터를 확대했을 때 화면에 얹히는 DOM. 실제 Windows XP 스타일 창 UI가 들어갈 자리다.
 * 기준 크기는 1024×768이고, 이 안에서는 평범한 웹 UI처럼 만들면 된다.
 * 색·간격은 globals.css의 `--xp-*` 토큰을 쓴다.
 */
export function MonitorScreen() {
  return (
    <div className="screen-placeholder screen-placeholder--xp">
      <p>모니터 화면 (XP 창 UI 자리)</p>
      <p className="screen-placeholder__hint">1024 × 768 · 토큰 접두 xp-</p>
    </div>
  );
}
