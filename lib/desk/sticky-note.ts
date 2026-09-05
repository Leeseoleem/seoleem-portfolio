import { canvasPalette } from './palette';

/**
 * 포스트잇 한 장. 색 바탕에 펜으로 그린 화살표 하나.
 * 글씨 대신 방향만 가리킨다. 아래쪽을 살짝 어둡게 해서 종이가 들려 있는 느낌을 준다.
 * angle은 화살표가 향하는 방향(라디안, 0 = 오른쪽, 양수 = 시계 방향).
 */
export function drawStickyNote(ctx: CanvasRenderingContext2D, size: number, color: string, angle: number) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  const shade = ctx.createLinearGradient(0, size * 0.6, 0, size);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, size, size);

  // 펜 선. 굵기는 일정하게, 끝은 둥글게. 몸통은 살짝 휘어 손으로 그은 느낌을 낸다
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(angle);
  ctx.strokeStyle = canvasPalette.sticky.ink;
  ctx.lineWidth = size * 0.045;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const len = size * 0.3;
  const head = size * 0.16;

  // 몸통: 뒤에서 앞으로, 가운데가 살짝 아래로 처진 곡선
  ctx.beginPath();
  ctx.moveTo(-len, size * 0.01);
  ctx.quadraticCurveTo(0, size * 0.05, len, 0);
  ctx.stroke();

  // 머리: 두 획. 약간 비대칭이어야 인쇄된 기호처럼 보이지 않는다
  ctx.beginPath();
  ctx.moveTo(len - head * 0.95, -head * 0.62);
  ctx.lineTo(len, 0);
  ctx.lineTo(len - head, head * 0.58);
  ctx.stroke();
  ctx.restore();
}
