'use client';

import { RoundedBox } from './RoundedBox';
import { scenePalette } from '@/lib/desk/palette';
import { positions } from '@/lib/desk/layout';

/**
 * 말 없는 소품들. 누를 수 없고 움직이지 않는다. 전부 상자와 원기둥이라 비용이 거의 없다.
 * "이 사람" 이야기를 더하는 용도다. 연필은 손으로 그리는 사람.
 */

// ---------- 연필 ----------
const PENCIL_L = 0.4;
const PENCIL_R = 0.0095;
const TIP_L = 0.045;

function Pencil() {
  const [x, y, z] = positions.pencil;
  const p = scenePalette.pencil;
  // 길이 방향이 z. 앉아서 보면 공책 옆에 세로로 놓인 셈이다. 살짝 틀어서 놓는다
  return (
    <group position={[x, y + PENCIL_R, z]} rotation={[Math.PI / 2, 0, 0.14]}>
      {/* 몸통. 육각 */}
      <mesh castShadow>
        <cylinderGeometry args={[PENCIL_R, PENCIL_R, PENCIL_L - TIP_L, 6]} />
        <meshStandardMaterial color={p.body} roughness={0.6} />
      </mesh>
      {/* 깎인 나무 부분 */}
      <mesh position={[0, -(PENCIL_L - TIP_L) / 2 - TIP_L * 0.35, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[PENCIL_R, TIP_L * 0.7, 6]} />
        <meshStandardMaterial color={p.wood} roughness={0.8} />
      </mesh>
      {/* 심 */}
      <mesh position={[0, -(PENCIL_L - TIP_L) / 2 - TIP_L * 0.7 - TIP_L * 0.15, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[PENCIL_R * 0.32, TIP_L * 0.3, 6]} />
        <meshStandardMaterial color={p.graphite} roughness={0.4} />
      </mesh>
      {/* 쇠테와 지우개 */}
      <mesh position={[0, (PENCIL_L - TIP_L) / 2 + 0.008, 0]}>
        <cylinderGeometry args={[PENCIL_R * 1.05, PENCIL_R * 1.05, 0.016, 12]} />
        <meshStandardMaterial color={p.ferrule} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, (PENCIL_L - TIP_L) / 2 + 0.016 + 0.009, 0]}>
        <cylinderGeometry args={[PENCIL_R * 0.98, PENCIL_R * 0.98, 0.018, 12]} />
        <meshStandardMaterial color={p.eraser} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Props() {
  return <Pencil />;
}
