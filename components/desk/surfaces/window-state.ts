'use client';

import { useState } from 'react';
import { findApp, type AppKind } from '@/lib/desk/xp-apps';

/** 모니터 화면 기준 크기. 창 좌표는 전부 이 안의 값이다 */
export const SCREEN_W = 1024;
export const SCREEN_H = 768;
export const TASKBAR_H = 40;

/** 창을 옮겨도 제목 표시줄은 이만큼 화면 안에 남는다. 완전히 밖으로 내보내면 되찾을 수 없다 */
const KEEP_VISIBLE = 120;
/** 새 창이 겹치지 않게 조금씩 밀어 놓는 간격 */
const CASCADE = 28;

export interface WindowState {
  id: string;
  title: string;
  kind: AppKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 겹침 순서. 클수록 앞이다 */
  z: number;
  minimized: boolean;
  maximized: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** 맨 앞으로 보낼 때 줄 겹침 순서 */
function nextZ(list: WindowState[]) {
  return list.reduce((max, w) => Math.max(max, w.z), 1) + 1;
}

/** 남은 창 중 맨 앞에 있는 것 */
function topmost(list: WindowState[]) {
  const alive = list.filter((w) => !w.minimized);
  if (alive.length === 0) return null;
  return alive.reduce((a, b) => (a.z > b.z ? a : b)).id;
}

/**
 * 모니터 화면의 창 관리. 열기·닫기·앞으로 가져오기·내리기를 모두 여기서 한다.
 *
 * 창 목록과 지금 활성인 창만 들고 있으면 작업 표시줄은 그걸 그대로 비추면 된다.
 * 겹침 순서는 z를 계속 키우는 방식이라, 앞으로 가져오는 것과 새로 여는 것이 같은 동작이 된다.
 */
export function useWindows() {
  const [wins, setWins] = useState<WindowState[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  /** 이미 열려 있으면 앞으로 가져오고, 없으면 새로 만든다 */
  const open = (id: string) => {
    const def = findApp(id);
    if (!def) return;
    setWins((ws) => {
      const z = nextZ(ws);
      if (ws.some((w) => w.id === id)) {
        return ws.map((w) => (w.id === id ? { ...w, z, minimized: false } : w));
      }
      const [w, h] = def.size;
      const step = ws.length % 5;
      return [
        ...ws,
        {
          id,
          title: def.title,
          kind: def.kind,
          x: 96 + step * CASCADE,
          y: 56 + step * CASCADE,
          w,
          h,
          z,
          minimized: false,
          maximized: false,
        },
      ];
    });
    setActiveId(id);
  };

  const focus = (id: string) => {
    if (activeId === id && !wins.find((w) => w.id === id)?.minimized) return;
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: nextZ(ws), minimized: false } : w)));
    setActiveId(id);
  };

  const close = (id: string) => {
    const rest = wins.filter((w) => w.id !== id);
    setWins(rest);
    if (activeId === id) setActiveId(topmost(rest));
  };

  const minimize = (id: string) => {
    const rest = wins.map((w) => (w.id === id ? { ...w, minimized: true } : w));
    setWins(rest);
    if (activeId === id) setActiveId(topmost(rest));
  };

  const toggleMax = (id: string) => {
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));
  };

  /** 작업 표시줄 버튼. 활성인 창을 다시 누르면 내려간다 */
  const toggleFromTaskbar = (id: string) => {
    const win = wins.find((w) => w.id === id);
    if (!win) return;
    if (!win.minimized && activeId === id) minimize(id);
    else focus(id);
  };

  const move = (id: string, x: number, y: number) => {
    setWins((ws) =>
      ws.map((w) =>
        w.id === id
          ? {
              ...w,
              x: clamp(x, -(w.w - KEEP_VISIBLE), SCREEN_W - KEEP_VISIBLE),
              y: clamp(y, 0, SCREEN_H - TASKBAR_H - 28),
            }
          : w,
      ),
    );
  };

  return { wins, activeId, open, focus, close, minimize, toggleMax, toggleFromTaskbar, move };
}
