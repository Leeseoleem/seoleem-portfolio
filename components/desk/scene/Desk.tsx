'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from './RoundedBox';
import { scenePalette } from '@/lib/desk/palette';
import { drawWoodGrain } from '@/lib/desk/wood-grain';
import { DESK_D, DESK_THICKNESS, DESK_W, DESK_Y, TOP } from '@/lib/desk/layout';

const LEG = 0.08;
const legXZ: Array<[number, number]> = [
  [-DESK_W / 2 + 0.15, -DESK_D / 2 + 0.15],
  [DESK_W / 2 - 0.15, -DESK_D / 2 + 0.15],
  [-DESK_W / 2 + 0.15, DESK_D / 2 - 0.15],
  [DESK_W / 2 - 0.15, DESK_D / 2 - 0.15],
];

/** 상판 둥근 모서리 반지름. 결 무늬는 이 안쪽 평평한 면에만 얹는다 */
const EDGE_R = 0.03;
/** 결 텍스처 가로 해상도. 세로는 상판 비율을 따른다 */
const GRAIN_W = 2048;

/**
 * 책상. 둥근 상판 위에 결 무늬를 그린 얇은 면을 한 장 덧댄다.
 * 상판 지오메트리(Extrude)는 UV가 0~1이 아니라 텍스처를 바로 못 입힌다.
 * 무늬의 바탕색을 재질색과 같게 맞춰서, 무늬가 없는 둥근 가장자리와 이어 보이게 한다.
 */
export function Desk() {
  const grain = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = GRAIN_W;
    c.height = Math.round((GRAIN_W * DESK_D) / DESK_W);
    const ctx = c.getContext('2d');
    if (ctx) drawWoodGrain(ctx, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
  useEffect(() => () => grain.dispose(), [grain]);

  return (
    <group>
      <RoundedBox size={[DESK_W, DESK_THICKNESS, DESK_D]} radius={EDGE_R} color={scenePalette.furniture.wood} roughness={0.7} position={[0, DESK_Y, 0]} />
      {/* 결 무늬 면. 상판보다 아주 조금 위에 두어 겹침 깜빡임을 피한다.
          포인터 이벤트를 받아 멈추는 이유: R3F는 핸들러가 있는 물체만 레이캐스트하므로,
          아무 핸들러도 없으면 상판이 아래 고양이를 가려 주지 못해 책상 위에서 고양이가 호버된다 */}
      <mesh
        position={[0, TOP + 0.0006, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerOver={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
      >
        <planeGeometry args={[DESK_W - EDGE_R * 2, DESK_D - EDGE_R * 2]} />
        <meshStandardMaterial map={grain} roughness={0.7} />
      </mesh>
      {legXZ.map(([x, z]) => (
        <RoundedBox key={`${x},${z}`} size={[LEG, DESK_Y, LEG]} color={scenePalette.furniture.woodDark} roughness={0.8} position={[x, DESK_Y / 2, z]} />
      ))}
    </group>
  );
}
