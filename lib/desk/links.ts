import type { ExternalLink, ProjectId } from '@/lib/desk/content/types';

/**
 * 바깥으로 나가는 링크. 핸드폰 독과 프로젝트 창이 쓴다.
 * 주소는 한 곳에서만 관리한다. velog·linkedin은 실제 주소로 바꿔야 한다.
 */
export const links = {
  github: 'https://github.com/Leeseoleem',
  velog: 'https://velog.io/@seoleem',
  linkedin: 'https://www.linkedin.com/in/seoleem',
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
