/**
 * 공책 내용. 디자인 작업(UI 설계, 컴포넌트, 화면 시안)을 Figma 페이지처럼 늘어놓는다.
 * 모니터가 개발 판단을 맡고, 공책은 시각 설계만 맡는다. 긴 설명은 쓰지 않고 캡션 한 줄만 둔다.
 *
 * 장마다 Figma 캔버스 하나를 그린다. 프레임(이미지)은 줄 단위로 놓이고, 한 줄의 프레임들은
 * 같은 높이로 맞춰져 줄 폭을 꼭 채운다(Figma에서 프레임을 나란히 정렬한 모습).
 * 이미지는 public/notebook/{프로젝트}/ 아래에 미리 줄여 둔 webp다. w, h는 원본 비율을 알기 위한 값이다.
 */

export interface NotebookFrame {
  src: string;
  /** Figma에서 프레임 위에 붙는 이름 */
  label: string;
  /** 원본 크기. 비율 계산에만 쓴다 */
  w: number;
  h: number;
}

export interface NotebookRow {
  frames: NotebookFrame[];
  /**
   * 줄 높이(px)를 직접 정한다. 없으면 줄 폭을 꼭 채우는 높이로 맞춘다.
   * 세로로 아주 긴 화면(곡 상세 등) 한 장을 놓을 때 폭 대신 높이를 기준으로 삼기 위한 값이다.
   */
  height?: number;
}

export interface CoverPage {
  kind: 'cover';
  title: string;
  caption: string;
  /** 표지에 적는 목차. 프로젝트 이름과 그 프로젝트에 쓴 장 수 */
  contents: Array<{ project: string; summary: string }>;
}

export interface BoardPage {
  kind: 'board';
  project: string;
  /** 이 장이 무엇을 보여 주는지. 컴포넌트, 화면 시안 등 */
  title: string;
  caption: string;
  rows: NotebookRow[];
}

export type NotebookPage = CoverPage | BoardPage;

const dir = '/notebook/garachato';
/** 폰 화면 프레임. 전부 같은 크기로 내보냈다 */
const phone = (name: string, label: string): NotebookFrame => ({ src: `${dir}/${name}.webp`, label, w: 1500, h: 3600 });

export const notebookPages: NotebookPage[] = [
  {
    kind: 'cover',
    title: 'seoleem의 design notes',
    caption: '화면을 만들며 정리한 디자인 기록입니다.',
    contents: [{ project: '가라챠토', summary: '컴포넌트 2장, 화면 시안 3장' }],
  },
  {
    kind: 'board',
    project: '가라챠토',
    title: '컴포넌트',
    caption: '곡 상세와 챗봇에 쓰는 요소를 상태별로 떼어 정리한 보드.',
    rows: [
      { frames: [{ src: `${dir}/kit-detail.webp`, label: '곡 상세 컴포넌트', w: 6876, h: 4240 }] },
      { frames: [{ src: `${dir}/kit-chat.webp`, label: '챗봇 컴포넌트', w: 5108, h: 2612 }] },
    ],
  },
  {
    kind: 'board',
    project: '가라챠토',
    title: '컴포넌트',
    caption: '설정 선택지와 시트. 선택 상태는 테두리와 체크 하나로만 구분한다.',
    rows: [{ frames: [{ src: `${dir}/kit-settings.webp`, label: '설정과 시트 컴포넌트', w: 3824, h: 3408 }] }],
  },
  {
    kind: 'board',
    project: '가라챠토',
    title: '화면 시안',
    caption: 'TOP100 목록. 번역과 원문을 같은 행 구조 안에서 바꾼다.',
    rows: [{ frames: [phone('list-tj', 'TOP100 번역'), phone('list-tabs', 'TOP100 원문'), phone('list-scrolled', '목록 스크롤')] }],
  },
  {
    kind: 'board',
    project: '가라챠토',
    title: '화면 시안',
    caption: '검색과 설정. 입력 상태에 따라 목록이 뒤로 물러난다.',
    rows: [{ frames: [phone('search-suggest', '검색 추천어'), phone('search-results', '검색 결과'), phone('settings-sheet', '설정 시트')] }],
  },
  {
    kind: 'board',
    project: '가라챠토',
    title: '화면 시안',
    caption: '챗봇과 곡 상세. 시트에서 시작해 전체 화면과 상세로 이어진다.',
    rows: [
      {
        frames: [phone('chat-sheet', '챗봇 시트'), phone('chat-full', '챗봇'), { src: `${dir}/detail.webp`, label: '곡 상세', w: 1500, h: 5356 }],
      },
    ],
  },
];
