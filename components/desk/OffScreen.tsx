'use client';

import { useEffect, useState } from 'react';
import { useDeskStore } from '@/stores/useDeskStore';
import { useWindowStore } from './surfaces/window-state';
import { getSound } from '@/lib/desk/sound';
import { resetSceneClock } from '@/lib/desk/runtime';
import { PowerButton } from './PowerButton';

type Stage = 'hidden' | 'black' | 'collapse' | 'closing';

/**
 * 전원 종료 뒤의 화면. 모니터 확대가 끝나면 검게 덮고, CRT처럼 흰 선이 수축한 뒤
 * 클로징 문구와 전원 기호 버튼이 남는다. 버튼을 누르면 처음부터 다시 시작한다.
 */
export function OffScreen() {
  const isOff = useDeskStore((s) => s.phase === 'off');
  // 연출 상태를 effect에서 되돌리지 않도록, 종료 상태에서만 시퀀스를 마운트한다
  if (!isOff) return null;
  return <OffSequence />;
}

function OffSequence() {
  const [stage, setStage] = useState<Stage>('hidden');
  const [shown, setShown] = useState(false);

  const restartScene = useDeskStore((s) => s.restart);
  const closeAllWindows = useWindowStore((s) => s.closeAll);

  /**
   * 다시 켜기. 시작음을 여기서 낸다.
   * 처음 접속할 때 내면 사용자가 아직 화면을 건드리기 전이라 소리가 대기했다가
   * 첫 클릭 때 클릭음과 겹친다. 이 버튼은 사용자가 직접 누른 것이라 바로 울린다.
   * 페이지를 새로 고치지 않고 씬만 부팅 상태로 되돌린다. 새로 고치면 시작음이 부팅 화면으로 넘어가며 끊긴다.
   * 시계를 먼저 0으로 돌려야 부팅 화면이 처음부터 그려진다.
   */
  const restart = () => {
    getSound().play('chime');
    closeAllWindows();
    resetSceneClock();
    restartScene();
  };

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage('black'), 1900),
      window.setTimeout(() => setStage('collapse'), 2600),
      window.setTimeout(() => setStage('closing'), 3600),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  // 마운트 다음 프레임에 클래스를 붙여야 opacity 전환이 실제로 일어난다
  useEffect(() => {
    if (stage === 'hidden') return;
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
        <PowerButton label="다시 켜기" onClick={restart} />
        <p className="closing-hint">seoleem desk</p>
      </div>
    </div>
  );
}
