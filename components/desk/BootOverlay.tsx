'use client';

import { useEffect, useRef } from 'react';
import { useDeskStore } from '@/stores/useDeskStore';
import { BOOT_DURATION, SCREEN_H, SCREEN_W, drawBoot } from '@/lib/desk/screen-canvas';
import { canvasPalette } from '@/lib/desk/palette';
import { getCanvasFont, getScreenCanvas, getScreenContext, sceneTime } from '@/lib/desk/runtime';

/**
 * 부팅 화면 오버레이. 모니터 텍스처와 같은 캔버스를 DOM에 그대로 붙여서(object-fit: cover)
 * 오버레이가 사라지는 순간 3D 모니터 화면과 정확히 이어진다.
 * 부팅 중에는 3D 렌더 루프가 멈춰 있으므로 이 컴포넌트가 자체 rAF로 캔버스를 그린다.
 */
export function BootOverlay() {
  const phase = useDeskStore((s) => s.phase);
  const finishBoot = useDeskStore((s) => s.finishBoot);
  const host = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  // 부팅 화면이 뜰 때마다 캔버스를 붙인다. 전원을 껐다 다시 켜면 이 오버레이가 다시 마운트되기 때문이다
  useEffect(() => {
    if (phase !== 'boot') return;
    const el = host.current;
    if (!el) return;
    const canvas = getScreenCanvas();
    el.appendChild(canvas);
    return () => {
      if (canvas.parentNode === el) el.removeChild(canvas);
    };
  }, [phase]);

  const complete = () => {
    if (done.current) return;
    done.current = true;
    // 부팅이 끝나면 화면 내용은 MonitorScreen(DOM)이 맡는다. 캔버스는 비워만 둔다
    const ctx = getScreenContext();
    if (ctx) {
      ctx.fillStyle = canvasPalette.boot.background;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
    // 접속음은 여기서 내지 않는다. 아직 사용자가 화면을 건드리기 전이라 소리가 대기했다가
    // 첫 클릭 때 클릭음과 겹쳐서 터진다. 시작음은 전원을 껐다 다시 켤 때만 낸다
    finishBoot();
  };

  // 부팅 애니메이션 루프. 2D 캔버스만 그리므로 3D가 멈춰 있어도 부드럽게 돈다
  useEffect(() => {
    if (phase !== 'boot') return;
    // 다시 켤 때는 지난 부팅의 완료 표시를 지워야 이번 부팅도 끝낼 수 있다
    done.current = false;
    const ctx = getScreenContext();
    let raf = 0;
    const tick = () => {
      const t = sceneTime();
      if (ctx) drawBoot(ctx, t, getCanvasFont(), window.innerWidth / window.innerHeight);
      if (t >= BOOT_DURATION) {
        complete();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase !== 'boot') return null;

  return (
    <div className="boot-overlay">
      <div ref={host} className="boot-canvas-host" />
      <button type="button" className="hud-btn boot-skip" onClick={complete}>
        건너뛰기
      </button>
    </div>
  );
}
