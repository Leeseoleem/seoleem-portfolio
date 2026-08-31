@AGENTS.md

# CLAUDE.md

seoleem portfolio 작업 시 Claude Code가 따르는 프로젝트 규칙.

---

## 프로젝트 개요

Windows XP 감성의 부팅 화면이 끝나면 카메라가 물러나 3D 책상이 나타나는 단일 페이지 포트폴리오다. 모니터(XP 스타일 창)에서 프로젝트를, 핸드폰(토스 스타일 UI)에서 출시 앱을, 서류와 공책에서 이력과 디자인 작업을 본다. 조명·고양이·본체 전원 같은 인터랙션과 효과음이 있고, 채용 담당자가 보는 것이 목적이다.
블로그나 CMS가 아니다. 글을 계속 쌓는 곳이 아니라 한 번 둘러보는 전시 공간이다.

- 워드마크·표기: 영문 소문자 `seoleem`. 대문자 시작(Seoleem)이나 `Seorim` 표기는 쓰지 않는다. 사이트 제목은 `seoleem desk`
- 역할: 기획·디자인·프론트엔드 전부 단독. 협업자 없음
- 데이터 모델: 미정. DB 없이 정적 데이터 파일(프로젝트 / 출시 앱 / 디자인 작업 / 이력 항목)로 관리할 예정

---

## 기술 스택

- 프레임워크: Next.js 16.3.3 (App Router, Turbopack), React 19.2.8 / react-dom 19.2.8
- 언어: TypeScript ^5 (strict), path alias `@/*` → 프로젝트 루트
- 라우팅: App Router (`app/`), 단일 페이지
- 스타일링: Tailwind CSS ^4 (`@tailwindcss/postcss` ^4, `app/globals.css`의 `@theme inline`)
- 상태관리: zustand ^5.0.15
- 3D: three ^0.185.1, @react-three/fiber ^9.7.0, @react-three/drei ^10.7.8, @types/three ^0.185.4
- 린트: eslint ^9 + eslint-config-next 16.3.3 (flat config, `eslint.config.mjs`)
- 패키지 매니저: npm (`package-lock.json`)
- 빌드·배포: `next build`, Vercel 배포 예정
- 백엔드: 없음

> 버전은 package.json 기준. 이 문서와 실제가 다르면 package.json이 맞다.

---

## 명령어

```bash
npm install            # 의존성 설치 (스크립트 아님)
npm run dev            # 개발 서버 (dev: next dev)
npm run build          # 프로덕션 빌드 (build: next build)
npm run start          # 빌드 결과 실행 (start: next start)
npm run lint           # ESLint (lint: eslint)
npm run typecheck      # 타입 검사 (typecheck: tsc --noEmit)
```

---

## 폴더 구조

```
app/                       # App Router. layout.tsx, page.tsx, globals.css, favicon.ico (create-next-app 기본 상태)
public/                    # 정적 파일. 현재 create-next-app 기본 svg만 있음
docs/
  commit-convention.md     # 커밋 컨벤션 원본
  code-review.md           # 코드 리뷰 절차와 리포트 양식
  log/                     # 사이클 회고 (TEMPLATE.md, decision-backlog.md)
.github/
  pull_request_template.md # PR 템플릿
.claude/
  local/                   # 이그노어. PR 봇 리뷰 규칙, 개인 메모 양식
AGENTS.md                  # Next.js 16이 자동 생성·갱신하는 에이전트 규칙. 손대지 않는다
CLAUDE.md                  # 이 문서. 첫 줄에서 AGENTS.md를 참조한다
next.config.ts  eslint.config.mjs  postcss.config.mjs  tsconfig.json  package.json

# 코드 작업 시 추가 예정: components/ (UI·3D 컴포넌트), lib/ (유틸·사운드), stores/ (zustand), data/ (정적 콘텐츠)
```

---

## 디자인 토큰

토큰 정의 위치: `app/globals.css`의 `:root` CSS 변수와 `@theme inline`. 사용 방식: Tailwind className (`bg-background` 등).

