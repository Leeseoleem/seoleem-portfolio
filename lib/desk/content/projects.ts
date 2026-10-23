import { projectLinks } from '@/lib/desk/links';
import type { ProjectContent } from './types';

/**
 * 프로젝트 창의 글. docs/content-brief.md 5장을 그대로 옮긴 것이고, 브리프는 PDF 포트폴리오 최종본(2026-10)을 따른다.
 * 채식어디는 이력서 PDF의 Activities에만 두고 여기서는 다루지 않는다.
 * 수치와 사실은 이력서·포트폴리오 최종본에서 검증된 것만 쓴다. 여기서 새로 만들지 않는다.
 * 하루만 지나도 달라지는 수치(곡 수, 행 수, 비율)는 문서와 같이 쓰지 않는다.
 * Engineering Case 한 칸은 한글 70자 안팎까지만. 창(760×540)의 2×2 칸에 스크롤 없이 들어가야 한다.
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
      summary: '"카페 → 식사 → 산책"처럼 큰 흐름만 고르면 세부 장소와 이동 루트를 AI가 구성하는 일정 플래너 앱입니다.',
      stack: ['React', 'TypeScript', 'Vite', 'Zustand', 'TanStack Query', 'React Native WebView'],
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
        { label: '역할', value: ['일정 생성/편집과 일반 로그인 화면 전담', '공통 UI 구조 설계', 'Android WebView 앱 연동, 출시'] },
        { label: '상태', value: ['Google Play 정식 출시', 'v2.0.0 리뉴얼 배포'] },
      ],
    },
    {
      kind: 'diagram',
      title: '서비스 구조',
      // 그림은 가장 긴 줄을 기준으로 가운데 놓인다. 라벨을 상자 옆에 붙이면 그 줄만 오른쪽으로 길어져
      // 상자가 한쪽으로 밀려 보인다. 라벨도 화살표 아래 한 줄로 내려 좌우를 맞춘다.
      // 상자는 선 문자(─│┌┐)가 아니라 +-|로 그린다. 웹폰트의 라틴 서브셋에는 선 문자가 없어
      // 기기에 따라 다른 글꼴에서 끌어오고, 그때 글자와 폭이 달라 상자가 어긋난다
      ascii: art(`
         사용자
            ↓
+-----------------------+
|      React Native     |
|        WebView        |
+-----------+-----------+
            ↑↓
       Bridge RPC
+-----------+-----------+
|       React SPA       |
+-----------+-----------+
            ↓
       Backend API
`),
    },
    {
      kind: 'case',
      title: '헤더 분기를 라우트 설정으로',
      heading: '헤더 분기를 라우트 설정으로 옮겨 변경 지점 단일화',
      problem: '라우트가 30개를 넘어가며 페이지별 헤더 관리의 수정 범위가 커졌고, 새 화면에서 헤더를 빠뜨리거나 정책 변경 시 여러 파일을 함께 고쳐야 했습니다.',
      decision:
        '헤더 구성을 라우트 설정 맵으로 옮기고 구간 단위 정책은 섹션 패턴 규칙으로 처리했습니다. 헤더 5종은 TypeScript discriminated union으로 정의했습니다.',
      reasoning: '헤더는 라우트에 따라 정해지는 UI 정책이라 Context보다 설정 구조가 적합했습니다. 타입도 optional 필드를 늘어놓기보다 union으로 나눠, 각 헤더 타입에 필요한 필드만 노출되게 했습니다.',
      result: '페이지에서 헤더 분기 로직이 사라지고 정책 변경 지점이 설정 맵 한 곳으로 모였습니다. 타입별로 필요한 필드만 노출돼 잘못된 조합은 컴파일 단계에서 차단됩니다.',
    },
    {
      kind: 'case',
      title: 'Web ↔ Native RPC 통합',
      heading: '웹과 네이티브 호출을 하나의 RPC 규약으로 통합',
      problem: '저장소, 외부 링크, 앱 종료 등 네이티브 기능이 늘면서 기능별 메시지와 콜백을 따로 두면 호출 규칙이 흩어질 수 있었습니다.',
      decision:
        '웹에서 RN으로 보내는 요청은 { id, method, payload }, RN에서 웹으로 돌려주는 응답은 window.__bridgeResolve(id, ok, value)로 통일했습니다. 요청별 Promise를 pending Map에 보관하고 3초 안에 응답이 없으면 회수합니다.',
      reasoning: '기능별 메시지는 비동기 기능이 늘수록 콜백 관리도 함께 늘어납니다. RPC로 통일하면 네이티브 기능을 같은 Promise 인터페이스로 다루고 새 기능도 메서드 추가로 확장할 수 있습니다. 규약은 RN_BRIDGE.md에 두 저장소의 공통 계약으로 적었습니다.',
      result: 'FCM 토큰과 앱 버전 조회까지 같은 규약에 연결했고, 구버전 앱에 없는 후속 메서드는 optional로 두고 존재 여부를 확인하는 호환 규칙도 추가했습니다.',
    },
  ],
};

export const garachato: ProjectContent = {
  id: 'garachato',
  name: '가라챠토',
  slug: 'garachato',
  tagline: '노래방 일본곡 번역과 곡 정보 서비스',
  pages: [
    {
      kind: 'intro',
      title: '프로젝트 소개',
      summary: 'TJ/금영 노래방에 수록된 일본곡의 제목과 가수명 번역, 노래방 번호와 곡 정보를 제공하는 서비스입니다. 웹과 앱인토스 미니앱 두 채널을 운영합니다.',
      stack: ['Next.js', 'Vite', 'TypeScript', 'Supabase', 'Gemini API', 'Vercel Cron'],
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
      +-----+-----+
      ↓           ↓
 TJ JSON API   KY HTML
      +-----+-----+
            ↓
       CrawledSong
            ↓
   공통 적재 파이프라인
            ↓
+-----------------------+
|  Supabase PostgreSQL  |
|  songs                |
|  karaoke_tracks       |
|  rank_history         |
|  search_songs RPC     |
+-----------+-----------+
      +-----+-----+
      ↓           ↓
  Vite SPA     Next.js
 Web+MiniApp  Metadata
`),
    },
    {
      kind: 'case',
      title: '전곡 검색 누락 해결',
      heading: '전곡 확장 후 검색 누락을 해결한 조회 구조 개선',
      problem: 'TOP 100에서 전곡으로 확장한 뒤 검색 노출을 점검했고, 새로 수집한 곡 대부분이 검색되지 않았습니다. 원본 테이블과 대조하니 기존 검색은 가공된 곡 정보 테이블에 연결된 곡만 조회하고 있었습니다.',
      decision:
        '곡 정보는 순차적으로 가공하되, 가공 전에도 제목과 가수명, 노래방 번호로 찾을 수 있도록 검색 함수에 전곡 테이블 조회를 추가했습니다. 곡 정보에 연결되지 않은 곡만 포함해 중복을 막고, 상세 정보가 없는 곡은 기본 정보 화면으로 보냈습니다.',
      reasoning:
        'AI 해설과 영상 정보 생성에는 API 호출량과 처리 시간의 제약이 있어 전곡을 한 번에 가공하기 어려웠습니다. 검색은 주로 제목과 가수명을 기준으로 이루어지므로, 전곡 테이블의 기본 정보만으로도 검색 기능을 제공할 수 있다고 판단했습니다.',
      result: '곡 정보 가공 전에도 새로 수집한 곡을 검색 결과에 노출하면서, TOP 100 차트에 진입한 적 없는 곡도 검색할 수 있게 됐습니다.',
    },
    {
      kind: 'case',
      title: '앱인토스 SPA 환경 대응',
      heading: '앱인토스의 SPA 환경에 맞춘 화면과 플랫폼 기능 분리',
      problem: '기존 Next.js 웹을 앱인토스 미니앱으로 확장하려 했지만, 미니앱은 SPA 방식의 배포만 지원해 서버 기반 데이터 조회와 라우팅을 그대로 쓸 수 없었습니다. 웹 화면까지 SPA로 전환하면 초기 HTML에 곡 정보가 담기지 않아 곡별 링크 미리보기를 잃는 문제도 있었습니다.',
      decision:
        '화면은 Vite SPA로 전환하되 서버 처리가 필요한 기능은 Next.js에 남겼습니다. 링크 미리보기용 곡별 메타데이터는 Next.js가 초기 HTML에 넣어 제공합니다. 웹과 미니앱은 화면 코드를 공유하고, 환경별로 달라지는 기능만 별도 모듈로 분리했습니다.',
      reasoning:
        '같은 화면의 변경을 두 번 반영하지 않으려면 공통 화면은 공유하고 환경별 기능만 분리하는 쪽이 맞았습니다. 링크 미리보기 수집기는 JavaScript를 실행하지 않고 초기 HTML의 메타데이터만 읽으므로, 화면 전체를 서버에서 그릴 필요 없이 곡별 메타데이터만 제공하면 된다고 판단했습니다.',
      result: '웹과 앱인토스가 같은 SPA 화면을 사용하는 구조로 전환해 서비스 범위를 미니앱까지 확장했습니다. 곡별 HTML 응답의 제목, 설명, OG 이미지를 확인하고 렌더링 후에도 제목이 일치하는지 검증해 링크 미리보기 정보가 유지되는 것을 확인했습니다.',
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
      stack: ['React Native (Expo)', 'TypeScript', 'Expo Router', 'NativeWind v4', 'Zustand', 'TanStack Query', 'Reanimated'],
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
+-------------------------+
|   React Native (Expo)   |
+------------+------------+
             |
      +------+------+
      ↓             ↓
 Screen / UX       Auth
      |             |
 Expo Router   OAuth / Token
      |             |
 Query Hooks   Refresh Lock
      |             |
      +------+------+
             ↓
  Mock | Fallback | Live
             ↓
        Backend API
`),
    },
    {
      kind: 'case',
      title: '동시 401 재발급 단일화',
      heading: '동시 401 토큰 재발급 단일화',
      problem: '액세스 토큰은 15분 뒤 만료되고 Refresh Token은 사용할 때마다 새 토큰으로 교체됩니다. 화면에서 여러 API가 동시에 401을 받으면 각 요청이 같은 Refresh Token으로 재발급을 시도해, 첫 요청 이후 나머지가 이미 폐기된 토큰을 사용하며 세션이 끊길 수 있었습니다.',
      decision: '진행 중인 재발급 Promise를 하나만 유지하고, 뒤따르는 요청은 새 재발급을 시작하지 않고 같은 결과를 기다리도록 했습니다. 401 요청은 재발급 후 한 번만 다시 시도합니다.',
      reasoning: '요청을 차례대로 실행하는 것만으로는 각 요청이 다시 Refresh Token을 쓸 수 있어 문제가 남습니다. 필요한 것은 순서가 아니라 여러 요청이 하나의 재발급 결과를 공유하는 것이었습니다. 네트워크 오류는 세션 만료로 보지 않고, 서버가 세션을 거절한 경우에만 토큰을 삭제합니다.',
      result: '여러 요청이 동시에 만료돼도 토큰 재발급은 한 번만 수행됩니다. API 계층은 화면 이동을 직접 처리하지 않고 세션 만료 콜백만 전달해 인증 처리와 라우팅도 분리했습니다.',
    },
    {
      kind: 'case',
      title: '참여 전 방 확인 API 조율',
      heading: '참여 전 방 확인을 위한 API 계약 조율',
      problem:
        '초대받은 사람이 방 정보를 먼저 확인하고 참여 여부를 선택하도록 설계했지만, 기존 API로는 참여 요청을 보낸 뒤에야 방 이름을 알 수 있었습니다. 임시로 안내 화면을 참여 이후에 뒀지만, 어느 방인지 모른 채 참여해야 하는 문제가 남았습니다.',
      decision:
        '참여 전에 방 정보를 조회하는 API를 제안하고, 방 이름, 인원, 정원, 만료 시각을 응답 예시로 정리해 백엔드에 전달했습니다. 일회용 초대 링크가 미리보기만으로 소진되지 않도록, 실제 참여가 완료됐을 때만 사용 처리하는 조건도 명시했습니다.',
      reasoning: '정보를 얻는 요청 자체가 참여를 실행하므로, 화면 문구나 순서를 바꾸는 것만으로는 참여 전 확인이 불가능했습니다. 의도한 사용자 흐름을 구현하려면 API 단계에서 조회와 참여를 분리해야 한다고 판단했습니다.',
      result: '추가된 API를 확인 화면에 연동해, 사용자가 방 정보를 본 뒤 입장하기를 눌렀을 때 참여 요청을 보내도록 변경했습니다. 정원이 찬 방은 입장을 막고, 사용할 수 없는 초대는 다른 링크를 입력하도록 안내했습니다.',
    },
  ],
};

/** 폴더에 보이는 순서. 브리프 4장의 순서 근거를 따른다 */
export const projectContents: ProjectContent[] = [fitpl, garachato, urido];

export function findProject(id: string): ProjectContent | undefined {
  return projectContents.find((p) => p.id === id);
}
