'use client';

import { useEffect, useState } from 'react';

/**
 * 모니터 화면. 확대했을 때뿐 아니라 책상 뷰에서도 이 컴포넌트가 그대로 보인다.
 * 캔버스 텍스처로 따로 그리지 않으므로 멀리서 본 모습과 확대한 모습이 항상 같다.
 *
 * 기준 크기는 1024×768이고, 이 안에서는 평범한 웹 UI처럼 만들면 된다.
 * 색·간격은 globals.css의 `--xp-*` 토큰을 쓴다.
 * 지금 있는 바탕화면은 골격일 뿐이라, 실제 XP 창 UI와 프로젝트 목록이 여기 들어간다.
 */
const ICONS = [
  { label: '프로젝트', tone: 'a' },
  { label: '소개', tone: 'b' },
  { label: '이력서', tone: 'c' },
  { label: '휴지통', tone: 'd' },
] as const;

function useClock() {
  const [clock, setClock] = useState('--:--');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  return clock;
}

export function MonitorScreen() {
  const clock = useClock();

  return (
    <div className="xp">
      <svg className="xp__hills" viewBox="0 0 1024 768" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 560 C250 420 520 640 780 500 C900 440 980 470 1024 520 L1024 768 L0 768 Z" fill="var(--xp-hill-far)" />
        <path d="M0 640 C300 560 600 700 1024 600 L1024 768 L0 768 Z" fill="var(--xp-hill-near)" />
      </svg>

      <ul className="xp__icons">
        {ICONS.map((icon) => (
          <li key={icon.label} className="xp-icon">
            <span className={`xp-icon__tile xp-icon__tile--${icon.tone}`} />
            <span className="xp-icon__label">{icon.label}</span>
          </li>
        ))}
      </ul>

      <div className="xp__taskbar">
        <span className="xp-start">
          <span className="xp-start__flag" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          start
        </span>
        <span className="xp__tray">{clock}</span>
      </div>
    </div>
  );
}
