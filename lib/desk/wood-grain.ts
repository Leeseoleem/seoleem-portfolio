import { canvasPalette } from './palette';

/**
 * 책상 윗면에 얹는 나무결. 사진 대신 캔버스에 그린다.
 *
 * 화이트 워시 오크를 노린다. 결은 가로로 길게 흐르고, 색 차이는 아주 작다.
 * 바탕색은 3D 재질의 나무색과 같아서 결이 없는 둥근 모서리와 경계가 생기지 않는다.
 * 난수는 고정 시드를 써서 새로 고쳐도 같은 무늬가 나온다.
 */

/** 시드 고정 난수. 매번 같은 결이 나와야 하므로 Math.random을 쓰지 않는다 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function drawWoodGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const p = canvasPalette.wood;
  const rand = rng(20260902);

  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, w, h);

  // 판 두 장이 이어진 자리. 아주 얇은 한 줄만
  ctx.strokeStyle = p.seam;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(1, h * 0.0015);
  for (const y of [h * 0.34, h * 0.67]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 결. 가로로 흐르는 완만한 물결선을 여러 겹 겹친다
  const lines = 230;
  for (let i = 0; i < lines; i++) {
    const y0 = rand() * h;
    const dark = rand() < 0.6;
    ctx.strokeStyle = dark ? p.grainDark : p.grainLight;
    ctx.globalAlpha = (dark ? 0.26 : 0.3) * (0.5 + rand() * 0.5);
    ctx.lineWidth = Math.max(1, h * (0.001 + rand() * 0.0035));

    // 진폭과 주기를 선마다 다르게. 같은 흐름 안에서 살짝씩 어긋나야 결처럼 보인다
    const amp = h * (0.004 + rand() * 0.012);
    const freq = 1.5 + rand() * 2.5;
    const phase = rand() * Math.PI * 2;
    const len = w * (0.35 + rand() * 0.65);
    const x0 = rand() * (w - len * 0.5) - len * 0.25;

    ctx.beginPath();
    const steps = 48;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = x0 + t * len;
      const y = y0 + Math.sin(t * Math.PI * freq + phase) * amp + Math.sin(t * Math.PI * freq * 3.1 + phase) * amp * 0.25;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 옹이 근처의 둥근 결 몇 개. 너무 많으면 얼룩처럼 보인다
  for (let k = 0; k < 3; k++) {
    const cx = w * (0.15 + rand() * 0.7);
    const cy = h * (0.2 + rand() * 0.6);
    const rings = 5 + Math.floor(rand() * 4);
    for (let r = 0; r < rings; r++) {
      const rx = w * (0.03 + r * 0.018) * (0.8 + rand() * 0.4);
      const ry = h * (0.012 + r * 0.007);
      ctx.strokeStyle = p.grainDark;
      ctx.globalAlpha = 0.1 + rand() * 0.06;
      ctx.lineWidth = Math.max(1, h * 0.0012);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}
