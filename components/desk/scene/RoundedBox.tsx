'use client';

import { useEffect, useMemo } from 'react';
import { createRoundedBoxGeometry } from '@/lib/desk/geometry';

interface RoundedBoxProps {
  size: [number, number, number];
  radius?: number;
  color: string;
  roughness?: number;
  metalness?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** 모든 모서리가 둥근 상자 메시. 지오메트리는 언마운트 시 해제한다. */
export function RoundedBox({
  size,
  radius = 0.03,
  color,
  roughness = 0.7,
  metalness = 0,
  position,
  rotation,
  castShadow = true,
  receiveShadow = true,
}: RoundedBoxProps) {
  const [w, h, d] = size;
  const geometry = useMemo(() => createRoundedBoxGeometry(w, h, d, radius), [w, h, d, radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}
