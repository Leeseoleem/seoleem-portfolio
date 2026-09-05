/**
 * 모니터 화면 안에서 창으로 열리는 것들의 목록.
 *
 * 창 자체는 MonitorScreen이 관리하고, 여기에는 무엇을 띄울 수 있는지만 적는다.
 * 실제 프로젝트 글은 아직 없어서 내용은 골격만 잡혀 있다.
 * 나중에 글이 나오면 projects 배열만 채우면 된다.
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

export const projects: AppDef[] = [
  { id: 'project-1', title: '프로젝트 하나', kind: 'project', size: [620, 460] },
  { id: 'project-2', title: '프로젝트 둘', kind: 'project', size: [620, 460] },
  { id: 'project-3', title: '프로젝트 셋', kind: 'project', size: [620, 460] },
];

export const desktopIcons: DesktopIcon[] = [
  { id: 'projects', label: '프로젝트', title: '내 프로젝트', kind: 'folder', tone: 'a', size: [560, 400] },
  { id: 'about', label: '소개', title: '소개 - 읽어보기', kind: 'article', tone: 'b', size: [520, 400] },
  { id: 'resume', label: '이력서', title: '이력서 - 미리보기', kind: 'article', tone: 'c', size: [520, 400] },
  { id: 'trash', label: '휴지통', title: '휴지통', kind: 'empty', tone: 'd', size: [420, 260] },
];

/** id로 창 정보를 찾는다. 바탕화면 아이콘과 프로젝트를 한 곳에서 본다 */
export function findApp(id: string): AppDef | undefined {
  return desktopIcons.find((a) => a.id === id) ?? projects.find((p) => p.id === id);
}
