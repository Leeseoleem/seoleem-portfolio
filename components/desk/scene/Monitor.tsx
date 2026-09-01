'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { ZoomSurface } from './ZoomSurface';
import { MonitorScreen } from '../surfaces/MonitorScreen';
import { RoundedBox } from './RoundedBox';
import { createFrameGeometry, createTaperedBoxGeometry } from '@/lib/desk/geometry';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { SCREEN_3D_H, SCREEN_3D_W, SCREEN_CENTER, TOP, zoomPoses } from '@/lib/desk/layout';
import { drawDesktop, drawShutdown } from '@/lib/desk/screen-canvas';
import { getCanvasFont, getScreenCanvas, sceneTime } from '@/lib/desk/runtime';

const BODY_Y = TOP + 0.2 + 0.56;

// 앞 테두리는 가운데가 뚫린 액자 한 덩어리다. 조각을 붙이면 모서리 홈이 두 겹처럼 보인다.
// 앞에서 보는 테 두께는 얇게 두고 깊이만 두껍게 해서, 옆에서 볼 때 CRT다운 덩어리감이 나오게 한다.
const OPEN_W = 1.3; // 테두리가 감싸는 구멍(유리 크기)
const OPEN_H = 0.98;
const BEZEL_W = 1.5;
const BEZEL_H = 1.18;
const BEZEL_D = 0.2; // 앞면이 z = 0.1. 화면(0.043)이 그만큼 안쪽으로 물린다
const LED_Z = 0.101;

/**
 * CRT 모니터. 화면 텍스처는 부팅 오버레이와 공유하는 캔버스다.
 * 부팅 중에는 매 프레임 그리고, 책상 뷰에서는 바탕화면을 30초마다(시계) 갱신, 종료 중에는 종료 화면을 그린다.
 */
export function Monitor() {
  const zoomTo = useDeskStore((s) => s.zoomTo);
  const ledMat = useRef<THREE.MeshBasicMaterial>(null);
  const desktopDrawnAt = useRef(-1);

  const { canvas, texture } = useMemo(() => {
    const c = getScreenCanvas();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { canvas: c, texture: tex };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const body = useMemo(() => createTaperedBoxGeometry(1.46, 1.14, 0.9, 0.05, 0.6, 0.56), []);
  useEffect(() => () => body.dispose(), [body]);

  const bezel = useMemo(() => createFrameGeometry(BEZEL_W, BEZEL_H, OPEN_W, OPEN_H, BEZEL_D), []);
  useEffect(() => () => bezel.dispose(), [bezel]);

  useFrame(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { phase, shutdownAt } = useDeskStore.getState();
    const t = sceneTime();
    const font = getCanvasFont();

    if (phase === 'boot') return; // 부팅 화면은 BootOverlay가 그린다
    if (phase === 'off') {
      const k = Math.min(1, (t - shutdownAt) / 1.9);
      drawShutdown(ctx, k, font);
      texture.needsUpdate = true;
      if (ledMat.current) ledMat.current.color.set(k > 0.95 ? scenePalette.led.off : scenePalette.led.on);
      return;
    }
    // 부팅 직후 한 번, 그 뒤 30초마다 시계 갱신
    if (desktopDrawnAt.current < 0 || t - desktopDrawnAt.current > 30) {
      drawDesktop(ctx, font);
      texture.needsUpdate = true;
      desktopDrawnAt.current = t;
    }
  });

  return (
    <Interactive label="모니터" onActivate={() => zoomTo('monitor', zoomPoses.monitor)}>
      {/* 받침 */}
      <RoundedBox size={[0.7, 0.06, 0.5]} color={scenePalette.furniture.beigeDark} position={[0, TOP + 0.03, -0.45]} />
      <RoundedBox size={[0.36, 0.14, 0.3]} color={scenePalette.furniture.beigeDark} position={[0, TOP + 0.13, -0.5]} />
      {/* 본체. 뒤로 갈수록 좁아지는 사다리꼴 */}
      <mesh geometry={body} position={[0, BODY_Y, -0.45]} castShadow receiveShadow>
        <meshStandardMaterial color={scenePalette.furniture.beige} roughness={0.6} />
      </mesh>
      {/* 앞 테두리. 가운데가 뚫린 액자 한 덩어리 */}
      <mesh geometry={bezel} position={[0, BODY_Y, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={scenePalette.furniture.beige} roughness={0.6} />
      </mesh>
      {/* 유리 */}
      <mesh position={[0, BODY_Y, 0.041]}>
        <planeGeometry args={[OPEN_W, OPEN_H]} />
        <meshStandardMaterial color={scenePalette.furniture.black} roughness={0.5} />
      </mesh>
      {/* 화면 */}
      <mesh position={SCREEN_CENTER}>
        <planeGeometry args={[SCREEN_3D_W, SCREEN_3D_H]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* 확대 시 화면 위에 얹히는 DOM */}
      <ZoomSurface target="monitor" size={[SCREEN_3D_W, SCREEN_3D_H]} pixels={[1024, 768]} position={[SCREEN_CENTER[0], SCREEN_CENTER[1], SCREEN_CENTER[2] + 0.002]}>
        <MonitorScreen />
      </ZoomSurface>
      {/* 전원 LED */}
      <mesh position={[0.62, TOP + 0.25, LED_Z]}>
        <circleGeometry args={[0.012, 12]} />
        <meshBasicMaterial ref={ledMat} color={scenePalette.led.on} />
      </mesh>
    </Interactive>
  );
}
