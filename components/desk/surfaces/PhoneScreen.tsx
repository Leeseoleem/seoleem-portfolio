'use client';

import { useClock } from './use-clock';

/**
 * 핸드폰 화면. 책상 뷰와 확대 뷰가 같은 DOM을 본다.
 * 기준 크기는 360×780. 색·간격은 globals.css의 `--phone-*`, `--toss-*` 토큰을 쓴다.
 *
 * 지금은 잠금화면이다. 토스 스타일 UI가 들어오기 전까지 자리를 지킨다.
 * 흰 화면은 책상에서 가장 밝은 점이 되어 시선을 끌기 때문에, 어두운 배경에 시계만 띄운다.
 */
export function PhoneScreen() {
  const { time, date } = useClock();
  return (
    <div className="lock">
      <div className="lock__status">
        <span>seoleem</span>
        <span className="lock__battery" aria-hidden="true">
          <i />
        </span>
      </div>
      <div className="lock__clock">
        <p className="lock__time">{time}</p>
        <p className="lock__date">{date}</p>
      </div>
      <div className="lock__notice">
        <span className="lock__app" aria-hidden="true" />
        <div>
          <p className="lock__notice-title">포트폴리오</p>
          <p className="lock__notice-body">토스 스타일 UI가 여기 들어옵니다</p>
        </div>
      </div>
      <div className="lock__home" aria-hidden="true" />
    </div>
  );
}
