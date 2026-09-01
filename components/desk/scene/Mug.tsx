'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { scenePalette } from '@/lib/desk/palette';
import { positions, TOP } from '@/lib/desk/layout';
import { getSound } from '@/lib/desk/sound';

const STEAM_N = 7;
const STEAM_RISE = 0.5;
const STEAM_LOOP = 3.2;

function makeSteamTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(c);
}

/** 속이 빈 컵, 커피, 반원 손잡이, 무한 루프로 피어오르는 김. 클릭하면 한 모금 마시는 소리가 난다 */
export function Mug() {
  const [mx, , mz] = positions.mug;
  const sprites = useRef<Array<THREE.Sprite | null>>([]);
  const steamTex = useMemo(() => makeSteamTexture(), []);
  useEffect(() => () => steamTex.dispose(), [steamTex]);
  // 김 입자마다 위상과 흔들림을 다르게 준다. 렌더 중 난수를 쓰지 않도록 인덱스 기반 결정적 값을 쓴다
  const seeds = useMemo(
    () =>
      Array.from({ length: STEAM_N }, (_, i) => ({
        phase: i / STEAM_N,
        wobble: (i * 2.399963) % (Math.PI * 2),
        drift: ((i % 3) - 1) * 0.02,
      })),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    sprites.current.forEach((sp, i) => {
      if (!sp) return;
      const s = seeds[i];
      const k = (t / STEAM_LOOP + s.phase) % 1;
      const sway = Math.sin(t * 1.6 + s.wobble) * 0.035 * k;
      sp.position.set(mx + sway + s.drift * k, TOP + 0.24 + k * STEAM_RISE, mz);
      const size = 0.08 + k * 0.16;
      sp.scale.set(size, size, 1);
      (sp.material as THREE.SpriteMaterial).opacity = Math.sin(k * Math.PI) * 0.55;
    });
  });

  return (
    <group>
      <Interactive onActivate={() => getSound().play('drink')} lift={false}>
      <mesh position={[mx, TOP + 0.12, mz]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.095, 0.24, 32, 1, true]} />
        <meshStandardMaterial color={scenePalette.furniture.ceramic} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mx, TOP + 0.012, mz]}>
        <circleGeometry args={[0.095, 32]} />
        <meshStandardMaterial color={scenePalette.furniture.ceramic} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[mx, TOP + 0.24, mz]}>
        <torusGeometry args={[0.108, 0.006, 8, 32]} />
        <meshStandardMaterial color={scenePalette.furniture.ceramic} roughness={0.35} />
      </mesh>
      {/* 손잡이: 잘린 두 단면이 컵 벽에 붙는 반원 */}
      <mesh position={[mx + 0.1, TOP + 0.125, mz]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <torusGeometry args={[0.062, 0.017, 10, 24, Math.PI]} />
        <meshStandardMaterial color={scenePalette.furniture.ceramic} roughness={0.35} />
      </mesh>
      {/* 커피. 컵이 속 빈 원통이라 이 면이 그림자를 만들어야 바닥 그림자가 고리로 뚫리지 않는다.
          단면 재질은 그림자를 뒷면으로 그리는데 이 면은 위를 보고 있어 잘려나가므로 양면으로 지정한다 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[mx, TOP + 0.2, mz]} castShadow>
        <circleGeometry args={[0.106, 32]} />
        <meshStandardMaterial
          color={scenePalette.furniture.coffee}
          roughness={0.2}
          metalness={0.05}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>
      </Interactive>
      {seeds.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            sprites.current[i] = el;
          }}
        >
          <spriteMaterial map={steamTex} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}
