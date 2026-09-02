'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import { Interactive } from './Interactive';
import { RoundedBox } from './RoundedBox';
import { createMouseShellGeometry, mouseShellRise } from '@/lib/desk/geometry';
import { drawKeyboardFace, KEY_COLS, KEY_ROWS } from '@/lib/desk/keyboard-face';
import { canvasPalette, scenePalette } from '@/lib/desk/palette';
import {
  canPlaceOnDesk,
  KEYBOARD_D,
  KEYBOARD_H,
  KEYBOARD_PAD,
  KEYBOARD_W,
  MOUSE_RX,
  MOUSE_RY,
  MOUSE_RZ,
  positions,
  TOP,
} from '@/lib/desk/layout';
import { getSound } from '@/lib/desk/sound';
import { useDeskStore } from '@/stores/useDeskStore';

// 마우스는 매끈한 돔 하나로 만들고, 분할선과 아래 테두리는 표면 텍스처로 새긴다.
// 껍데기를 쪼개면 덩어리가 따로 놀아서 실제 마우스처럼 보이지 않는다.
// 키보드 판과 마우스 크기는 lib/desk/layout.ts에 있다. 충돌 판정과 같은 숫자를 봐야 하기 때문이다
const [KX, , KZ] = positions.keyboard;
const KEY_TEX_W = 1200;

const [MX, , MZ] = positions.mouse;
// 돔 꼭대기에서 휠까지의 각도. 0이 꼭대기, Math.PI / 2가 바닥 테두리다
const WHEEL_ANGLE = 0.62;
const WHEEL_R = 0.0156;
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
  const keyTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = KEY_TEX_W;
    c.height = Math.round((KEY_TEX_W * KEY_ROWS) / KEY_COLS);
    const ctx = c.getContext('2d');
    if (ctx) drawKeyboardFace(ctx, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
  useEffect(() => () => keyTexture.dispose(), [keyTexture]);

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

  // 그룹(마우스 위치) 기준 로컬 좌표. 마우스를 끌면 그룹이 움직인다
  const wheelPos = useMemo<[number, number, number]>(() => {
    // 껍데기와 같은 변형을 적용한 표면 지점에서, 살짝 파묻히도록 안쪽으로 당긴다
    const unitZ = -Math.sin(WHEEL_ANGLE);
    const y = MOUSE_RY * Math.cos(WHEEL_ANGLE) * mouseShellRise(unitZ);
    const z = MOUSE_RZ * unitZ;
    return [0, y - 0.0048, z + 0.0036];
  }, []);

  // ----- 마우스 끌기 -----
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const rig = useRef<THREE.Group>(null);
  const drag = useRef({ active: false, offX: 0, offZ: 0 });
  const tools = useMemo(
    () => ({
      plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -TOP),
      ray: new THREE.Raycaster(),
      ndc: new THREE.Vector2(),
      hit: new THREE.Vector3(),
    }),
    [],
  );

  /** 화면 좌표를 상판 평면 위의 점으로 바꾼다 */
  const toDeskPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      tools.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      tools.ray.setFromCamera(tools.ndc, camera);
      return tools.ray.ray.intersectPlane(tools.plane, tools.hit);
    },
    [camera, gl, tools],
  );

  const onGrab = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (useDeskStore.getState().phase !== 'desk' || !rig.current) return;
      const p = toDeskPoint(e.clientX, e.clientY);
      if (!p) return;
      e.stopPropagation();
      drag.current = { active: true, offX: rig.current.position.x - p.x, offZ: rig.current.position.z - p.z };
      useDeskStore.getState().setDragging(true);
      useDeskStore.getState().setHover(null);
      document.body.style.cursor = 'grabbing';
    },
    [toDeskPoint],
  );

  useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      if (!drag.current.active || !rig.current) return;
      const p = toDeskPoint(ev.clientX, ev.clientY);
      if (!p) return;
      const pos = rig.current.position;
      // 축을 따로 시도한다. 한쪽이 막혀도 다른 축은 움직여서 물건 모서리를 따라 미끄러진다
      const nx = p.x + drag.current.offX;
      const nz = p.z + drag.current.offZ;
      if (canPlaceOnDesk(nx, pos.z, MOUSE_RX, MOUSE_RZ)) pos.x = nx;
      if (canPlaceOnDesk(pos.x, nz, MOUSE_RX, MOUSE_RZ)) pos.z = nz;
    };
    const onRelease = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      useDeskStore.getState().setDragging(false);
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onRelease);
    window.addEventListener('pointercancel', onRelease);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onRelease);
      window.removeEventListener('pointercancel', onRelease);
      useDeskStore.getState().setDragging(false);
    };
  }, [toDeskPoint]);

  return (
    <group>
      <Interactive onActivate={() => getSound().play('keys')} lift={false}>
        <RoundedBox
          size={[KEYBOARD_W, KEYBOARD_H, KEYBOARD_D]}
          radius={0.012}
          color={scenePalette.furniture.beige}
          roughness={0.6}
          position={[KX, TOP + KEYBOARD_H / 2, KZ]}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[KX, TOP + KEYBOARD_H + 0.001, KZ]}>
          <planeGeometry args={[KEYBOARD_W - KEYBOARD_PAD * 2, KEYBOARD_D - KEYBOARD_PAD * 2]} />
          <meshStandardMaterial map={keyTexture} roughness={0.8} />
        </mesh>
      </Interactive>
      <Interactive onActivate={() => getSound().play('mouseClick')} lift={false}>
        {/* 꾹 눌러 끌면 상판 위를 움직인다. 다른 물건과 상판 밖으로는 못 나간다 */}
        <group ref={rig} position={[MX, TOP, MZ]} onPointerDown={onGrab}>
          {/* 껍데기. 반구를 눌러 낮고 길쭉한 돔으로 만든다 */}
          <mesh geometry={shell} scale={[MOUSE_RX, MOUSE_RY, MOUSE_RZ]} castShadow>
            <meshStandardMaterial map={texture} roughness={0.5} />
          </mesh>
          {/* 휠 */}
          <mesh position={wheelPos} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.0096, 20]} />
            <meshStandardMaterial color={scenePalette.pointer.wheel} roughness={0.5} />
          </mesh>
        </group>
      </Interactive>
    </group>
  );
}
