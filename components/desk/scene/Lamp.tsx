'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { positions, TOP } from '@/lib/desk/layout';
import { lerpLight, nightMix } from '@/lib/desk/night';
import { prefersReducedMotion } from '@/lib/desk/runtime';
import { getSound } from '@/lib/desk/sound';

const ARM_LEN = 0.95;
const ARM_TILT = 0.3;

/** 올 화이트 스탠드. 누르면 밤이 되고(램프 점등) 다시 누르면 낮으로 돌아온다 */
export function Lamp() {
  const isNight = useDeskStore((s) => s.isNight);
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const headMat = useRef<THREE.MeshStandardMaterial>(null);
  const bulbMat = useRef<THREE.MeshBasicMaterial>(null);
  const flickerUntil = useRef(0);

  const geo = useMemo(() => {
    const armDir = new THREE.Vector3(Math.sin(ARM_TILT), Math.cos(ARM_TILT), 0);
    const base = new THREE.Vector3(...positions.lampBase);
    const armCenter = base.clone().addScaledVector(armDir, ARM_LEN / 2);
    const armEnd = base.clone().addScaledVector(armDir, ARM_LEN);
    const head = armEnd.clone().add(new THREE.Vector3(0.06, -0.04, 0));
    const bulb = head.clone().add(new THREE.Vector3(0.06, -0.09, 0));
    return { armCenter, head, bulb, colors: { off: new THREE.Color(scenePalette.lamp.bulbOff), on: new THREE.Color(scenePalette.lamp.bulbOn) } };
  }, []);

  useFrame(() => {
    const mix = nightMix.value;
    const now = performance.now();
    // 켜진 직후 0.7초 동안 불규칙하게 떨린다
    let flicker = 1;
    if (now < flickerUntil.current) {
      const k = (flickerUntil.current - now) / 700;
      flicker = Math.random() < 0.35 * k ? 0.15 : 1;
    }
    if (light.current) {
      light.current.intensity = lerpLight('lamp', mix) * flicker;
      light.current.castShadow = mix >= 0.5;
      light.current.target = target;
    }
    if (headMat.current) headMat.current.emissiveIntensity = mix * 0.8 * 0.35;
    if (bulbMat.current) bulbMat.current.color.copy(geo.colors.off).lerp(geo.colors.on, mix);
  });

  const toggle = () => {
    const next = !useDeskStore.getState().isNight;
    useDeskStore.getState().setNight(next);
    getSound().play('lightFlicker');
    if (next && !prefersReducedMotion()) flickerUntil.current = performance.now() + 700;
  };

  return (
    <Interactive label={isNight ? '조명 끄기' : '조명 켜기'} onActivate={toggle} lift={false}>
      <mesh position={positions.lampBase} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.05, 32]} />
        <meshStandardMaterial color={scenePalette.furniture.white} roughness={0.45} />
      </mesh>
      <mesh position={geo.armCenter} rotation={[0, 0, -ARM_TILT]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, ARM_LEN, 16]} />
        <meshStandardMaterial color={scenePalette.furniture.white} roughness={0.45} />
      </mesh>
      <mesh position={geo.head} rotation={[0, 0, 0.45]} castShadow>
        <coneGeometry args={[0.2, 0.24, 24, 1, false]} />
        <meshStandardMaterial
          ref={headMat}
          color={scenePalette.furniture.white}
          roughness={0.45}
          side={THREE.DoubleSide}
          emissive={scenePalette.lamp.headGlow}
          emissiveIntensity={0}
        />
      </mesh>
      <mesh position={geo.bulb}>
        <sphereGeometry args={[0.045, 16, 12]} />
        <meshBasicMaterial ref={bulbMat} color={scenePalette.lamp.bulbOff} />
      </mesh>
      <spotLight
        ref={light}
        color={scenePalette.lamp.lightWarm}
        intensity={0}
        distance={6}
        angle={Math.PI / 3.2}
        penumbra={0.55}
        decay={2}
        position={geo.bulb}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0006}
      />
      <primitive object={target} position={[-0.3, TOP, 0.25]} />
    </Interactive>
  );
}
