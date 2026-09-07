'use client';

import { useRef, useState } from 'react';
import { getSound } from '@/lib/desk/sound';
import { notebookPages, type BoardPage, type CoverPage, type NotebookRow } from '@/lib/desk/content/notebook';

/**
 * 공책을 펼쳤을 때 드러난 속지 위에 얹히는 DOM. 기준 크기는 720×940.
 * 내용은 lib/desk/content/notebook.ts에 있고, 여기서는 넘김 동작과 장 배치만 맡는다.
 *
 * 이 화면은 이미 3D 공간에 비스듬히 놓인 DOM이라, 그 위에서 CSS 3D 회전을 한 번 더 거는 셈이다.
 * 장이 실제로 넘어갈 때(끌어서 놓았을 때, 스크롤이 한 장 분량을 넘었을 때) 서류와 같은 종이 소리를 낸다.
 */
const PAGES = notebookPages;

/** 한 장을 넘기는 데 필요한 가로 이동 거리(px) */
const TURN_DISTANCE = 300;

/** 장 안쪽 치수. CSS의 .nbp 값과 같아야 프레임 줄이 장 폭을 꼭 채운다 */
const PAGE_W = 720;
const PAGE_PAD = 28;
const FRAME_GAP = 16;
const CANVAS_W = PAGE_W - PAGE_PAD * 2;

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
    const settled = clampPos(Math.round(pos));
    // 반쯤 넘기다 놓아 제자리로 돌아가면 소리가 없다. 장이 실제로 바뀔 때만 난다
    if (settled !== start.current.pos) getSound().play('pageflip');
    setPos(settled);
  };

  // 가로 스크롤로도 넘긴다. 트랙패드는 deltaX, 휠 마우스는 shift + deltaY로 들어온다
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    wheel.current += dx;
    if (Math.abs(wheel.current) < TURN_DISTANCE) return;
    const next = clampPos(Math.round(pos) + Math.sign(wheel.current));
    wheel.current = 0;
    if (next === Math.round(pos)) return;
    getSound().play('pageflip');
    setPos(next);
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
        // 90도를 넘으면 뒷면이 보인다. backface-visibility에 맡기지 않고 직접 고른다.
        // 이 DOM은 drei가 씬 카메라에 맞춰 준 3D 변환(y축이 뒤집힌 거울상) 안에 있어서,
        // 브라우저가 앞뒤를 거꾸로 판정해 내용이 있는 앞면을 숨기고 빈 뒷면만 그린다
        const showBack = t >= 0.5;
        return (
          <div
            key={i}
            className={`nb__leaf${dragging ? '' : ' nb__leaf--eased'}`}
            style={{
              transform: `rotateY(${-180 * t}deg)`,
              zIndex: i === front ? PAGES.length + 1 : PAGES.length - i,
              pointerEvents: t > 0 && t < 1 ? 'none' : undefined,
            }}
          >
            <div className="nb__face nb__face--front" style={{ visibility: showBack ? 'hidden' : 'visible' }}>
              {page.kind === 'cover' ? <Cover page={page} /> : <Board page={page} />}
              <span className="nbp__no">
                {i + 1} / {PAGES.length}
              </span>
              <span className="nb__shade" style={{ opacity: shade }} />
            </div>
            <div className="nb__face nb__face--back" style={{ visibility: showBack ? 'visible' : 'hidden' }}>
              <span className="nb__shade nb__shade--back" style={{ opacity: shade }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 표지. Figma 파일의 커버 프레임처럼, 캔버스 위 프레임 하나에 제목과 목차를 담는다 */
function Cover({ page }: { page: CoverPage }) {
  return (
    <div className="nbp">
      <header className="nbp__head">
        <p className="nbp__name">
          seoleem / <b>design notes</b>
        </p>
      </header>
      <div className="nbp__rows">
        <figure className="nbp__frame" style={{ width: CANVAS_W }}>
          <figcaption className="nbp__frame-label">cover</figcaption>
          <div className="nbp__cover">
            <div>
              <h2 className="nbp__title">{page.title}</h2>
              <p className="nbp__caption">{page.caption}</p>
            </div>
            <dl className="nbp__contents">
              {page.contents.map((c) => (
                <div key={c.project} className="nbp__contents-row">
                  <dt>{c.project}</dt>
                  <dd>{c.summary}</dd>
                </div>
              ))}
            </dl>
          </div>
        </figure>
      </div>
    </div>
  );
}

/** Figma 페이지 하나. 왼쪽 위에 장 이름과 캡션, 그 아래로 프레임 줄 */
function Board({ page }: { page: BoardPage }) {
  return (
    <div className="nbp">
      <header className="nbp__head">
        <p className="nbp__name">
          {page.project} / <b>{page.title}</b>
        </p>
        <p className="nbp__caption">{page.caption}</p>
      </header>
      <div className="nbp__rows">
        {page.rows.map((row, i) => (
          <Row key={i} row={row} />
        ))}
      </div>
    </div>
  );
}

/**
 * 프레임 한 줄. 높이를 정하지 않으면 줄 폭을 꼭 채우는 높이로 맞춘다.
 * 비율이 다른 프레임이 섞여도 한 줄에 나란히 놓인 모양이 된다.
 */
function Row({ row }: { row: NotebookRow }) {
  const aspectSum = row.frames.reduce((s, f) => s + f.w / f.h, 0);
  const height = row.height ?? (CANVAS_W - FRAME_GAP * (row.frames.length - 1)) / aspectSum;
  return (
    <div className="nbp__row">
      {row.frames.map((f) => (
        <figure key={f.src} className="nbp__frame" style={{ width: Math.round((height * f.w) / f.h) }}>
          <figcaption className="nbp__frame-label">{f.label}</figcaption>
          {/* 3D 안에서 확대되는 DOM이라 next/image 축소본 대신 미리 줄인 원본을 쓴다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.src} alt={f.label} style={{ height: Math.round(height) }} draggable={false} />
        </figure>
      ))}
    </div>
  );
}
