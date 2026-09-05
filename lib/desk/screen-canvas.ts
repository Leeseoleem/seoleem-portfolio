import { canvasPalette } from './palette';

/**
 * 모니터 화면(1024×768 캔버스)에 그리는 내용. 부팅 화면은 DOM 오버레이와 모니터 텍스처가
 * 같은 캔버스를 공유하므로, 카메라가 물러나는 순간 두 화면이 정확히 이어진다.
 */

export const SCREEN_W = 1024;
export const SCREEN_H = 768;

export const BOOT_DURATION = 6.8; // 초
const CHAR_RATE = 28; // 초당 글자 수

export interface IntroLine {
  at: number;
  text: string;
}

// 임시 문구. 실제 자기소개로 교체한다.
export const introLines: IntroLine[] = [
  { at: 0.6, text: '> seoleem 포트폴리오를 불러오는 중...' },
  { at: 1.6, text: '> 디자인과 개발을 잇는 프론트엔드 개발자' },
  { at: 2.8, text: '> Figma에서 시작해서 React로 끝낸다' },
  { at: 4.0, text: '> 출시한 앱 2개, 진행 중인 프로젝트 3개' },
  { at: 5.2, text: '> 책상을 준비하는 중...' },
];

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 한 칸의 바탕. 로고 네 칸이 모두 이 모양이다 */
function tile(ctx: CanvasRenderingContext2D, s: number, bg: string, edge?: string): void {
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, s, s, 4);
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** React: 원자 기호. 타원 셋과 가운데 점 */
function drawReactTile(ctx: CanvasRenderingContext2D, s: number): void {
  const c = canvasPalette.boot.tiles.react;
  tile(ctx, s, c.bg);
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = s * 0.055;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(s / 2, s / 2, s * 0.36, s * 0.14, (Math.PI / 3) * i + Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = c.fg;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

/** Next.js: 검은 칸에 흰 N. 오른쪽 세로획이 길게 빠지는 형태 */
function drawNextTile(ctx: CanvasRenderingContext2D, s: number): void {
  const c = canvasPalette.boot.tiles.next;
  tile(ctx, s, c.bg, c.edge);
  ctx.strokeStyle = c.fg;
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'butt';
  const l = s * 0.3;
  const r = s * 0.7;
  const t = s * 0.28;
  const b = s * 0.72;
  ctx.beginPath();
  ctx.moveTo(l, b);
  ctx.lineTo(l, t);
  ctx.lineTo(r, b + s * 0.06);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r, t);
  ctx.lineTo(r, s * 0.6);
  ctx.stroke();
}

/** TypeScript: 파란 칸에 TS */
function drawTsTile(ctx: CanvasRenderingContext2D, s: number, font: string): void {
  const c = canvasPalette.boot.tiles.ts;
  tile(ctx, s, c.bg);
  ctx.fillStyle = c.fg;
  ctx.font = `800 ${Math.round(s * 0.42)}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TS', s / 2, s * 0.56);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

/** Figma: 왼쪽 세 칸(빨강·보라·초록), 오른쪽 위 주황, 오른쪽 가운데 파란 원 */
function drawFigmaTile(ctx: CanvasRenderingContext2D, s: number): void {
  const c = canvasPalette.boot.tiles.figma;
  tile(ctx, s, c.bg);
  const u = s * 0.16; // 도형 한 변
  const x0 = s / 2 - u;
  const y0 = s / 2 - u * 1.5;
  const [red, purple, green, orange, blue] = c.shapes;
  const blob = (x: number, y: number, color: string, tl: number, tr: number, br: number, bl: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, u, u, [tl, tr, br, bl]);
    ctx.fill();
  };
  const r = u / 2;
  blob(x0, y0, red, r, 0, 0, r);
  blob(x0, y0 + u, purple, r, 0, 0, r);
  blob(x0, y0 + u * 2, green, r, 0, r, r);
  blob(x0 + u, y0, orange, 0, r, r, 0);
  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.arc(x0 + u * 1.5, y0 + u * 1.5, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 로고. 윈도우 깃발처럼 네 칸이 살짝 기울어 있지만, 칸마다 이 사이트를 만든 대표 툴이 들어간다.
 * 순서는 왼쪽 위부터 React, Next.js, TypeScript, Figma.
 */
function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, font: string): void {
  const pos: Array<[number, number]> = [[0, 0], [1, 0], [0, 1], [1, 1]];
  const draw = [drawReactTile, drawNextTile, (c: CanvasRenderingContext2D, size: number) => drawTsTile(c, size, font), drawFigmaTile];
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, -0.12, 0, 1, 0, 0);
  pos.forEach((p, i) => {
    ctx.save();
    ctx.translate(p[0] * (s + 4), p[1] * (s + 4));
    draw[i](ctx, s);
    ctx.restore();
  });
  ctx.restore();
}

/** object-fit: cover 뒤에 실제로 보이는 캔버스 영역. 좁은 화면에서 레이아웃을 그 안으로 줄인다. */
function visibleRect(viewportAspect: number): { x: number; y: number; w: number; h: number } {
  let vw = SCREEN_W;
  let vh = SCREEN_H;
  if (viewportAspect < SCREEN_W / SCREEN_H) vw = SCREEN_H * viewportAspect;
  else vh = SCREEN_W / viewportAspect;
  return { x: (SCREEN_W - vw) / 2, y: (SCREEN_H - vh) / 2, w: vw, h: vh };
}

export function drawBoot(ctx: CanvasRenderingContext2D, t: number, font: string, viewportAspect: number): void {
  const c = canvasPalette.boot;
  ctx.fillStyle = c.background;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const vis = visibleRect(viewportAspect);
  const BLOCK_W = 520;
  const BLOCK_H = 470;
  const scale = Math.min(1, (vis.w - 48) / BLOCK_W, (vis.h - 48) / BLOCK_H);
  ctx.save();
  ctx.translate(SCREEN_W / 2, SCREEN_H / 2);
  ctx.scale(scale, scale);
  ctx.translate(-BLOCK_W / 2, -BLOCK_H / 2);

  drawFlag(ctx, 40, 100, 36, font);
  ctx.fillStyle = c.text;
  ctx.font = `400 24px ${font}`;
  ctx.fillText('seoleem', 136, 118);
  ctx.font = `800 56px ${font}`;
  ctx.fillText('Portfolio', 136, 172);

  // 진행 바
  const bx = 150;
  const by = 220;
  const bw = 220;
  const bh = 16;
  ctx.strokeStyle = c.barBorder;
  ctx.lineWidth = 1.5;
  roundRect(ctx, bx, by, bw, bh, 4);
  ctx.stroke();
  ctx.save();
  roundRect(ctx, bx + 3, by + 3, bw - 6, bh - 6, 2);
  ctx.clip();
  const blockW = 10;
  const gap = 3;
  const span = bw + 4 * (blockW + gap);
  const off = (t * 170) % span;
  for (let i = 0; i < 3; i++) {
    const x = bx - 3 * (blockW + gap) + off + i * (blockW + gap);
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, c.barTop);
    g.addColorStop(1, c.barBottom);
    ctx.fillStyle = g;
    ctx.fillRect(x, by + 3, blockW, bh - 6);
  }
  ctx.restore();

  // 타자기 소개
  ctx.font = `16px ${font}`;
  ctx.fillStyle = c.intro;
  let y = 320;
  for (const line of introLines) {
    if (t < line.at) continue;
    const n = Math.min(line.text.length, Math.floor((t - line.at) * CHAR_RATE));
    let s = line.text.slice(0, n);
    if (n < line.text.length && Math.floor(t * 3) % 2 === 0) s += '_';
    ctx.fillText(s, 40, y);
    y += 26;
  }
  ctx.restore();

  // 푸터. 오른쪽 아래는 건너뛰기 버튼 자리라 비워 둔다
  ctx.fillStyle = c.footer;
  ctx.font = `12px ${font}`;
  ctx.fillText('Copyright © seoleem', vis.x + 32, vis.y + vis.h - 28);
}



/** 종료 화면. k는 0..1 진행도, 끝에서만 검게 덮는다. */
export function drawShutdown(ctx: CanvasRenderingContext2D, k: number, font: string): void {
  const c = canvasPalette.shutdown;
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  g.addColorStop(0, c.top);
  g.addColorStop(1, c.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.fillStyle = c.text;
  ctx.textAlign = 'center';
  ctx.font = `700 28px ${font}`;
  ctx.fillText('시스템을 종료하는 중...', SCREEN_W / 2, SCREEN_H / 2 - 10);
  ctx.font = `16px ${font}`;
  ctx.fillText('seoleem desk', SCREEN_W / 2, SCREEN_H / 2 + 26);
  ctx.textAlign = 'left';
  const dark = Math.min(1, Math.max(0, (k - 0.85) / 0.15));
  ctx.fillStyle = `rgba(0,0,0,${dark})`;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
}
