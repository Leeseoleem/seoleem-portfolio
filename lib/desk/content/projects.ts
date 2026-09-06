import { projectLinks } from '@/lib/desk/links';
import type { ProjectContent } from './types';

/**
 * 프로젝트 창의 글. docs/content-brief.md 5장을 그대로 옮긴 것이다.
 * 채식어디는 이력서 PDF의 Activities에만 두고 여기서는 다루지 않는다.
 * 수치와 사실은 이력서·포트폴리오 최종본에서 검증된 것만 쓴다. 여기서 새로 만들지 않는다.
 *
 * 대표 화면은 public/shots/에 있는 기기 목업 이미지다. 투명 배경이라 그대로 놓는다.
 */

/** 구조도를 소스 안에서 보기 좋게 적기 위해 앞뒤 빈 줄만 걷어낸다 */
const art = (s: string) => s.replace(/^\n/, '').replace(/\n[ \t]*$/, '');

export const fitpl: ProjectContent = {
  id: 'fitpl',
  name: '핏플',
  slug: 'fitpl',
  tagline: 'AI가 일정을 구성하는 플래너 앱',
  pages: [
    {
      kind: 'intro',
      title: '프로젝트 소개',
      summary: '"카페 → 식사 → 산책"처럼 큰 흐름을 고르면 AI가 세부 장소와 이동 루트를 구성합니다.',
      stack: ['React', 'TypeScript', 'Zustand', 'TanStack Query', 'React Native WebView'],
      links: projectLinks.fitpl,
      shots: [
        { label: '메인', src: '/shots/fitpl-1.webp' },
        { label: '일정 상세', src: '/shots/fitpl-2.webp' },
      ],
    },
    {
      kind: 'overview',
      title: '개요',
      meta: [
        { label: '기간', value: '2025.05 ~ 진행 중' },
        { label: '팀', value: ['프론트엔드 2인', '백엔드 2인'] },
        { label: '역할', value: ['핵심 일정 플로우, 인증 화면 전담', '공통 UI 구조 설계', 'Android WebView 앱 연동, 출시'] },
        { label: '상태', value: ['Google Play 출시', 'v2.0.0 배포'] },
      ],
    },
    {
      kind: 'diagram',
      title: '서비스 구조',
      ascii: art(`
             사용자
               ↓
      ┌────────────────┐
      │ React Native   │
      │    WebView     │
      └───────┬────────┘
              ↕ Bridge RPC
      ┌───────┴────────┐
      │   React SPA    │
      └───────┬────────┘
              ↓
         Backend API
`),
    },
    {
      kind: 'case',
      title: '헤더 분기를 라우트 설정으로',
      heading: '헤더 분기를 라우트 설정으로 옮겨 변경 지점 단일화',
      problem: '라우트가 30개를 넘으며 페이지마다 헤더 분기가 쌓였고, 정책 변경 때 여러 파일을 함께 수정해야 했습니다.',
      decision:
        '헤더 구성을 라우트 설정 맵으로 옮기고 구간 정책은 섹션 패턴으로 처리했습니다. 헤더 5종은 TypeScript discriminated union으로 구분했습니다.',
      reasoning: '헤더는 개별 화면 상태보다 라우트에 따라 정해지는 UI 정책에 가까워 Context보다 설정 구조가 적합하다고 판단했습니다.',
      result: '페이지별 분기가 사라지고 변경 지점이 설정 맵으로 모였습니다. 잘못된 헤더 조합도 컴파일 단계에서 차단됩니다.',
    },
    {
      kind: 'case',
      title: 'Web ↔ Native RPC 통합',
      heading: '웹·네이티브 호출을 하나의 RPC 규약으로 통합',
      problem: '저장소, 외부 링크, 앱 종료처럼 네이티브 기능이 늘며 기능별 메시지와 콜백이 함께 늘어날 수 있었습니다.',
      decision:
        '요청은 { id, method, payload }, 응답은 __bridgeResolve(id, ok, value)로 통일하고 요청별 Promise를 pending Map으로 관리했습니다.',
      reasoning: '기능별 메시지를 추가하는 대신 웹에서 모든 네이티브 기능을 같은 Promise 인터페이스로 다루고 싶었습니다.',
      result: 'FCM 토큰과 앱 버전 조회까지 같은 규약으로 확장했고, 구버전 앱에는 메서드 존재 여부를 확인하는 호환 규칙을 적용했습니다.',
    },
  ],
};

