'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { scenePalette } from '@/lib/desk/palette';
import { positions } from '@/lib/desk/layout';
import { createArchGeometry } from '@/lib/desk/geometry';
import { catState } from '@/lib/desk/cat-state';
import { getSound } from '@/lib/desk/sound';

const MOUSE_OUT = 0.22;
// 타임라인(초): 0~0.5 기어 나옴, 0.5~1.4 두리번, 1.4~1.55 놀라서 폴짝, 1.55~1.85 도망
function outAmount(e: number): number {
  if (e < 0) return 0;
  if (e < 0.5) return e / 0.5;
  if (e < 1.55) return 1;
  if (e < 1.85) return 1 - (e - 1.55) / 0.3;
  return 0;
}

/** 벽 아래 쥐구멍. 클릭하면 쥐가 빼꼼 나와 고양이를 보고 놀라 들어간다 */
export function MouseHole() {
  const clock = useThree((s) => s.clock);
  const mouse = useRef<THREE.Group>(null);
  const startedAt = useRef(-10);
  const [hx, , hz] = positions.mouseHole;

  const holeGeo = useMemo(() => createArchGeometry(0.11, 0.09), []);
  const trimGeo = useMemo(() => createArchGeometry(0.13, 0.09), []);
  useEffect(
    () => () => {
      holeGeo.dispose();
      trimGeo.dispose();
    },
    [holeGeo, trimGeo],
  );

  useFrame((state) => {
    const e = state.clock.elapsedTime - startedAt.current;
    const out = outAmount(e);
    if (!mouse.current) return;
    const visible = e >= 0 && e < 1.85;
    mouse.current.visible = visible;
    if (!visible) {
      catState.alertTarget = 0;
      return;
    }
    const ease = out * out * (3 - 2 * out);
    mouse.current.position.z = hz - 0.2 + ease * MOUSE_OUT;
    const hop = e > 1.4 && e < 1.55 ? Math.sin(((e - 1.4) / 0.15) * Math.PI) * 0.05 : 0;
    mouse.current.position.y = hop;
    mouse.current.rotation.y = e > 0.5 && e < 1.4 ? Math.sin((e - 0.5) * 6) * 0.35 : 0;
    catState.alertTarget = out > 0.3 ? 1 : 0;
  });

  const poke = () => {
    if (clock.elapsedTime - startedAt.current < 2.2) return; // 이미 나와 있는 중
    startedAt.current = clock.elapsedTime;
    window.setTimeout(() => getSound().play('squeak'), 1400);
  };

  const fur = scenePalette.mouse.fur;

  return (
    <group>
      <Interactive label="쥐구멍" onActivate={poke} lift={false} position={[hx, 0, hz]}>
        <mesh geometry={holeGeo}>
          <meshBasicMaterial color={scenePalette.mouse.hole} />
        </mesh>
        <mesh geometry={trimGeo} position={[0, 0, -0.002]}>
          <meshStandardMaterial color={scenePalette.mouse.holeTrim} roughness={0.9} />
        </mesh>
      </Interactive>

      <group ref={mouse} position={[hx, 0, hz - 0.2]} visible={false}>
        <mesh position={[0, 0.045, 0]} scale={[0.9, 0.8, 1.4]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0.1]}>
          <coneGeometry args={[0.04, 0.09, 16]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.03, 0.085, 0.06]} rotation={[0, side * 0.3, 0]}>
              <circleGeometry args={[0.022, 12]} />
              <meshStandardMaterial color={scenePalette.mouse.ear} roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[side * 0.018, 0.06, 0.11]}>
              <sphereGeometry args={[0.007, 8, 6]} />
              <meshBasicMaterial color={scenePalette.mouse.eye} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.05, 0.146]}>
          <sphereGeometry args={[0.008, 8, 6]} />
          <meshBasicMaterial color={scenePalette.mouse.nose} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, -0.12]}>
          <cylinderGeometry args={[0.005, 0.003, 0.14, 8]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
