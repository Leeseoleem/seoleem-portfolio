'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDeskStore, type CameraPose } from '@/stores/useDeskStore';
import { CAMERA_FOV, SCREEN_3D_H, SCREEN_3D_W, SCREEN_CENTER, orbitDefaults } from '@/lib/desk/layout';
import { prefersReducedMotion } from '@/lib/desk/runtime';

interface Tween {
  fromPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  fromUp: THREE.Vector3;
  toPos: THREE.Vector3;
  toTarget: THREE.Vector3;
  toUp: THREE.Vector3;
  start: number;
  duration: number;
  then?: 'desk' | 'zoomed' | 'boot' | 'transition' | 'off';
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * 카메라 하나를 세 가지 방식으로 움직인다.
 * - boot: 모니터 화면이 뷰포트를 정확히 덮는 위치(closePose)에 고정. 오버레이가 사라질 때 이어진다
 * - desk: 책상 주변 궤도. 드래그로 회전, 휠·핀치로 확대
 * - transition: 스토어의 cameraRequest를 받아 포즈 사이를 보간
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  const orbit = useRef({ yaw: orbitDefaults.yaw, pitch: orbitDefaults.pitch, zoom: orbitDefaults.zoom });
  const cam = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) });
  const tween = useRef<Tween | null>(null);
  const reduceMotion = useRef(false);

  const closePose = (aspect: number): CameraPose => {
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    const dByH = SCREEN_3D_H / 2 / tanHalf;
    const dByW = SCREEN_3D_W / 2 / (tanHalf * aspect);
    const d = Math.min(dByH, dByW);
    return {
      position: [SCREEN_CENTER[0], SCREEN_CENTER[1], SCREEN_CENTER[2] + d],
      target: [...SCREEN_CENTER],
    };
  };

  const orbitPose = (aspect: number): CameraPose => {
    const o = orbit.current;
    const radius = orbitDefaults.radius * o.zoom * THREE.MathUtils.clamp(1.6 / aspect, 1, 2.8);
    const t = orbitDefaults.target;
    return {
      position: [
        t[0] + Math.sin(o.yaw) * Math.cos(o.pitch) * radius,
        t[1] + Math.sin(o.pitch) * radius,
        t[2] + Math.cos(o.yaw) * Math.cos(o.pitch) * radius,
      ],
      target: [...t],
    };
  };

  const apply = () => {
    camera.position.copy(cam.current.pos);
    camera.up.copy(cam.current.up).normalize();
    camera.lookAt(cam.current.target);
  };

  /**
   * 포즈를 실제 카메라 자리로 바꾼다.
   * fit이 있으면 대상 크기가 화면에 다 들어오는 거리를 화면 비율에서 계산한다.
   * 자리를 눈대중으로 적어두면 창 비율이 달라질 때 대상이 잘리거나 너무 작아진다.
   */
  const resolve = (pose: CameraPose, aspect: number) => {
    const target = new THREE.Vector3(...pose.target);
    const up = new THREE.Vector3(...(pose.up ?? [0, 1, 0]));
    if (!pose.fit || !pose.dir) {
      return { pos: new THREE.Vector3(...(pose.position ?? [0, 0, 0])), target, up };
    }
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    const margin = pose.margin ?? 1.1;
    const [w, h] = pose.fit;
    const dByH = ((h * margin) / 2) / tanHalf;
    const dByW = ((w * margin) / 2) / (tanHalf * aspect);
    const d = Math.max(dByH, dByW);
    const dir = new THREE.Vector3(...pose.dir).normalize();
    return { pos: target.clone().addScaledVector(dir, d), target, up };
  };

  // 초기 위치: 부팅 화면과 맞물리는 근접 포즈
  useEffect(() => {
    reduceMotion.current = prefersReducedMotion();
    camera.fov = CAMERA_FOV;
    camera.near = 0.02;
    camera.far = 60;
    camera.updateProjectionMatrix();
    if (useDeskStore.getState().phase === 'boot') {
      const p = closePose(size.width / size.height);
      cam.current.pos.set(...(p.position ?? [0, 0, 0]));
      cam.current.target.set(...p.target);
      cam.current.up.set(0, 1, 0);
      apply();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height]);

  // 포인터 입력: 드래그 회전, 핀치·휠 확대. 책상 뷰에서만
  useEffect(() => {
    const el = gl.domElement;
    const drag = { active: false, moved: false, x: 0, y: 0, yaw: 0, pitch: 0 };
    const touches = new Map<number, { x: number; y: number }>();
    const pinch = { active: false, dist: 0, zoom: 1 };
    const isDesk = () => useDeskStore.getState().phase === 'desk';
    const touchDist = () => {
      const pts = Array.from(touches.values());
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const onDown = (ev: PointerEvent) => {
      touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (touches.size === 2 && isDesk()) {
        pinch.active = true;
        pinch.dist = touchDist();
        pinch.zoom = orbit.current.zoom;
        drag.active = false;
        return;
      }
      if (!isDesk() || ev.button !== 0 || useDeskStore.getState().dragging) return;
      drag.active = true;
      drag.moved = false;
      drag.x = ev.clientX;
      drag.y = ev.clientY;
      drag.yaw = orbit.current.yaw;
      drag.pitch = orbit.current.pitch;
    };
    const onUp = (ev: PointerEvent) => {
      touches.delete(ev.pointerId);
      if (touches.size < 2) pinch.active = false;
      drag.active = false;
      if (drag.moved) document.body.style.cursor = '';
    };
    const onMove = (ev: PointerEvent) => {
      if (touches.has(ev.pointerId)) touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (pinch.active && touches.size === 2) {
        const d = touchDist();
        if (d > 0) orbit.current.zoom = THREE.MathUtils.clamp(pinch.zoom * (pinch.dist / d), orbitDefaults.zoomMin, orbitDefaults.zoomMax);
        return;
      }
      // 오브젝트를 끄는 중이면 시점을 돌리지 않는다. 포인터 다운 순서에 의존하지 않도록 여기서도 확인한다
      if (useDeskStore.getState().dragging) {
        drag.active = false;
        return;
      }
      if (!drag.active || !isDesk()) return;
      const dx = ev.clientX - drag.x;
      const dy = ev.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 4) {
        drag.moved = true;
        document.body.style.cursor = 'grabbing';
        useDeskStore.getState().setHover(null);
      }
      if (drag.moved) {
        orbit.current.yaw = THREE.MathUtils.clamp(drag.yaw - dx * 0.004, orbitDefaults.yawMin, orbitDefaults.yawMax);
        orbit.current.pitch = THREE.MathUtils.clamp(drag.pitch + dy * 0.003, orbitDefaults.pitchMin, orbitDefaults.pitchMax);
      }
    };
    const onWheel = (ev: WheelEvent) => {
      if (!isDesk()) return;
      ev.preventDefault();
      orbit.current.zoom = THREE.MathUtils.clamp(orbit.current.zoom * (1 + ev.deltaY * 0.0012), orbitDefaults.zoomMin, orbitDefaults.zoomMax);
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('pointermove', onMove);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('wheel', onWheel);
    };
  }, [gl]);

  useFrame(() => {
    const state = useDeskStore.getState();
    const aspect = size.width / size.height;

    // 새 이동 요청 소비
    const req = state.cameraRequest;
    if (req) {
      const pose = req.pose === 'orbit' ? orbitPose(aspect) : req.pose === 'close' ? closePose(aspect) : req.pose;
      const to = resolve(pose, aspect);
      tween.current = {
        fromPos: cam.current.pos.clone(),
        fromTarget: cam.current.target.clone(),
        fromUp: cam.current.up.clone(),
        toPos: to.pos,
        toTarget: to.target,
        toUp: to.up,
        start: performance.now(),
        duration: reduceMotion.current ? 0 : req.duration,
        then: req.then,
      };
      state.consumeCameraRequest();
    }

    if (state.phase === 'boot') {
      const p = closePose(aspect);
      cam.current.pos.set(...(p.position ?? [0, 0, 0]));
      cam.current.target.set(...p.target);
      cam.current.up.set(0, 1, 0);
      apply();
      return;
    }

    const tw = tween.current;
    if (tw) {
      const k = Math.min(1, (performance.now() - tw.start) / Math.max(1, tw.duration));
      const e = easeInOutCubic(k);
      cam.current.pos.lerpVectors(tw.fromPos, tw.toPos, e);
      cam.current.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
      cam.current.up.lerpVectors(tw.fromUp, tw.toUp, e);
      apply();
      if (k >= 1) {
        tween.current = null;
        if (tw.then) state.setPhase(tw.then);
      }
      return;
    }

    if (state.phase === 'desk') {
      const p = orbitPose(aspect);
      const k = reduceMotion.current ? 1 : 0.12;
      cam.current.pos.lerp(new THREE.Vector3(...(p.position ?? [0, 0, 0])), k);
      cam.current.target.lerp(new THREE.Vector3(...p.target), k);
      cam.current.up.lerp(new THREE.Vector3(0, 1, 0), k);
      apply();
    }
  });

  return null;
}
