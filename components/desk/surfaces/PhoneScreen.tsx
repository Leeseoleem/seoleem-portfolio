'use client';

/**
 * 핸드폰을 확대했을 때 화면에 얹히는 DOM. 토스 스타일 UI가 들어갈 자리다.
 * 기준 크기는 360×780. 색·간격은 globals.css의 `--toss-*` 토큰을 쓴다.
 */
export function PhoneScreen() {
  return (
    <div className="screen-placeholder screen-placeholder--toss">
      <p>핸드폰 화면 (토스 스타일 UI 자리)</p>
      <p className="screen-placeholder__hint">360 × 780 · 토큰 접두 toss-</p>
    </div>
  );
}
