'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSound } from '@/lib/desk/sound';
import { useIsMobile } from '@/lib/desk/use-mobile';
import {
  fullSrc,
  notebookIndex,
  notebookPages,
  notebookSection,
  type BoardPage,
  type CoverPage,
  type NotebookFrame,
  type NotebookIndexEntry,
  type NotebookRow,
  type SectionPage,
} from '@/lib/desk/content/notebook';

/**
 * 공책을 펼쳤을 때 드러난 속지 위에 얹히는 DOM. 기준 크기는 720×940.
 * 내용은 lib/desk/content/notebook.ts에 있고, 여기서는 넘김 동작, 장 배치, 전체 화면 보기만 맡는다.
 *
 * 이 화면은 이미 3D 공간에 비스듬히 놓인 DOM이라, 그 위에서 CSS 3D 회전을 한 번 더 거는 셈이다.
 * 장이 실제로 넘어갈 때(끌어서 놓았을 때, 스크롤이 한 장 분량을 넘었을 때) 서류와 같은 종이 소리를 낸다.
 * 프레임을 누르면 전체 화면으로 크게 본다. 전체 화면은 3D 변환 밖(body)에 그려야 화면에 똑바로 놓인다.
 */
const PAGES = notebookPages;
/** 프로젝트마다 첫 장. 표지 목차와 옆의 인덱스 탭이 같은 목록을 본다 */
const INDEX = notebookIndex(PAGES);

/** 한 장을 넘기는 데 필요한 가로 이동 거리(px) */
const TURN_DISTANCE = 300;
/** 이보다 많이 움직이면 끌기다. 그 뒤에 놓아도 프레임을 열지 않는다 */
const CLICK_SLOP = 6;

/** 장 안쪽 치수. CSS의 .nbp 값과 같아야 프레임 줄이 판 폭을 꼭 채운다 */
const PAGE_W = 720;
const PAGE_PAD = 40;
const PLATE_PAD = 20;
const FRAME_GAP = 16;
const PLATE_W = PAGE_W - PAGE_PAD * 2 - PLATE_PAD * 2;

/** 전체 화면으로 보고 있는 프레임. 같은 장의 프레임 사이를 좌우로 오간다 */
interface Viewing {
  frames: NotebookFrame[];
  index: number;
}

