'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { useDeskStore } from '@/stores/useDeskStore';

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
 *
 * 오브젝트를 끄는 동안에는 툴팁과 떠오르는 효과를 멈춘다. 다만 커서가 들어왔다는 사실 자체는
 * 계속 기록해 둔다. 그 신호는 경계를 넘는 순간에만 오기 때문에, 무시해 버리면
 * 드래그가 끝났을 때 커서가 이미 안쪽에 있어 다시 받을 방법이 없다.
 */
export function Interactive({ label, onActivate, lift = true, position, rotation, children }: InteractiveProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const point = useRef({ x: 0, y: 0 });
  const dragging = useDeskStore((s) => s.dragging);
  const setHover = useDeskStore((s) => s.setHover);
  const baseY = position?.[1] ?? 0;

  const isDeskView = () => useDeskStore.getState().phase === 'desk';

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!isDeskView()) return;
    e.stopPropagation();
    point.current = { x: e.clientX, y: e.clientY };
    setHovered(true);
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!hovered || !isDeskView()) return;
    point.current = { x: e.clientX, y: e.clientY };
    if (label && !dragging) setHover(label, point.current);
  };
  const out = () => {
    setHovered(false);
    setHover(null);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!isDeskView()) return;
    if (e.delta > DRAG_THRESHOLD_PX) return;
    e.stopPropagation();
    onActivate(e);
  };

  // 커서 모양과 툴팁은 호버 여부와 드래그 여부에서 계산한다.
  // 드래그가 끝나는 순간에는 포인터 이벤트가 오지 않으므로 여기서 되살린다
  useEffect(() => {
    if (!hovered || dragging) return;
    document.body.style.cursor = 'pointer';
    if (label) setHover(label, point.current);
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered, dragging, label, setHover]);

  useFrame(() => {
    if (!group.current || !lift) return;
    const active = hovered && !dragging && isDeskView();
    const targetY = baseY + (active ? 0.03 : 0);
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
