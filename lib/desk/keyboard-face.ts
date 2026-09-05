import { canvasPalette } from './palette';

/**
 * 키보드 상판에 그리는 키 배열. 키를 하나씩 모델링하면 메시가 백 개 넘게 늘어나므로
 * 캔버스에 그려 텍스처로 얹는다.
 *
 * 폭의 단위는 u다. 일반 키가 1u이고 한 줄은 항상 15u가 되도록 맞춰져 있다.
 */
const ROWS: { h: number; keys: number[] }[] = [
  // Esc, F1~F12, Del, Home
  { h: 0.7, keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  // 숫자열 + Backspace
  { h: 1, keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2] },
  // Tab ~ 백슬래시
  { h: 1, keys: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
  // CapsLock ~ Enter
  { h: 1, keys: [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25] },
  // Shift ~ Shift, 오른쪽 끝은 위쪽 방향키
  { h: 1, keys: [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75, 1] },
  // 최하단: 보조키 + 스페이스 + 방향키
  { h: 1, keys: [1.25, 1.25, 1.25, 6, 1.25, 1, 1, 1, 1] },
];

export const KEY_COLS = 15;
export const KEY_ROWS = ROWS.reduce((sum, r) => sum + r.h, 0);
/** 키 사이 여백. u 단위 */
const GAP = 0.12;

/** 상판 전체를 키 배열로 채운다. 캔버스 크기는 KEY_COLS : KEY_ROWS 비율이어야 한다 */
export function drawKeyboardFace(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const p = canvasPalette.keyboard;
  const u = w / KEY_COLS;
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = p.keyEdge;
  ctx.lineWidth = Math.max(1, u * 0.045);

  let y = 0;
  for (const row of ROWS) {
    let x = 0;
    for (const kw of row.keys) {
      const kx = x * u + (GAP * u) / 2;
      const ky = y * u + (GAP * u) / 2;
      const kwPx = kw * u - GAP * u;
      const khPx = row.h * u - GAP * u;
      ctx.fillStyle = p.key;
      ctx.beginPath();
      ctx.roundRect(kx, ky, kwPx, khPx, u * 0.14);
      ctx.fill();
      ctx.stroke();
      x += kw;
    }
    y += row.h;
  }
}
