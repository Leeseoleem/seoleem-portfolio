import { canvasPalette } from './palette';
import { roundRect } from './screen-canvas';

/**
 * 핸드폰 화면(360×780 캔버스). 홈 / 설정 / 앱 임시 화면 세 가지를 그리고, 탭 좌표를 판정한다.
 * 실제 토스 스타일 UI는 별도 작업으로 대체될 예정이며, 여기는 3D 씬용 임시 화면이다.
 */

export const PHONE_W = 360;
export const PHONE_H = 780;

export interface PhoneApp {
  name: string;
  color: string;
  glyph: string;
  action?: 'settings';
  url?: string;
}

// 임시 앱 목록. 실제 아이콘과 스토어 링크로 교체한다.
export const apps: PhoneApp[] = [
  { name: '가라챠토', color: '#ff7a59', glyph: '가' },
  { name: 'fitpl', color: '#4f8cff', glyph: 'F' },
  { name: '우리두', color: '#ffb547', glyph: '우' },
  { name: '채엥', color: '#5cc48a', glyph: '채' },
  { name: '채식어디', color: '#7bc96f', glyph: '채' },
  { name: '생일 카드', color: '#f06292', glyph: '생' },
  { name: '유리병', color: '#4dd0e1', glyph: '유' },
  { name: '설정', color: '#8e9aa6', glyph: '⚙', action: 'settings' },
];

// 하단 독. url이 비어 있으면 아직 연결 전이라 임시 화면을 띄운다.
export const dock: PhoneApp[] = [
  { name: 'Velog', color: '#20c997', glyph: 'V', url: '' },
  { name: 'LinkedIn', color: '#0a66c2', glyph: 'in', url: '' },
  { name: 'GitHub', color: '#24292e', glyph: 'G', url: 'https://github.com/Leeseoleem' },
];

export type PhoneScreen = 'home' | 'settings' | 'app';
export type PhoneAction = 'settings' | 'home' | 'app' | 'link' | 'toggle-sound' | 'toggle-night';

export interface HitRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  action: PhoneAction;
  app?: PhoneApp;
}

export interface PhoneUIState {
  screen: PhoneScreen;
  app: PhoneApp | null;
  soundOn: boolean;
  isNight: boolean;
}

const ICON = 64;
const COLS = 4;
const GRID_X = 24;
const GRID_Y = 150;
const GAP_X = (PHONE_W - GRID_X * 2 - ICON * COLS) / (COLS - 1);
const GAP_Y = 104;

