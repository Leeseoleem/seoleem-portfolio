'use client';

import { useSyncExternalStore } from 'react';

/**
 * 모바일 화면인지. 모니터 화면(1024×768)은 3D 안에 놓인 DOM이라 작은 화면에서는 글자가 읽히지 않는다.
 * 이 기준에 맞으면 창을 3D 밖 전체 화면 시트로 띄운다.
 *
 * 폭만 보면 창을 줄인 데스크톱까지 걸리고, 포인터만 보면 터치되는 노트북까지 걸린다. 둘을 섞어 쓴다.
 * 미디어 쿼리는 리액트 밖의 상태라 useSyncExternalStore로 구독한다. 상태를 따로 두고 효과에서 맞추면
 * 첫 그림 뒤에 한 번 더 그리게 된다.
 */
const MOBILE_QUERY = '(max-width: 900px), ((pointer: coarse) and (max-width: 1180px))';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** 서버에서는 알 수 없다. 데스크톱 기준으로 그린 뒤 붙자마자 맞춘다 */
const serverSnapshot = () => false;

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, serverSnapshot);
}
