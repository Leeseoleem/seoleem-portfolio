'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CasePage, DiagramPage, IntroPage, OverviewPage, ProjectContent, ProjectPage } from '@/lib/desk/content/types';

interface Props {
  project: ProjectContent;
  page: number;
  /** 지금 앞에 나와 있는 창일 때만 방향키를 받는다 */
  active: boolean;
  onPage: (page: number) => void;
}

/**
 * 프로젝트 창의 속. 장 하나를 보여주고 아래 상태 표시줄에서 앞뒤로 넘긴다.
 *
 * XP 대화상자 문법을 따른다. 회색 바탕 위에 그룹 상자(테두리 + 파란 제목)로
 * 내용을 나누고, 아래는 상태 표시줄처럼 칸을 나눈다.
 * 장은 스크롤 없이 한 화면에 들어가야 한다. 첫 장만 보고도 프로젝트를 알 수 있고,
 * 더 궁금한 사람만 다음 장으로 들어가는 구조다.
 * 방향키는 활성 창에서만 듣는다. 창이 여러 개 열려 있을 때 전부 같이 넘어가면 안 된다.
 */
export function ProjectWindow({ project, page, active, onPage }: Props) {
  const pages = project.pages;
  const last = pages.length - 1;
  const index = Math.min(Math.max(page, 0), last);
  const current = pages[index];
  const prev = index > 0 ? pages[index - 1] : null;
  const next = index < last ? pages[index + 1] : null;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && index > 0) onPage(index - 1);
      else if (e.key === 'ArrowRight' && index < last) onPage(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, index, last, onPage]);

  return (
    <div className="pj">
      <div className="pj__page">
        <PageBody page={current} project={project} />
      </div>
      <nav className="pj__status" aria-label="장 넘김">
        <span className="pj__cell pj__cell--prev">
          {prev && (
            <button type="button" className="xp-btn" onClick={() => onPage(index - 1)}>
              ‹ {prev.title}
            </button>
          )}
        </span>
        <span className="pj__cell pj__cell--count">
          {index + 1} / {pages.length}
        </span>
        <span className="pj__cell pj__cell--next">
          {next && (
            <button type="button" className="xp-btn" onClick={() => onPage(index + 1)}>
              {next.title} ›
            </button>
          )}
        </span>
      </nav>
    </div>
  );
}

function PageBody({ page, project }: { page: ProjectPage; project: ProjectContent }) {
  switch (page.kind) {
    case 'intro':
      return <Intro page={page} project={project} />;
    case 'overview':
      return <Overview page={page} />;
    case 'diagram':
      return <Diagram page={page} project={project} />;
    case 'case':
      return <Case page={page} />;
  }
}

/** 소개 장. 왼쪽에 이름과 설명, 기술, 링크. 오른쪽에 대표 화면 두 장 */
function Intro({ page, project }: { page: IntroPage; project: ProjectContent }) {
  return (
    <div className="pj-intro">
      <div className="pj-intro__text">
        <header className="pj-intro__head">
          <h2 className="pj-intro__name">{project.name}</h2>
          <p className="pj-intro__tagline">{project.tagline}</p>
        </header>

        <p className="pj-intro__summary">{page.summary}</p>

        {page.stack.length > 0 && (
          <fieldset className="xp-group">
            <legend>사용 기술</legend>
            <ul className="pj-stack">
              {page.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </fieldset>
        )}

        {page.links.length > 0 && (
          <p className="pj-links">
            {page.links.map((l) => (
              <a key={l.href} className="xp-btn" href={l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
          </p>
        )}
      </div>

      <div className="pj-shots">
        {page.shots.map((shot) => (
          <figure key={shot.label} className="pj-shot">
            {shot.src ? (
              // 3D 안에서 확대되는 DOM이라 next/image의 크기별 축소본이 오히려 흐려진다. 원본을 그대로 쓴다
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shot.src} alt={shot.label} />
            ) : (
              <span className="pj-shot__empty" aria-hidden="true" />
            )}
            <figcaption>{shot.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** 개요 장. 속성 대화상자처럼 항목과 값을 표로 */
function Overview({ page }: { page: OverviewPage }) {
  return (
    <div className="pj-overview">
      <fieldset className="xp-group">
        <legend>프로젝트 정보</legend>
        <dl className="pj-meta">
          {page.meta.map((row) => (
            <div key={row.label} className="pj-meta__row">
              <dt>{row.label}</dt>
              <dd>
                {Array.isArray(row.value) ? row.value.map((v) => <span key={v}>{v}</span>) : <span>{row.value}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </fieldset>

      {page.note && (
        <fieldset className="xp-group">
          <legend>운영 기록</legend>
          <p className="pj-overview__note">{page.note}</p>
        </fieldset>
      )}
    </div>
  );
}

/**
 * 구조도 장. 검은 터미널 한 장이 장 전체를 채운다.
 * HUD의 파워셸 창과 같은 프롬프트로 architecture.md를 읽고, 그 아래는 마크다운 코드 펜스가 렌더된 모양이다.
 * 제목 글은 두지 않는다. 장 이름이 이미 아래 넘김 막대에 있다.
 * 커서는 두지 않는다. 깜빡이면 무언가 입력할 수 있는 것처럼 보인다.
 */
function Diagram({ page, project }: { page: DiagramPage; project: ProjectContent }) {
  return (
    <div className="pj-code">
      <p className="pj-code__line">
        <span className="pj-code__prompt">{`PS D:\\seoleem\\${project.slug}>`}</span> type architecture.md
      </p>
      <div className="pj-code__fence">
        <FitPre text={page.ascii} />
      </div>
    </div>
  );
}

/** 짧은 그림이 터무니없이 커지지 않게 위로는 여기까지만 키운다 */
const FIT_MAX = 1.35;

/**
 * 고정폭 그림을 남은 칸에 꽉 차게 키운다.
 * 12줄짜리와 23줄짜리를 같은 글자 크기로 두면 짧은 쪽이 허전하다.
 * 칸과 그림의 실제 크기를 재서 들어가는 만큼 확대하고, 칸이 바뀌면 다시 잰다.
 */
function FitPre({ text }: { text: string }) {
  const box = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = box.current;
    const inner = pre.current;
    if (!el || !inner) return;
    const fit = () => {
      // offset 크기는 transform의 영향을 받지 않아 원래 크기를 그대로 준다
      const w = inner.offsetWidth;
      const h = inner.offsetHeight;
      if (!w || !h) return;
      setScale(Math.min(FIT_MAX, el.clientWidth / w, el.clientHeight / h));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={box} className="pj-code__fit">
      <pre ref={pre} style={{ transform: `scale(${scale})` }}>
        {text}
      </pre>
    </div>
  );
}

/** Engineering Case 장. 문제 → 결정 → 판단 근거 → 결과를 그룹 상자 넷으로 */
function Case({ page }: { page: CasePage }) {
  const parts: Array<[string, string]> = [
    ['문제', page.problem],
    ['결정', page.decision],
    ['판단 근거', page.reasoning],
    ['결과', page.result],
  ];
  return (
    <article className="pj-case">
      <header className="pj-case__head">
        <p className="pj-case__kicker">Engineering Case</p>
        <h2 className="pj-case__heading">{page.heading}</h2>
      </header>
      <div className="pj-case__grid">
        {parts.map(([label, text]) => (
          <fieldset key={label} className="xp-group">
            <legend>{label}</legend>
            <p>{text}</p>
          </fieldset>
        ))}
      </div>
    </article>
  );
}
