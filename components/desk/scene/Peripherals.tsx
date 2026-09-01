'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { RoundedBox } from './RoundedBox';
import { createMouseShellGeometry, mouseShellRise } from '@/lib/desk/geometry';
import { canvasPalette, scenePalette } from '@/lib/desk/palette';
import { positions, TOP } from '@/lib/desk/layout';
import { getSound } from '@/lib/desk/sound';

// 마우스는 매끈한 돔 하나로 만들고, 분할선과 아래 테두리는 표면 텍스처로 새긴다.
// 껍데기를 쪼개면 덩어리가 따로 놀아서 실제 마우스처럼 보이지 않는다.
const [MX, , MZ] = positions.mouse;
const MOUSE_RX = 0.058;
const MOUSE_RY = 0.05;
const MOUSE_RZ = 0.085;
// 돔 꼭대기에서 휠까지의 각도. 0이 꼭대기, Math.PI / 2가 바닥 테두리다
const WHEEL_ANGLE = 0.62;
const WHEEL_R = 0.013;
const TEX_W = 512;
const TEX_H = 256;
// 마우스 앞쪽(사용자 반대편) 중심선이 텍스처에서 놓이는 자리
const FRONT_U = 0.75;

/** 마우스 껍데기에 새길 선을 그린다 */
function drawShellTexture(ctx: CanvasRenderingContext2D) {
  const p = canvasPalette.pointer;
  const cx = TEX_W * FRONT_U;
  ctx.fillStyle = p.body;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // 좌우 버튼을 가르는 선. 돔 꼭대기에서 앞쪽으로 내려온다.
  // 실제 비율대로 그리면 화면에서 1픽셀도 안 되므로 눈에 읽힐 만큼 굵게 그린다
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, TEX_H * 0.62);
  ctx.stroke();
  // 바닥 테두리. 위도선이라 몸통을 한 바퀴 두른다
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, TEX_H * 0.9);
  ctx.lineTo(TEX_W, TEX_H * 0.9);
  ctx.stroke();
  // 휠이 앉는 홈
  ctx.fillStyle = p.slot;
  const slotY = TEX_H * (WHEEL_ANGLE / (Math.PI / 2));
  ctx.beginPath();
  ctx.roundRect(cx - 9, slotY - 26, 18, 52, 9);
  ctx.fill();
}

/** 키보드와 마우스. 누르면 소리만 난다. 툴팁 없음 */
export function Peripherals() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = TEX_W;
    c.height = TEX_H;
    const ctx = c.getContext('2d');
    if (ctx) drawShellTexture(ctx);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const shell = useMemo(() => createMouseShellGeometry(), []);
  useEffect(() => () => shell.dispose(), [shell]);

  const wheelPos = useMemo<[number, number, number]>(() => {
    // 껍데기와 같은 변형을 적용한 표면 지점에서, 살짝 파묻히도록 안쪽으로 당긴다
    const unitZ = -Math.sin(WHEEL_ANGLE);
    const y = MOUSE_RY * Math.cos(WHEEL_ANGLE) * mouseShellRise(unitZ);
    const z = MOUSE_RZ * unitZ;
    return [MX, TOP + y - 0.004, MZ + z + 0.003];
  }, [shell]);

  return (
    <group>
      <Interactive onActivate={() => getSound().play('keys')} lift={false}>
        <RoundedBox size={[1.15, 0.04, 0.36]} color={scenePalette.furniture.beige} roughness={0.6} position={positions.keyboard} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[positions.keyboard[0], TOP + 0.041, positions.keyboard[2]]}>
          <planeGeometry args={[1.05, 0.28]} />
          <meshStandardMaterial color={scenePalette.furniture.keys} roughness={0.8} />
        </mesh>
      </Interactive>
      <Interactive onActivate={() => getSound().play('mouseClick')} lift={false}>
        {/* 껍데기. 반구를 눌러 낮고 길쭉한 돔으로 만든다 */}
        <mesh geometry={shell} position={[MX, TOP, MZ]} scale={[MOUSE_RX, MOUSE_RY, MOUSE_RZ]} castShadow>
          <meshStandardMaterial map={texture} roughness={0.5} />
        </mesh>
        {/* 휠 */}
        <mesh position={wheelPos} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.008, 20]} />
          <meshStandardMaterial color={scenePalette.pointer.wheel} roughness={0.5} />
        </mesh>
      </Interactive>
    </group>
  );
}
