/**
 * 바탕화면 아이콘 그림. 색 네모 대신 XP처럼 무엇을 여는지 보이는 픽토그램이다.
 *
 * 화면이 3D 안에서 매 프레임 변형되므로 filter나 drop-shadow는 쓰지 않고,
 * 입체감은 SVG 그라데이션과 선으로만 낸다. 48×48 기준으로 그린다.
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
          <stop offset="0" stopColor="#e6b43a" />
          <stop offset="1" stopColor="#c8921f" />
        </linearGradient>
        <linearGradient id="xpi-folder-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe28a" />
          <stop offset="0.5" stopColor="#f8cf5e" />
          <stop offset="1" stopColor="#e7b23c" />
        </linearGradient>
      </defs>
      <path d="M5 12.5c0-1.4 1.1-2.5 2.5-2.5h11l3.5 3.5H40.5c1.4 0 2.5 1.1 2.5 2.5V37c0 1.4-1.1 2.5-2.5 2.5h-33C6.1 39.5 5 38.4 5 37V12.5Z" fill="url(#xpi-folder-back)" />
      <path d="M5 19.5c0-1.1.9-2 2-2h34c1.1 0 2 .9 2 2V37c0 1.4-1.1 2.5-2.5 2.5h-33C6.1 39.5 5 38.4 5 37V19.5Z" fill="url(#xpi-folder-front)" />
      <path d="M6.5 19h35" stroke="#fff1bd" strokeOpacity="0.8" strokeWidth="1" />
    </svg>
  );
}

/** 글이 적힌 문서 한 장. 오른쪽 위가 접혀 있다 */
function DocumentIcon() {
  return (
    <svg className="xp-icon__pic" viewBox="0 0 48 48" width={SIZE} height={SIZE} aria-hidden="true">
      <defs>
        <linearGradient id="xpi-page" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4eaf2" />
        </linearGradient>
      </defs>
      <path d="M11 5.5h18l9 9V41c0 .8-.7 1.5-1.5 1.5h-25.5c-.8 0-1.5-.7-1.5-1.5V7c0-.8.7-1.5 1.5-1.5Z" fill="url(#xpi-page)" stroke="#8ea2be" />
      <path d="M29 5.5v7.5c0 .8.7 1.5 1.5 1.5H38" fill="#cfd9e6" stroke="#8ea2be" />
      <g stroke="#5b7fb5" strokeWidth="1.6" strokeLinecap="round">
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
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4eaf2" />
        </linearGradient>
        <linearGradient id="xpi-resume-photo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fb2f0" />
          <stop offset="1" stopColor="#3f7fd6" />
        </linearGradient>
      </defs>
      <path d="M9.5 5.5h29c.8 0 1.5.7 1.5 1.5v34c0 .8-.7 1.5-1.5 1.5h-29c-.8 0-1.5-.7-1.5-1.5V7c0-.8.7-1.5 1.5-1.5Z" fill="url(#xpi-resume-page)" stroke="#8ea2be" />
      <rect x="13" y="11" width="10" height="12" rx="1" fill="url(#xpi-resume-photo)" />
      <circle cx="18" cy="15.5" r="2.2" fill="#eaf2ff" />
      <path d="M14.5 22c.6-2.2 2-3.3 3.5-3.3s2.9 1.1 3.5 3.3" fill="#eaf2ff" />
      <g stroke="#5b7fb5" strokeWidth="1.6" strokeLinecap="round">
        <path d="M27 13h8" />
        <path d="M27 18h8" />
        <path d="M13 29h22" />
        <path d="M13 34h22" />
      </g>
      <path d="M8 40.5h32" stroke="#c9d5e5" />
    </svg>
  );
}

/** 반투명한 휴지통. 재활용 화살표는 초록 고리 하나로 줄였다 */
function TrashIcon() {
  return (
    <svg className="xp-icon__pic" viewBox="0 0 48 48" width={SIZE} height={SIZE} aria-hidden="true">
      <defs>
        <linearGradient id="xpi-bin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#eef4fa" />
          <stop offset="0.45" stopColor="#c9d8e8" />
          <stop offset="1" stopColor="#9db1c8" />
        </linearGradient>
      </defs>
      <path d="M12 14h24l-2.2 25.2c-.1 1.3-1.2 2.3-2.5 2.3H16.7c-1.3 0-2.4-1-2.5-2.3L12 14Z" fill="url(#xpi-bin)" stroke="#7f95ad" />
      <rect x="9.5" y="10.5" width="29" height="4" rx="1.5" fill="#dfe8f2" stroke="#7f95ad" />
      <path d="M19 8.5h10" stroke="#7f95ad" strokeWidth="2" strokeLinecap="round" />
      <g stroke="#7f95ad" strokeOpacity="0.5" strokeLinecap="round">
        <path d="M18.5 19v18" />
        <path d="M24 19v18" />
        <path d="M29.5 19v18" />
      </g>
      <path d="M24 22.5a6 6 0 1 1-5.2 3" fill="none" stroke="#3f9d3a" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17.5 23.5l1.3 3 3-1.3" fill="none" stroke="#3f9d3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
