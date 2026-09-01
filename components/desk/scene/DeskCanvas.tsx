'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { Room } from './Room';
import { Desk } from './Desk';
import { Monitor } from './Monitor';
import { Peripherals } from './Peripherals';
import { Mug } from './Mug';
import { Phone } from './Phone';
import { Notebook } from './Notebook';
import { Documents } from './Documents';
import { Lamp } from './Lamp';
import { Cat } from './Cat';
import { MouseHole } from './MouseHole';
import { Tower } from './Tower';
import { CAMERA_FOV } from '@/lib/desk/layout';
import { useDeskStore } from '@/stores/useDeskStore';

/**
 * 3D 씬 루트. 서버에서 렌더되지 않는다(부모가 dynamic import, ssr: false).
 * 부팅 오버레이(DOM)가 이 캔버스 위에 덮여 있다가 카메라가 물러날 때 사라진다.
 */
export function DeskCanvas() {
  // 부팅 화면이 덮고 있는 동안에는 3D를 한 프레임도 그리지 않는다.
  // 그리지 않아도 보이지 않는데, 그림자까지 도는 씬이 2D 부팅 애니메이션을 끊어놓기 때문이다.
  const isBooting = useDeskStore((s) => s.phase === 'boot');
  const phase = useDeskStore((s) => s.phase);
  // 확대 상태에서는 카메라가 멈춰 있고 화면은 DOM이 덮는다. 요청이 있을 때만 그린다.
  const isZoomed = useDeskStore((s) => s.phase === 'zoomed');
  // 종료 연출(모니터 확대)이 끝나 화면이 검게 덮이면 더 그릴 이유가 없다
  const [stoppedAfterOff, setStoppedAfterOff] = useState(false);
  useEffect(() => {
    if (phase !== 'off') {
      setStoppedAfterOff(false);
      return;
    }
    const id = window.setTimeout(() => setStoppedAfterOff(true), 2200);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <Canvas
      className="desk-canvas"
      frameloop={isBooting || stoppedAfterOff ? 'never' : isZoomed ? 'demand' : 'always'}
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={1}
      performance={{ min: 0.5 }}
      camera={{ fov: CAMERA_FOV, near: 0.02, far: 60, position: [0, 2.5, 4] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <CameraRig />
      <Room />
      <Desk />
      <Monitor />
      <Peripherals />
      <Mug />
      <Phone />
      <Notebook />
      <Documents />
      <Lamp />
      <Cat />
      <MouseHole />
      <Tower />
    </Canvas>
  );
}
