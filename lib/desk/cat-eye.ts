import { canvasPalette } from './palette';

/**
 * 고양이 눈 2D 그림. 투명 캔버스에 그려서 머리 곡면 패치에 얹는다.
 * 형태: 윗선은 날렵한 얕은 호, 아랫선은 눈 폭 전체에 걸친 반원, 안쪽 끝이 바깥 끝보다 아래,
 * 바깥 끝은 길게 뻗은 뾰족한 꼬리. 감을 때는 눈꺼풀 없이 세로로 접히다가 곡선 하나가 된다.
 */

export const EYE_W = 220;
export const EYE_H = 210;

const CX = EYE_W / 2 - 10;
const CY = EYE_H / 2 - 22;
const RX = 62;
const RY = 40;

function corners() {
  return { ox: CX + RX * 1.32, outY: CY - RY * 0.6, ix: CX - RX, inY: CY + RY * 0.7 };
}

function upperLine(c: CanvasRenderingContext2D): void {
  const { ox, outY, ix, inY } = corners();
  c.beginPath();
  c.moveTo(ix, inY);
  c.bezierCurveTo(CX - RX * 0.8, CY - RY * 0.7, CX + RX * 0.6, CY - RY * 0.95, ox, outY);
}

function lowerLine(c: CanvasRenderingContext2D): void {
  const { ox, outY, ix, inY } = corners();
  const ex = CX + RX;
  const eY = CY - RY * 0.1;
  c.beginPath();
  c.moveTo(ox, outY);
  c.lineTo(ex, eY);
  // 눈 안쪽 끝과 바깥 가장자리를 잇는 현 위의 반원
  const dx = ix - ex;
  const dy = inY - eY;
  const len = Math.hypot(dx, dy);
  const r = len / 2;
  const nx = -dy / len;
  const ny = dx / len;
  const sign = ny > 0 ? 1 : -1;
  const k = 1.3333 * r;
  c.bezierCurveTo(ex + nx * k * sign, eY + ny * k * sign, ix + nx * k * sign, inY + ny * k * sign, ix, inY);
}

function eyePath(c: CanvasRenderingContext2D): void {
  const { ox, outY, ix, inY } = corners();
  const ex = CX + RX;
  const eY = CY - RY * 0.1;
  c.beginPath();
  c.moveTo(ix, inY);
  c.bezierCurveTo(CX - RX * 0.8, CY - RY * 0.7, CX + RX * 0.6, CY - RY * 0.95, ox, outY);
  c.lineTo(ex, eY);
  const dx = ix - ex;
  const dy = inY - eY;
  const len = Math.hypot(dx, dy);
  const r = len / 2;
  const nx = -dy / len;
  const ny = dx / len;
  const sign = ny > 0 ? 1 : -1;
  const k = 1.3333 * r;
  c.bezierCurveTo(ex + nx * k * sign, eY + ny * k * sign, ix + nx * k * sign, inY + ny * k * sign, ix, inY);
  c.closePath();
}

/**
 * @param blink 0 = 뜬 눈, 1 = 감은 눈
 * @param slit 0 = 둥근 동공, 1 = 세로 슬릿
 */
export function drawCatEye(c: CanvasRenderingContext2D, blink: number, slit: number): void {
  const p = canvasPalette.catEye;
  c.clearRect(0, 0, EYE_W, EYE_H);
  const open = 1 - blink;
  if (open > 0.06) {
    c.save();
    c.translate(CX, CY);
    c.scale(1, open);
    c.translate(-CX, -CY);
    c.save();
    eyePath(c);
    c.clip();
    const g = c.createRadialGradient(CX, CY + 16, 6, CX, CY + 16, 70);
    g.addColorStop(0, p.irisCenter);
    g.addColorStop(0.55, p.irisMid);
    g.addColorStop(1, p.irisEdge);
    c.fillStyle = g;
    c.fillRect(0, 0, EYE_W, EYE_H);
    const pr = RY * 0.6;
    const prx = pr * (1 - slit) + 4 * slit;
    const pry = pr + RY * 0.4 * slit;
    c.fillStyle = p.pupil;
    c.beginPath();
    c.ellipse(CX, CY + 16, prx, pry, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = p.shine;
    c.beginPath();
    c.ellipse(CX - pr * 0.4, CY + 16 - pr * 0.45, 6, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.lineJoin = 'round';
    c.lineCap = 'round';
    upperLine(c);
    c.strokeStyle = p.lineDark;
    c.lineWidth = 4.5;
    c.stroke();
    lowerLine(c);
    c.strokeStyle = p.lineFaint;
    c.lineWidth = 2;
    c.stroke();
    c.restore();
  } else {
    // 감은 눈: 뜬 눈 영역의 세로 중앙 높이에 둥근 곡선 하나
    c.strokeStyle = p.lineDark;
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(CX - RX, CY + 34);
    c.quadraticCurveTo(CX + RX * 0.1, CY - 20, CX + RX * 1.32, CY + 6);
    c.stroke();
  }
}
