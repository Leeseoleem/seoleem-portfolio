/**
 * 고양이와 쥐구멍이 프레임 단위로 공유하는 상태. React 상태가 아니라 가변 객체다.
 * - alertTarget: 쥐가 보이면 1. 고양이 동공이 슬릿이 되고 고개를 돌린다
 * - purrUntil: 그르릉 중인 동안의 종료 시각(performance.now 기준 ms)
 * - blinkRequestAt: 눈 키스(슬로우 블링크)를 시작할 씬 시각(초). -1이면 요청 없음
 */
export const catState = {
  alertTarget: 0,
  purrUntil: 0,
  blinkRequestAt: -1,
};
