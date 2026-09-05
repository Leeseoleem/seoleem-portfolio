'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDeskStore } from '@/stores/useDeskStore';
import { getSound } from '@/lib/desk/sound';

const PROMPT = 'PS D:\\seoleem>';
/** 파워셸이 시작할 때 읽는 스크립트 이름. 자기소개 창이라는 뜻으로도 읽힌다 */
const TITLE = 'seoleem - profile.ps1';

/**
 * 화면 오른쪽 아래에 항상 떠 있는 HUD. XP 시절 파워셸 창 모양이다.
 *
 * 중간에 들어온 사람도 이게 누구 사이트인지 바로 알 수 있어야 하고,
 * 효과음을 끌 방법이 어디엔가는 있어야 한다. 둘 다 여기서 해결한다.
 * 확대 상태에서는 돌아가는 명령이 한 줄 더 붙는다.
 */
export function Hud() {
  const phase = useDeskStore((s) => s.phase);
  const hoverLabel = useDeskStore((s) => s.hoverLabel);
  const hoverPoint = useDeskStore((s) => s.hoverPoint);
  const backToDesk = useDeskStore((s) => s.backToDesk);
  const soundOn = useDeskStore((s) => s.soundOn);
  const setSound = useDeskStore((s) => s.setSound);
  // 좁은 화면에서는 접힌 채 시작한다. 펼쳐진 창이 3D 씬의 절반을 가리기 때문이다.
  // 부팅 중에는 이 창이 그려지지 않아 서버 렌더와 어긋날 일이 없다
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches);
  /** 사용자가 옮긴 자리. null이면 CSS의 기본 자리(오른쪽 아래)를 쓴다 */
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  /** 밖으로 나간 창을 도로 들일 때만 켜는 스냅 연출 */
  const [snapping, setSnapping] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const drag = useRef({ active: false, dx: 0, dy: 0 });
  const snapTimer = useRef(0);
  /** 렌더 밖에서도 지금 자리를 읽어야 해서 같은 값을 참조로도 들고 있는다 */
  const posRef = useRef<{ x: number; y: number } | null>(null);

  const moveTo = (next: { x: number; y: number }) => {
    posRef.current = next;
    setPos(next);
  };

  /** 창이 화면 밖으로 나가지 않게 가둔다. 창이 화면보다 크면 왼쪽 위를 살린다 */
  const clampTo = useCallback((x: number, y: number) => {
    const el = panel.current;
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const fit = (v: number, max: number) => Math.max(8, Math.min(max, v));
    return {
      x: fit(x, window.innerWidth - w - 8),
      y: fit(y, window.innerHeight - h - 8),
    };
  }, []);

  /** 밖으로 삐져나간 만큼 튕겨 들어오게 한다 */
  const snapBack = useCallback(() => {
    const p = posRef.current;
    if (!p) return;
    const next = clampTo(p.x, p.y);
    if (next.x === p.x && next.y === p.y) return;
    posRef.current = next;
    setPos(next);
    setSnapping(true);
    window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => setSnapping(false), 320);
  }, [clampTo]);

  /**
   * 접기/펼치기. 펼치면 창이 아래로 길어져서 화면 밖으로 나갈 수 있다.
   * 다시 그린 뒤에 실제 높이를 재야 하므로 다음 프레임에 자리를 확인한다.
   */
  const toggleCollapsed = () => {
    setCollapsed((c) => !c);
    requestAnimationFrame(snapBack);
  };

  const onBarDown = (e: React.PointerEvent<HTMLElement>) => {
    const el = panel.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    drag.current = { active: true, dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setSnapping(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onBarMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag.current.active) return;
    moveTo(clampTo(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  };
  const onBarUp = () => {
    drag.current.active = false;
  };

  // 창을 줄였을 때 밖으로 밀려나 있으면 다시 안으로 들인다
  useEffect(() => {
    window.addEventListener('resize', snapBack);
    return () => window.removeEventListener('resize', snapBack);
  }, [snapBack]);

  useEffect(() => () => window.clearTimeout(snapTimer.current), []);

  // 돌아가는 길은 창을 접어도 막히면 안 된다. Esc는 창 상태와 상관없이 항상 통한다
  useEffect(() => {
    if (phase !== 'zoomed') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      getSound().play('click');
      backToDesk();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, backToDesk]);

  const visible = phase === 'desk' || phase === 'zoomed' || phase === 'transition';

  const back = () => {
    getSound().play('click');
    backToDesk();
  };

  const toggleSound = () => {
    const next = !soundOn;
    getSound().setEnabled(next);
    setSound(next);
    // 켜는 쪽일 때만 소리를 낸다. 끄는 순간에 소리가 나면 안 꺼진 것처럼 들린다
    if (next) getSound().play('click');
  };

  return (
    <>
      {visible && (
        <section
          ref={panel}
          // 확대 중에는 화면을 가리지 않게 흐려 둔다. 마우스를 올리면 다시 진해진다
          className={`ps${snapping ? ' is-snapping' : ''}${phase === 'zoomed' ? ' is-dim' : ''}`}
          style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
          aria-label="seoleem 포트폴리오 안내"
        >
          {/* 타이틀바를 잡아 창을 옮긴다 */}
          <header className="ps__bar" onPointerDown={onBarDown} onPointerMove={onBarMove} onPointerUp={onBarUp} onPointerCancel={onBarUp}>
            <span className="ps__title">{TITLE}</span>
            {/* 접어 두면 본문의 cd ..가 사라진다. 확대 중에는 돌아갈 길을 제목 표시줄에 남긴다 */}
            {collapsed && phase === 'zoomed' && (
              <button type="button" className="ps__back" onPointerDown={stopDrag} onClick={back}>
                cd ..
              </button>
            )}
            <button
              type="button"
              className="ps__min"
              onPointerDown={stopDrag}
              onClick={toggleCollapsed}
              aria-label={collapsed ? '펼치기' : '접기'}
            >
              {collapsed ? '□' : '─'}
            </button>
          </header>
          {!collapsed && (
            <div className="ps__body">
              <p className="ps__line">
                <span className="ps__prompt">{PROMPT}</span> whoami
              </p>
              <p className="ps__out">seoleem · Frontend Developer</p>
              <p className="ps__line">
                <span className="ps__prompt">{PROMPT}</span>{' '}
                <button type="button" className="ps__cmd" onClick={toggleSound}>
                  sound {soundOn ? 'off' : 'on'}
                </button>
              </p>
              {phase === 'zoomed' && (
                <p className="ps__line">
                  <span className="ps__prompt">{PROMPT}</span>{' '}
                  <button type="button" className="ps__cmd" onClick={back}>
                    cd ..
                  </button>
                  <span className="ps__note"># 책상으로 (Esc)</span>
                </p>
              )}
              <p className="ps__line">
                <span className="ps__prompt">{PROMPT}</span> <span className="ps__caret" aria-hidden="true" />
              </p>
            </div>
          )}
        </section>
      )}
      {hoverLabel && hoverPoint && phase === 'desk' && (
        <div className="hud-label" style={{ left: hoverPoint.x, top: hoverPoint.y }} aria-hidden="true">
          {hoverLabel}
        </div>
      )}
    </>
  );
}

/** 제목 표시줄 버튼을 눌렀을 때 창 끌기가 같이 시작되지 않게 막는다 */
function stopDrag(e: React.PointerEvent<HTMLButtonElement>) {
  e.stopPropagation();
}
