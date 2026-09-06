import { projectContents } from '@/lib/desk/content/projects';

/**
 * 모니터 화면 안에서 창으로 열리는 것들의 목록.
 *
 * 창 자체는 MonitorScreen이 관리하고, 여기에는 무엇을 띄울 수 있는지만 적는다.
 * 프로젝트 창의 글은 lib/desk/content/projects.ts에 있고, 여기서는 그 목록을 창 정의로 바꿔 준다.
 */

/** 창 안에 무엇을 그릴지 */
export type AppKind = 'folder' | 'project' | 'article' | 'empty';

export interface AppDef {
  id: string;
  title: string;
  kind: AppKind;
  /** 1024x768 기준 기본 크기 */
  size: [number, number];
}

/** 바탕화면에 놓이는 아이콘. tone은 아이콘 타일 색이다 */
export interface DesktopIcon extends AppDef {
  label: string;
  tone: 'a' | 'b' | 'c' | 'd';
}

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
  { id: 'about', label: '소개', title: '소개 - 읽어보기', kind: 'article', tone: 'b', size: [520, 400] },
  { id: 'projects', label: '프로젝트', title: '내 프로젝트', kind: 'folder', tone: 'a', size: [560, 400] },
  { id: 'resume', label: '이력서', title: '이력서 - 미리보기', kind: 'article', tone: 'c', size: [520, 400] },
  { id: 'trash', label: '휴지통', title: '휴지통', kind: 'empty', tone: 'd', size: [420, 260] },
];

/** id로 창 정보를 찾는다. 바탕화면 아이콘과 프로젝트를 한 곳에서 본다 */
export function findApp(id: string): AppDef | undefined {
  return desktopIcons.find((a) => a.id === id) ?? projects.find((p) => p.id === id);
}
