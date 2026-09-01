'use client';

import { Interactive } from './Interactive';
import { RoundedBox } from './RoundedBox';
import { scenePalette } from '@/lib/desk/palette';
import { positions, TOP } from '@/lib/desk/layout';
import { getSound } from '@/lib/desk/sound';

/** 키보드와 마우스. 누르면 소리만 난다. 툴팁 없음 */
export function Peripherals() {
  return (
    <group>
      <Interactive onActivate={() => getSound().play('keys')} lift={false}>
        <RoundedBox size={[1.15, 0.04, 0.36]} color={scenePalette.furniture.beige} roughness={0.6} position={positions.keyboard} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[positions.keyboard[0], TOP + 0.041, positions.keyboard[2]]}>
          <planeGeometry args={[1.05, 0.28]} />
          <meshStandardMaterial color={scenePalette.furniture.keys} roughness={0.8} />
        </mesh>
      </Interactive>
      <Interactive onActivate={() => getSound().play('mouseClick')} lift={false}>
        <RoundedBox size={[0.1, 0.05, 0.16]} color={scenePalette.furniture.beige} roughness={0.6} position={positions.mouse} />
      </Interactive>
    </group>
  );
}
