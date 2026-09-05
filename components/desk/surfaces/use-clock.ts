'use client';

import { useEffect, useState } from 'react';

/**
 * 현재 시각. 모니터 작업 표시줄과 핸드폰 잠금화면이 같은 시계를 본다.
 * 30초마다 갱신한다. 초를 안 보여 주니 그 이상 촘촘할 이유가 없다.
 * 첫 값은 '--:--'다. 서버 렌더와 첫 클라이언트 렌더가 같아야 하기 때문이다.
 */
export function useClock() {
  const [clock, setClock] = useState({ time: '--:--', date: '' });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      setClock({ time: `${hh}:${mm}`, date: `${now.getMonth() + 1}월 ${now.getDate()}일 ${days[now.getDay()]}요일` });
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  return clock;
}
