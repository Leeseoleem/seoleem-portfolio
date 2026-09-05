'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BootOverlay } from './BootOverlay';
import { Hud } from './Hud';
import { OffScreen } from './OffScreen';
import { ErrorScreen } from './ErrorScreen';
import { useDeskStore } from '@/stores/useDeskStore';
import { getSound } from '@/lib/desk/sound';

// three와 WebGL은 브라우저에서만 돈다. ssr: false는 클라이언트 컴포넌트 안에서만 허용된다.
const DeskCanvas = dynamic(() => import('./scene/DeskCanvas').then((m) => m.DeskCanvas), {
  ssr: false,
  loading: () => <div className="desk-canvas-loading" aria-hidden="true" />,
});

/** 책상 씬 전체: 3D 캔버스 + 부팅 오버레이 + HUD + 종료 화면 + 오류 화면 */
export function DeskExperience() {
  const setSound = useDeskStore((s) => s.setSound);
  const crashed = useDeskStore((s) => s.crashed);

  // 첫 사용자 제스처에서 오디오를 열고, 저장된 효과음 설정을 스토어에 반영한다
  useEffect(() => {
    const sound = getSound();
    setSound(sound.isEnabled);
    sound.prefetch(); // 첫 클릭부터 파일 소리가 나도록 미리 받아둔다
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [setSound]);

  return (
    <main className="desk-root">
      <DeskCanvas />
      <BootOverlay />
      <Hud />
      <OffScreen />
      {/* WebGL 컨텍스트가 죽으면 캔버스가 하얗게 남는다. 그 위를 오류 화면으로 덮는다 */}
      {crashed && <ErrorScreen code="webgl" />}
    </main>
  );
}
