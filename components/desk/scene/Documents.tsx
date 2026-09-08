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
import { useIsMobile } from '@/lib/desk/use-mobile';
import { smoothstep } from '@/lib/desk/math';

/** 클립이 빠지는 연출 길이(초)와 이동 거리. 카메라가 다가오는 동안 끝나야 한다 */
const CLIP_SLIDE_DURATION = 0.45;
const CLIP_SLIDE = 0.14;
/** 종이가 얼마나 하얗게 되는지. 톤매핑을 거치고도 DOM의 흰색(#fff)에 닿도록 1을 넘긴다 */
const PAPER_BLEACH = 1.6;
/**
 * 종이가 하얗게 되고 뼈대 글줄이 사라지는 데 걸리는 시간(초).
 * 카메라가 다가오는 1.4초보다 여유 있게 짧아서, 프레임이 튀어도 PDF(DOM)가 뜨는 순간에는 이미 빈 흰 종이다.
 */
const BLEACH_DURATION = 1.05;
/** 돌아올 때는 이만큼 빨리 원래 종이로 돌아온다. 카메라가 물러나는 초반에 뼈대가 다시 보여야 한다 */
const BLEACH_RETURN_DURATION = 0.5;
/** 확대할 때 맨 위 장을 집어 드는 높이(m). 옆의 폰보다 위로 올라온다 */
const LIFT_H = 0.05;
/**
 * 확대 화면(DOM)의 크기. PDF 한 쪽(600×840)에 여백을 두른 크기다. 여백에 넘김 단추가 놓인다.
 * 맨 위 장은 들리면서 이 크기로 커져서 DOM이 뜰 때 종이 크기가 튀지 않는다.
 */
const SHEET_PX: [number, number] = [704, 920];
const SHEET_SIZE: [number, number] = [0.704, 0.92];
const PAPER_W = 0.6;
const PAPER_H = 0.84;

/**
 * 서류 세 장. 멀리서는 글씨 없는 뼈대만 보이고, 카메라가 다 다가온 뒤에 DocumentSheets(DOM)가 내용을 그린다.
 * 다가오는 동안 DOM이 먼저 뜨면 종이가 아직 작을 때 글씨만 커져 보여 어색하다.
 */
