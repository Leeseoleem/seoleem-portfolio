'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { RoundedBox } from './RoundedBox';
import { scenePalette } from '@/lib/desk/palette';
import { positions } from '@/lib/desk/layout';
import {
  DeformableTube,
  createCatBodyGeometry,
  createCatSkullGeometry,
  createEarGeometry,
  createRoundedTriangleGeometry,
  createSurfacePatch,
  probeDown,
  probeForward,
} from '@/lib/desk/geometry';
import { drawCatEye, EYE_H, EYE_W } from '@/lib/desk/cat-eye';
import { catState } from '@/lib/desk/cat-state';
import { getSound } from '@/lib/desk/sound';

const HEAD_R = 0.19;
const CUSHION_H = 0.14;
const TAIL_REST = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.14, 0.0, 0.02),
  new THREE.Vector3(0.2, -0.01, 0.3),
  new THREE.Vector3(0.12, 0.0, 0.58),
  new THREE.Vector3(-0.02, 0.03, 0.66),
];

interface EarPlacement {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

interface HeadAssets {
  skull: THREE.SphereGeometry;
  ears: EarPlacement[];
  earGeo: THREE.LatheGeometry;
  innerEarGeo: THREE.LatheGeometry;
  eyes: THREE.PlaneGeometry[];
  noseGeo: THREE.BufferGeometry;
  nose: { position: THREE.Vector3; quaternion: THREE.Quaternion };
}

function buildHead(): HeadAssets {
  const skull = createCatSkullGeometry(HEAD_R);
  const probe = new THREE.Mesh(skull);
  const up = new THREE.Vector3(0, 1, 0);

  const ears: EarPlacement[] = [-1, 1].map((side) => {
    const hit = probeDown(probe, side * 0.088, -0.03);
    const n = hit ? hit.normal : new THREE.Vector3(side * 0.4, 1, 0).normalize();
    const p = hit ? hit.point : new THREE.Vector3(side * 0.088, HEAD_R * 0.9, -0.03);
    // 거의 수직으로 세우고 살짝 바깥으로, 밑동은 피부 바로 아래
    const earUp = n.clone().multiplyScalar(0.35).add(new THREE.Vector3(0, 0.65, 0)).normalize();
    const position = p.clone().addScaledVector(earUp, -0.052);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, earUp);
    const lean = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -side * 0.22);
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), side * 0.2);
    quaternion.multiply(lean).multiply(turn);
    return { position, quaternion };
  });

  const eyes = [-1, 1].map((side) => {
    const n = new THREE.Vector3(side * 0.58, 0.2, 1).normalize();
    const center = n.clone().multiplyScalar(HEAD_R + 0.004);
    const u = new THREE.Vector3().crossVectors(up, n).normalize();
    const v = new THREE.Vector3().crossVectors(n, u).normalize();
    return createSurfacePatch(probe, center, u, v, 0.18, 0.172, 10, side < 0);
  });

  const noseHit = probeForward(probe, 0, -0.045);
  const noseN = noseHit ? noseHit.normal : new THREE.Vector3(0, 0, 1);
  const nosePos = (noseHit ? noseHit.point : new THREE.Vector3(0, -0.045, HEAD_R)).addScaledVector(noseN, 0.003);

  return {
    skull,
    ears,
    earGeo: createEarGeometry(0.058, 0.17, 0.025),
    innerEarGeo: createEarGeometry(0.03, 0.1),
    eyes,
    noseGeo: createRoundedTriangleGeometry(0.06, 0.045, 0.017),
    nose: { position: nosePos, quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), noseN) },
  };
}

function toeGroovePoints(side: number, az: number): THREE.Vector3[] {
  return [0.45, 0.25, 0.05, -0.15].map(
    (el) =>
      new THREE.Vector3(
        side * 0.135 + 0.068 * 0.995 * Math.cos(el) * Math.sin(az),
        0.028 + 0.037 * 0.995 * Math.sin(el),
        0.3 + 0.068 * 0.995 * Math.cos(el) * Math.cos(az),
      ),
  );
}