export const garachato: ProjectContent = {
  id: 'garachato',
  name: '가라챠토',
  slug: 'garachato',
  tagline: 'J-POP 노래방 곡 검색 서비스',
  pages: [
    {
      kind: 'intro',
      title: '프로젝트 소개',
      summary: 'TJ와 금영의 수록곡과 차트 데이터를 수집해 일본 노래방 곡을 검색하고 순위를 확인할 수 있는 서비스입니다.',
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Gemini API', 'Vercel Cron'],
      links: projectLinks.garachato,
      shots: [
        { label: 'Apps-in-Toss 미니앱', src: '/shots/garachato-1.webp' },
        { label: '웹 (모바일)', src: '/shots/garachato-2.webp' },
      ],
    },
    {
      kind: 'overview',
      title: '개요',
      meta: [
        { label: '기간', value: '2026.02 ~ 운영 중' },
        { label: '형태', value: '개인 프로젝트' },
        { label: '역할', value: ['기획, 디자인, 프론트엔드', '데이터 파이프라인, 배포, 운영'] },
        { label: '상태', value: ['웹 운영', 'Apps-in-Toss 운영'] },
      ],
      note: '스토어 리뷰 요청 → 2일 만에 신곡 알림 반영',
    },
    {
      kind: 'diagram',
      title: '서비스 구조',
      ascii: art(`
          Vercel Cron
               ↓
     ┌─────────┴─────────┐
     ↓                   ↓
 TJ JSON API          KY HTML
     └─────────┬─────────┘
               ↓
          CrawledSong
               ↓
      공통 적재 파이프라인
               ↓
   ┌─────────────────────┐
   │ Supabase PostgreSQL │
   │ songs               │
   │ karaoke_tracks      │
   │ rank_history        │
   │ search_songs RPC    │
   └──────────┬──────────┘
          ┌───┴───┐
          ↓       ↓
      Next.js   Mini App
       Server   Client+RLS
`),
    },
    {
      kind: 'case',
      title: '전곡 검색 구조 재설계',
      heading: '전곡 검색 확장 중 88.5% 누락 확인, 검색 구조 재설계',
      problem: '검색 범위를 11,519곡으로 넓힌 뒤 확인해 보니 기존 검색 대상은 1,319행뿐이었고, 카탈로그의 88.5%가 빠지고 있었습니다.',
      decision:
        '검색을 PostgreSQL RPC로 옮기고 부분 일치, 별칭, trigram, 자모 편집거리 등을 함께 적용했습니다. 인기 차트와 전체 카탈로그 결과도 분리했습니다.',
      reasoning:
        'ai는 전체 카탈로그에서 412건이 매칭돼도 하나의 결과 제한에서는 노출되지 않을 수 있었습니다. 정확도뿐 아니라 어떤 결과를 보여줄지도 함께 해결해야 했습니다.',
      result: '전곡 검색이 가능해졌고, 곡 그룹화도 DB로 옮겨 행이 아닌 곡 기준으로 결과를 반환하도록 했습니다.',
    },
    {
      kind: 'case',
      title: '미니앱 구조 재설계',
      heading: 'SSR 미지원 환경에 맞춰 미니앱 구조 재설계',
      problem: 'Next.js 웹은 Server Component에서 데이터를 조회했지만 Apps-in-Toss에서는 SSR을 사용할 수 없었습니다.',
      decision: '별도 Vite 앱에서 클라이언트 Supabase 조회와 RLS를 사용하고 라우팅은 React Router로 다시 구성했습니다.',
      reasoning: '브라우저가 DB를 직접 조회하는 환경에서는 화면 코드가 아니라 실제 DB 정책에서 접근 권한을 제한해야 했습니다.',
      result: '같은 데이터를 사용하면서 웹은 서버 조회, 미니앱은 클라이언트 조회와 RLS를 사용하는 구조로 분리했습니다.',
    },
  ],
};

