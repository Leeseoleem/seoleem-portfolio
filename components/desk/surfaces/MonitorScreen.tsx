'use client';

import { useRef, useState } from 'react';
import { desktopIcons } from '@/lib/desk/xp-apps';
import { useDeskStore } from '@/stores/useDeskStore';
import { getSound } from '@/lib/desk/sound';
import { sceneTime } from '@/lib/desk/runtime';
import { findProject, projectContents } from '@/lib/desk/content/projects';
import { about } from '@/lib/desk/content/about';
import { XpWindow } from './XpWindow';
import { ProjectWindow } from './ProjectWindow';
import { XpIcon } from './xp-icons';
import { useWindows, type WindowState } from './window-state';
import { useClock } from './use-clock';

/**
 * 모니터 화면. 확대했을 때뿐 아니라 책상 뷰에서도 이 컴포넌트가 그대로 보인다.
 * 캔버스 텍스처로 따로 그리지 않으므로 멀리서 본 모습과 확대한 모습이 항상 같다.
 *
 * 기준 크기는 1024×768이고, 이 안에서는 평범한 웹 UI처럼 만들면 된다.
 * 색·간격은 globals.css의 `--xp-*` 토큰을 쓴다.
 *
 * 바탕화면 아이콘을 누르면 창이 열리고, 열린 창은 작업 표시줄에 쌓인다.
 * 프로젝트와 소개 창의 글은 lib/desk/content/에서 온다. 이력서·휴지통은 아직 골격이다.
 */
export function MonitorScreen() {
  const { time: clock } = useClock();
  const screen = useRef<HTMLDivElement>(null);
  const { wins, activeId, open, focus, close, minimize, toggleMax, toggleFromTaskbar, move, setPage } = useWindows();
  const [startOpen, setStartOpen] = useState(false);
  const powerOff = useDeskStore((s) => s.powerOff);

  /** 시작 메뉴에서 고른 것을 열고 메뉴를 닫는다 */
  const openFromStart = (id: string) => {
    setStartOpen(false);
    open(id);
  };

  /** 본체의 전원 단추와 같은 종료 절차. 소리도 같다 */
  const shutDown = () => {
    setStartOpen(false);
    getSound().play('click');
    window.setTimeout(() => getSound().play('shutdown'), 250);
    powerOff(sceneTime());
  };

  return (
    <div className="xp" ref={screen}>
      {/* 배경화면. CSS background-image는 3D로 변형된 이 층에서 그려지지 않아 img로 깐다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="xp__wall" src="/xp/bliss.webp" alt="" draggable={false} />

      <ul className="xp__icons">
        {desktopIcons.map((icon) => (
          <li key={icon.id}>
            {/* 3D 화면 너머로 누르는 것이라 실제 XP와 달리 한 번 누르면 열린다 */}
            <button type="button" className="xp-icon" onClick={() => open(icon.id)}>
              <XpIcon name={icon.icon} />
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
            <WindowBody win={win} active={activeId === win.id} onOpen={open} onPage={(p) => setPage(win.id, p)} />
          </XpWindow>
        ))}

      {startOpen && (
        <>
          {/* 메뉴 밖을 누르면 닫힌다. 실제 XP와 같다 */}
          <button type="button" className="xp-menu-backdrop" aria-label="시작 메뉴 닫기" onClick={() => setStartOpen(false)} />
          <nav id="xp-start-menu" className="xp-menu" aria-label="시작 메뉴">
            <header className="xp-menu__head">
              <span className="xp-menu__avatar" aria-hidden="true">
                <XpIcon name="resume" />
              </span>
              <span className="xp-menu__user">seoleem</span>
            </header>
            <ul className="xp-menu__list">
              {desktopIcons.map((icon) => (
                <li key={icon.id}>
                  <button type="button" className="xp-menu__item" onClick={() => openFromStart(icon.id)}>
                    <XpIcon name={icon.icon} />
                    <span>{icon.title}</span>
                  </button>
                </li>
              ))}
            </ul>
            <footer className="xp-menu__foot">
              <button type="button" className="xp-menu__power" onClick={shutDown}>
                <span className="xp-menu__power-icon" aria-hidden="true" />
                컴퓨터 끄기
              </button>
            </footer>
          </nav>
        </>
      )}

      <div className="xp__taskbar">
        <button
          type="button"
          className={`xp-start${startOpen ? ' is-open' : ''}`}
          onClick={() => setStartOpen((v) => !v)}
          aria-expanded={startOpen}
          aria-controls="xp-start-menu"
        >
          <span className="xp-start__flag" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="xp-start__text">start</span>
        </button>

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

/** 창 안쪽. 프로젝트는 장 넘김 창으로, 나머지는 글이 들어오기 전까지 자리만 잡아 둔 골격으로 그린다 */
function WindowBody({
  win,
  active,
  onOpen,
  onPage,
}: {
  win: WindowState;
  active: boolean;
  onOpen: (id: string) => void;
  onPage: (page: number) => void;
}) {
  if (win.kind === 'folder') {
    return (
      <ul className="xp-list">
        {projectContents.map((p) => (
          <li key={p.id}>
            <button type="button" className="xp-list__row" onClick={() => onOpen(p.id)}>
              {/* 실제 앱 아이콘. 3D 안에서 확대되는 DOM이라 next/image 축소본 대신 원본을 쓴다 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="xp-list__icon" src={`/icons/${p.id}.png`} alt="" />
              <span className="xp-list__name">{p.name}</span>
              <span className="xp-list__sub">{p.tagline}</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  if (win.kind === 'project') {
    const project = findProject(win.id);
    if (project) return <ProjectWindow project={project} page={win.page} active={active} onPage={onPage} />;
  }

  if (win.id === 'about') {
    return (
      <article className="xp-about">
        <h2 className="xp-about__heading">{about.heading}</h2>
        {about.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </article>
    );
  }

  if (win.kind === 'empty') {
    return <p className="xp-empty">비어 있음</p>;
  }

  return (
    <div className="xp-doc">
      <span className="xp-doc__line xp-doc__line--title" />
      <span className="xp-doc__line" />
      <span className="xp-doc__line" />
      <span className="xp-doc__line xp-doc__line--short" />
    </div>
  );
}
