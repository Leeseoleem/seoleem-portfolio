'use client';

import type { ReactNode } from 'react';
import { Html } from '@react-three/drei';
import { useDeskStore, type ZoomTarget } from '@/stores/useDeskStore';

interface ZoomSurfaceProps {
  /** 어떤 오브젝트를 확대했을 때 나타나는 화면인지 */
  target: ZoomTarget;
  /** 3D 상의 평면 크기(미터). 오브젝트의 화면 면과 같아야 한다 */
  size: [number, number];
  /** 그 화면을 CSS 픽셀로 몇으로 볼지. 안에 들어갈 UI는 이 크기를 기준으로 만든다 */
  pixels: [number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  children: ReactNode;
}

/**
 * 3D 오브젝트의 화면 면 위에 실제 DOM을 얹는다. 확대된 동안에만 나타난다.
 *
 * 캔버스 텍스처가 아니라 진짜 DOM이므로 그 안은 평범한 React 컴포넌트로 만들면 된다.
 * 텍스트 선택, 스크롤, 접근성, CSS 트랜지션이 그대로 동작한다.
 * 좌표는 부모 그룹 기준이라 오브젝트가 움직여도 화면이 따라간다.
 */
export function ZoomSurface({ target, size, pixels, position, rotation, children }: ZoomSurfaceProps) {
  const active = useDeskStore((s) => s.zoomed === target && (s.phase === 'zoomed' || s.phase === 'transition'));
  if (!active) return null;
  // 픽셀 크기의 div를 평면 크기에 정확히 맞춘다
  const scale = size[0] / pixels[0];
  return (
    <Html
      transform
      position={position}
      rotation={rotation}
      scale={scale}
      occlude={false}
      zIndexRange={[8, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="zoom-surface"
        style={{ width: pixels[0], height: pixels[1] }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </Html>
  );
}
