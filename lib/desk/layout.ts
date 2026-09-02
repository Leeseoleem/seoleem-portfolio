import type { CameraPose } from '@/stores/useDeskStore';
import { KEY_COLS, KEY_ROWS } from './keyboard-face';

/** 책상 씬의 치수와 배치. 오브젝트 컴포넌트와 카메라 리그가 같은 숫자를 본다. 단위는 미터에 가깝다. */

export const DESK_Y = 1.25; // 상판 중심 높이
export const DESK_THICKNESS = 0.08;
export const TOP = DESK_Y + DESK_THICKNESS / 2; // 상판 윗면
export const DESK_W = 4.2;
export const DESK_D = 2.0;

// 모니터 화면(4:3). 부팅 화면이 여기 그려지고 카메라 시작 위치의 기준이 된다.
export const SCREEN_3D_W = 1.2;
export const SCREEN_3D_H = 0.9;
// 앞 테두리 앞면(z = 0.1) 바로 뒤. 더 깊이 물리면 비스듬히 볼 때 확대 화면 DOM이
// 테두리를 뚫고 나온다. DOM은 3D 깊이 판정을 받지 않기 때문이다.
export const SCREEN_CENTER: [number, number, number] = [0, TOP + 0.2 + 0.56, 0.095];
export const CAMERA_FOV = 45;

/** 오브젝트가 y축으로 돌아 있는 각도. 확대 구도를 화면과 나란히 맞출 때 쓴다 */
export const NOTEBOOK_YAW = 0.22;
export const PHONE_YAW = -0.18;
/** 서류가 부채처럼 벌어진 간격. 맨 위 장은 이만큼 틀어져 있다 */
export const DOCS_FAN = 0.12;

/** 공책 표지와 속지 치수 */
export const COVER_W = 0.72;
export const COVER_D = 0.94;
/** 속지가 표지보다 안으로 들어간 폭. 실제 공책처럼 표지가 속지를 조금 덮는다 */
const PAPER_IN = 0.006;
export const PAPER_W = COVER_W - PAPER_IN;
export const PAPER_D = COVER_D - PAPER_IN * 2;
/** 속지 중심 x. 책등(왼쪽)에는 붙고 오른쪽만 들어가므로 왼쪽으로 반만큼 치우친다 */
export const PAPER_X = -PAPER_IN / 2;
/** 앞뒤 표지 두께와 속지 두께. 셋을 합친 것이 닫힌 공책의 높이다 */
export const COVER_T = 0.006;
export const PAPER_H = 0.034;

/** 책상 뷰 궤도 카메라 기본값 */
export const orbitDefaults = {
  target: [0, DESK_Y + 0.2, -0.1] as [number, number, number],
  radius: 4.25,
  yaw: 0,
  pitch: 0.52,
  zoom: 0.78,
  yawMin: -0.9,
  yawMax: 0.9,
  pitchMin: 0.1,
  pitchMax: 0.78,
  zoomMin: 0.55,
  zoomMax: 1.12,
};



export const positions = {
  phone: [1.3, 0, 0.42] as [number, number, number],
  notebook: [-1.25, 0, 0.35] as [number, number, number],
  docs: [1.25, 0, -0.3] as [number, number, number],
  mug: [-0.55, TOP, 0.4] as [number, number, number],
  keyboard: [0, TOP + 0.02, 0.72] as [number, number, number],
  mouse: [0.78, TOP + 0.025, 0.72] as [number, number, number],
  lampBase: [-1.75, TOP + 0.04, -0.55] as [number, number, number],
  // 책상 아래 안쪽. 기본 시점에선 거의 안 보이고 시점을 낮춰야 발견되는, 숨은 고양이다
  cat: [-1.45, 0, -0.5] as [number, number, number],
  mouseHole: [-0.55, 0, -1.695] as [number, number, number],
  tower: [1.3, 0, -0.2] as [number, number, number],
  wallZ: -1.7,
};

/**
 * 각 오브젝트를 클릭했을 때의 카메라 포즈.
 *
 * 자리를 직접 적지 않고 "무엇을 얼마나 담을지"로 적는다. 거리는 화면 비율에 맞춰 계산되므로
 * 창을 어떻게 늘려도 대상이 같은 비율로 화면에 들어온다.
 * up은 비스듬히 놓인 물건을 화면과 나란히 세우기 위한 것이다. 물건이 y축으로 θ만큼 돌아 있으면
 * 그 물건의 뒤쪽 방향인 (-sin θ, 0, -cos θ)가 화면 위쪽이 된다.
 */
/**
 * 위에서 내려다보되 종이의 아래쪽으로 k만큼 기울인 시선.
 * 기울이는 방향이 월드 +z로 고정돼 있으면, y축으로 돌아 있는 종이는 화면에서 비스듬한 사다리꼴로 보인다.
 * 종이 자신의 세로축을 따라 기울여야 화면에 반듯한 직사각형으로 잡힌다.
 */
