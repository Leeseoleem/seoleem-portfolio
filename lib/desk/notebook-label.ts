import { canvasPalette } from './palette';

/**
 * 공책 표지에 붙은 라벨. 속지 표지와 같은 필기체로 제목 한 줄을 쓴다.
 *
 * 글꼴은 next/font가 만든 이름이라 코드에 적을 수 없다. `--font-script` 값을 그대로 받아 쓴다.
 * 글꼴이 아직 안 왔으면 대체 글꼴로 먼저 그리고, 다 오면 Notebook이 다시 부른다.
 */
export const NOTEBOOK_LABEL_TEXT = 'Design Notes';
/** 라벨 텍스처 크기. 실제 라벨(0.326 × 0.126m) 비율에 맞춘다 */
export const LABEL_TEX_W = 1024;
export const LABEL_TEX_H = 396;

/** <html>에 걸린 필기체 글꼴 이름. 없으면 대체 글꼴만 돌려준다 */
export function scriptFontFamily(): string {
  const fallback = "'Segoe Script', 'Bradley Hand', cursive";
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-script').trim();
  return v ? `${v}, ${fallback}` : fallback;
}

export function drawNotebookLabel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const p = canvasPalette.notebookLabel;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = p.paper;
  ctx.fillRect(0, 0, w, h);

  // 종이 결. 아주 옅은 가로줄 몇 개로 인쇄물이 아니라 붙인 종이처럼 보이게 한다
  ctx.fillStyle = p.grain;
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 1);

  const family = scriptFontFamily();
  // 폭의 76%에 맞춰 글자 크기를 정한다. 대체 글꼴로 그릴 때도 넘치지 않는다.
  // 필기체는 아래로 뻗는 획이 길어 크기를 라벨 높이의 절반으로 잡고 기준선을 조금 올린다
  const target = w * 0.76;
  let size = h * 0.5;
  ctx.font = `${size}px ${family}`;
  const measured = ctx.measureText(NOTEBOOK_LABEL_TEXT).width;
  if (measured > 0) size = Math.min(size, (size * target) / measured);
  ctx.font = `${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = p.ink;
  ctx.fillText(NOTEBOOK_LABEL_TEXT, w / 2, h * 0.46);
}
