'use client';

import { useEffect, useRef, useState } from 'react';
import { RESUME } from '@/lib/desk/xp-apps';
import { getSound } from '@/lib/desk/sound';

/**
 * 서류를 확대했을 때 얹히는 DOM. 책상 위에 놓인 실제 이력서처럼 PDF를 한 장씩 보여 준다.
 * 기준 크기는 600×840, A4 비율이라 페이지 이미지가 종이를 그대로 채운다.
 *
 * 웹용 요약을 따로 쓰지 않는다. 모니터의 이력서 아이콘은 내려받기, 여기는 열람이다.
 * PDF는 pdf.js로 그리지 않고 미리 렌더한 페이지 이미지(public/resume/)를 쓴다. 3D 씬 위에 얹는 DOM이라
 * 번들과 첫 로딩을 가볍게 두려는 결정이다.
 * 양옆 단추, 방향키, 가로 스크롤 셋으로 넘기고, 마지막 장에서 처음으로 돌아가지 않는다. 넘길 때 종이 넘기는 소리가 난다.
 */
/** 한 쪽을 넘기는 데 필요한 가로 스크롤 거리(px). 공책과 같은 값이다 */
const TURN_DISTANCE = 300;

export function DocumentSheets() {
  const [page, setPage] = useState(1);
  /** 끝에서 더 넘기려 했을 때 종이가 튕기는 방향. 0이면 가만히 */
  const [bump, setBump] = useState<-1 | 0 | 1>(0);
  const wheel = useRef(0);
  const bumpTimer = useRef(0);
  const last = RESUME.pages;
  const prev = page > 1 ? page - 1 : null;
  const next = page < last ? page + 1 : null;

  /**
   * n쪽으로 간다. 범위를 벗어나면 넘어가지 않고 그 방향으로 살짝 튕긴다.
   * 순환시키지 않는 대신 "여기가 끝"을 몸으로 알린다.
   */
  const go = (n: number) => {
    if (n < 1 || n > last) {
      setBump(n < 1 ? -1 : 1);
      window.clearTimeout(bumpTimer.current);
      bumpTimer.current = window.setTimeout(() => setBump(0), 220);
      return;
    }
    getSound().play('pageflip');
    setPage(n);
  };

  useEffect(() => () => window.clearTimeout(bumpTimer.current), []);

  // 공책처럼 가로 스크롤로도 넘긴다. 트랙패드는 deltaX, 휠 마우스는 shift + deltaY로 들어온다
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    wheel.current += dx;
    if (Math.abs(wheel.current) < TURN_DISTANCE) return;
    const n = page + Math.sign(wheel.current);
    wheel.current = 0;
    go(n);
  };

  // 확대 상태에서만 이 컴포넌트가 떠 있으므로 방향키는 그때만 붙는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      if (!dir) return;
      const n = page + dir;
      if (n < 1 || n > last) {
        setBump(dir);
        window.clearTimeout(bumpTimer.current);
        bumpTimer.current = window.setTimeout(() => setBump(0), 220);
        return;
      }
      getSound().play('pageflip');
      setPage(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, last]);

  return (
    <div className={`sheet${bump ? (bump < 0 ? ' is-bump-left' : ' is-bump-right') : ''}`} onWheel={onWheel}>
      {/* 3D 안에서 확대되는 DOM이라 next/image 축소본 대신 원본을 쓴다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sheet__page" src={RESUME.page(page)} alt={`이력서 ${page}쪽`} draggable={false} />
      {/* 앞뒤 장을 미리 받아 두어 넘길 때 비지 않게 한다 */}
      {[prev, next].map(
        (n) =>
          n && (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} className="sheet__preload" src={RESUME.page(n)} alt="" aria-hidden="true" />
          ),
      )}

      <p className="sheet__file">
        resume.pdf <span className="sheet__count">{page} / {last}</span>
      </p>

      {/* 넘김 단추는 종이 양옆 여백에 둔다. 본문 위에 얹으면 글을 가린다 */}
      <button
        type="button"
        className="sheet__arrow sheet__arrow--prev"
        onClick={() => go(page - 1)}
        aria-disabled={!prev}
        aria-label="이전 쪽"
      >
        ‹
      </button>
      <button
        type="button"
        className="sheet__arrow sheet__arrow--next"
        onClick={() => go(page + 1)}
        aria-disabled={!next}
        aria-label="다음 쪽"
      >
        ›
      </button>
    </div>
  );
}
