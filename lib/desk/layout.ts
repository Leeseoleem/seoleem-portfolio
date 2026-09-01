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
export const SCREEN_CENTER: [number, number, number] = [0, TOP + 0.2 + 0.56, 0.043];

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
    position: [0, SCREEN_CENTER[1], 1.55],
    target: [0, SCREEN_CENTER[1], 0],
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
