'use client';

import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { ZoomSurface } from './ZoomSurface';
import { DocumentSheets } from '../surfaces/DocumentSheets';
import { useDeskStore } from '@/stores/useDeskStore';
import { canvasPalette } from '@/lib/desk/palette';
import { positions, TOP, zoomPoses } from '@/lib/desk/layout';
import { getCanvasFont, onFontsReady } from '@/lib/desk/runtime';

/** 서류 세 장. 위 장에 이름과 임시 본문 줄이 그려져 있다 */
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
    const font = getCanvasFont();
    ctx.fillStyle = p.paper;
    ctx.fillRect(0, 0, 300, 420);
    ctx.fillStyle = p.ink;
    ctx.font = `800 24px ${font}`;
    ctx.fillText('seoleem', 30, 50);
    ctx.fillStyle = p.muted;
    ctx.font = `12px ${font}`;
    ctx.fillText('Frontend Developer / Designer', 30, 72);
    ctx.fillStyle = p.line;
    for (let i = 0; i < 14; i++) ctx.fillRect(30, 105 + i * 20, 120 + ((i * 53) % 110), 6);
    texture.needsUpdate = true;
  }, [canvas, texture]);

  useEffect(() => {
    draw();
    onFontsReady(draw);
  }, [draw]);

  return (
    <Interactive label="서류" position={positions.docs} onActivate={() => zoomTo('docs', zoomPoses.docs)}>
      <ZoomSurface target="docs" size={[0.6, 0.84]} pixels={[600, 840]} position={[0.02, TOP + 0.02, 0.015]} rotation={[-Math.PI / 2, 0, 0]}>
        <DocumentSheets />
      </ZoomSurface>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, (i - 1) * 0.12]} position={[i * 0.02, TOP + 0.002 + i * 0.004, i * 0.015]} receiveShadow>
          <planeGeometry args={[0.6, 0.84]} />
          <meshStandardMaterial map={texture} roughness={0.95} />
        </mesh>
      ))}
    </Interactive>
  );
}