export const urido: ProjectContent = {
  id: 'urido',
  name: '우리두',
  slug: 'urido',
  tagline: '함께 정하고 기록하는 그룹 앱',
  pages: [
    {
      kind: 'intro',
      title: '프로젝트 소개',
      summary: '무엇을 할지 정하는 과정을 룰렛이나 카드 뽑기 같은 놀이로 만들고, 함께 정한 결과를 기록하는 모바일 앱입니다.',
      stack: ['React Native (Expo)', 'TypeScript', 'Expo Router', 'NativeWind v4', 'TanStack Query', 'Reanimated'],
      links: projectLinks.urido,
      shots: [
        { label: '홈', src: '/shots/urido-1.webp' },
        { label: '룰렛', src: '/shots/urido-2.webp' },
      ],
    },
    {
      kind: 'overview',
      title: '개요',
      meta: [
        { label: '기간', value: '2026.06 ~ 진행 중' },
        { label: '팀', value: ['프론트엔드 1인', '백엔드 1인'] },
        { label: '역할', value: ['PO 겸 Frontend Developer', '기획, UX 설계, 프론트엔드 전담'] },
        { label: '상태', value: '소셜 로그인, API 연동 단계' },
      ],
    },
    {
      kind: 'diagram',
      title: '서비스 구조',
      ascii: art(`
              사용자
                ↓
       ┌────────────────┐
       │ React Native   │
       │     Expo       │
       └───────┬────────┘
               │
       ┌───────┴────────┐
       ↓                ↓
   Screen / UX         Auth
       │                │
   Expo Router      OAuth / Token
       │                │
       ↓             Refresh
   Query Hooks       single-flight
       │
       ↓
 [ Mock | Fallback | Live ]
                       │
                       ↓
                  Backend API
`),
    },
    {
      kind: 'case',
      title: '동시 401 재발급 단일화',
      heading: '동시 401 토큰 재발급 단일화',
      problem: '여러 API가 동시에 401을 받으면 각 요청이 같은 rotating Refresh Token으로 재발급을 시도해 세션이 끊길 수 있었습니다.',
      decision: '진행 중인 재발급 Promise를 하나만 유지하고 뒤따르는 요청은 같은 결과를 기다리도록 했습니다.',
      reasoning: '필요한 것은 요청 순서를 맞추는 것이 아니라 여러 요청이 하나의 재발급 결과를 공유하는 것이었습니다.',
      result: '동시에 여러 요청이 만료돼도 재발급은 한 번만 수행됩니다. 네트워크 오류와 실제 세션 만료도 구분해 처리했습니다.',
    },
    {
      kind: 'case',
      title: 'DnD 검증 후 직접 구현',
      heading: 'DnD 라이브러리 검증 후 직접 구현으로 전환',
      problem:
        '항목 정렬과 리스트 밖 휴지통 삭제를 함께 지원해야 했지만 reanimated-dnd가 외부 drop zone까지 지원하는지는 문서만으로 알기 어려웠습니다.',
      decision:
        '소스를 확인해 useSortable의 DropContext 참조가 0건임을 확인하고 라이브러리를 제거했습니다. 이후 Gesture Handler와 Reanimated로 직접 구현했습니다.',
      reasoning: '라이브러리에 화면 구조를 맞추면 필요한 인터랙션을 포기하거나 우회 로직이 늘어날 가능성이 있었습니다.',
      result: '기존 화면 구조를 유지하면서 정렬과 외부 삭제 영역을 함께 구현했고, 지원되지 않는 동작을 위한 우회 코드도 남기지 않았습니다.',
    },
  ],
};

/** 폴더에 보이는 순서. 브리프 4장의 순서 근거를 따른다 */
export const projectContents: ProjectContent[] = [fitpl, garachato, urido];

export function findProject(id: string): ProjectContent | undefined {
  return projectContents.find((p) => p.id === id);
}
