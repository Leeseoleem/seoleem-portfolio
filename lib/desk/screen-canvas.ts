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

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const colors = canvasPalette.boot.flag;
  const pos: Array<[number, number]> = [[0, 0], [1, 0], [0, 1], [1, 1]];
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, -0.12, 0, 1, 0, 0);
  pos.forEach((p, i) => {
    ctx.fillStyle = colors[i];
    roundRect(ctx, p[0] * (s + 4), p[1] * (s + 4), s, s, 4);
    ctx.fill();
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

  drawFlag(ctx, 40, 100, 36);
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