- 색: 현재 create-next-app 기본값만 있다 (`--background` #ffffff / #0a0a0a, `--foreground` #171717 / #ededed). 실제 팔레트로 교체 예정. 두 체계로 분리한다. `xp-*`(모니터 안 UI: 회색 크롬 + 파랑, 실제 Windows XP 룩) / `toss-*`(핸드폰 UI: 토스 스타일 모던 UI). 공통 브랜드·HUD 토큰은 별도 접두
- radius: 미정. 확정 후 여기 기록
- 타이포: 미정. 확정 후 여기 기록. 폰트는 PF스타더스트 3.0(Regular / Bold / ExtraBold) 사용 예정
- 그림자: 미정. 확정 후 여기 기록

토큰 확정 전에도 하드코딩 색상 금지는 동일하게 적용한다. 3D 씬의 재질 색은 `lib/` 아래 팔레트 상수로 모아 관리한다.

---

## 작업 규칙

### 브랜치 전략
- `main`: 배포 브랜치. Vercel 프로덕션이 바라본다. 직접 커밋 금지
- `dev`: 통합 브랜치. 작업 브랜치의 PR을 여기로 합친다
- `feat/xxx`, `fix/xxx`, `chore/xxx`: 작업 브랜치. `dev`에서 파고 `dev`로 PR
- 배포는 `dev` → `main` PR로 한다

### 커밋
- 형식: `태그: 설명` (50자 이내, 반말 문어체)
- 태그: feat / fix / refactor / style / chore / docs / test (7종, 신설 금지)
- 단계별로 커밋. 여러 변경 섞기 금지
- AI 트레일러·푸터 금지 (`Co-Authored-By`, `Generated with` 등)
- 상세: `docs/commit-convention.md`

### 코드 리뷰
- `feat/xxx` → `dev`, `dev` → `main` PR은 머지 전 리뷰 (5줄 이내·문서만 변경 등은 스킵 가능)
- 단 CI·권한·시크릿·의존성 추가 변경은 줄 수와 무관하게 반드시 리뷰. 위험은 diff 크기와 무관하다
- 검증 명령: `npm run typecheck`, `npm run lint`
- 리포트: PR 코멘트에 남기고, 파일 사본은 `.claude/local/reviews/{브랜치명}.md` (이그노어)
- 상세: `docs/code-review.md`

### 코딩 컨벤션
- TypeScript strict 기준. `any` 지양, 불가피하면 주석으로 사유 명시
- 색상·간격 하드코딩 금지. 토큰·변수만 사용
- 데이터 필드 변경 시 렌더·모달 등 참조 지점도 함께 갱신
- 컴포넌트 PascalCase, 훅 `use` 접두, 유틸 camelCase. named export 기본 (프레임워크가 default export를 요구하는 라우트·페이지 파일은 예외)
- Next.js 16은 학습 데이터의 15와 API가 다르다. 새 API를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 문서를 먼저 읽는다 (`AGENTS.md` 규칙)
- Server / Client Component 경계를 지킨다. three, R3F, drei, Web Audio, `window`를 쓰는 컴포넌트는 `'use client'`이고, 3D 캔버스는 `next/dynamic`의 `ssr: false`로 불러온다
- 서버 전용 값은 `NEXT_PUBLIC_` 접두로 노출하지 않는다 (현재 환경 변수 없음)
- 효과음은 사용자 제스처 이후에만 재생된다. 첫 상호작용 전 자동 재생을 전제로 짜지 않는다
- three 리소스(geometry, material, texture)는 컴포넌트 언마운트 시 dispose한다. `useFrame` 안에서 객체를 새로 만들지 않는다

---

## 응답 규칙 (Claude Code)

- 한국어로 응답
- 이모지 사용 금지
- 커밋·주석·내부 문서는 반말 문어체. 외부 공유·제출 문서만 존댓말체
- 사람을 지칭할 때 이름·대명사를 쓰지 않는다. 사용자 본인은 "사용자", 협업자가 생기면 "팀원"으로 지칭한다
- 한 번에 하나의 화면·결정 단위로 작업. 명시한 범위를 넘어 앞서가지 않는다
- 큰 데이터 모델 변경은 명시적 요청이 있을 때만
- 코드 생략 금지. "...나머지 동일", "// 기존 코드 유지" 형태로 잘라내지 않는다

---

## 하지 말 것

- `any` 사용
- 색상·간격 하드코딩
- 클릭 핸들러 달린 `div` (`button` 사용)
- 요청 범위 밖 리팩토링
- 상의 없는 새 라이브러리 추가
- 검증 명령 실패 상태로 커밋

---

## 사이클 회고 프로세스

한 사이클(하나의 기능·화면 묶음 작업)이 끝나면 회고 로그를 남긴다.
다음 사이클에서 맥락을 빠르게 복원하고, 포트폴리오 작성 시 재료로 쓰기 위함이다.

### 사이클 단위
"부팅 화면 구현", "책상 씬 구현", "핸드폰 UI 구현"처럼 의미 있는 작업 묶음 하나 = 한 사이클.
브랜치(feature) 하나가 대략 한 사이클에 대응한다.

### 작성 시점·위치
- 시점: 사이클의 마지막 PR을 `dev`에 머지한 직후
- 회고: `docs/log/cycle-NN.md` (번호 2자리 순차, 커밋)
- 양식: `docs/log/TEMPLATE.md` 복사해서 작성
- 개인 메모: `.claude/local/notes/cycle-NN-note.md` (이그노어, 포폴 후보·솔직한 회고)

### 기록 항목
- 무엇을 했는지 (구현·결정 요약)
- 왜 그렇게 정했는지 (주요 결정과 근거)
- 막혔던 점과 해결 (트러블슈팅)
- 다음 사이클 메모 (보류 항목, 이어서 할 것)

### decision-backlog
사이클 중 보류한 항목은 `docs/log/decision-backlog.md`에 누적한다.
회고의 "다음 사이클 메모"와 함께 후속 작업의 진입점이 된다.

---

## 로컬 전용 문서 (이그노어)

`.claude/local/`은 `.gitignore` 대상이다. 레포에 올리지 않는다.

| 경로 | 내용 |
| --- | --- |
| `.claude/local/PR_REVIEW_RULES.md` | PR 봇 리뷰를 어떻게 판단·브리핑할지에 대한 개인 작업 규칙 |
| `.claude/local/reviews/{브랜치명}.md` | 코드 리뷰 리포트 사본 (정본은 PR 코멘트). 첫 리뷰 때 폴더가 생긴다 |
| `.claude/local/notes/cycle-NN-note.md` | 사이클 개인 메모, 포폴 후보 (양식: 같은 폴더의 `cycle-note-TEMPLATE.md`) |

Claude Code는 이 폴더의 문서도 프로젝트 규칙으로 함께 읽는다.
