'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { positions } from '@/lib/desk/layout';
import { lerpLight, lighting, nightMix } from '@/lib/desk/night';
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

/**
 * 형광등 스타터처럼 켜지는 순서. [이 시각(초)까지, 밝기] 구간의 나열이다.
 * 효과음(lightFlicker)의 박자에 맞춰 두었다. 0초와 0.05초의 '띡', 0.12초부터의 '띠딕',
 * 0.5초부터 이어지는 웅- 소리. 마지막 구간이 끝나면 평소 밝기로 넘어간다.
 */
const IGNITE: Array<[number, number]> = [
  [0.04, 1],
  [0.12, 0],
  [0.2, 0.55],
  [0.3, 0],
  [0.38, 1],
  [0.46, 0.08],
  [0.6, 1],
];
/** 끌 때는 한 번 되살아나는 듯하다가 꺼진다 */
const EXTINGUISH: Array<[number, number]> = [
  [0.05, 0],
  [0.1, 0.7],
  [0.22, 0],
];

/** 구간표에서 지금 밝기를 찾는다. 표가 끝났으면 null */
function envelope(pattern: Array<[number, number]>, elapsed: number): number | null {
  for (const [until, level] of pattern) if (elapsed < until) return level;
  return null;
}

/** +Y축을 Z축 기준으로 rz만큼 돌렸을 때의 방향 */
function dirFromRot(rz: number) {
  return new THREE.Vector3(-Math.sin(rz), Math.cos(rz), 0);
}

/** 올 화이트 스탠드. 누르면 밤이 되고(램프 점등) 다시 누르면 낮으로 돌아온다 */
export function Lamp() {
  const isNight = useDeskStore((s) => s.isNight);
  const light = useRef<THREE.SpotLight>(null);
  /** 갓 주변으로 번지는 빛. 원뿔 하나만 있으면 손전등처럼 보인다 */
  const glowLight = useRef<THREE.PointLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const headMat = useRef<THREE.MeshStandardMaterial>(null);
  const bulbMat = useRef<THREE.MeshBasicMaterial>(null);
  /** 진행 중인 점등/소등 연출. 없으면 밤낮 진행도를 그대로 따른다 */
  const flick = useRef<{ start: number; pattern: Array<[number, number]> } | null>(null);

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
    // 평소에는 밤낮 진행도를 따라 서서히 밝아진다
    let intensity = lerpLight('lamp', mix);
    let spill = lerpLight('lampGlow', mix);
    let glow = mix;
    // 연출 중에는 진행도와 무관하게 구간표의 밝기를 그대로 낸다.
    // 진행도에 곱하면 켜지기 시작할 때 값이 0에 가까워 깜빡임이 보이지 않는다
    const f = flick.current;
    if (f) {
      const level = envelope(f.pattern, (performance.now() - f.start) / 1000);
      if (level === null) {
        flick.current = null;
      } else {
        intensity = lighting.night.lamp * level;
        spill = lighting.night.lampGlow * level;
        glow = level;
      }
    }
    if (light.current) {
      light.current.intensity = intensity;
      light.current.target = target;
    }
    if (glowLight.current) glowLight.current.intensity = spill;
    // 전구와 갓 안쪽도 같은 밝기로 깜빡여야 램프가 켜지는 것처럼 보인다
    if (headMat.current) headMat.current.emissiveIntensity = glow * 0.6;
    if (bulbMat.current) bulbMat.current.color.copy(geo.colors.off).lerp(geo.colors.on, glow);
  });

  const toggle = () => {
    const next = !useDeskStore.getState().isNight;
    useDeskStore.getState().setNight(next);
    getSound().play('lightFlicker');
    if (!prefersReducedMotion()) flick.current = { start: performance.now(), pattern: next ? IGNITE : EXTINGUISH };
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
          distance={5.5}
          /* 갓 폭보다 조금 넓은 원뿔. 너무 넓히면 책상 전체가 고르게 밝아져서 웅덩이가 사라진다.
             가장자리는 최대한 풀어서 경계선이 보이지 않게 한다 */
          angle={Math.PI / 4}
          penumbra={0.95}
          decay={2}
          position={geo.bulb}
          /* 그림자는 진행도로 켜고 끄지 않는다. 세기에 비례해 저절로 짙어지고 옅어지므로,
             중간에 스위치를 두면 그 순간 그림자가 한 번에 튀어나온다 */
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
        />
        {/* 갓에서 새는 빛과 되튕긴 빛. 그림자는 만들지 않고 주변만 채운다 */}
        <pointLight ref={glowLight} color={scenePalette.lamp.lightWarm} intensity={0} distance={3.5} decay={2} position={geo.bulb} />
        <primitive object={target} position={geo.aim} />
      </group>
    </Interactive>
  );
}
