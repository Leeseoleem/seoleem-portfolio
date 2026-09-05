/**
 * 그림자 맵 갱신 요청.
 *
 * 그림자 맵은 매 프레임 다시 그리지 않는다(Room이 autoUpdate를 꺼 둔다). 조명이 바뀔 때만 그리면
 * 충분한데, 물건이 움직이면 그 물건의 그림자가 옛 자리에 남는다. 물건을 움직이는 쪽이
 * 이 함수를 부르면 Room이 다음 프레임에 한 번 다시 그린다.
 */
export const shadowDirty = { value: true };

export function requestShadowUpdate() {
  shadowDirty.value = true;
}
