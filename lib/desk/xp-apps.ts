import { projectContents } from '@/lib/desk/content/projects';
import { trashItems } from '@/lib/desk/content/trash';

/**
 * 모니터 화면 안에서 창으로 열리는 것들의 목록.
 *
 * 창 자체는 MonitorScreen이 관리하고, 여기에는 무엇을 띄울 수 있는지만 적는다.
 * 프로젝트 창의 글은 lib/desk/content/projects.ts에 있고, 여기서는 그 목록을 창 정의로 바꿔 준다.
 */

/** 창 안에 무엇을 그릴지 */
export type AppKind = 'folder' | 'project' | 'article' | 'trash';

export interface AppDef {
  id: string;
  title: string;
  kind: AppKind;
  /** 1024x768 기준 기본 크기 */
  size: [number, number];
}

/** 바탕화면 아이콘 그림 이름. 실제 그림은 components/desk/surfaces/xp-icons.tsx에 있다 */
export type XpIconName = 'about' | 'projects' | 'resume' | 'trash';

/** 바탕화면에 놓이는 아이콘. icon은 어떤 그림을 그릴지다 */
export interface DesktopIcon extends AppDef {
  label: string;
  icon: XpIconName;
  /** 있으면 창을 여는 대신 이 파일을 내려받는다 */
  download?: { href: string; filename: string };
}

/** 이력서 PDF. 모니터에서는 내려받고, 책상 위 서류에서는 같은 파일의 페이지 이미지를 넘겨 본다 */
export const RESUME = {
  href: '/resume.pdf',
  filename: '이서림_이력서.pdf',
  /** public/resume/page-N.webp. 페이지 수는 PDF를 다시 렌더할 때 함께 맞춘다 */
  pages: 6,
  page: (n: number) => `/resume/page-${n}.webp`,
} as const;

/**
 * 프로젝트 창 크기. 소개 장에 메타 표, 설명, 스택, 화면 두 장이 스크롤 없이 들어가야 해서
 * 다른 창보다 크다. 1024×768 작업 영역 안에 여백을 두고 들어가는 크기다.
 */
export const PROJECT_WINDOW_SIZE: [number, number] = [760, 540];

export const projects: AppDef[] = projectContents.map((p) => ({
  id: p.id,
  title: p.name,
  kind: 'project',
  size: PROJECT_WINDOW_SIZE,
}));

/** 바탕화면 아이콘 순서. 처음 온 사람이 위에서부터 읽으니 소개가 맨 위다 */
export const desktopIcons: DesktopIcon[] = [
  { id: 'about', label: '소개', title: '소개 - 읽어보기', kind: 'article', icon: 'about', size: [560, 440] },
  { id: 'projects', label: '프로젝트', title: '내 프로젝트', kind: 'folder', icon: 'projects', size: [560, 400] },
  { id: 'resume', label: '이력서', title: '이력서', kind: 'article', icon: 'resume', size: [520, 400], download: RESUME },
  { id: 'trash', label: '휴지통', title: `휴지통 (${trashItems.length}개 항목)`, kind: 'trash', icon: 'trash', size: [680, 380] },
];

/** id로 창 정보를 찾는다. 바탕화면 아이콘과 프로젝트를 한 곳에서 본다 */
export function findApp(id: string): AppDef | undefined {
  return desktopIcons.find((a) => a.id === id) ?? projects.find((p) => p.id === id);
}
