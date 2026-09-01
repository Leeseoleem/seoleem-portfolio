import { SCREEN_H, SCREEN_W } from './screen-canvas';

/**
 * 클라이언트 전용 런타임 조각들.
 * - 씬 시계: DOM 오버레이와 3D 텍스처가 같은 시각을 봐야 부팅 화면이 이어진다.
 * - 공유 화면 캔버스: 부팅 오버레이(DOM)와 모니터 텍스처가 같은 캔버스를 그린다.
 * - 캔버스 폰트: next/font/local이 만든 실제 font-family 이름을 CSS 변수에서 읽는다.
 */

const t0 = typeof performance !== 'undefined' ? performance.now() : 0;

/** 페이지 스크립트가 로드된 뒤 흐른 시간(초) */
export function sceneTime(): number {
  return (performance.now() - t0) / 1000;
}

let screenCanvas: HTMLCanvasElement | null = null;

export function getScreenCanvas(): HTMLCanvasElement {
  if (!screenCanvas) {
    screenCanvas = document.createElement('canvas');
    screenCanvas.width = SCREEN_W;
    screenCanvas.height = SCREEN_H;
  }
  return screenCanvas;
}

const FALLBACK_FONT = 'Tahoma, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
let cachedFont: string | null = null;

/** 캔버스 fillText용 font-family 문자열. `--font-stardust` 변수가 있으면 그 값을 앞에 붙인다. */
export function getCanvasFont(): string {
  if (cachedFont) return cachedFont;
  if (typeof document === 'undefined') return FALLBACK_FONT;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-stardust').trim();
  if (!v) return FALLBACK_FONT;
  cachedFont = `${v}, ${FALLBACK_FONT}`;
  return cachedFont;
}

/** 폰트 로드가 끝나면 콜백을 한 번 부른다. 한 번만 그리는 캔버스(폰, 서류, 라벨)를 다시 그릴 때 쓴다. */
export function onFontsReady(cb: () => void): void {
  if (typeof document === 'undefined' || !document.fonts) return;
  void document.fonts.ready.then(() => cb());
}

let reducedMotion: boolean | null = null;

/** 모션 축소 설정. 매 프레임 호출되므로 결과를 캐시한다. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (reducedMotion === null) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = mq.matches;
    mq.addEventListener('change', (e) => {
      reducedMotion = e.matches;
    });
  }
  return reducedMotion;
}
