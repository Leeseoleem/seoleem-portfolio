'use client';

import { create } from 'zustand';
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
  /** 장을 넘기는 창(프로젝트)의 현재 장. 창을 내렸다 올려도 읽던 자리가 남는다 */
  page: number;
}

interface WindowStore {
  wins: WindowState[];
  activeId: string | null;
  open: (id: string) => void;
  focus: (id: string) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  toggleMax: (id: string) => void;
  toggleFromTaskbar: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  setPage: (id: string, page: number) => void;
  /** 모든 창을 닫는다. 전원을 껐다 다시 켤 때 쓴다 */
  closeAll: () => void;
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
 * 모니터 밖(핸드폰 앱 타일)에서도 창을 열어야 해서 컴포넌트 상태가 아니라 스토어다.
 */
export const useWindowStore = create<WindowStore>((set, get) => ({
  wins: [],
  activeId: null,

  /** 이미 열려 있으면 앞으로 가져오고, 없으면 새로 만든다 */
  open: (id) => {
    const def = findApp(id);
    if (!def) return;
    set((s) => {
      const z = nextZ(s.wins);
      if (s.wins.some((w) => w.id === id)) {
        return { wins: s.wins.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)), activeId: id };
      }
      const [w, h] = def.size;
      const step = s.wins.length % 5;
      return {
        wins: [
          ...s.wins,
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
            page: 0,
          },
        ],
        activeId: id,
      };
    });
  },

  focus: (id) => {
    const { wins, activeId } = get();
    if (activeId === id && !wins.find((w) => w.id === id)?.minimized) return;
    set((s) => ({
      wins: s.wins.map((w) => (w.id === id ? { ...w, z: nextZ(s.wins), minimized: false } : w)),
      activeId: id,
    }));
  },

  close: (id) =>
    set((s) => {
      const rest = s.wins.filter((w) => w.id !== id);
      return { wins: rest, activeId: s.activeId === id ? topmost(rest) : s.activeId };
    }),

  minimize: (id) =>
    set((s) => {
      const rest = s.wins.map((w) => (w.id === id ? { ...w, minimized: true } : w));
      return { wins: rest, activeId: s.activeId === id ? topmost(rest) : s.activeId };
    }),

  toggleMax: (id) => set((s) => ({ wins: s.wins.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) })),

  /** 작업 표시줄 버튼. 활성인 창을 다시 누르면 내려간다 */
  toggleFromTaskbar: (id) => {
    const { wins, activeId, minimize, focus } = get();
    const win = wins.find((w) => w.id === id);
    if (!win) return;
    if (!win.minimized && activeId === id) minimize(id);
    else focus(id);
  },

  move: (id, x, y) =>
    set((s) => ({
      wins: s.wins.map((w) =>
        w.id === id
          ? {
              ...w,
              x: clamp(x, -(w.w - KEEP_VISIBLE), SCREEN_W - KEEP_VISIBLE),
              y: clamp(y, 0, SCREEN_H - TASKBAR_H - 28),
            }
          : w,
      ),
    })),

  setPage: (id, page) => set((s) => ({ wins: s.wins.map((w) => (w.id === id ? { ...w, page } : w)) })),

  closeAll: () => set({ wins: [], activeId: null }),
}));

/** MonitorScreen이 쓰는 이름. 스토어를 그대로 돌려준다 */
export function useWindows() {
  return useWindowStore();
}
