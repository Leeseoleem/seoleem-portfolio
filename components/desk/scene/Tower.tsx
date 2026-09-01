'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { RoundedBox } from './RoundedBox';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { positions } from '@/lib/desk/layout';
import { sceneTime } from '@/lib/desk/runtime';
import { getSound } from '@/lib/desk/sound';

/** 책상 아래 본체. 전원 버튼을 누르면 사이트 종료 시퀀스가 시작된다 */
export function Tower() {
  const powerOff = useDeskStore((s) => s.powerOff);
  const ledMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const { phase, shutdownAt } = useDeskStore.getState();
    if (!ledMat.current) return;
    if (phase === 'off') {
      const k = Math.min(1, (sceneTime() - shutdownAt) / 1.9);
      ledMat.current.color.set(k > 0.95 ? scenePalette.led.off : scenePalette.led.on);
    }
  });

  const press = () => {
    if (useDeskStore.getState().phase === 'off') return;
    getSound().play('click');
    window.setTimeout(() => getSound().play('shutdown'), 250);
    powerOff(sceneTime());
  };

  const [tx, , tz] = positions.tower;
  const beige = scenePalette.furniture.beige;

  return (
    <group position={[tx, 0, tz]}>
      <RoundedBox size={[0.34, 1.0, 0.7]} radius={0.02} color={beige} roughness={0.6} position={[0, 0.5, 0]} />
      <RoundedBox size={[0.345, 0.96, 0.03]} radius={0.01} color={scenePalette.furniture.beigeDark} position={[0, 0.5, 0.34]} castShadow={false} />
      {[0.86, 0.78].map((y) => (
        <group key={y}>
          <RoundedBox size={[0.26, 0.05, 0.02]} radius={0.008} color={beige} position={[0, y, 0.36]} castShadow={false} />
          <RoundedBox size={[0.2, 0.006, 0.005]} radius={0.002} color={scenePalette.furniture.black} position={[0, y - 0.013, 0.371]} castShadow={false} />
        </group>
      ))}
      <mesh position={[0, 0.22, 0.356]}>
        <planeGeometry args={[0.16, 0.16]} />
        <meshStandardMaterial color={scenePalette.furniture.vent} roughness={0.9} />
      </mesh>

      <Interactive label="전원" onActivate={press} lift={false} position={[0, 0.58, 0.356]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.014, 20]} />
          <meshStandardMaterial color={beige} roughness={0.6} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.035, 0.003, 8, 24]} />
          <meshStandardMaterial color={scenePalette.furniture.beigeDark} roughness={0.7} />
        </mesh>
        {/* 클릭 판정을 넓히는 투명 히트 박스 */}
        <mesh>
          <boxGeometry args={[0.09, 0.09, 0.03]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={[0.07, 0.02, 0.001]}>
          <circleGeometry args={[0.006, 10]} />
          <meshBasicMaterial ref={ledMat} color={scenePalette.led.on} />
        </mesh>
        <mesh position={[0.07, -0.004, 0.001]}>
          <circleGeometry args={[0.005, 10]} />
          <meshBasicMaterial color={scenePalette.led.hdd} />
        </mesh>
      </Interactive>
    </group>
  );
}
