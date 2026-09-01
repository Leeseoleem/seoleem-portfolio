'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { ZoomSurface } from './ZoomSurface';
import { PhoneScreen } from '../surfaces/PhoneScreen';
import { RoundedBox } from './RoundedBox';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { positions, TOP, zoomPoses } from '@/lib/desk/layout';
import { drawPhone, hitTestPhone, PHONE_H, PHONE_W, type HitRegion, type PhoneUIState } from '@/lib/desk/phone-ui';
import { getCanvasFont, onFontsReady } from '@/lib/desk/runtime';
import { getSound } from '@/lib/desk/sound';

const BODY: [number, number, number] = [0.31, 0.022, 0.66];

/**
 * 핸드폰. 책상 뷰에서 클릭하면 확대되고, 확대된 뒤에는 화면을 직접 탭할 수 있다.
 * 화면은 임시 UI다(실제 토스 스타일 UI는 별도 작업).
 */
export function Phone() {
  const zoomTo = useDeskStore((s) => s.zoomTo);
  const ui = useRef<PhoneUIState>({ screen: 'home', app: null, soundOn: true, isNight: false });
  const hits = useRef<HitRegion[]>([]);

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = PHONE_W;
    c.height = PHONE_H;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { canvas: c, texture: tex };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const redraw = useCallback(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = useDeskStore.getState();
    ui.current.soundOn = s.soundOn;
    ui.current.isNight = s.isNight;
    hits.current = drawPhone(ctx, ui.current, getCanvasFont());
    texture.needsUpdate = true;
  }, [canvas, texture]);

  useEffect(() => {
    redraw();
    onFontsReady(redraw);
    // 설정 화면이 열려 있을 때 밤 모드·효과음 상태가 바뀌면 토글 표시를 맞춘다
    const unsub = useDeskStore.subscribe((s, prev) => {
      if (ui.current.screen === 'settings' && (s.isNight !== prev.isNight || s.soundOn !== prev.soundOn)) redraw();
    });
    return unsub;
  }, [redraw]);

  const onScreenClick = (e: ThreeEvent<MouseEvent>) => {
    const state = useDeskStore.getState();
    if (state.phase !== 'zoomed' || state.zoomed !== 'phone' || !e.uv) return;
    e.stopPropagation();
    const hit = hitTestPhone(hits.current, e.uv.x, e.uv.y);
    if (!hit) return;
    getSound().play('tap');
    switch (hit.action) {
      case 'settings':
        ui.current.screen = 'settings';
        break;
      case 'home':
        ui.current.screen = 'home';
        break;
      case 'app':
        ui.current.screen = 'app';
        ui.current.app = hit.app ?? null;
        break;
      case 'link':
        if (hit.app?.url) window.open(hit.app.url, '_blank', 'noopener,noreferrer');
        return;
      case 'toggle-sound': {
        const next = !state.soundOn;
        getSound().setEnabled(next);
        state.setSound(next);
        if (next) getSound().play('tap');
        break;
      }
      case 'toggle-night':
        state.toggleNight();
        getSound().play('lightFlicker');
        break;
    }
    redraw();
  };

  const onScreenOver = () => {
    const s = useDeskStore.getState();
    if (s.phase === 'zoomed' && s.zoomed === 'phone') document.body.style.cursor = 'pointer';
  };
  const onScreenOut = () => {
    const s = useDeskStore.getState();
    if (s.phase === 'zoomed' && s.zoomed === 'phone') document.body.style.cursor = '';
  };

  return (
    <Interactive label="핸드폰" position={positions.phone} rotation={[0, -0.18, 0]} onActivate={() => zoomTo('phone', zoomPoses.phone)}>
      <RoundedBox size={BODY} radius={0.03} color={scenePalette.furniture.black} roughness={0.5} position={[0, TOP + 0.011, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP + 0.0225, 0]} onClick={onScreenClick} onPointerOver={onScreenOver} onPointerOut={onScreenOut}>
        <planeGeometry args={[0.276, 0.598]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <ZoomSurface target="phone" size={[0.276, 0.598]} pixels={[360, 780]} position={[0, TOP + 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <PhoneScreen />
      </ZoomSurface>
      {/* 전면 카메라 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP + 0.0226, -0.27]}>
        <circleGeometry args={[0.008, 12]} />
        <meshBasicMaterial color={scenePalette.furniture.black} />
      </mesh>
    </Interactive>
  );
}
