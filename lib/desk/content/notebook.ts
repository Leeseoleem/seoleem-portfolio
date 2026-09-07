/**
 * 공책 내용. 디자인 작업(컴포넌트, 화면 시안)을 케이스 스터디처럼 장 단위로 보여 준다.
 * 모니터가 개발 판단을 맡고, 공책은 시각 설계만 맡는다. 한 장에 한 주제, 글은 장 제목 하나만 둔다.
 *
 * 프레임(이미지)은 줄 단위로 놓이고, 한 줄의 프레임들은 같은 높이로 맞춰져 줄 폭을 꼭 채운다.
 * 프레임을 누르면 전체 화면으로 크게 본다. 장에는 줄인 이미지, 전체 화면에는 큰 이미지를 쓴다.
 * 이미지는 public/notebook/{프로젝트}/ 아래에 있고 큰 것은 그 안의 full/ 에 같은 이름으로 있다. w, h는 원본 비율을 알기 위한 값이다.
 */

import type { ProjectId } from '@/lib/desk/content/types';

export interface NotebookFrame {
  /** 장에 놓이는 줄인 이미지 */
  src: string;
  /** 프레임 아래 붙는 이름 */
  label: string;
  /** 원본 크기. 비율 계산에만 쓴다 */
  w: number;
  h: number;
}

/** 전체 화면용 큰 이미지. 줄인 이미지와 같은 이름으로 full/ 폴더에 둔다 */
export function fullSrc(frame: NotebookFrame): string {
  const i = frame.src.lastIndexOf('/');
  return `${frame.src.slice(0, i)}/full${frame.src.slice(i)}`;
}

export interface NotebookRow {
  frames: NotebookFrame[];
  /**
   * 줄 높이(px)를 직접 정한다. 없으면 줄 폭을 꼭 채우는 높이로 맞춘다.
   * 세로로 아주 긴 화면 한 장을 놓을 때 폭 대신 높이를 기준으로 삼기 위한 값이다.
   */
  height?: number;
}

export interface CoverPage {
  kind: 'cover';
  /** 잉크 펜 필기체로 쓰는 제목 */
  title: string;
  caption: string;
}

export interface BoardPage {
  kind: 'board';
  /** 프로젝트 id. 인덱스 탭과 목차의 아이콘(/icons/{id}.png)을 찾는 데 쓴다 */
  projectId: ProjectId;
  project: string;
  /** 이 장이 무엇을 보여 주는지. 컴포넌트, 화면 시안 등 */
  title: string;
  /** 비어 있으면 자료를 준비 중인 장이다. 판에 안내 문장만 나온다 */
  rows: NotebookRow[];
}

export type NotebookPage = CoverPage | BoardPage;

/** 목차와 인덱스 탭 한 줄. 프로젝트가 시작하는 장의 번호(0부터)를 든다 */
export interface NotebookIndexEntry {
  projectId: ProjectId;
  project: string;
  /** 그 프로젝트의 첫 장. 0부터 센다 */
  page: number;
}

/** 프로젝트마다 첫 장을 찾는다. 표지의 목차와 옆의 인덱스 탭이 같은 목록을 쓴다 */
export function notebookIndex(pages: NotebookPage[]): NotebookIndexEntry[] {
  const out: NotebookIndexEntry[] = [];
  pages.forEach((p, i) => {
    if (p.kind === 'board' && !out.some((e) => e.projectId === p.projectId)) out.push({ projectId: p.projectId, project: p.project, page: i });
  });
  return out;
}

const dir = '/notebook/garachato';
/** 폰 화면 프레임. 전부 같은 크기로 내보냈다 */
const phone = (name: string, label: string): NotebookFrame => ({ src: `${dir}/${name}.webp`, label, w: 1500, h: 3600 });

const fitplDir = '/notebook/fitpl';
/** 핏플 2.x 보드. 앱 코드(globals.css의 토큰, 화면 컴포넌트)를 바탕으로 정리한 판이다 */
const fitplBoard = (name: string, label: string, w: number, h: number): NotebookFrame => ({ src: `${fitplDir}/${name}.webp`, label, w, h });

const uridoDir = '/notebook/urido';
/** 우리두 보드. Figma 탭 하나를 통째로 내보낸 이미지다. 이름 앞의 c는 컴포넌트, s는 화면 시안 */
const uridoBoard = (name: string, label: string, w: number, h: number): NotebookFrame => ({ src: `${uridoDir}/${name}.webp`, label, w, h });

