'use client';

import { useRef, useState } from 'react';
import { desktopIcons } from '@/lib/desk/xp-apps';
import { useDeskStore } from '@/stores/useDeskStore';
import { getSound } from '@/lib/desk/sound';
import { sceneTime } from '@/lib/desk/runtime';
import { findProject, projectContents } from '@/lib/desk/content/projects';
import { about } from '@/lib/desk/content/about';
import { trashItems, trashNote } from '@/lib/desk/content/trash';
import { XpWindow } from './XpWindow';
import { MobileWindowSheet } from './MobileWindowSheet';
import { ProjectWindow } from './ProjectWindow';
import { XpIcon } from './xp-icons';
import { useWindows, type WindowState } from './window-state';
import { useClock } from './use-clock';
import { useIsMobile } from '@/lib/desk/use-mobile';

/**
 * 모니터 화면. 확대했을 때뿐 아니라 책상 뷰에서도 이 컴포넌트가 그대로 보인다.
 * 캔버스 텍스처로 따로 그리지 않으므로 멀리서 본 모습과 확대한 모습이 항상 같다.
 *
 * 기준 크기는 1024×768이고, 이 안에서는 평범한 웹 UI처럼 만들면 된다.
 * 색·간격은 globals.css의 `--xp-*` 토큰을 쓴다.
 *
 * 바탕화면 아이콘을 누르면 창이 열리고, 열린 창은 작업 표시줄에 쌓인다.
 * 모바일에서는 이 화면이 손톱만 하게 보이므로, 창만 3D 밖으로 꺼내 화면 전체를 덮는 시트로 띄운다.
 * 프로젝트, 소개, 휴지통 창의 글은 lib/desk/content/에서 온다. 이력서 아이콘은 창 없이 PDF를 내려받는다.
 */
export function MonitorScreen() {
  const { time: clock } = useClock();
  const screen = useRef<HTMLDivElement>(null);
  const { wins, activeId, open, focus, close, minimize, toggleMax, toggleFromTaskbar, move, setPage } = useWindows();
  const [startOpen, setStartOpen] = useState(false);
  const powerOff = useDeskStore((s) => s.powerOff);
  const mobile = useIsMobile();
  /** 모바일 시트에 띄울 창. 맨 앞의 창 하나만 보여 준다 */
  const sheetWin = mobile ? (wins.find((w) => w.id === activeId && !w.minimized) ?? null) : null;

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
            {/* 3D 화면 너머로 누르는 것이라 실제 XP와 달리 한 번 누르면 열린다. 이력서는 창 대신 파일을 내려받는다 */}
            {icon.download ? (
              <a className="xp-icon" href={icon.download.href} download={icon.download.filename}>
                <XpIcon name={icon.icon} />
                <span className="xp-icon__label">{icon.label}</span>
              </a>
            ) : (
              <button type="button" className="xp-icon" onClick={() => open(icon.id)}>
                <XpIcon name={icon.icon} />
                <span className="xp-icon__label">{icon.label}</span>
              </button>
            )}
          </li>
        ))}
      </ul>

      {sheetWin && (
        <MobileWindowSheet win={sheetWin} onClose={() => close(sheetWin.id)}>
          <WindowBody win={sheetWin} active onOpen={open} onPage={(p) => setPage(sheetWin.id, p)} />
        </MobileWindowSheet>
      )}

      {!mobile &&
        wins
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
                  {icon.download ? (
                    <a
                      className="xp-menu__item"
                      href={icon.download.href}
                      download={icon.download.filename}
                      onClick={() => setStartOpen(false)}
                    >
                      <XpIcon name={icon.icon} />
                      <span>{icon.title} 내려받기</span>
                    </a>
                  ) : (
                    <button type="button" className="xp-menu__item" onClick={() => openFromStart(icon.id)}>
                      <XpIcon name={icon.icon} />
                      <span>{icon.title}</span>
                    </button>
                  )}
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
  const mobile = useIsMobile();

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

  if (win.kind === 'trash') {
    // 실제 휴지통의 자세히 보기. 프로젝트, 이름, 이유 세 칸의 표다.
    // 같은 프로젝트가 이어지면 프로젝트 칸을 세로로 합쳐 한 번만 적는다.
    // 좁은 화면에서는 세 칸짜리 표가 한 글자씩 끊겨 읽히지 않는다. 그때는 항목마다 카드 한 장으로 세운다
    return (
      <div className="xp-trash">
        <p className="xp-trash__note">{trashNote}</p>
        {mobile ? (
          <ul className="xp-trash__cards">
            {trashItems.map((item) => {
              const from = findProject(item.project);
              return (
                <li key={item.title} className="xp-trash__card">
                  <p className="xp-trash__name">{item.title}</p>
                  <p className="xp-trash__reason">{item.reason}</p>
                  {/* 어느 프로젝트에서 나온 결정인지. 누르면 그 프로젝트 창으로 간다 */}
                  {from && (
                    <button type="button" className="xp-trash__from" onClick={() => onOpen(from.id)}>
                      {from.name} ›
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <table className="xp-table">
            <thead>
              <tr>
                <th scope="col">프로젝트</th>
                <th scope="col">이름</th>
                <th scope="col">이유</th>
              </tr>
            </thead>
            <tbody>
              {trashItems.map((item, i) => {
                const first = i === 0 || trashItems[i - 1].project !== item.project;
                let span = 0;
                if (first) {
                  while (i + span < trashItems.length && trashItems[i + span].project === item.project) span += 1;
                }
                const from = findProject(item.project);
                return (
                  <tr key={item.title}>
                    {first && (
                      <td className="xp-table__project" rowSpan={span}>
                        {/* 누르면 그 프로젝트 창이 열린다 */}
                        {from && (
                          <button type="button" className="xp-table__link" onClick={() => onOpen(from.id)}>
                            {from.name}
                          </button>
                        )}
                      </td>
                    )}
                    <td className="xp-table__name">{item.title}</td>
                    <td className="xp-table__reason">{item.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
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
