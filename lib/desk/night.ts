/**
 * 밤/낮 전환 진행도. 0 = 낮, 1 = 밤. Room이 매 프레임 갱신하고 Lamp 등이 읽는다.
 * React 상태로 두면 프레임마다 리렌더가 나므로 가변 객체로 공유한다.
 */
export const nightMix = { value: 0 };

export const lighting = {
  day: { ambient: 1.0, hemi: 0.9, fill: 1.3, lamp: 0, screen: 1.1 },
  night: { ambient: 0.63, hemi: 0.5, fill: 0.31, lamp: 7, screen: 3.1 },
} as const;

export function lerpLight(key: keyof typeof lighting.day, mix: number): number {
  return lighting.day[key] + (lighting.night[key] - lighting.day[key]) * mix;
}
