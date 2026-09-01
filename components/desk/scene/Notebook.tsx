'use client';

import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { ZoomSurface } from './ZoomSurface';
import { NotebookPages } from '../surfaces/NotebookPages';
import { RoundedBox } from './RoundedBox';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { positions, TOP, zoomPoses } from '@/lib/desk/layout';
import { getCanvasFont, onFontsReady } from '@/lib/desk/runtime';

/** 공책. 크라프트 표지, 세로 고무 밴드, 짧은 리본 책갈피, DESIGN 라벨 */
export function Notebook() {
  const zoomTo = useDeskStore((s) => s.zoomTo);

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 340;
    c.height = 140;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: tex };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const draw = useCallback(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const font = getCanvasFont();
    ctx.fillStyle = scenePalette.notebook.labelPaper;
    ctx.fillRect(0, 0, 340, 140);
    ctx.strokeStyle = scenePalette.notebook.labelBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 320, 120);
    ctx.fillStyle = scenePalette.notebook.labelInk;
    ctx.textAlign = 'center';
    ctx.font = `800 34px ${font}`;
    ctx.fillText('DESIGN', 170, 62);
    ctx.font = `18px ${font}`;
    ctx.fillStyle = scenePalette.notebook.labelMuted;
    ctx.fillText('seoleem sketchbook', 170, 100);
    ctx.textAlign = 'left';
    texture.needsUpdate = true;
  }, [canvas, texture]);

  useEffect(() => {
    draw();
    onFontsReady(draw);
  }, [draw]);

  return (
    <Interactive label="공책" position={positions.notebook} rotation={[0, 0.22, 0]} onActivate={() => zoomTo('notebook', zoomPoses.notebook)}>
      <RoundedBox size={[0.72, 0.07, 0.94]} color={scenePalette.furniture.kraft} roughness={0.9} position={[0, TOP + 0.035, 0]} />
      <RoundedBox size={[0.74, 0.02, 0.96]} color={scenePalette.furniture.paper} roughness={0.95} position={[0, TOP + 0.035, 0]} castShadow={false} />
      {/* 라벨 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP + 0.0705, -0.12]}>
        <planeGeometry args={[0.34, 0.14]} />
        <meshStandardMaterial map={texture} roughness={0.95} />
      </mesh>
      <ZoomSurface target="notebook" size={[0.72, 0.94]} pixels={[720, 940]} position={[0, TOP + 0.076, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <NotebookPages />
      </ZoomSurface>
      {/* 세로 고무 밴드 */}
      <RoundedBox size={[0.028, 0.08, 0.96]} radius={0.01} color={scenePalette.notebook.band} roughness={0.85} position={[0.27, TOP + 0.035, 0]} castShadow={false} />
      {/* 리본 책갈피 */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[0.06, TOP + 0.004, 0.505]}>
        <planeGeometry args={[0.022, 0.07]} />
        <meshStandardMaterial color={scenePalette.notebook.ribbon} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </Interactive>
  );
}
