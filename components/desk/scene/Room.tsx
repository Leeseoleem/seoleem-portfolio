'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { positions, SCREEN_CENTER } from '@/lib/desk/layout';
import { lerpLight, nightMix } from '@/lib/desk/night';
import { prefersReducedMotion, sceneTime } from '@/lib/desk/runtime';

/**
 * 벽, 바닥, 조명. 밤/낮 전환을 매 프레임 보간한다.
 * 조명 세기는 three r155+의 물리 단위(candela) 기준이라 프로토타입 값에 π를 곱한 수준이다.
 */
export function Room() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const shadowMix = useRef(-1);
  const wallMat = useRef<THREE.MeshStandardMaterial>(null);
  const floorMat = useRef<THREE.MeshStandardMaterial>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const screenLight = useRef<THREE.PointLight>(null);

  const colors = useMemo(
    () => ({
      wallDay: new THREE.Color(scenePalette.room.wallDay),
      wallNight: new THREE.Color(scenePalette.room.wallNight),
      floorDay: new THREE.Color(scenePalette.room.floorDay),
      floorNight: new THREE.Color(scenePalette.room.floorNight),
      bgDay: new THREE.Color(scenePalette.room.backgroundDay),
      bgNight: new THREE.Color(scenePalette.room.backgroundNight),
      ambientDay: new THREE.Color(scenePalette.light.ambientDay),
      ambientNight: new THREE.Color(scenePalette.light.ambientNight),
      hemiDay: new THREE.Color(scenePalette.light.hemiSkyDay),
      hemiNight: new THREE.Color(scenePalette.light.hemiSkyNight),
      background: new THREE.Color(scenePalette.room.backgroundDay),
    }),
    [],
  );

  // 그림자는 매 프레임 다시 그릴 이유가 없다. 조명이 바뀔 때만 갱신한다.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
  }, [gl]);

  useFrame((state) => {
    const { isNight, phase, shutdownAt } = useDeskStore.getState();
    const goal = isNight ? 1 : 0;
    const k = prefersReducedMotion() ? 1 : 0.05;
    nightMix.value += (goal - nightMix.value) * k;
    const mix = nightMix.value;

    if (ambient.current) {
      ambient.current.intensity = lerpLight('ambient', mix);
      ambient.current.color.copy(colors.ambientDay).lerp(colors.ambientNight, mix);
    }
    if (hemi.current) {
      hemi.current.intensity = lerpLight('hemi', mix);
      hemi.current.color.copy(colors.hemiDay).lerp(colors.hemiNight, mix);
    }
    if (fill.current) {
      fill.current.intensity = lerpLight('fill', mix);
      fill.current.castShadow = mix < 0.5;
    }
    if (screenLight.current) {
      let s = lerpLight('screen', mix) * (1 + Math.sin(state.clock.elapsedTime * 9) * 0.05);
      if (phase === 'off') s *= 1 - Math.min(1, (sceneTime() - shutdownAt) / 1.9);
      screenLight.current.intensity = s;
    }
    if (Math.abs(mix - shadowMix.current) > 0.02) {
      gl.shadowMap.needsUpdate = true;
      shadowMix.current = mix;
    }
    if (wallMat.current) wallMat.current.color.copy(colors.wallDay).lerp(colors.wallNight, mix);
    if (floorMat.current) floorMat.current.color.copy(colors.floorDay).lerp(colors.floorNight, mix);

    // 부팅 중에는 검은 배경(화면 밖 여백), 이후에는 방 색으로
    if (phase === 'boot') colors.background.setScalar(0);
    else colors.background.copy(colors.bgDay).lerp(colors.bgNight, mix);
    scene.background = colors.background;
  });

  return (
    <group>
      <mesh position={[0, 3, positions.wallZ]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial ref={wallMat} color={scenePalette.room.wallDay} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial ref={floorMat} color={scenePalette.room.floorDay} roughness={0.9} />
      </mesh>

      <ambientLight ref={ambient} color={scenePalette.light.ambientDay} intensity={1.0} />
      <hemisphereLight ref={hemi} color={scenePalette.light.hemiSkyDay} groundColor={scenePalette.light.hemiGround} intensity={0.9} />
      <directionalLight
        ref={fill}
        color={scenePalette.light.fill}
        intensity={1.3}
        position={[2, 4, 3]}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0005}
      />
      <pointLight
        ref={screenLight}
        color={scenePalette.light.screenGlow}
        intensity={1.1}
        distance={3.2}
        decay={2}
        position={[0, SCREEN_CENTER[1], 0.5]}
      />
    </group>
  );
}
