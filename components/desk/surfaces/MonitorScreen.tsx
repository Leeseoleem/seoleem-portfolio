'use client';

import { useRef } from 'react';
import { desktopIcons, projects, type AppKind } from '@/lib/desk/xp-apps';
import { XpWindow } from './XpWindow';
import { useWindows } from './window-state';
import { useClock } from './use-clock';

/**
 * 모니터 화면. 확대했을 때뿐 아니라 책상 뷰에서도 이 컴포넌트가 그대로 보인다.
 * 캔버스 텍스처로 따로 그리지 않으므로 멀리서 본 모습과 확대한 모습이 항상 같다.
 *
 * 기준 크기는 1024×768이고, 이 안에서는 평범한 웹 UI처럼 만들면 된다.
 * 색·간격은 globals.css의 `--xp-*` 토큰을 쓴다.
 *
 * 바탕화면 아이콘을 누르면 창이 열리고, 열린 창은 작업 표시줄에 쌓인다.
 * 창 안의 글은 아직 골격이라, 실제 내용은 lib/desk/xp-apps.ts에 채우면 된다.
 */
export function MonitorScreen() {
  const { time: clock } = useClock();
  const screen = useRef<HTMLDivElement>(null);
  const { wins, activeId, open, focus, close, minimize, toggleMax, toggleFromTaskbar, move } = useWindows();

  return (
    <div className="xp" ref={screen}>
      <svg className="xp__hills" viewBox="0 0 1024 768" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 560 C250 420 520 640 780 500 C900 440 980 470 1024 520 L1024 768 L0 768 Z" fill="var(--xp-hill-far)" />
        <path d="M0 640 C300 560 600 700 1024 600 L1024 768 L0 768 Z" fill="var(--xp-hill-near)" />
      </svg>

      <ul className="xp__icons">
        {desktopIcons.map((icon) => (
          <li key={icon.id}>
            {/* 3D 화면 너머로 누르는 것이라 실제 XP와 달리 한 번 누르면 열린다 */}
            <button type="button" className="xp-icon" onClick={() => open(icon.id)}>
              <span className={`xp-icon__tile xp-icon__tile--${icon.tone}`} />
              <span className="xp-icon__label">{icon.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {wins
        .filter((w) => !w.minimized)
        .map((win) => (
          <XpWindow
            key={win.id}
            win={win}
            active={activeId === win.id}
            screen={screen}
            onFocus={() => focus(win.id)}
            onMove={(x, y) => move(win.id, x, y)}
            onMinimize={() => minimize(win.id)}
            onToggleMax={() => toggleMax(win.id)}
            onClose={() => close(win.id)}
          >
            <WindowBody kind={win.kind} onOpen={open} />
          </XpWindow>
        ))}

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

        {/* 열려 있는 창 목록. 내려둔 창도 여기 남아 있어야 다시 꺼낼 수 있다 */}
        <ul className="xp-tasks">
          {wins.map((win) => (
            <li key={win.id}>
              <button
                type="button"
                className={`xp-task${activeId === win.id && !win.minimized ? ' is-active' : ''}`}
                onClick={() => toggleFromTaskbar(win.id)}
              >
                {win.title}
              </button>
            </li>
          ))}
        </ul>

        <span className="xp__tray">{clock}</span>
      </div>
    </div>
  );
}

/** 창 안쪽. 실제 글이 들어오기 전까지는 자리만 잡아 둔 골격이다 */
function WindowBody({ kind, onOpen }: { kind: AppKind; onOpen: (id: string) => void }) {
  if (kind === 'folder') {
    return (
      <ul className="xp-list">
        {projects.map((p) => (
          <li key={p.id}>
            <button type="button" className="xp-list__row" onClick={() => onOpen(p.id)}>
              <span className="xp-list__icon" />
              <span>{p.title}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  if (kind === 'empty') {
    return <p className="xp-empty">비어 있음</p>;
  }

  return (
    <div className="xp-doc">
      {kind === 'project' && <span className="xp-doc__shot" />}
      <span className="xp-doc__line xp-doc__line--title" />
      <span className="xp-doc__line" />
      <span className="xp-doc__line" />
      <span className="xp-doc__line xp-doc__line--short" />
    </div>
  );
}
