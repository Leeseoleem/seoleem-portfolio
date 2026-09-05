import { canvasPalette } from './palette';

/**
 * 공책 표지에 입히는 가죽 결. 이어 붙여 쓰는(타일) 텍스처라 네 변이 맞물려야 한다.
 * 알갱이 하나를 그릴 때 가장자리에 걸치면 반대편에도 같은 것을 그려서 경계가 보이지 않게 한다.
 * 색과 요철(bump)에 같은 그림을 쓴다. 밝은 알갱이는 도드라지고 어두운 틈은 들어간다.
 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function drawLeather(ctx: CanvasRenderingContext2D, size: number) {
  const p = canvasPalette.leather;
  const rand = rng(7331);
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, size, size);

  /** 타일 경계에 걸친 알갱이를 반대편에도 그린다 */
  const dot = (x: number, y: number, r: number) => {
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const cx = x + dx;
        const cy = y + dy;
        if (cx < -r || cy < -r || cx > size + r || cy > size + r) continue;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * (0.7 + rand() * 0.5), rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // 어두운 틈. 촘촘하고 작다
  ctx.fillStyle = p.dark;
  for (let i = 0; i < 2600; i++) {
    ctx.globalAlpha = 0.08 + rand() * 0.14;
    dot(rand() * size, rand() * size, size * (0.004 + rand() * 0.009));
  }
  // 밝은 알갱이. 더 크고 드물다
  ctx.fillStyle = p.light;
  for (let i = 0; i < 1400; i++) {
    ctx.globalAlpha = 0.06 + rand() * 0.12;
    dot(rand() * size, rand() * size, size * (0.006 + rand() * 0.012));
  }
  // 아주 얇은 주름 몇 줄
  ctx.strokeStyle = p.dark;
  ctx.lineWidth = Math.max(1, size * 0.0015);
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.05 + rand() * 0.07;
    const x0 = rand() * size;
    const y0 = rand() * size;
    const len = size * (0.05 + rand() * 0.12);
    const a = rand() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + Math.cos(a + 0.4) * len * 0.5, y0 + Math.sin(a + 0.4) * len * 0.5, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