export const notebookPages: NotebookPage[] = [
  {
    kind: 'cover',
    title: 'Design Notes',
    caption: '프로젝트별로 Figma에서 직접 디자인한 화면 시안에 대한 기록',
  },
  {
    kind: 'board',
    projectId: 'garachato',
    project: '가라챠토',
    title: '컴포넌트',
    // 보드 둘을 한 장에 세로로 놓는다. 폭을 다 쓰면 판을 넘쳐서 높이를 정해 준다
    rows: [
      { frames: [{ src: `${dir}/kit-detail.webp`, label: '곡 상세 컴포넌트', w: 6876, h: 4240 }], height: 340 },
      { frames: [{ src: `${dir}/kit-chat.webp`, label: '챗봇 컴포넌트', w: 5108, h: 2612 }], height: 280 },
    ],
  },
  {
    kind: 'board',
    projectId: 'garachato',
    project: '가라챠토',
    title: '컴포넌트',
    rows: [{ frames: [{ src: `${dir}/kit-settings.webp`, label: '설정과 시트 컴포넌트', w: 3824, h: 3408 }] }],
  },
  {
    kind: 'board',
    projectId: 'garachato',
    project: '가라챠토',
    title: '화면 시안',
    rows: [{ frames: [phone('list-tj', 'TOP100 번역'), phone('list-tabs', 'TOP100 원문'), phone('list-scrolled', '목록 스크롤')] }],
  },
  {
    kind: 'board',
    projectId: 'garachato',
    project: '가라챠토',
    title: '화면 시안',
    rows: [{ frames: [phone('search-suggest', '검색 추천어'), phone('search-results', '검색 결과'), phone('settings-sheet', '설정 시트')] }],
  },
  {
    kind: 'board',
    projectId: 'garachato',
    project: '가라챠토',
    title: '화면 시안',
    rows: [
      {
        frames: [phone('chat-sheet', '챗봇 시트'), phone('chat-full', '챗봇'), { src: `${dir}/detail.webp`, label: '곡 상세', w: 1500, h: 5356 }],
      },
    ],
  },
  // 핏플 2.x. Figma 시안 없이 코드에서 만든 버전이라, 완성된 앱의 토큰과 화면을 보드로 정리했다(decision-backlog B07).
  // 토큰을 먼저, 화면은 앱 흐름(가입 → 홈 → 일정 만들기 → 일정 상세) 순서로 둔다
  {
    kind: 'board',
    projectId: 'fitpl',
    project: '핏플',
    title: '디자인 토큰 (2.x)',
    rows: [{ frames: [fitplBoard('tokens', 'color, typography, spacing', 4800, 2800)] }],
  },
  {
    kind: 'board',
    projectId: 'fitpl',
    project: '핏플',
    title: '화면 (2.x)',
    rows: [{ frames: [fitplBoard('auth', 'auth', 5344, 3876)] }],
  },
  {
    kind: 'board',
    projectId: 'fitpl',
    project: '핏플',
    title: '화면 (2.x)',
    rows: [{ frames: [fitplBoard('home', 'home', 1104, 2058)], height: 640 }],
  },
  {
    kind: 'board',
    projectId: 'fitpl',
    project: '핏플',
    title: '화면 (2.x)',
    // 두 보드가 같은 높이(2058)라 폭을 다 쓰면 각 282px, 둘을 세로로 놓아도 판 안에 든다
    rows: [{ frames: [fitplBoard('plan', 'plan', 4496, 2058)] }, { frames: [fitplBoard('route', 'route', 4496, 2058)] }],
  },
  // 우리두. Figma 탭 순서(common, auth, home, challenge, uri, calendar, my)대로 컴포넌트 보드를 먼저, 화면 시안 보드를 뒤에 둔다.
  // 보드는 탭 하나를 통째로 내보낸 것이라 크기가 제멋대로다. 세로로 긴 보드는 높이를 정해 판 안에 넣는다
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '컴포넌트',
    rows: [{ frames: [uridoBoard('c-common', 'common 컴포넌트', 12524, 23488), uridoBoard('c-auth', 'auth 컴포넌트', 3468, 3604)] }],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '컴포넌트',
    rows: [{ frames: [uridoBoard('c-home', 'home 컴포넌트', 16284, 8512)] }, { frames: [uridoBoard('c-challenge', 'challenge 컴포넌트', 27508, 11112)] }],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '컴포넌트',
    rows: [
      { frames: [uridoBoard('c-uri', 'uri 컴포넌트', 15432, 7700)], height: 270 },
      { frames: [uridoBoard('c-calendar', 'calendar 컴포넌트', 7000, 4628)], height: 330 },
    ],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '컴포넌트',
    rows: [{ frames: [uridoBoard('c-my', 'my 컴포넌트', 11888, 7656)] }],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '화면 시안',
    rows: [{ frames: [uridoBoard('s-onboarding', 'onboarding', 10960, 7952)] }],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '화면 시안',
    rows: [{ frames: [uridoBoard('s-home', 'home', 7520, 11728)], height: 640 }],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '화면 시안',
    rows: [{ frames: [uridoBoard('s-challenge', 'challenge', 16120, 23056)], height: 640 }],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '화면 시안',
    rows: [{ frames: [uridoBoard('s-uri', 'uri', 14280, 23704)], height: 640 }],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '화면 시안',
    rows: [{ frames: [uridoBoard('s-calendar', 'calendar', 5800, 5372)] }],
  },
  {
    kind: 'board',
    projectId: 'urido',
    project: '우리두',
    title: '화면 시안',
    rows: [{ frames: [uridoBoard('s-my', 'my', 7520, 12496)], height: 640 }],
  },
];