export function Documents() {
  const zoomTo = useDeskStore((s) => s.zoomTo);
  const mobile = useIsMobile();

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 420;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: tex };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  /** 종이를 그린다. fade가 1에 가까울수록 뼈대 글줄이 옅어져 빈 종이가 된다 */
  const draw = useCallback(
    (fade: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const p = canvasPalette.doc;
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.paper;
      ctx.fillRect(0, 0, 300, 420);
      // 멀리서 보이는 종이는 글씨 없이 뼈대만 둔다. 실제 내용은 확대했을 때 DocumentSheets가 그린다
      ctx.globalAlpha = 1 - fade;
      ctx.fillStyle = p.muted;
      ctx.fillRect(30, 36, 108, 16);
      ctx.fillRect(30, 62, 168, 8);
      ctx.fillStyle = p.line;
      for (let i = 0; i < 14; i++) ctx.fillRect(30, 105 + i * 20, 120 + ((i * 53) % 110), 6);
      ctx.globalAlpha = 1;
      texture.needsUpdate = true;
    },
    [canvas, texture],
  );

  useEffect(() => {
    draw(0);
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
  /** 맨 위 장, 클립, 확대 화면을 함께 들어 올리는 그룹 */
  const liftGroup = useRef<THREE.Group>(null);
  const topSheet = useRef<THREE.Mesh>(null);
  const clipGroup = useRef<THREE.Group>(null);
  const clipMat = useRef<THREE.MeshStandardMaterial>(null);
  /** 종이 세 장의 재질. 확대되는 동안 흰빛을 더해 PDF 바탕색으로 이어 붙인다 */
  const sheetMats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const slide = useRef(0);
  /** 종이가 하얗게 되고 뼈대가 사라지는 진행도. 클립보다 느리게, 카메라 도착 직전에 끝난다 */
  const fade = useRef(0);
  useFrame((_, delta) => {
    const { phase, zoomed } = useDeskStore.getState();
    const target = zoomed === 'docs' && (phase === 'zoomed' || phase === 'transition') ? 1 : 0;
    const prevSlide = slide.current;
    const prevFade = fade.current;
    if (prefersReducedMotion() || phase === 'zoomed') {
      slide.current = target;
      fade.current = target;
    } else {
      const dt = Math.min(delta, 0.05);
      const step = dt / CLIP_SLIDE_DURATION;
      slide.current = Math.min(1, Math.max(0, prevSlide + (target ? step : -step)));
      // 이 진행도는 프레임 간격을 자르지 않는다. 프레임이 늦어도 카메라 시간에 맞춰 끝나야 한다
      const fstep = delta / (target ? BLEACH_DURATION : BLEACH_RETURN_DURATION);
      fade.current = Math.min(1, Math.max(0, prevFade + (target ? fstep : -fstep)));
    }
    if (slide.current === prevSlide && fade.current === prevFade) return;

    const k = smoothstep(slide.current);
    if (clipGroup.current) {
      // 맨 위 장의 위쪽 방향(세로축)으로 밀려난다
      clipGroup.current.position.set(-Math.sin(DOCS_FAN) * CLIP_SLIDE * k, 0.01 * k, -Math.cos(DOCS_FAN) * CLIP_SLIDE * k);
      clipGroup.current.visible = k < 0.99;
    }
    if (clipMat.current) clipMat.current.opacity = 1 - k;
    // 서류를 집어 드는 것처럼 맨 위 장이 올라온다. 확대 화면(DOM)이 이 그룹 안에 있어 같이 따라온다
    if (liftGroup.current) liftGroup.current.position.y = LIFT_H * k;
    // 들리는 동안 확대 화면 크기까지 자란다
    if (topSheet.current) topSheet.current.scale.set(1 + (SHEET_SIZE[0] / PAPER_W - 1) * k, 1 + (SHEET_SIZE[1] / PAPER_H - 1) * k, 1);

    // 다가오는 동안 뼈대 글줄이 옅어지고 종이가 하얘진다. PDF가 뜨는 순간에는 빈 흰 종이다
    if (fade.current !== prevFade) {
      const f = smoothstep(fade.current);
      draw(f);
      // 흰빛은 제곱 곡선이다. 뼈대가 옅어진 뒤에 하얘지고, 돌아올 때는 흰빛이 먼저 빠져 뼈대가 바로 보인다
      for (const m of sheetMats.current) if (m) m.emissiveIntensity = PAPER_BLEACH * f * f;
    }
    requestShadowUpdate();
    invalidate();
  });

  return (
    <Interactive label="서류" position={positions.docs} onActivate={() => zoomTo('docs', zoomPoses.docs)}>
      {/* 맨 위 장과 그 위의 것들. 확대하면 이 그룹이 통째로 들린다 */}
      <group ref={liftGroup}>
        {/* 맨 위 장 오른쪽 위 모서리에 물린 클립. 위 모서리에 수직으로 물려 있고, 맨 위 장의 회전(DOCS_FAN)을 따른다 */}
        <group ref={clipGroup}>
          <mesh geometry={clip} position={[0.243, TOP + 0.0125, -0.377]} rotation={[0, DOCS_FAN + Math.PI / 2, 0]} scale={1.9} castShadow>
            <meshStandardMaterial ref={clipMat} color={scenePalette.furniture.clip} metalness={0.85} roughness={0.3} transparent />
          </mesh>
        </group>
        {/* 맨 위 장에 정확히 얹는다. 아래 장들은 부채처럼 틀어져 있어 기준이 될 수 없다.
            모바일에서는 이 자리 대신 화면을 덮는 창(MobileDocSheet)으로 연다 */}
        {!mobile && (
          <ZoomSurface waitForZoom target="docs" size={SHEET_SIZE} pixels={SHEET_PX} position={[0.04, TOP + 0.014, 0.03]} rotation={[-Math.PI / 2, 0, DOCS_FAN]}>
            <DocumentSheets />
          </ZoomSurface>
        )}
        <Sheet
          index={2}
          texture={texture}
          meshRef={topSheet}
          matRef={(m) => {
            sheetMats.current[2] = m;
          }}
        />
      </group>
      {[0, 1].map((i) => (
        <Sheet
          key={i}
          index={i}
          texture={texture}
          matRef={(m) => {
            sheetMats.current[i] = m;
          }}
        />
      ))}
    </Interactive>
  );
}

/** 종이 한 장. 아래 장일수록 부채처럼 조금 틀어지고 살짝 낮다 */
function Sheet({
  index,
  texture,
  matRef,
  meshRef,
}: {
  index: number;
  texture: THREE.Texture;
  matRef: (m: THREE.MeshStandardMaterial | null) => void;
  meshRef?: React.RefObject<THREE.Mesh | null>;
}) {
  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, (index - 1) * DOCS_FAN]}
      position={[index * 0.02, TOP + 0.002 + index * 0.004, index * 0.015]}
      receiveShadow
    >
      <planeGeometry args={[PAPER_W, PAPER_H]} />
      <meshStandardMaterial ref={matRef} map={texture} roughness={0.95} emissive={scenePalette.furniture.bleach} emissiveIntensity={0} />
    </mesh>
  );
}
