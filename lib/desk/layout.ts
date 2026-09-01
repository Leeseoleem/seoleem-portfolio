import type { CameraPose } from '@/stores/useDeskStore';

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
/** 모니터를 확대했을 때 화면에서 카메라까지의 거리 */
const MONITOR_ZOOM_DIST = 1.507;

export const CAMERA_FOV = 45;

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

/** 각 오브젝트를 클릭했을 때의 카메라 포즈 */
export const zoomPoses = {
  monitor: {
    position: [0, SCREEN_CENTER[1], SCREEN_CENTER[2] + MONITOR_ZOOM_DIST],
    target: [0, SCREEN_CENTER[1], SCREEN_CENTER[2]],
  },
  phone: {
    position: [1.3, TOP + 0.95, 0.47],
    target: [1.3, TOP, 0.42],
  },
  notebook: {
    position: [-1.25, TOP + 1.15, 0.55],
    target: [-1.25, TOP, 0.35],
  },
  docs: {
    position: [1.25, TOP + 1.1, -0.15],
    target: [1.25, TOP, -0.3],
  },
} satisfies Record<string, CameraPose>;

export const positions = {
  phone: [1.3, 0, 0.42] as [number, number, number],
  notebook: [-1.25, 0, 0.35] as [number, number, number],
  docs: [1.25, 0, -0.3] as [number, number, number],
  mug: [-0.55, TOP, 0.4] as [number, number, number],
  keyboard: [0, TOP + 0.02, 0.72] as [number, number, number],
  mouse: [0.78, TOP + 0.025, 0.72] as [number, number, number],
  lampBase: [-1.75, TOP + 0.04, -0.55] as [number, number, number],
  cat: [-1.45, 0, -0.5] as [number, number, number],
  mouseHole: [-0.55, 0, -1.695] as [number, number, number],
  tower: [1.3, 0, -0.2] as [number, number, number],
  wallZ: -1.7,
};

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
  { x: 0, z: 0.72, halfW: 0.548, halfD: 0.227 }, // 키보드
  { x: -0.55, z: 0.4, halfW: 0.15, halfD: 0.15 }, // 머그
  { x: -1.25, z: 0.35, halfW: 0.44, halfD: 0.52 }, // 공책
  { x: 1.25, z: -0.3, halfW: 0.33, halfD: 0.45 }, // 서류
  { x: 1.3, z: 0.42, halfW: 0.17, halfD: 0.34 }, // 핸드폰
  { x: 0, z: -0.47, halfW: 0.36, halfD: 0.28 }, // 모니터 받침
  { x: -1.75, z: -0.55, halfW: 0.2, halfD: 0.2 }, // 스탠드 받침
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
