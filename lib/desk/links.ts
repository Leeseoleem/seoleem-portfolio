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
 * 프로젝트 소개 장에 붙는 외부 링크.
 * 핏플의 Google Play, 가라챠토의 Live와 Apps-in-Toss 주소는 아직 받지 못해 비워 두었다.
 * 주소가 오면 여기만 채우면 창에 바로 나온다.
 */
export const projectLinks: Record<ProjectId, ExternalLink[]> = {
  fitpl: [],
  garachato: [],
  urido: [],
  chaesigeodi: [
    { label: 'GitHub', href: 'https://github.com/VRRS-Project-Team-GitPage' },
    { label: 'Demo Video', href: 'https://www.youtube.com/watch?v=PUEc9VYo3kM' },
  ],
};
