'use client';

/**
 * 공책을 확대했을 때 얹히는 DOM. 디자인 작업 목록이 들어갈 자리다.
 * 페이지 넘김은 가로 스크롤 방식으로 만든다(요구사항).
 * 기준 크기는 720×940.
 */
export function NotebookPages() {
  return (
    <div className="screen-placeholder screen-placeholder--paper">
      <p>공책 (디자인 작업 목록 자리)</p>
      <p className="screen-placeholder__hint">720 × 940 · 가로 스크롤로 페이지 넘김</p>
    </div>
  );
}
