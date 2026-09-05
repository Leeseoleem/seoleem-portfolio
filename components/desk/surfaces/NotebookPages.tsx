'use client';

import { useRef, useState } from 'react';

/**
 * 공책을 펼쳤을 때 드러난 속지 위에 얹히는 DOM. 디자인 작업 목록이 들어갈 자리다.
 * 기준 크기는 720×940.
 *
 * 지금 들어 있는 건 넘김 동작 확인용 임시 종이다.
 * 이 화면은 이미 3D 공간에 비스듬히 놓인 DOM이라, 그 위에서 CSS 3D 회전을 한 번 더 거는 셈이다.
 * 원근이 제대로 잡히는지 확인하고 실제 내용을 얹는다.
 */
const PAGES = [
  { id: '01', tone: 'a' },
  { id: '02', tone: 'b' },
  { id: '03', tone: 'c' },
] as const;

/** 한 장을 넘기는 데 필요한 가로 이동 거리(px) */
const TURN_DISTANCE = 300;

export function NotebookPages() {
  /** 넘어간 정도. 정수 부분이 넘어간 장 수, 소수 부분이 지금 넘기는 중인 장의 진행도다 */
  const [pos, setPos] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, pos: 0 });
  const wheel = useRef(0);

  const clampPos = (v: number) => Math.min(PAGES.length, Math.max(0, v));

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, pos };
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const moved = (start.current.x - e.clientX) / TURN_DISTANCE;
    // 한 번 끌어서 넘길 수 있는 건 한 장까지다. 거리에 그대로 비례시키면 여러 장이 한꺼번에 넘어간다
    const limited = Math.min(1, Math.max(-1, moved));
    setPos(clampPos(start.current.pos + limited));
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    setPos((p) => clampPos(Math.round(p)));
  };

  // 가로 스크롤로도 넘긴다. 트랙패드는 deltaX, 휠 마우스는 shift + deltaY로 들어온다
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    wheel.current += dx;
    if (Math.abs(wheel.current) < TURN_DISTANCE) return;
    setPos((p) => clampPos(Math.round(p) + Math.sign(wheel.current)));
    wheel.current = 0;
  };

  const front = Math.floor(pos);

  return (
    <div
      className={`nb${dragging ? ' nb--grabbing' : ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onWheel={onWheel}
    >
      <p className="nb__end">마지막 장</p>
      {PAGES.map((page, i) => {
        // 이 장이 얼마나 넘어갔는지. 0이 덮인 상태, 1이 완전히 넘어간 상태
        const t = Math.min(1, Math.max(0, pos - i));
        // 종이가 세워질수록 빛을 덜 받는다. 90도 부근에서 가장 어둡다
        const shade = Math.sin(t * Math.PI) * 0.45;
        return (
          <div
            key={page.id}
            className={`nb__leaf${dragging ? '' : ' nb__leaf--eased'}`}
            style={{
              transform: `rotateY(${-180 * t}deg)`,
              zIndex: i === front ? PAGES.length + 1 : PAGES.length - i,
              pointerEvents: t > 0 && t < 1 ? 'none' : undefined,
            }}
          >
            <div className={`nb__face nb__face--front nb__face--${page.tone}`}>
              <span className="nb__no">{page.id}</span>
              <span className="nb__hint">가로로 끌어 넘긴다. 반대로 끌면 되돌아온다</span>
              <span className="nb__shade" style={{ opacity: shade }} />
            </div>
            <div className="nb__face nb__face--back">
              <span className="nb__shade nb__shade--back" style={{ opacity: shade }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
