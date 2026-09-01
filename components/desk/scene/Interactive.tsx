'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { useDeskStore } from '@/stores/useDeskStore';
import { dragLock } from '@/lib/desk/drag-lock';

interface InteractiveProps {
  /** 호버 시 툴팁에 뜨는 이름. 비우면 툴팁 없이 커서만 바뀐다 */
  label?: string;
  onActivate: (e: ThreeEvent<MouseEvent>) => void;
  /** 호버 시 살짝 떠오르는 효과 */
  lift?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  children: ReactNode;
}

const DRAG_THRESHOLD_PX = 4;

/**
 * 책상 위 클릭 가능한 오브젝트 공통 래퍼. 책상 뷰(phase === 'desk')에서만 반응하고,
 * 드래그로 시점을 돌린 뒤 손을 뗄 때는 클릭으로 치지 않는다.
 */
export function Interactive({ label, onActivate, lift = true, position, rotation, children }: InteractiveProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const setHover = useDeskStore((s) => s.setHover);
  const baseY = position?.[1] ?? 0;

  const isDeskView = () => useDeskStore.getState().phase === 'desk';
  // 오브젝트를 끌고 있는 동안에는 지나치는 다른 물건에 호버가 걸리지 않게 한다
  const canHover = () => isDeskView() && !dragLock.active;

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!canHover()) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    if (label) setHover(label, { x: e.clientX, y: e.clientY });
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!hovered || !label || !canHover()) return;
    setHover(label, { x: e.clientX, y: e.clientY });
  };
  const out = () => {
    setHovered(false);
    document.body.style.cursor = '';
    setHover(null);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!isDeskView()) return;
    if (e.delta > DRAG_THRESHOLD_PX) return;
    e.stopPropagation();
    onActivate(e);
  };

  useFrame(() => {
    if (!group.current || !lift) return;
    const targetY = baseY + (hovered && canHover() ? 0.03 : 0);
    group.current.position.y += (targetY - group.current.position.y) * 0.15;
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={over}
      onPointerMove={move}
      onPointerOut={out}
      onClick={click}
    >
      {children}
    </group>
  );
}