function tiltToward(yaw: number, k: number): [number, number, number] {
  return [Math.sin(yaw) * k, 1, Math.cos(yaw) * k];
}

export const zoomPoses = {
  monitor: {
    target: [...SCREEN_CENTER] as [number, number, number],
    dir: [0, 0, 1] as [number, number, number],
    fit: [SCREEN_3D_W, SCREEN_3D_H] as [number, number],
    margin: 1.08,
  },
  phone: {
    target: [positions.phone[0], TOP + 0.03, positions.phone[2]] as [number, number, number],
    dir: tiltToward(PHONE_YAW, 0.22),
    fit: [0.276, 0.598] as [number, number],
    margin: 1.16,
    up: [-Math.sin(PHONE_YAW), 0, -Math.cos(PHONE_YAW)] as [number, number, number],
  },
  notebook: {
    target: [positions.notebook[0], TOP + 0.05, positions.notebook[2]] as [number, number, number],
    dir: tiltToward(NOTEBOOK_YAW, 0.24),
    fit: [PAPER_W, PAPER_D] as [number, number],
    margin: 1.14,
    up: [-Math.sin(NOTEBOOK_YAW), 0, -Math.cos(NOTEBOOK_YAW)] as [number, number, number],
  },
  docs: {
    // 맨 위 장 기준이다. 가운데 장에 맞추면 실제로 보이는 종이와 각도·자리가 어긋난다
    target: [positions.docs[0] + 0.04, TOP + 0.012, positions.docs[2] + 0.03] as [number, number, number],
    dir: tiltToward(DOCS_FAN, 0.24),
    fit: [0.6, 0.84] as [number, number],
    margin: 1.16,
    up: [-Math.sin(DOCS_FAN), 0, -Math.cos(DOCS_FAN)] as [number, number, number],
  },
} satisfies Record<string, CameraPose>;

// ---------- 책상 위 물건의 치수 ----------
// 오브젝트를 그리는 컴포넌트와 아래 충돌 판정이 같은 숫자를 보게 여기서 한 번만 정한다.
// 따로 적어두면 한쪽만 바뀌었을 때 눈에 보이는 크기와 부딪히는 벽이 어긋난다.

/** 키보드. 키 한 칸이 KEY_U이고 가로 KEY_COLS칸, 세로 KEY_ROWS줄이다 */
export const KEY_U = 0.069;
export const KEYBOARD_PAD = 0.03;
export const KEYBOARD_H = 0.028;
export const KEYBOARD_W = KEY_COLS * KEY_U + KEYBOARD_PAD * 2;
export const KEYBOARD_D = KEY_ROWS * KEY_U + KEYBOARD_PAD * 2;

/** 마우스 껍데기 반지름 */
export const MOUSE_RX = 0.0696;
export const MOUSE_RY = 0.06;
export const MOUSE_RZ = 0.102;

// ---------- 책상 위 이동 가능 영역 ----------

/** 위에서 내려다본 사각형. 마우스를 끌 때 넘어갈 수 없는 영역이다 */
interface Obstacle {
  x: number;
  z: number;
  halfW: number;
  halfD: number;
}

/**
 * 책상 위 오브젝트가 차지하는 자리.
 * 오브젝트를 옮기거나 크기를 바꾸면 여기 값도 같이 고쳐야 한다.
 */
export const deskObstacles: Obstacle[] = [
  { x: positions.keyboard[0], z: positions.keyboard[2], halfW: KEYBOARD_W / 2, halfD: KEYBOARD_D / 2 },
  { x: positions.mug[0], z: positions.mug[2], halfW: 0.15, halfD: 0.15 },
  { x: positions.notebook[0], z: positions.notebook[2], halfW: 0.44, halfD: 0.52 },
  { x: positions.docs[0], z: positions.docs[2], halfW: 0.33, halfD: 0.45 },
  { x: positions.phone[0], z: positions.phone[2], halfW: 0.17, halfD: 0.34 },
  // 모니터. 받침뿐 아니라 본체까지 막는다. 본체가 빠지면 마우스가 그 밑으로 들어가 화면에서 사라진다
  { x: 0, z: -0.45, halfW: 0.75, halfD: 0.5 },
  { x: positions.lampBase[0], z: positions.lampBase[2], halfW: 0.2, halfD: 0.2 },
];

/** 상판에서 오브젝트가 떨어지지 않도록 남기는 여유 */
const EDGE_MARGIN = 0.02;

/** (x, z)에 반지름 halfW·halfD짜리 물건을 놓을 수 있는지. 상판을 벗어나거나 다른 물건과 겹치면 false */
export function canPlaceOnDesk(x: number, z: number, halfW: number, halfD: number) {
  const limitX = DESK_W / 2 - halfW - EDGE_MARGIN;
  const limitZ = DESK_D / 2 - halfD - EDGE_MARGIN;
  if (x < -limitX || x > limitX || z < -limitZ || z > limitZ) return false;
  return !deskObstacles.some((o) => Math.abs(x - o.x) < o.halfW + halfW && Math.abs(z - o.z) < o.halfD + halfD);
}
