'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { ZoomSurface } from './ZoomSurface';
import { DocumentSheets } from '../surfaces/DocumentSheets';
import { useDeskStore } from '@/stores/useDeskStore';
import { canvasPalette, scenePalette } from '@/lib/desk/palette';
import { DOCS_FAN, positions, TOP, zoomPoses } from '@/lib/desk/layout';
import { requestShadowUpdate } from '@/lib/desk/shadows';
import { prefersReducedMotion } from '@/lib/desk/runtime';

/** 클립이 빠지는 연출 길이(초)와 이동 거리. 카메라가 다가오는 동안 끝나야 한다 */
const CLIP_SLIDE_DURATION = 0.45;
const CLIP_SLIDE = 0.14;

function smoothstep(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/**
 * 서류 세 장. 멀리서는 글씨 없는 뼈대만 보이고, 카메라가 다 다가온 뒤에 DocumentSheets(DOM)가 내용을 그린다.
 * 다가오는 동안 DOM이 먼저 뜨면 종이가 아직 작을 때 글씨만 커져 보여 어색하다.
 */
export function Documents() {
  const zoomTo = useDeskStore((s) => s.zoomTo);

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 420;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: tex };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const draw = useCallback(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const p = canvasPalette.doc;
    ctx.fillStyle = p.paper;
    ctx.fillRect(0, 0, 300, 420);
    // 멀리서 보이는 종이는 글씨 없이 뼈대만 둔다. 실제 내용은 확대했을 때 DocumentSheets가 그린다
    ctx.fillStyle = p.muted;
    ctx.fillRect(30, 36, 108, 16);
    ctx.fillRect(30, 62, 168, 8);
    ctx.fillStyle = p.line;
    for (let i = 0; i < 14; i++) ctx.fillRect(30, 105 + i * 20, 120 + ((i * 53) % 110), 6);
    texture.needsUpdate = true;
  }, [canvas, texture]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 클립. 철사 한 가닥이 두 번 감긴 모양을 곡선 하나로 그린다
  const clip = useMemo(() => {
    const pts: Array<[number, number]> = [
      [-0.018, -0.0065],
      [0.02, -0.0065],
      [0.0255, 0],
      [0.02, 0.0065],
      [-0.02, 0.0065],
      [-0.0255, 0],
      [-0.02, -0.0025],
      [0.012, -0.0025],
      [0.017, 0.001],
      [0.012, 0.004],
      [-0.014, 0.004],
    ];
    const curve = new THREE.CatmullRomCurve3(pts.map(([u, v]) => new THREE.Vector3(u, 0, -v)), false, 'catmullrom', 0.5);
    return new THREE.TubeGeometry(curve, 96, 0.0011, 8, false);
  }, []);
  useEffect(() => () => clip.dispose(), [clip]);

  // 공책의 고무 밴드처럼, 확대되면 클립이 종이 위쪽으로 빠져 사라지고 돌아오면 다시 물린다.
  // 확대 화면(DOM)이 3D 클립을 덮어 버리므로 그 전에 치워야 어색하지 않다
  const invalidate = useThree((s) => s.invalidate);
  const clipGroup = useRef<THREE.Group>(null);
  const clipMat = useRef<THREE.MeshStandardMaterial>(null);
  const slide = useRef(0);
  useFrame((_, delta) => {
    const { phase, zoomed } = useDeskStore.getState();
    const target = zoomed === 'docs' && (phase === 'zoomed' || phase === 'transition') ? 1 : 0;
    const prev = slide.current;
    if (prefersReducedMotion() || phase === 'zoomed') {
      slide.current = target;
    } else {
      const step = Math.min(delta, 0.05) / CLIP_SLIDE_DURATION;
      slide.current = Math.min(1, Math.max(0, prev + (target ? step : -step)));
    }
    if (slide.current === prev) return;
    const k = smoothstep(slide.current);
    if (clipGroup.current) {
      // 맨 위 장의 위쪽 방향(세로축)으로 밀려난다
      clipGroup.current.position.set(-Math.sin(DOCS_FAN) * CLIP_SLIDE * k, 0.01 * k, -Math.cos(DOCS_FAN) * CLIP_SLIDE * k);
      clipGroup.current.visible = k < 0.99;
    }
    if (clipMat.current) clipMat.current.opacity = 1 - k;
    requestShadowUpdate();
    invalidate();
  });

  return (
    <Interactive label="서류" position={positions.docs} onActivate={() => zoomTo('docs', zoomPoses.docs)}>
      {/* 맨 위 장 오른쪽 위 모서리에 물린 클립. 위 모서리에 수직으로 물려 있고, 맨 위 장의 회전(DOCS_FAN)을 따른다 */}
      <group ref={clipGroup}>
        <mesh geometry={clip} position={[0.243, TOP + 0.0125, -0.377]} rotation={[0, DOCS_FAN + Math.PI / 2, 0]} scale={1.9} castShadow>
          <meshStandardMaterial ref={clipMat} color={scenePalette.furniture.clip} metalness={0.85} roughness={0.3} transparent />
        </mesh>
      </group>
      {/* 맨 위 장에 정확히 얹는다. 아래 장들은 부채처럼 틀어져 있어 기준이 될 수 없다 */}
      <ZoomSurface waitForZoom target="docs" size={[0.6, 0.84]} pixels={[600, 840]} position={[0.04, TOP + 0.014, 0.03]} rotation={[-Math.PI / 2, 0, DOCS_FAN]}>
        <DocumentSheets />
      </ZoomSurface>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, (i - 1) * DOCS_FAN]} position={[i * 0.02, TOP + 0.002 + i * 0.004, i * 0.015]} receiveShadow>
          <planeGeometry args={[0.6, 0.84]} />
          <meshStandardMaterial map={texture} roughness={0.95} />
        </mesh>
      ))}
    </Interactive>
  );
}