/**
 * 책상 안쪽 구석 방석 위의 회색 고양이(식빵 자세). 누르면 그르릉거리며 눈 키스를 한다.
 * 쥐가 나오면 동공이 세로로 좁아지고 고개를 돌린다.
 */
export function Cat() {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tailGroup = useRef<THREE.Group>(null);
  const tailMesh = useRef<THREE.Mesh>(null);
  const tailTip = useRef<THREE.Mesh>(null);
  const earMeshes = useRef<Array<THREE.Mesh | null>>([]);
  const anim = useRef({ pupilSlit: 0, blinkStart: -10, nextIdleBlink: 6 + Math.random() * 8, lastBlink: -1, lastSlit: -1 });

  const assets = useMemo(() => buildHead(), []);
  const bodyGeo = useMemo(() => createCatBodyGeometry(), []);
  const tailPoints = useMemo(() => TAIL_REST.map((v) => v.clone()), []);
  const tailCurve = useMemo(() => new THREE.CatmullRomCurve3(tailPoints), [tailPoints]);
  const tail = useMemo(() => new DeformableTube(tailCurve, 20, 0.036, 8), [tailCurve]);
  const toeGrooves = useMemo(
    () => [-1, 1].flatMap((side) => [-0.32, 0.32].map((az) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(toeGroovePoints(side, az)), 12, 0.0045, 8, false))),
    [],
  );

  const { eyeCanvas, eyeTex } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = EYE_W;
    c.height = EYE_H;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { eyeCanvas: c, eyeTex: tex };
  }, []);

  useEffect(() => {
    const ctx = eyeCanvas.getContext('2d');
    if (ctx) {
      drawCatEye(ctx, 0, 0);
      eyeTex.needsUpdate = true;
    }
    return () => {
      eyeTex.dispose();
      assets.skull.dispose();
      assets.earGeo.dispose();
      assets.innerEarGeo.dispose();
      assets.noseGeo.dispose();
      assets.eyes.forEach((g) => g.dispose());
      bodyGeo.dispose();
      tail.dispose();
      toeGrooves.forEach((g) => g.dispose());
    };
  }, [assets, bodyGeo, eyeCanvas, eyeTex, tail, toeGrooves]);

  const blinkAmount = (nowMs: number) => {
    const e = (nowMs - anim.current.blinkStart) / 1000;
    if (e < 0 || e > 2.0) return 0;
    if (e < 0.8) return e / 0.8;
    if (e < 1.2) return 1;
    return 1 - (e - 1.2) / 0.8;
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const now = performance.now();
    const a = anim.current;
    const excited = now < catState.purrUntil;

    // 경계 상태(쥐)는 빠르게 슬릿으로, 해제는 천천히
    const target = catState.alertTarget;
    a.pupilSlit += (target - a.pupilSlit) * (target ? 0.45 : 0.12);
    const alert = a.pupilSlit > 0.5;

    // 눈 키스 요청과 가끔 하는 자동 깜빡임. 경계 중에는 감지 않는다
    if (catState.blinkRequestAt >= 0 && now >= catState.blinkRequestAt) {
      a.blinkStart = now;
      catState.blinkRequestAt = -1;
    }
    if (t > a.nextIdleBlink) {
      if (!alert) a.blinkStart = now;
      a.nextIdleBlink = t + 8 + Math.random() * 10;
    }
    const blinkRaw = alert ? 0 : blinkAmount(now);
    const blink = blinkRaw * blinkRaw * (3 - 2 * blinkRaw);
    if (Math.abs(blink - a.lastBlink) > 0.01 || Math.abs(a.pupilSlit - a.lastSlit) > 0.01) {
      const ctx = eyeCanvas.getContext('2d');
      if (ctx) {
        drawCatEye(ctx, blink, a.pupilSlit);
        eyeTex.needsUpdate = true;
      }
      a.lastBlink = blink;
      a.lastSlit = a.pupilSlit;
    }

    // 꼬리: 뿌리에서 끝으로 전달되는 파동(채찍)
    if (tailMesh.current && tailTip.current) {
      const speed = excited ? 6.5 : 1.4;
      const amp = excited ? 0.11 : 0.045;
      for (let i = 0; i < tailPoints.length; i++) {
        const k = i / (tailPoints.length - 1);
        const lag = k * 2.4;
        const w = Math.pow(k, 1.6);
        tailPoints[i].copy(TAIL_REST[i]);
        tailPoints[i].y += Math.sin(t * speed - lag) * amp * w;
        tailPoints[i].x += Math.sin(t * speed * 0.5 - lag) * amp * 0.35 * w;
      }
      tail.update(tailCurve);
      tailTip.current.position.copy(tailCurve.getPoint(1));
    }

    if (body.current) body.current.scale.y = 1 + Math.sin(t * (excited ? 12 : 2.0)) * (excited ? 0.02 : 0.01);
    if (head.current) {
      head.current.rotation.z = excited ? Math.sin(t * 5) * 0.08 : 0;
      head.current.rotation.y += ((alert ? 0.55 : 0) - head.current.rotation.y) * 0.1;
    }
    earMeshes.current.forEach((ear, i) => {
      if (ear) ear.rotation.x = excited ? Math.sin(t * 14 + i) * 0.1 : 0;
    });
  });

  const purr = () => {
    getSound().play('purr');
    catState.purrUntil = performance.now() + 2200;
    catState.blinkRequestAt = performance.now() + 200;
  };

  const fur = scenePalette.cat.fur;

  return (
    <Interactive label="...?" onActivate={purr} lift={false} position={positions.cat} rotation={[0, 0.85, 0]}>
      {/* 방석 */}
      <RoundedBox size={[0.8, CUSHION_H, 0.8]} radius={0.07} color={scenePalette.cat.cushion} roughness={0.95} position={[0, CUSHION_H / 2, 0]} castShadow={false} />
      <mesh position={[0, CUSHION_H, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color={scenePalette.cat.cushionButton} roughness={0.9} />
      </mesh>

      <group ref={body} position={[0, CUSHION_H, 0]}>
        {/* 몸통: 평평한 바닥이 방석 윗면에 닿는다 */}
        <mesh geometry={bodyGeo} scale={[1, 0.72, 1]} position={[0, 0.2 * 0.72, 0]}>
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
        {/* 앞발: 몸통 앞에 대부분 묻히고 끝만 보인다 */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.135, 0.028, 0.3]} scale={[1.1, 0.6, 1.1]}>
            <sphereGeometry args={[0.062, 20, 14]} />
            <meshStandardMaterial color={fur} roughness={0.9} />
          </mesh>
        ))}
        {toeGrooves.map((g, i) => (
          <mesh key={i} geometry={g}>
            <meshStandardMaterial color={scenePalette.cat.toe} roughness={0.95} />
          </mesh>
        ))}

        {/* 머리 */}
        <group ref={head} position={[0, 0.31, 0.27]}>
          <mesh geometry={assets.skull}>
            <meshStandardMaterial color={fur} roughness={0.9} />
          </mesh>
          {assets.ears.map((ear, i) => (
            <group key={i} position={ear.position} quaternion={ear.quaternion}>
              <mesh
                ref={(el) => {
                  earMeshes.current[i] = el;
                }}
                geometry={assets.earGeo}
              >
                <meshStandardMaterial color={fur} roughness={0.9} />
                <mesh geometry={assets.innerEarGeo} position={[0, 0.03, 0.02]}>
                  <meshStandardMaterial color={scenePalette.cat.innerEar} roughness={0.9} />
                </mesh>
              </mesh>
            </group>
          ))}
          {assets.eyes.map((g, i) => (
            <mesh key={i} geometry={g} renderOrder={2}>
              <meshBasicMaterial map={eyeTex} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          ))}
          <mesh geometry={assets.noseGeo} position={assets.nose.position} quaternion={assets.nose.quaternion}>
            <meshStandardMaterial color={scenePalette.cat.nose} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* 꼬리 */}
        <group ref={tailGroup} position={[0.16, 0.08, -0.32]}>
          <mesh ref={tailMesh} geometry={tail.geometry}>
            <meshStandardMaterial color={fur} roughness={0.9} />
          </mesh>
          <mesh ref={tailTip}>
            <sphereGeometry args={[0.042, 16, 12]} />
            <meshStandardMaterial color={fur} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </Interactive>
  );
}
