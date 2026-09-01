'use client';

/**
 * 서류를 확대했을 때 얹히는 DOM. 기본 이력·소개가 들어갈 자리다.
 * 종이 넘기는 효과를 여기서 구현한다(요구사항).
 * 기준 크기는 600×840.
 */
export function DocumentSheets() {
  return (
    <div className="screen-placeholder screen-placeholder--paper">
      <p>서류 (기본 정보 자리)</p>
      <p className="screen-placeholder__hint">600 × 840 · 페이지 넘김 효과</p>
    </div>
  );
}
