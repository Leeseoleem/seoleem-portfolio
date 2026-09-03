import { create } from 'zustand';

/** 씬의 큰 상태. 프레임마다 바뀌는 값(카메라 위치 등)은 여기 두지 않고 ref로 다룬다. */
export type DeskPhase = 'boot' | 'transition' | 'desk' | 'zoomed' | 'off';

/** 확대 대상. 카메라 포즈는 각 오브젝트 컴포넌트가 등록한다. */
export type ZoomTarget = 'monitor' | 'phone' | 'notebook' | 'docs';

export interface CameraPose {
  /** 바라볼 지점 */
  target: [number, number, number];
  /** 카메라를 둘 자리. fit을 쓰면 생략한다 */
  position?: [number, number, number];
  /** target에서 카메라 쪽을 보는 방향. fit과 함께 쓴다 */
  dir?: [number, number, number];
  /**
   * 이 크기(가로, 세로)가 화면에 다 들어오도록 거리를 계산한다.
   * 자리를 눈대중으로 적어두면 화면 비율이 달라질 때 구도가 어긋난다.
   */
  fit?: [number, number];
  /** fit에 남길 여백 배수. 1.1이면 대상 크기의 1.1배가 화면에 들어온다 */
  margin?: number;
  /** 화면의 위쪽이 될 방향. 비스듬히 놓인 물건을 화면과 나란히 보여줄 때 쓴다 */
  up?: [number, number, number];
}

interface DeskState {
  phase: DeskPhase;
  zoomed: ZoomTarget | null;
  isNight: boolean;
  soundOn: boolean;
  hoverLabel: string | null;
  hoverPoint: { x: number; y: number } | null;
  /** 책상 위 오브젝트를 끌고 있는 중. 시점 회전과 호버 표시를 멈춘다 */
  dragging: boolean;
  /** 종료 시퀀스 시작 시각(초, 씬 시계 기준). -1이면 아직 아님 */
  shutdownAt: number;
  /** 카메라 이동 요청. CameraRig가 소비한다. */
  cameraRequest: { pose: CameraPose | 'orbit' | 'close'; duration: number; then?: DeskPhase; id: number } | null;

  setPhase: (phase: DeskPhase) => void;
  setNight: (on: boolean) => void;
  toggleNight: () => void;
  setSound: (on: boolean) => void;
  setHover: (label: string | null, point?: { x: number; y: number } | null) => void;
  setDragging: (on: boolean) => void;
  zoomTo: (target: ZoomTarget, pose: CameraPose) => void;
  backToDesk: () => void;
  finishBoot: () => void;
  powerOff: (sceneTime: number) => void;
  consumeCameraRequest: () => void;
}

let requestId = 0;

export const useDeskStore = create<DeskState>((set) => ({
  phase: 'boot',
  zoomed: null,
  isNight: false,
  soundOn: true,
  hoverLabel: null,
  hoverPoint: null,
  dragging: false,
  shutdownAt: -1,
  cameraRequest: null,

  setPhase: (phase) => set({ phase }),
  setNight: (on) => set({ isNight: on }),
  toggleNight: () => set((s) => ({ isNight: !s.isNight })),
  setSound: (on) => set({ soundOn: on }),
  setHover: (label, point = null) => set({ hoverLabel: label, hoverPoint: point }),
  setDragging: (on) => set({ dragging: on }),

  zoomTo: (target, pose) =>
    set({
      phase: 'transition',
      zoomed: target,
      hoverLabel: null,
      cameraRequest: { pose, duration: 1400, then: 'zoomed', id: ++requestId },
    }),

  backToDesk: () =>
    set({
      phase: 'transition',
      zoomed: null,
      cameraRequest: { pose: 'orbit', duration: 1400, then: 'desk', id: ++requestId },
    }),

  finishBoot: () =>
    set({
      phase: 'transition',
      cameraRequest: { pose: 'orbit', duration: 2600, then: 'desk', id: ++requestId },
    }),

  powerOff: (sceneTime) =>
    set({
      phase: 'off',
      hoverLabel: null,
      shutdownAt: sceneTime,
      cameraRequest: { pose: 'close', duration: 1900, id: ++requestId },
    }),

  consumeCameraRequest: () => set({ cameraRequest: null }),
}));
