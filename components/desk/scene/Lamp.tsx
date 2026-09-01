'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { positions } from '@/lib/desk/layout';
import { lerpLight, nightMix } from '@/lib/desk/night';
import { prefersReducedMotion } from '@/lib/desk/runtime';
import { getSound } from '@/lib/desk/sound';

// 봉은 수직 기둥 → 관절 → 기울어진 팔 → 관절 → 짧은 목 → 갓 순서로 꺾인다.
// 각 각도는 실린더의 기본 축(+Y)을 Z축으로 얼마나 돌리는지를 뜻한다.
const POST_H = 0.58;
const POST_R = 0.021;
const JOINT_R = 0.03;
const ARM_LEN = 0.4;
const ARM_ROT = -0.62;
const NECK_LEN = 0.14;
const NECK_ROT = -1.85;
// 갓은 원뿔이 아니라 위가 잘린 원통이다. 좁은 위쪽이 목에 붙고 넓은 아래쪽이 책상을 향한다
const SHADE_TOP_R = 0.07;
const SHADE_BOT_R = 0.185;
const SHADE_H = 0.21;
const SHADE_ROT = 0.47;
// 받침 안에서 봉 전체가 돌아간 각도(약 27도). 갓은 앞쪽을 보되 팔 실루엣이 가려지지 않는 선
const YAW = -0.48;

/** +Y축을 Z축 기준으로 rz만큼 돌렸을 때의 방향 */
function dirFromRot(rz: number) {
  return new THREE.Vector3(-Math.sin(rz), Math.cos(rz), 0);
}

/** 올 화이트 스탠드. 누르면 밤이 되고(램프 점등) 다시 누르면 낮으로 돌아온다 */
export function Lamp() {
  const isNight = useDeskStore((s) => s.isNight);
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const headMat = useRef<THREE.MeshStandardMaterial>(null);
  const bulbMat = useRef<THREE.MeshBasicMaterial>(null);
  const flickerUntil = useRef(0);

  // 받침 중심을 원점으로 두고 계산한다. 실제 배치와 회전은 바깥 group이 맡는다
  const geo = useMemo(() => {
    const armDir = dirFromRot(ARM_ROT);
    const neckDir = dirFromRot(NECK_ROT);
    const shadeDown = dirFromRot(SHADE_ROT).negate();

    const postCenter = new THREE.Vector3(0, POST_H / 2, 0);
    const elbow = new THREE.Vector3(0, POST_H, 0);
    const armCenter = elbow.clone().addScaledVector(armDir, ARM_LEN / 2);
    const wrist = elbow.clone().addScaledVector(armDir, ARM_LEN);
    const neckCenter = wrist.clone().addScaledVector(neckDir, NECK_LEN / 2);
    const shadeTop = wrist.clone().addScaledVector(neckDir, NECK_LEN);
    const shadeCenter = shadeTop.clone().addScaledVector(shadeDown, SHADE_H / 2);
    const bulb = shadeTop.clone().addScaledVector(shadeDown, SHADE_H * 0.8);
    // 빛이 갓이 향한 쪽으로 나가도록 조준점을 갓 축 위에 둔다
    const aim = bulb.clone().addScaledVector(shadeDown, 1.4);

    return {
      postCenter,
      elbow,
      armCenter,
      wrist,
      neckCenter,
      shadeCenter,
      bulb,
      aim,
      colors: { off: new THREE.Color(scenePalette.lamp.bulbOff), on: new THREE.Color(scenePalette.lamp.bulbOn) },
    };
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
      <group position={positions.lampBase} rotation={[0, YAW, 0]}>
        {/* 받침 */}
        <mesh castShadow>
          <cylinderGeometry args={[0.185, 0.195, 0.034, 40]} />
          <meshStandardMaterial color={scenePalette.furniture.white} roughness={0.45} />
        </mesh>
        {/* 수직 기둥 */}
        <mesh position={geo.postCenter} castShadow>
          <cylinderGeometry args={[POST_R, POST_R, POST_H, 16]} />
          <meshStandardMaterial color={scenePalette.furniture.white} roughness={0.45} />
        </mesh>
        {/* 아래 관절 */}
        <mesh position={geo.elbow} castShadow>
          <sphereGeometry args={[JOINT_R, 16, 12]} />
          <meshStandardMaterial color={scenePalette.furniture.white} roughness={0.45} />
        </mesh>
        {/* 기울어진 팔 */}
        <mesh position={geo.armCenter} rotation={[0, 0, ARM_ROT]} castShadow>
          <cylinderGeometry args={[POST_R, POST_R, ARM_LEN, 16]} />
          <meshStandardMaterial color={scenePalette.furniture.white} roughness={0.45} />
        </mesh>
        {/* 위 관절 */}
        <mesh position={geo.wrist} castShadow>
          <sphereGeometry args={[JOINT_R, 16, 12]} />
          <meshStandardMaterial color={scenePalette.furniture.white} roughness={0.45} />
        </mesh>
        {/* 갓으로 이어지는 짧은 목 */}
        <mesh position={geo.neckCenter} rotation={[0, 0, NECK_ROT]} castShadow>
          <cylinderGeometry args={[POST_R, POST_R, NECK_LEN, 16]} />
          <meshStandardMaterial color={scenePalette.furniture.white} roughness={0.45} />
        </mesh>
        {/* 갓 */}
        <mesh position={geo.shadeCenter} rotation={[0, 0, SHADE_ROT]} castShadow>
          <cylinderGeometry args={[SHADE_TOP_R, SHADE_BOT_R, SHADE_H, 40, 1, false]} />
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
          <sphereGeometry args={[0.05, 16, 12]} />
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
        <primitive object={target} position={geo.aim} />
      </group>
    </Interactive>
  );
}
