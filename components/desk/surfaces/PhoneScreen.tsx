'use client';

import type { ReactNode } from 'react';
import { useClock } from './use-clock';
import { links } from '@/lib/desk/links';
import { projectContents } from '@/lib/desk/content/projects';

/**
 * 핸드폰 화면. 책상 뷰와 확대 뷰가 같은 DOM을 본다.
 * 기준 크기는 390×780. 색·간격은 globals.css의 `--phone-*` 토큰을 쓴다.
 *
 * 연회색 단색의 뉴모피즘 홈 화면. 책상(흰 우드·베이지·회색)과 같은 톤이라 폰이 책상의 일부로 읽힌다.
 * 상태바, 어두운 소개 카드, 프로젝트 앱 타일 셋, 맨 아래 검은 원 아이콘 넷.
 * 시계는 상태바에만 있다. 화면 가운데 큰 시계를 두면 잠금화면처럼 읽힌다.
 * 독의 네 항목은 바깥 링크다. 순서는 코드(GitHub) → 글(velog) → 연락(LinkedIn, 메일).
 * 카드가 설명하는 것은 사이트가 아니라 사람이라, 칩에는 이 사이트 스택(Three.js)이 아닌 주력 스택을 적는다.
 */

/** 독 아이콘. 검은 원 안에 흰 로고. 로고 경로는 24×24 기준이고 가운데에 0.55배로 들어간다 */
function DockIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="var(--phone-ink)" />
      <g fill="var(--phone-bg)" transform="translate(24 24) scale(1.1) translate(-12 -12)">
        {children}
      </g>
    </svg>
  );
}

export function PhoneScreen() {
  const { time } = useClock();
  return (
    <div className="home">
      <div className="home__status">
        <span className="home__signal" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>{time}</span>
        <span className="home__battery" aria-hidden="true">
          <i />
        </span>
      </div>

      <section className="card" aria-label="소개">
        <p className="card__eyebrow">seoleem</p>
        <p className="card__title">Frontend Developer</p>
        <p className="card__body">반복되는 문제를 구조로 해결합니다. 웹과 앱을 직접 출시합니다.</p>
        <div className="card__meta">
          <span>React</span>
          <span>TypeScript</span>
          <span>Next.js</span>
        </div>
      </section>

      {/* 앱. 프로젝트마다 실제 앱 아이콘 타일 하나. 누르면 모니터의 프로젝트 창으로 넘긴다 (연결은 다음 단계) */}
      <ul className="apps" aria-label="프로젝트">
        {projectContents.map((p) => (
          <li key={p.id}>
            <button type="button" className="app" aria-label={`${p.name} 프로젝트 보기`}>
              <span className="app__tile">
                {/* 3D 안에서 확대되는 DOM이라 next/image 축소본 대신 원본을 쓴다 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/icons/${p.id}.png`} alt="" draggable={false} />
              </span>
              <span className="app__name">{p.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="home__dots" aria-hidden="true">
        <i className="is-on" />
        <i />
        <i />
      </div>

      <nav className="dock" aria-label="바깥 링크">
        <a className="dock__item" href={links.github} target="_blank" rel="noreferrer" aria-label="GitHub">
          <DockIcon>
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.05.78 2.12v3.14c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
          </DockIcon>
        </a>
        <a className="dock__item" href={links.velog} target="_blank" rel="noreferrer" aria-label="velog">
          <DockIcon>
            <path d="M4.6 7.4 9.6 6.2c1.1-.3 1.7.1 1.9 1l2.1 9.6c2-2.5 3.2-4.6 3.6-6.2.3-1.1 0-1.7-1-2.3.7-.9 1.6-1.4 2.5-1.4 1 0 1.7.7 1.7 1.8 0 2.4-2.1 5.9-6.1 11.2L11 19.6 8.7 8.5H4.6Z" />
          </DockIcon>
        </a>
        <a className="dock__item" href={links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
          <DockIcon>
            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
          </DockIcon>
        </a>
        <a className="dock__item" href={links.email} aria-label="이메일 보내기">
          <DockIcon>
            {/* 봉투. 겉선과 뚜껑 접힌 선 */}
            <path d="M3 5.5h18c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H3c-.8 0-1.5-.7-1.5-1.5V7c0-.8.7-1.5 1.5-1.5Zm.6 2 7.7 5.9c.4.3 1 .3 1.4 0l7.7-5.9V7.3L12 13.1 3.6 7.3v.2Z" />
          </DockIcon>
        </a>
      </nav>
    </div>
  );
}
