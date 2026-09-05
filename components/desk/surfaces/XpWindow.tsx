'use client';

import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import { SCREEN_H, SCREEN_W, TASKBAR_H, type WindowState } from './window-state';

interface Props {
  win: WindowState;
  active: boolean;
  /** 창이 놓이는 바탕화면. 실제 화면 크기를 재서 끌기 거리를 보정한다 */
  screen: RefObject<HTMLDivElement | null>;
  onFocus: () => void;
  onMove: (x: number, y: number) => void;
  onMinimize: () => void;
  onToggleMax: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * XP 창 하나. 제목 표시줄을 잡아 옮기고, 오른쪽 위 세 버튼으로 내리거나 넓히거나 닫는다.
 *
 * 이 화면은 3D 안에 놓인 DOM이라 실제로는 축소돼서 보인다. 그래서 포인터가 움직인
 * 화면상의 거리와 창이 움직여야 할 거리가 다르다. 바탕화면의 실제 폭을 기준 폭으로 나눈
 * 배율로 나눠 줘야 커서와 창이 어긋나지 않는다.
 */
export function XpWindow({ win, active, screen, onFocus, onMove, onMinimize, onToggleMax, onClose, children }: Props) {
  /** 끌기 시작할 때의 배율과 잡은 지점 */
  const drag = useRef({ active: false, scale: 1, dx: 0, dy: 0 });

  const onBarDown = (e: React.PointerEvent<HTMLElement>) => {
    onFocus();
    // 넓혀 둔 창은 자리를 옮길 수 없다. 실제 윈도우도 그렇다
    if (win.maximized) return;
    const rect = screen.current?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? rect.width / SCREEN_W : 1;
    drag.current = {
      active: true,
      scale,
      dx: e.clientX / scale - win.x,
      dy: e.clientY / scale - win.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onBarMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return;
    const { scale, dx, dy } = drag.current;
    onMove(e.clientX / scale - dx, e.clientY / scale - dy);
  };

  const onBarUp = () => {
    drag.current.active = false;
  };

  const geo = win.maximized
    ? { left: 0, top: 0, width: SCREEN_W, height: SCREEN_H - TASKBAR_H }
    : { left: win.x, top: win.y, width: win.w, height: win.h };

  return (
    <section
      className={`xpw${active ? ' is-active' : ''}`}
      style={{ ...geo, zIndex: win.z }}
      onPointerDown={onFocus}
      aria-label={win.title}
    >
      <header
        className="xpw__bar"
        onPointerDown={onBarDown}
        onPointerMove={onBarMove}
        onPointerUp={onBarUp}
        onPointerCancel={onBarUp}
        onDoubleClick={onToggleMax}
      >
        <span className="xpw__title">{win.title}</span>
        <span className="xpw__btns">
          <button type="button" className="xpw__btn" onPointerDown={stop} onClick={onMinimize} aria-label="최소화">
            _
          </button>
          <button
            type="button"
            className="xpw__btn"
            onPointerDown={stop}
            onClick={onToggleMax}
            aria-label={win.maximized ? '이전 크기로' : '최대화'}
          >
            {win.maximized ? '❐' : '□'}
          </button>
          <button
            type="button"
            className="xpw__btn xpw__btn--close"
            onPointerDown={stop}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </span>
      </header>
      <div className="xpw__body">{children}</div>
    </section>
  );
}

/** 버튼을 눌렀을 때 제목 표시줄 끌기가 같이 시작되지 않게 막는다 */
function stop(e: React.PointerEvent<HTMLButtonElement>) {
  e.stopPropagation();
}
