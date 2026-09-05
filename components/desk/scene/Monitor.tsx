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
import { canvasPalette, scenePalette } from '@/lib/desk/palette';
import { drawStickyNote } from '@/lib/desk/sticky-note';
import { SCREEN_3D_H, SCREEN_3D_W, SCREEN_CENTER, TOP, zoomPoses } from '@/lib/desk/layout';
import { drawShutdown } from '@/lib/desk/screen-canvas';
import { getCanvasFont, getScreenCanvas, getScreenContext, sceneTime } from '@/lib/desk/runtime';

const BODY_Y = TOP + 0.2 + 0.56;

// 앞 테두리는 가운데가 뚫린 액자 한 덩어리다. 조각을 붙이면 모서리 홈이 두 겹처럼 보인다.
// 앞에서 보는 테 두께는 얇게 두고 깊이만 두껍게 해서, 옆에서 볼 때 CRT다운 덩어리감이 나오게 한다.
const OPEN_W = 1.3; // 테두리가 감싸는 구멍(유리 크기)
const OPEN_H = 0.98;
const BEZEL_W = 1.5;
const BEZEL_H = 1.18;
const BEZEL_D = 0.2; // 앞면이 z = 0.1. 화면(0.043)이 그만큼 안쪽으로 물린다
const LED_Z = 0.101;
/** 아래 테두리 띠의 세로 중심. 통풍구·버튼·LED가 이 줄에 놓인다 */
const BAND_Y = BODY_Y - (OPEN_H + BEZEL_H) / 4;
/** 베젤에 붙인 포스트잇. 처음 온 사람에게 어디를 눌러야 하는지 알려주는 유일한 장치다 */
const NOTES: Array<{ color: string; arrow: number; position: [number, number, number]; tilt: number }> = [
  // 오른쪽 위: 화면을 가리키는 화살표(왼쪽)
  { color: canvasPalette.sticky.yellow, arrow: Math.PI, position: [0.71, BODY_Y + 0.33, LED_Z + 0.003], tilt: -0.07 },
  // 왼쪽 아래: 책상 위 물건들을 가리키는 화살표(왼쪽 아래)
  { color: canvasPalette.sticky.pink, arrow: Math.PI * 0.72, position: [-0.71, BODY_Y - 0.26, LED_Z + 0.003], tilt: 0.09 },
];
const NOTE_SIZE = 0.105;
const NOTE_TEX = 256;

function StickyNote({ color, arrow, position, tilt }: (typeof NOTES)[number]) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = NOTE_TEX;
    const ctx = c.getContext('2d');
    if (ctx) drawStickyNote(ctx, NOTE_TEX, color, arrow);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [color, arrow]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={position} rotation={[0, 0, tilt]} castShadow>
      <planeGeometry args={[NOTE_SIZE, NOTE_SIZE]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}

const VENT_X = [-0.62, -0.595, -0.57, -0.545, -0.52, -0.495, -0.47, -0.445];
const BUTTON_X = [0.46, 0.51, 0.56];

/**
 * CRT 모니터. 화면 텍스처는 부팅 오버레이와 공유하는 캔버스다.
 * 부팅 중에는 매 프레임 그리고, 책상 뷰에서는 바탕화면을 30초마다(시계) 갱신, 종료 중에는 종료 화면을 그린다.
 */
export function Monitor() {
  const zoomTo = useDeskStore((s) => s.zoomTo);
  const ledMat = useRef<THREE.MeshBasicMaterial>(null);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(getScreenCanvas());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const body = useMemo(() => createTaperedBoxGeometry(1.46, 1.14, 0.9, 0.05, 0.6, 0.56), []);
  useEffect(() => () => body.dispose(), [body]);

  const bezel = useMemo(() => createFrameGeometry(BEZEL_W, BEZEL_H, OPEN_W, OPEN_H, BEZEL_D), []);
  useEffect(() => () => bezel.dispose(), [bezel]);

  useFrame(() => {
    const { phase, shutdownAt } = useDeskStore.getState();
    // 부팅 화면은 BootOverlay가, 책상·확대 화면은 MonitorScreen(DOM)이 맡는다.
    // 여기서 그리는 건 종료 연출뿐이다
    if (phase !== 'off') return;
    const ctx = getScreenContext();
    if (!ctx) return;
    const k = Math.min(1, (sceneTime() - shutdownAt) / 1.9);
    drawShutdown(ctx, k, getCanvasFont());
    texture.needsUpdate = true;
    if (ledMat.current) ledMat.current.color.set(k > 0.95 ? scenePalette.led.off : scenePalette.led.on);
  });

  return (
    <Interactive label="모니터" onActivate={() => zoomTo('monitor', zoomPoses.monitor)}>
      {/* 받침 */}
      <RoundedBox size={[0.7, 0.06, 0.5]} color={scenePalette.furniture.beigeDark} position={[0, TOP + 0.03, -0.45]} />
      <RoundedBox size={[0.36, 0.14, 0.3]} color={scenePalette.furniture.beigeDark} position={[0, TOP + 0.13, -0.5]} />
      {/* 본체. 뒤로 갈수록 좁아지는 사다리꼴 */}
      <mesh geometry={body} position={[0, BODY_Y, -0.45]} castShadow receiveShadow>
        <meshStandardMaterial color={scenePalette.furniture.crt} roughness={0.55} />
      </mesh>
      {/* 앞 테두리. 가운데가 뚫린 액자 한 덩어리 */}
      <mesh geometry={bezel} position={[0, BODY_Y, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={scenePalette.furniture.crt} roughness={0.55} />
      </mesh>
      {NOTES.map((n) => (
        <StickyNote key={n.color} {...n} />
      ))}
      {/* 아래 테두리 띠: 왼쪽 통풍 슬릿, 오른쪽 조작 버튼과 LED */}
      {VENT_X.map((x) => (
        <mesh key={x} position={[x, BAND_Y, LED_Z]}>
          <planeGeometry args={[0.007, 0.046]} />
          <meshStandardMaterial color={scenePalette.furniture.crtSlot} roughness={0.9} />
        </mesh>
      ))}
      {BUTTON_X.map((x) => (
        <mesh key={x} position={[x, BAND_Y, LED_Z]}>
          <circleGeometry args={[0.011, 16]} />
          <meshStandardMaterial color={scenePalette.furniture.beigeDark} roughness={0.7} />
        </mesh>
      ))}
      {/* 유리 */}
      <mesh position={[0, BODY_Y, 0.093]}>
        <planeGeometry args={[OPEN_W, OPEN_H]} />
        <meshStandardMaterial color={scenePalette.furniture.black} roughness={0.5} />
      </mesh>
      {/* 화면 */}
      <mesh position={SCREEN_CENTER}>
        <planeGeometry args={[SCREEN_3D_W, SCREEN_3D_H]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* 확대 시 화면 위에 얹히는 DOM */}
      <ZoomSurface deskView target="monitor" size={[SCREEN_3D_W, SCREEN_3D_H]} pixels={[1024, 768]} position={[SCREEN_CENTER[0], SCREEN_CENTER[1], SCREEN_CENTER[2] + 0.002]}>
        <MonitorScreen />
      </ZoomSurface>
      {/* 전원 LED */}
      <mesh position={[0.62, BAND_Y, LED_Z]}>
        <circleGeometry args={[0.012, 12]} />
        <meshBasicMaterial ref={ledMat} color={scenePalette.led.on} />
      </mesh>
    </Interactive>
  );
}
