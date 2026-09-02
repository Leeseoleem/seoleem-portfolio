/**
 * 밤/낮 전환 진행도. 0 = 낮, 1 = 밤. Room이 매 프레임 갱신하고 Lamp 등이 읽는다.
 * React 상태로 두면 프레임마다 리렌더가 나므로 가변 객체로 공유한다.
 */
export const nightMix = { value: 0 };

/**
 * 낮은 키 라이트(fill) 하나가 주도하고 ambient·hemi는 그림자 속을 살짝 밝히는 정도로만 둔다.
 * 사방에서 고르게 비추면 그림자가 사라져 씬이 평평해진다.
 */
export const lighting = {
  day: { ambient: 0.4, hemi: 0.55, fill: 2.4, lamp: 0, screen: 1.1 },
  night: { ambient: 0.28, hemi: 0.32, fill: 0.4, lamp: 7, screen: 3.1 },
} as const;

export function lerpLight(key: keyof typeof lighting.day, mix: number): number {
  return lighting.day[key] + (lighting.night[key] - lighting.day[key]) * mix;
}