export function NotebookPages() {
  /** 넘어간 정도. 정수 부분이 넘어간 장 수, 소수 부분이 지금 넘기는 중인 장의 진행도다 */
  const [pos, setPos] = useState(0);
  const [dragging, setDragging] = useState(false);
  /** 목차로 여러 장을 넘기는 중. 이때는 CSS 전환을 끄고 한 장씩 직접 돌린다 */
  const [turning, setTurning] = useState(false);
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const start = useRef({ x: 0, pos: 0 });
  /** 끌고 있는 동안의 현재 위치. 놓을 때 상태 갱신 함수 안에서 소리를 내지 않으려고 따로 든다 */
  const live = useRef(0);
  const moved = useRef(false);
  const wheel = useRef(0);

  const anim = useRef(0);

  const clampPos = (v: number) => Math.min(PAGES.length, Math.max(0, v));

  /** 넘김 애니메이션을 멈춘다. 끌기나 스크롤이 들어오면 바로 끊는다 */
  const stopTurn = () => {
    if (!anim.current) return;
    cancelAnimationFrame(anim.current);
    anim.current = 0;
    setTurning(false);
  };

  const apply = (v: number) => {
    live.current = v;
    setPos(v);
  };

  useEffect(() => () => { if (anim.current) cancelAnimationFrame(anim.current); }, []);

  // 끌기. 포인터 캡처를 쓰지 않고 창에 리스너를 건다. 캡처를 걸면 프레임 단추의 click이 오지 않는다
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    stopTurn();
    start.current = { x: e.clientX, pos: live.current };
    moved.current = false;
    setDragging(true);
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const dx = start.current.x - e.clientX;
      if (Math.abs(dx) > CLICK_SLOP) moved.current = true;
      // 한 번 끌어서 넘길 수 있는 건 한 장까지다. 거리에 그대로 비례시키면 여러 장이 한꺼번에 넘어간다
      const limited = Math.min(1, Math.max(-1, dx / TURN_DISTANCE));
      apply(clampPos(start.current.pos + limited));
    };
    const onUp = () => {
      setDragging(false);
      const settled = clampPos(Math.round(live.current));
      // 반쯤 넘기다 놓아 제자리로 돌아가면 소리가 없다. 장이 실제로 바뀔 때만 난다
      if (settled !== Math.round(start.current.pos)) getSound().play('pageflip');
      apply(settled);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  // 가로 스크롤로도 넘긴다. 트랙패드는 deltaX, 휠 마우스는 shift + deltaY로 들어온다
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    stopTurn();
    wheel.current += dx;
    if (Math.abs(wheel.current) < TURN_DISTANCE) return;
    // 애니메이션을 끊은 직후에는 pos가 아직 한 프레임 전 값이라 지금 위치(live)를 기준으로 센다
    const here = Math.round(live.current);
    const next = clampPos(here + Math.sign(wheel.current));
    wheel.current = 0;
    if (next === here) return;
    getSound().play('pageflip');
    apply(next);
  };

  /** 프레임을 눌렀다. 끌다가 놓은 것이면 열지 않는다 */
  const open = (frames: NotebookFrame[], index: number) => {
    if (moved.current) return;
    getSound().play('click');
    setViewing({ frames, index });
  };

  /**
   * 목차나 인덱스 탭으로 먼 장까지 간다. 위치를 한 번에 옮기지 않고 시간에 따라 이어서 옮긴다.
   * 한 번에 옮기면 모든 장이 동시에 돌아, 목적지 장이 먼저 드러난 채로 그 위에서 종이가 펄럭인다.
   * 이어서 옮기면 언제나 한 장만 돌고 있어 실제로 여러 장을 주르륵 넘기는 모양이 된다.
   */
  const jump = (page: number) => {
    if (moved.current) return;
    stopTurn();
    const from = live.current;
    const to = clampPos(page);
    const dist = Math.abs(to - from);
    if (dist < 0.01) return;
    getSound().play('pageflip');
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply(to);
      return;
    }
    // 한 장에 약 110ms. 멀리 갈수록 길어지되 1.4초를 넘기지 않는다
    const dur = Math.min(1400, 260 + dist * 110);
    const t0 = performance.now();
    setTurning(true);
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      apply(from + (to - from) * e);
      if (k < 1) {
        anim.current = requestAnimationFrame(step);
        return;
      }
      anim.current = 0;
      setTurning(false);
      getSound().play('pageflip');
    };
    anim.current = requestAnimationFrame(step);
  };

  const front = Math.floor(pos);
  /** 마지막 장까지 넘겨 뒤표지가 드러났는지 */
  const atEnd = pos > PAGES.length - 0.5;

  return (
    <div className={`nb${dragging ? ' nb--grabbing' : ''}`} onPointerDown={onDown} onWheel={onWheel}>
      {/* 뒤표지. 장을 다 넘기면 드러난다. 그 전에는 단추를 두지 않는다. 덮여 있어도 탭 순서에는 남기 때문이다 */}
      <div className="nb__end">
        {atEnd && (
          <button type="button" className="nb__end-btn" onClick={() => jump(0)}>
            처음으로
          </button>
        )}
      </div>
      {PAGES.map((page, i) => {
        // 이 장이 얼마나 넘어갔는지. 0이 덮인 상태, 1이 완전히 넘어간 상태
        const t = Math.min(1, Math.max(0, pos - i));
        // 종이가 세워질수록 빛을 덜 받는다. 90도 부근에서 가장 어둡다
        const shade = Math.sin(t * Math.PI) * 0.45;
        // 90도를 넘으면 뒷면이 보인다. backface-visibility에 맡기지 않고 직접 고른다.
        // 이 DOM은 drei가 씬 카메라에 맞춰 준 3D 변환(y축이 뒤집힌 거울상) 안에 있어서,
        // 브라우저가 앞뒤를 거꾸로 판정해 내용이 있는 앞면을 숨기고 빈 뒷면만 그린다
        const showBack = t >= 0.5;
        // 지금 장과 그다음 장만 그린다. 더 뒤의 장은 위 장에 완전히 덮여 보이지 않는데,
        // 살려 두면 탭 순서가 화면에 없는 단추 수십 개를 지나간다. 옆의 인덱스 탭은 장 밖이라 그대로 둔다
        const covered = i > front + 1;
        return (
          <div
            key={i}
            className={`nb__leaf${dragging || turning ? '' : ' nb__leaf--eased'}`}
            style={{
              transform: `rotateY(${-180 * t}deg)`,
              zIndex: i === front ? PAGES.length + 1 : PAGES.length - i,
              pointerEvents: t > 0 && t < 1 ? 'none' : undefined,
            }}
          >
            <div className="nb__face nb__face--front" style={{ visibility: showBack || covered ? 'hidden' : 'visible' }}>
              {page.kind === 'cover' && <Cover page={page} pageNo={i + 1} total={PAGES.length} onJump={jump} />}
              {page.kind === 'section' && (
                <Section page={page} pageNo={i + 1} total={PAGES.length} contents={notebookSection(PAGES, i)} onJump={jump} />
              )}
              {page.kind === 'board' && <Board page={page} pageNo={i + 1} total={PAGES.length} onOpen={open} />}
              <span className="nb__shade" style={{ opacity: shade }} />
            </div>
            <div className="nb__face nb__face--back" style={{ visibility: showBack && !covered ? 'visible' : 'hidden' }}>
              <span className="nb__shade nb__shade--back" style={{ opacity: shade }} />
            </div>
            {/* 인덱스 탭. 프로젝트가 시작하는 장의 오른쪽 가장자리에 붙어 있고, 장이 넘어가면 장과 함께 왼쪽으로 간다 */}
            {INDEX.filter((e) => e.page === i).map((e) => (
              <IndexTab key={e.projectId} entry={e} order={INDEX.indexOf(e)} flipped={showBack} onJump={jump} />
            ))}
          </div>
        );
      })}
      {viewing && <Lightbox viewing={viewing} onChange={setViewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

/** 장 바닥의 작은 글줄. 왼쪽에 프로젝트 이름, 오른쪽에 쪽번호 */
function Running({ left, pageNo, total }: { left: string; pageNo: number; total: number }) {
  return (
    <p className="nbp__running">
      <span>{left}</span>
      <span>
        {String(pageNo).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </p>
  );
}

/** 표지. 필기체 제목과 한 줄 아래로 프로젝트 목차가 붙는다 */
function Cover({ page, pageNo, total, onJump }: { page: CoverPage; pageNo: number; total: number; onJump: (page: number) => void }) {
  return (
    <div className="nbp">
      <div className="nbp__body">
        <div className="nbp__cover">
          <h2 className="nbp__cover-title">{page.title}</h2>
          <p className="nbp__caption">{page.caption}</p>
        </div>
        <ol className="nbp__toc nbp__toc--projects">
          {INDEX.map((e) => (
            <li key={e.projectId}>
              <button type="button" className="nbp__toc-row" onClick={() => onJump(e.page)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="nbp__toc-icon" src={`/icons/${e.projectId}.png`} alt="" draggable={false} />
                <span className="nbp__toc-name">{e.project}</span>
                <span className="nbp__toc-page">{String(e.page + 1).padStart(2, '0')}</span>
                <Chevron />
              </button>
            </li>
          ))}
        </ol>
      </div>
      <Running left="seoleem" pageNo={pageNo} total={total} />
    </div>
  );
}

/** 목차 줄 끝의 꺾쇠. 누르면 그 장으로 간다는 표시다 */
function Chevron() {
  return (
    <svg className="nbp__toc-more" viewBox="0 0 8 13" fill="none" aria-hidden="true">
      <path d="M1.5 1.5 6.5 6.5 1.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 프로젝트 간지. 로고와 이름, 그 프로젝트 안의 목차만 둔다 */
function Section({
  page,
  pageNo,
  total,
  contents,
  onJump,
}: {
  page: SectionPage;
  pageNo: number;
  total: number;
  contents: { title: string; page: number }[];
  onJump: (page: number) => void;
}) {
  return (
    <div className="nbp">
      <div className="nbp__body">
        <div className="nbp__section-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="nbp__section-icon" src={`/icons/${page.projectId}.png`} alt="" draggable={false} />
          <h2 className="nbp__section-name">{page.project}</h2>
        </div>
        <ol className="nbp__toc">
          {contents.map((c) => (
            <li key={c.page}>
              <button type="button" className="nbp__toc-row" onClick={() => onJump(c.page)}>
                <span className="nbp__toc-name">{c.title}</span>
                <span className="nbp__toc-page">{String(c.page + 1).padStart(2, '0')}</span>
                <Chevron />
              </button>
            </li>
          ))}
        </ol>
      </div>
      <Running left={page.project} pageNo={pageNo} total={total} />
    </div>
  );
}

/**
 * 공책 옆에 붙은 인덱스 탭. 장의 오른쪽 가장자리 밖으로 튀어나온다(좁은 화면에서는 안쪽 여백에 붙는다).
 * 장이 뒤로 넘어가면 장과 함께 거울상이 되므로 글자를 한 번 더 뒤집어 바로 읽히게 한다.
 */
function IndexTab({ entry, order, flipped, onJump }: { entry: NotebookIndexEntry; order: number; flipped: boolean; onJump: (page: number) => void }) {
  // 좁은 화면에서는 장을 정면으로 크게 보므로, 밖으로 튀어나온 탭이 화면 밖으로 나간다
  const inset = useIsMobile();
  return (
    <button
      type="button"
      className={`nb__tab nb__tab--${order % 3}${flipped ? ' nb__tab--flipped' : ''}${inset ? ' nb__tab--inset' : ''}`}
      style={{ top: 96 + order * 124 }}
      onClick={() => onJump(entry.page)}
      aria-label={`${entry.project} 장으로`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="nb__tab-icon" src={`/icons/${entry.projectId}.png`} alt="" draggable={false} />
      <span className="nb__tab-name">{entry.project}</span>
    </button>
  );
}

/** 한 주제를 다루는 장. 제목 하나와 그 아래 프레임을 얹은 판 */
function Board({
  page,
  pageNo,
  total,
  onOpen,
}: {
  page: BoardPage;
  pageNo: number;
  total: number;
  onOpen: (frames: NotebookFrame[], index: number) => void;
}) {
  return (
    <div className="nbp">
      <header className="nbp__head">
        <h2 className="nbp__title">{page.title}</h2>
      </header>
      <div className="nbp__plate">
        {page.rows.map((row, i) => (
          <Row key={i} row={row} onOpen={onOpen} />
        ))}
      </div>
      <Running left={page.project} pageNo={pageNo} total={total} />
    </div>
  );
}

/**
 * 프레임 한 줄. 높이를 정하지 않으면 줄 폭을 꼭 채우는 높이로 맞춘다.
 * 비율이 다른 프레임이 섞여도 한 줄에 나란히 놓인 모양이 된다.
 */
function Row({ row, onOpen }: { row: NotebookRow; onOpen: (frames: NotebookFrame[], index: number) => void }) {
  const aspectSum = row.frames.reduce((s, f) => s + f.w / f.h, 0);
  const height = row.height ?? (PLATE_W - FRAME_GAP * (row.frames.length - 1)) / aspectSum;
  return (
    <div className="nbp__row">
      {row.frames.map((f, i) => (
        <figure key={f.src} className="nbp__frame" style={{ width: Math.round((height * f.w) / f.h) }}>
          <button type="button" className="nbp__frame-btn" onClick={() => onOpen(row.frames, i)} aria-label={`${f.label} 크게 보기`}>
            {/* 3D 안에서 확대되는 DOM이라 next/image 축소본 대신 미리 줄인 원본을 쓴다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.src} alt={f.label} style={{ height: Math.round(height) }} draggable={false} />
          </button>
          <figcaption className="nbp__frame-label">{f.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/**
 * 전체 화면 보기. 3D 변환 안에 그리면 화면에 비스듬히 놓이므로 body에 붙인다.
 * 방향키로 같은 장의 다른 프레임을 보고, Esc나 바깥을 누르면 닫는다.
 * Esc는 HUD의 "책상으로" 단축키와 겹치므로 capture 단계에서 먹어 둔다.
 */
function Lightbox({ viewing, onChange, onClose }: { viewing: Viewing; onChange: (v: Viewing) => void; onClose: () => void }) {
  const { frames, index } = viewing;
  const frame = frames[index];
  const prev = index > 0 ? index - 1 : null;
  const next = index < frames.length - 1 ? index + 1 : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowLeft' && prev !== null) {
        e.stopPropagation();
        onChange({ frames, index: prev });
      } else if (e.key === 'ArrowRight' && next !== null) {
        e.stopPropagation();
        onChange({ frames, index: next });
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [frames, prev, next, onChange, onClose]);

  return createPortal(
    // 공책의 끌기 처리로 이벤트가 올라가지 않게 여기서 끊는다
    <div className="lb" role="dialog" aria-modal="true" aria-label={frame.label} onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <button type="button" className="lb__backdrop" aria-label="닫기" onClick={onClose} />
      <header className="lb__bar">
        <span className="lb__label">{frame.label}</span>
        <span className="lb__count">
          {index + 1} / {frames.length}
        </span>
        <button type="button" className="lb__close" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </header>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={frame.src} className="lb__img" src={fullSrc(frame)} alt={frame.label} draggable={false} />
      <button type="button" className="lb__arrow lb__arrow--prev" onClick={() => prev !== null && onChange({ frames, index: prev })} aria-disabled={prev === null} aria-label="이전">
        ‹
      </button>
      <button type="button" className="lb__arrow lb__arrow--next" onClick={() => next !== null && onChange({ frames, index: next })} aria-disabled={next === null} aria-label="다음">
        ›
      </button>
    </div>,
    document.body,
  );
}
