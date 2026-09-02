'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { scenePalette } from '@/lib/desk/palette';
import { DESK_D, KEYBOARD_D, positions, TOP } from '@/lib/desk/layout';

/** 모니터 본체 중심 높이. Monitor.tsx의 BODY_Y와 같은 식이다 */
const BODY_Y = TOP + 0.2 + 0.56;
/** 책상 뒤 모서리 z. 선이 여기서 꺾여 아래로 떨어진다 */
const BACK_EDGE = -DESK_D / 2;
/** 본체 뒷면. 선이 여기서 들어간다. 본체 크기는 RoundedBox [0.34, 1.0, 0.7]이고 z 중심이 tower[2]다 */
const TOWER_BACK: [number, number, number] = [positions.tower[0], 0.42, positions.tower[2] - 0.36];

/**
 * 모니터와 키보드에서 본체로 이어지는 선. 책상 위를 지나 뒤 모서리에서 아래로 떨어진다.
 * 물건들이 서로 연결돼 있다는 것만 보여도 장면이 한 벌의 작업 공간으로 읽힌다.
 */
const monitorPath: Array<[number, number, number]> = [
  // 본체 뒤 아래쪽에서 나온다. 뒷면은 좁아져서 z가 -0.9쯤이다
  [0.08, BODY_Y - 0.22, -0.88],
  [0.16, BODY_Y - 0.36, -0.93],
  // 상판에 닿아 살짝 늘어진다
  [0.3, TOP + 0.012, -0.96],
  [0.48, TOP + 0.008, BACK_EDGE + 0.01],
  // 모서리를 넘어 뒤로 떨어진다
  [0.62, TOP - 0.12, BACK_EDGE - 0.035],
  [0.85, TOP - 0.5, BACK_EDGE - 0.02],
  [1.1, 0.5, -0.78],
  TOWER_BACK,
];

const keyboardPath: Array<[number, number, number]> = [
  // 키보드 뒤 가운데에서 나온다
  [0.1, TOP + 0.016, positions.keyboard[2] - KEYBOARD_D / 2 + 0.01],
  // 곧게 뻗지 않고 살짝 S자로 늘어진다. 직선이면 그려 넣은 줄처럼 보인다
  [0.2, TOP + 0.007, 0.3],
  [0.19, TOP + 0.007, 0.05],
  // 모니터 받침 오른쪽을 지나
  [0.36, TOP + 0.007, -0.25],
  [0.5, TOP + 0.007, -0.55],
  [0.64, TOP + 0.007, -0.82],
  [0.7, TOP + 0.006, BACK_EDGE + 0.01],
  [0.78, TOP - 0.1, BACK_EDGE - 0.03],
  [0.98, TOP - 0.45, BACK_EDGE - 0.02],
  [1.18, 0.52, -0.74],
  [TOWER_BACK[0] + 0.04, TOWER_BACK[1] + 0.06, TOWER_BACK[2]],
];

function useCable(path: Array<[number, number, number]>, radius: number) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(path.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
    return new THREE.TubeGeometry(curve, 96, radius, 8, false);
  }, [path, radius]);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

export function Cables() {
  const monitor = useCable(monitorPath, 0.007);
  const keyboard = useCable(keyboardPath, 0.0045);
  return (
    <group>
      <mesh geometry={monitor} castShadow receiveShadow>
        <meshStandardMaterial color={scenePalette.furniture.cable} roughness={0.45} />
      </mesh>
      <mesh geometry={keyboard} castShadow receiveShadow>
        <meshStandardMaterial color={scenePalette.furniture.cable} roughness={0.45} />
      </mesh>
    </group>
  );
}
