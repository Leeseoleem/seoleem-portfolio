'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { WindowState } from './window-state';

/**
 * 모바일에서 여는 창. 3D 안의 작은 모니터 대신 화면 전체를 덮는 시트로 띄운다.
 *
 * 3D 변환 안에서는 position: fixed가 그 변환을 기준으로 잡혀 화면에 똑바로 놓이지 않는다.
 * 공책의 전체 화면 보기와 같은 이유로 body에 따로 그린다.
 * 화면을 꽉 채우면 창이 아니라 그냥 회색 판이 된다. 사방에 여백을 두고 뒤를 어둡게 깔아 창처럼 띄운다.
 * 창틀은 XP 그대로 두되 제목과 닫기만 남긴다. 손가락으로 옮기거나 크기를 바꿀 일이 없다.
 * 어두운 바깥을 누르면 닫힌다.
 */
export function MobileWindowSheet({ win, onClose, children }: { win: WindowState; onClose: () => void; children: ReactNode }) {
  // 뒤로 가기 대신 쓰는 Esc. 책상으로 빠져나가는 단축키와 겹치므로 여기서 먹는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  // 이 시트는 모바일에서만 그려진다. 첫 그림(서버·수화)에는 없으므로 body를 바로 써도 어긋나지 않는다
  if (typeof document === 'undefined') return null;

  /** 창 밖(어두운 바깥)을 눌렀을 때만 닫는다. 창 안을 누른 것이 올라온 경우는 무시한다 */
  const onOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="xpm" onClick={onOutside}>
      <section
        className={`xpm__win${win.kind === 'project' ? ' xpm__win--tall' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={win.title}
      >
        <header className="xpm__bar">
          <span className="xpm__title">{win.title}</span>
          <button type="button" className="xpm__close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>
        <div className={`xpm__body${win.kind === 'project' ? ' xpm__body--flush' : ''}`}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}
