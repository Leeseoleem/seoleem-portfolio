import type { ProjectId } from './types';

/**
 * 휴지통 창의 글. docs/content-brief.md 8장을 그대로 옮긴 것이다.
 * 농담이 아니라 검토했지만 쓰지 않기로 한 선택들이다. 자세한 근거는 해당 프로젝트 창에 있다.
 * 실제 휴지통이 "원래 위치"를 보여 주듯 항목마다 어느 프로젝트에서 버린 것인지 적는다.
 */

export interface TrashItem {
  title: string;
  reason: string;
  /** 이 선택을 버린 프로젝트. 휴지통에서 그 프로젝트 창으로 바로 갈 수 있다 */
  project: ProjectId;
}

export const trashNote = '검토했지만 쓰지 않기로 한 것들입니다.';

/** 프로젝트 폴더와 같은 순서로 둔다 */
export const trashItems: TrashItem[] = [
  {
    title: 'Context로 헤더 상태 전달',
    reason: '헤더는 라우트에 따라 정해지는 정책이라 전달보다 설정이 맞다고 봤습니다.',
    project: 'fitpl',
  },
  {
    title: '기능별 브리지 메시지',
    reason: '기능이 늘수록 콜백도 함께 늘어나, 하나의 RPC 규약으로 통일했습니다.',
    project: 'fitpl',
  },
  {
    title: '화면에서 필터링하는 검색',
    reason: '내려온 일부 데이터만 훑는 방식으로는 11,519곡 전체를 감당할 수 없었습니다.',
    project: 'garachato',
  },
  {
    title: 'reanimated-dnd',
    reason: '소스를 확인해 보니 외부 drop zone을 연결할 경로가 없었습니다. 제거하고 직접 구현했습니다.',
    project: 'urido',
  },
];
