/**
 * 바탕화면 아이콘 그림. 색 네모 대신 XP처럼 무엇을 여는지 보이는 픽토그램이다.
 *
 * 화면이 3D 안에서 매 프레임 변형되므로 filter나 drop-shadow는 쓰지 않고,
 * 입체감은 SVG 그라데이션과 선으로만 낸다. 48×48 기준으로 그린다.
 * 색은 globals.css의 --xpi-* 토큰을 style로 읽는다. 속성(fill="var()")은 브라우저에 따라 var()를 못 읽어 style로 둔다.
 */

import type { XpIconName } from '@/lib/desk/xp-apps';

export function XpIcon({ name }: { name: XpIconName }) {
  switch (name) {
    case 'projects':
      return <FolderIcon />;
    case 'about':
      return <DocumentIcon />;
    case 'resume':
      return <ResumeIcon />;
    case 'trash':
      return <TrashIcon />;
  }
}

const SIZE = 48;

/** 노란 서류 폴더. 뒤판이 진하고 앞판이 밝다 */
function FolderIcon() {
  return (
    <svg className="xp-icon__pic" viewBox="0 0 48 48" width={SIZE} height={SIZE} aria-hidden="true">
      <defs>
        <linearGradient id="xpi-folder-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--xpi-folder-back-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--xpi-folder-back-bottom)' }} />
        </linearGradient>
        <linearGradient id="xpi-folder-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--xpi-folder-front-top)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--xpi-folder-front-mid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--xpi-folder-front-bottom)' }} />
        </linearGradient>
      </defs>
      <path d="M5 12.5c0-1.4 1.1-2.5 2.5-2.5h11l3.5 3.5H40.5c1.4 0 2.5 1.1 2.5 2.5V37c0 1.4-1.1 2.5-2.5 2.5h-33C6.1 39.5 5 38.4 5 37V12.5Z" fill="url(#xpi-folder-back)" />
      <path d="M5 19.5c0-1.1.9-2 2-2h34c1.1 0 2 .9 2 2V37c0 1.4-1.1 2.5-2.5 2.5h-33C6.1 39.5 5 38.4 5 37V19.5Z" fill="url(#xpi-folder-front)" />
      <path d="M6.5 19h35" style={{ stroke: 'var(--xpi-folder-edge)' }} strokeOpacity="0.8" strokeWidth="1" />
    </svg>
  );
}

/** 글이 적힌 문서 한 장. 오른쪽 위가 접혀 있다 */
function DocumentIcon() {
  return (
    <svg className="xp-icon__pic" viewBox="0 0 48 48" width={SIZE} height={SIZE} aria-hidden="true">
      <defs>
        <linearGradient id="xpi-page" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--xpi-page-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--xpi-page-bottom)' }} />
        </linearGradient>
      </defs>
      <path d="M11 5.5h18l9 9V41c0 .8-.7 1.5-1.5 1.5h-25.5c-.8 0-1.5-.7-1.5-1.5V7c0-.8.7-1.5 1.5-1.5Z" fill="url(#xpi-page)" style={{ stroke: 'var(--xpi-page-line)' }} />
      <path d="M29 5.5v7.5c0 .8.7 1.5 1.5 1.5H38" style={{ fill: 'var(--xpi-page-fold)', stroke: 'var(--xpi-page-line)' }} />
      <g style={{ stroke: 'var(--xpi-page-text)' }} strokeWidth="1.6" strokeLinecap="round">
        <path d="M15 20h14" />
        <path d="M15 25h18" />
        <path d="M15 30h18" />
        <path d="M15 35h11" />
      </g>
    </svg>
  );
}

/** 사진 칸과 글줄이 있는 이력서 */
function ResumeIcon() {
  return (
    <svg className="xp-icon__pic" viewBox="0 0 48 48" width={SIZE} height={SIZE} aria-hidden="true">
      <defs>
        <linearGradient id="xpi-resume-page" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--xpi-page-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--xpi-page-bottom)' }} />
        </linearGradient>
        <linearGradient id="xpi-resume-photo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--xpi-photo-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--xpi-photo-bottom)' }} />
        </linearGradient>
      </defs>
      <path d="M9.5 5.5h29c.8 0 1.5.7 1.5 1.5v34c0 .8-.7 1.5-1.5 1.5h-29c-.8 0-1.5-.7-1.5-1.5V7c0-.8.7-1.5 1.5-1.5Z" fill="url(#xpi-resume-page)" style={{ stroke: 'var(--xpi-page-line)' }} />
      <rect x="13" y="11" width="10" height="12" rx="1" fill="url(#xpi-resume-photo)" />
      <circle cx="18" cy="15.5" r="2.2" style={{ fill: 'var(--xpi-photo-fg)' }} />
      <path d="M14.5 22c.6-2.2 2-3.3 3.5-3.3s2.9 1.1 3.5 3.3" style={{ fill: 'var(--xpi-photo-fg)' }} />
      <g style={{ stroke: 'var(--xpi-page-text)' }} strokeWidth="1.6" strokeLinecap="round">
        <path d="M27 13h8" />
        <path d="M27 18h8" />
        <path d="M13 29h22" />
        <path d="M13 34h22" />
      </g>
      <path d="M8 40.5h32" style={{ stroke: 'var(--xpi-page-rule)' }} />
    </svg>
  );
}

/** 반투명한 휴지통. 재활용 화살표는 초록 고리 하나로 줄였다 */
function TrashIcon() {
  return (
    <svg className="xp-icon__pic" viewBox="0 0 48 48" width={SIZE} height={SIZE} aria-hidden="true">
      <defs>
        <linearGradient id="xpi-bin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--xpi-bin-light)' }} />
          <stop offset="0.45" style={{ stopColor: 'var(--xpi-bin-mid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--xpi-bin-dark)' }} />
        </linearGradient>
      </defs>
      <path d="M12 14h24l-2.2 25.2c-.1 1.3-1.2 2.3-2.5 2.3H16.7c-1.3 0-2.4-1-2.5-2.3L12 14Z" fill="url(#xpi-bin)" style={{ stroke: 'var(--xpi-bin-line)' }} />
      <rect x="9.5" y="10.5" width="29" height="4" rx="1.5" style={{ fill: 'var(--xpi-bin-lid)', stroke: 'var(--xpi-bin-line)' }} />
      <path d="M19 8.5h10" style={{ stroke: 'var(--xpi-bin-line)' }} strokeWidth="2" strokeLinecap="round" />
      <g style={{ stroke: 'var(--xpi-bin-line)' }} strokeOpacity="0.5" strokeLinecap="round">
        <path d="M18.5 19v18" />
        <path d="M24 19v18" />
        <path d="M29.5 19v18" />
      </g>
      <path d="M24 22.5a6 6 0 1 1-5.2 3" fill="none" style={{ stroke: 'var(--xpi-bin-arrow)' }} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17.5 23.5l1.3 3 3-1.3" fill="none" style={{ stroke: 'var(--xpi-bin-arrow)' }} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
