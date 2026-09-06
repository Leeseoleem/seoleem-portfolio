/**
 * 모니터 프로젝트 창에 들어가는 글의 모양.
 *
 * 프로젝트 하나는 창 하나로 열리고, 창 안에서 장을 넘긴다.
 * 장은 세 종류만 있다. 소개, 서비스 구조도, Engineering Case.
 * 글은 lib/desk/content/projects.ts에 데이터로만 두고, 그리는 쪽은 종류별로 한 번만 만든다.
 * 문구가 바뀌면 데이터 파일만 고치면 된다.
 */

export type ProjectId = 'fitpl' | 'garachato' | 'urido';

/** 소개 장의 메타 표 한 줄. 값이 여러 개면 줄을 나눠 그린다 */
export interface MetaRow {
  label: string;
  value: string | string[];
}

export interface ExternalLink {
  label: string;
  href: string;
}

/** 대표 화면 한 장. src가 없으면 자리만 잡은 회색 판을 그린다 */
export interface Screenshot {
  label: string;
  src?: string;
}

export interface IntroPage {
  kind: 'intro';
  title: '프로젝트 소개';
  meta: MetaRow[];
  /** 서비스가 무엇인지 한두 문장 */
  summary: string;
  stack: string[];
  links: ExternalLink[];
  shots: Screenshot[];
  /** 운영 중 있었던 일을 짧게 적는 배지. 없어도 된다 */
  badge?: string;
}

/** 설명문 없이 ASCII 구조도만 보여주는 장 */
export interface DiagramPage {
  kind: 'diagram';
  title: '서비스 구조';
  ascii: string;
}

/** 문제 → 결정 → 판단 근거 → 결과. 이후 기준은 웹에서 생략한다 */
export interface CasePage {
  kind: 'case';
  /** 하단 탐색에 보이는 짧은 이름 */
  title: string;
  /** 본문 위에 놓이는 제목 */
  heading: string;
  problem: string;
  decision: string;
  reasoning: string;
  result: string;
}

export type ProjectPage = IntroPage | DiagramPage | CasePage;

export interface ProjectContent {
  id: ProjectId;
  /** 화면에 보이는 이름 */
  name: string;
  /** 부팅 화면 PROJECTS 줄처럼 영문만 쓸 자리 */
  slug: string;
  /** 폴더 목록에 붙는 한 줄 */
  tagline: string;
  pages: ProjectPage[];
}
