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
  day: { ambient: 0.4, hemi: 0.55, fill: 2.4, lamp: 0, lampGlow: 0, screen: 1.1 },
  // 밤에는 스탠드가 만드는 빛 웅덩이가 주인공이다. 바탕 빛은 형태만 겨우 읽힐 만큼만 남긴다.
  // 화이트 책상은 빛을 많이 되돌려서 바탕 빛이 조금만 세도 램프가 묻힌다
  // lampGlow는 갓에서 새고 벽·책상에서 튕기는 빛. 원뿔 바깥을 은은하게 채워 손전등처럼 보이지 않게 한다
  night: { ambient: 0.18, hemi: 0.22, fill: 0.12, lamp: 8, lampGlow: 2.2, screen: 2.4 },
} as const;

export function lerpLight(key: keyof typeof lighting.day, mix: number): number {
  return lighting.day[key] + (lighting.night[key] - lighting.day[key]) * mix;
}
