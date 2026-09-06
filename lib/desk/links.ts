import type { ExternalLink, ProjectId } from '@/lib/desk/content/types';

/**
 * 바깥으로 나가는 링크. 핸드폰 독과 프로젝트 창이 쓴다.
 * 주소는 한 곳에서만 관리하고, 이력서 PDF에 걸린 것과 같은 값이다.
 * LinkedIn 주소에는 한글이 들어 있어 퍼센트 인코딩된 형태로 둔다.
 */
export const links = {
  github: 'https://github.com/Leeseoleem',
  velog: 'https://velog.io/@leeseoleem1014',
  linkedin: 'https://www.linkedin.com/in/%EC%84%9C%EB%A6%BC-%EC%9D%B4-84944a355',
  email: 'mailto:leeseorim0029@gmail.com',
} as const;

/**
 * 프로젝트 소개 장에 붙는 외부 링크. 주소는 이력서 PDF에 걸린 것과 같다.
 * 우리두는 아직 출시 전이라 링크가 없다.
 */
export const projectLinks: Record<ProjectId, ExternalLink[]> = {
  fitpl: [{ label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.bluehp.fitpl' }],
  garachato: [
    { label: 'Live', href: 'https://garachato-karaoke-chart.vercel.app/' },
    { label: 'Apps-in-Toss', href: 'https://minion.toss.im/9pLio5R4' },
  ],
  urido: [],
};
