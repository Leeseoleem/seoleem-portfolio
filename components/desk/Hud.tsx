'use client';

import { useDeskStore } from '@/stores/useDeskStore';
import { getSound } from '@/lib/desk/sound';

/** 확대 상태의 되돌아가기 버튼과 호버 툴팁 */
export function Hud() {
  const phase = useDeskStore((s) => s.phase);
  const hoverLabel = useDeskStore((s) => s.hoverLabel);
  const hoverPoint = useDeskStore((s) => s.hoverPoint);
  const backToDesk = useDeskStore((s) => s.backToDesk);

  const back = () => {
    getSound().play('click');
    backToDesk();
  };

  return (
    <>
      {phase === 'zoomed' && (
        <div className="hud">
          <button type="button" className="hud-btn" onClick={back}>
            책상으로 돌아가기
          </button>
        </div>
      )}
      {hoverLabel && hoverPoint && phase === 'desk' && (
        <div className="hud-label" style={{ left: hoverPoint.x, top: hoverPoint.y }} aria-hidden="true">
          {hoverLabel}
        </div>
      )}
    </>
  );
}
