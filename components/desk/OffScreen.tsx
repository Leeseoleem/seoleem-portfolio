'use client';

import { useEffect, useState } from 'react';
import { useDeskStore } from '@/stores/useDeskStore';

type Stage = 'hidden' | 'black' | 'collapse' | 'closing';

/**
 * 전원 종료 뒤의 화면. 모니터 확대가 끝나면 검게 덮고, CRT처럼 흰 선이 수축한 뒤
 * 클로징 문구와 전원 기호 버튼이 남는다. 버튼을 누르면 처음부터 다시 시작한다.
 */
export function OffScreen() {
  const phase = useDeskStore((s) => s.phase);
  const [stage, setStage] = useState<Stage>('hidden');
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (phase !== 'off') {
      setStage('hidden');
      return;
    }
    const timers = [
      window.setTimeout(() => setStage('black'), 1900),
      window.setTimeout(() => setStage('collapse'), 2600),
      window.setTimeout(() => setStage('closing'), 3600),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase]);

  // 마운트 다음 프레임에 클래스를 붙여야 opacity 전환이 실제로 일어난다
  useEffect(() => {
    if (stage === 'hidden') {
      setShown(false);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [stage]);

  if (stage === 'hidden') return null;

  return (
    <div className={`off-screen${shown ? ' is-visible' : ''}`}>
      <div className={`off-line${stage === 'collapse' || stage === 'closing' ? ' is-collapsed' : ''}`} />
      <div className={`closing${stage === 'closing' ? ' is-visible' : ''}`} aria-hidden={stage !== 'closing'}>
        <p className="closing-title">긍정적인 검토를 기다리겠습니다.</p>
        <p className="closing-sub">감사합니다.</p>
        <button type="button" className="power-btn" aria-label="다시 켜기" onClick={() => window.location.reload()}>
          <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true">
            <path d="M24 6v18" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M14.5 12.5a15 15 0 1 0 19 0" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </svg>
        </button>
        <p className="closing-hint">seoleem desk</p>
      </div>
    </div>
  );
}
