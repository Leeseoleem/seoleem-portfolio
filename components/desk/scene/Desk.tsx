'use client';

import { RoundedBox } from './RoundedBox';
import { scenePalette } from '@/lib/desk/palette';
import { DESK_D, DESK_THICKNESS, DESK_W, DESK_Y } from '@/lib/desk/layout';

const LEG = 0.08;
const legXZ: Array<[number, number]> = [
  [-DESK_W / 2 + 0.15, -DESK_D / 2 + 0.15],
  [DESK_W / 2 - 0.15, -DESK_D / 2 + 0.15],
  [-DESK_W / 2 + 0.15, DESK_D / 2 - 0.15],
  [DESK_W / 2 - 0.15, DESK_D / 2 - 0.15],
];

export function Desk() {
  return (
    <group>
      <RoundedBox size={[DESK_W, DESK_THICKNESS, DESK_D]} color={scenePalette.furniture.wood} position={[0, DESK_Y, 0]} />
      {legXZ.map(([x, z]) => (
        <RoundedBox key={`${x},${z}`} size={[LEG, DESK_Y, LEG]} color={scenePalette.furniture.woodDark} roughness={0.8} position={[x, DESK_Y / 2, z]} />
      ))}
    </group>
  );
}