function timeLabel(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function drawStatusBar(c: CanvasRenderingContext2D, dark: boolean, font: string): void {
  c.fillStyle = dark ? canvasPalette.phone.statusDark : canvasPalette.phone.statusLight;
  c.font = `700 16px ${font}`;
  c.textAlign = 'left';
  c.fillText(timeLabel(), 28, 40);
  for (let i = 0; i < 4; i++) c.fillRect(PHONE_W - 96 + i * 7, 40 - 6 - i * 3, 4, 6 + i * 3);
  c.strokeStyle = c.fillStyle;
  c.lineWidth = 1.5;
  roundRect(c, PHONE_W - 56, 26, 26, 14, 3);
  c.stroke();
  c.fillRect(PHONE_W - 30, 30, 2, 6);
  c.fillRect(PHONE_W - 53, 29, 18, 8);
}

function drawIcon(c: CanvasRenderingContext2D, x: number, y: number, size: number, app: PhoneApp, labelColor: string | null, font: string): void {
  c.fillStyle = app.color;
  roundRect(c, x, y, size, size, size * 0.26);
  c.fill();
  const hl = c.createLinearGradient(0, y, 0, y + size);
  hl.addColorStop(0, 'rgba(255,255,255,0.22)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hl;
  roundRect(c, x, y, size, size, size * 0.26);
  c.fill();
  c.fillStyle = '#ffffff';
  c.font = `800 ${Math.round(size * 0.42)}px ${font}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(app.glyph, x + size / 2, y + size / 2 + 2);
  c.textBaseline = 'alphabetic';
  if (labelColor) {
    c.fillStyle = labelColor;
    c.font = `12px ${font}`;
    c.fillText(app.name, x + size / 2, y + size + 18);
  }
  c.textAlign = 'left';
}

function drawHome(c: CanvasRenderingContext2D, font: string): HitRegion[] {
  const hits: HitRegion[] = [];
  const p = canvasPalette.phone;
  const g = c.createLinearGradient(0, 0, PHONE_W, PHONE_H);
  g.addColorStop(0, p.wallpaperA);
  g.addColorStop(0.55, p.wallpaperB);
  g.addColorStop(1, p.wallpaperC);
  c.fillStyle = g;
  c.fillRect(0, 0, PHONE_W, PHONE_H);
  const blob = (x: number, y: number, r: number, col: string) => {
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(80, 620, 200, p.blobWarm);
  blob(300, 200, 180, p.blobCool);
  drawStatusBar(c, false, font);

  c.fillStyle = p.label;
  c.font = `800 44px ${font}`;
  c.fillText(timeLabel(), 28, 108);
  c.font = `14px ${font}`;
  const d = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  c.fillText(`${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`, 30, 130);

  apps.forEach((app, i) => {
    const x = GRID_X + (i % COLS) * (ICON + GAP_X);
    const y = GRID_Y + Math.floor(i / COLS) * GAP_Y;
    drawIcon(c, x, y, ICON, app, p.label, font);
    hits.push({ x, y, w: ICON, h: ICON + 22, action: app.action ?? 'app', app });
  });

  c.fillStyle = p.dock;
  roundRect(c, 18, PHONE_H - 118, PHONE_W - 36, 92, 28);
  c.fill();
  dock.forEach((app, i) => {
    const x = 18 + 34 + i * ((PHONE_W - 36 - 68 - 58) / 2);
    const y = PHONE_H - 118 + 17;
    drawIcon(c, x, y, 58, app, null, font);
    hits.push({ x, y, w: 58, h: 58, action: app.url ? 'link' : 'app', app });
  });

  c.fillStyle = p.homeIndicatorLight;
  roundRect(c, PHONE_W / 2 - 60, PHONE_H - 12, 120, 5, 3);
  c.fill();
  return hits;
}

function drawSettings(c: CanvasRenderingContext2D, state: PhoneUIState, font: string): HitRegion[] {
  const hits: HitRegion[] = [];
  const p = canvasPalette.phone;
  c.fillStyle = p.settingsBackground;
  c.fillRect(0, 0, PHONE_W, PHONE_H);
  drawStatusBar(c, true, font);
  c.fillStyle = p.settingsLink;
  c.font = `16px ${font}`;
  c.fillText('< 홈', 24, 86);
  hits.push({ x: 10, y: 60, w: 90, h: 40, action: 'home' });
  c.fillStyle = p.settingsText;
  c.font = `800 30px ${font}`;
  c.fillText('설정', 24, 136);

  const rows: Array<{ label: string; on: boolean; action: PhoneAction }> = [
    { label: '효과음', on: state.soundOn, action: 'toggle-sound' },
    { label: '밤 모드', on: state.isNight, action: 'toggle-night' },
  ];
  c.fillStyle = p.settingsCard;
  roundRect(c, 20, 170, PHONE_W - 40, rows.length * 64, 16);
  c.fill();
  rows.forEach((r, i) => {
    const y = 170 + i * 64;
    if (i > 0) {
      c.fillStyle = p.settingsDivider;
      c.fillRect(40, y, PHONE_W - 60, 1);
    }
    c.fillStyle = p.settingsText;
    c.font = `16px ${font}`;
    c.fillText(r.label, 40, y + 38);
    const tx = PHONE_W - 40 - 60;
    const ty = y + 18;
    c.fillStyle = r.on ? p.toggleOn : p.toggleOff;
    roundRect(c, tx, ty, 60, 30, 15);
    c.fill();
    c.fillStyle = p.toggleKnob;
    c.beginPath();
    c.arc(r.on ? tx + 45 : tx + 15, ty + 15, 12, 0, Math.PI * 2);
    c.fill();
    hits.push({ x: 20, y, w: PHONE_W - 40, h: 64, action: r.action });
  });
  c.fillStyle = p.settingsMuted;
  c.font = `12px ${font}`;
  c.fillText('효과음 설정은 이 기기에만 기억된다.', 40, 170 + rows.length * 64 + 28);
  c.fillStyle = p.homeIndicatorDark;
  roundRect(c, PHONE_W / 2 - 60, PHONE_H - 12, 120, 5, 3);
  c.fill();
  return hits;
}

function drawApp(c: CanvasRenderingContext2D, app: PhoneApp, font: string): HitRegion[] {
  const hits: HitRegion[] = [];
  const p = canvasPalette.phone;
  c.fillStyle = p.appBackground;
  c.fillRect(0, 0, PHONE_W, PHONE_H);
  drawStatusBar(c, false, font);
  c.fillStyle = p.appMuted;
  c.font = `16px ${font}`;
  c.fillText('< 홈', 24, 86);
  hits.push({ x: 10, y: 60, w: 90, h: 40, action: 'home' });
  drawIcon(c, PHONE_W / 2 - 44, 200, 88, app, null, font);
  c.fillStyle = p.appText;
  c.font = `800 26px ${font}`;
  c.textAlign = 'center';
  c.fillText(app.name, PHONE_W / 2, 340);
  c.fillStyle = p.appMuted;
  c.font = `14px ${font}`;
  c.fillText('앱 미리보기와 스토어 링크가 들어갈 자리', PHONE_W / 2, 372);
  c.textAlign = 'left';
  c.fillStyle = p.homeIndicatorLight;
  roundRect(c, PHONE_W / 2 - 60, PHONE_H - 12, 120, 5, 3);
  c.fill();
  return hits;
}

/** 현재 화면을 그리고 탭 가능 영역을 돌려준다. */
export function drawPhone(c: CanvasRenderingContext2D, state: PhoneUIState, font: string): HitRegion[] {
  if (state.screen === 'settings') return drawSettings(c, state, font);
  if (state.screen === 'app' && state.app) return drawApp(c, state.app, font);
  return drawHome(c, font);
}

/** 평면 uv(왼쪽 아래 원점) → 캔버스 좌표로 바꿔 영역을 찾는다. */
export function hitTestPhone(hits: HitRegion[], uvX: number, uvY: number): HitRegion | null {
  const px = uvX * PHONE_W;
  const py = (1 - uvY) * PHONE_H;
  return hits.find((h) => px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) ?? null;
}
