'use client';

import { Interactive } from './Interactive';
import { ZoomSurface } from './ZoomSurface';
import { PhoneScreen } from '../surfaces/PhoneScreen';
import { RoundedBox } from './RoundedBox';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { PHONE_YAW, positions, TOP, zoomPoses } from '@/lib/desk/layout';

const BODY: [number, number, number] = [0.31, 0.022, 0.66];
const SCREEN: [number, number] = [0.276, 0.598];

/**
 * 핸드폰. 화면 내용은 PhoneScreen(DOM)이 전부 맡는다.
 * 책상 뷰에서도 같은 DOM이 떠 있어서 멀리서 본 모습과 확대한 모습이 어긋나지 않는다.
 * 아래 검은 면은 DOM이 뜨기 전(부팅·종료)에 보이는 꺼진 화면이다.
 */
export function Phone() {
  const zoomTo = useDeskStore((s) => s.zoomTo);

  return (
    <Interactive label="핸드폰" position={positions.phone} rotation={[0, PHONE_YAW, 0]} onActivate={() => zoomTo('phone', zoomPoses.phone)}>
      <RoundedBox size={BODY} radius={0.03} color={scenePalette.furniture.black} roughness={0.5} position={[0, TOP + 0.011, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP + 0.0225, 0]}>
        <planeGeometry args={SCREEN} />
        <meshBasicMaterial color={scenePalette.furniture.black} toneMapped={false} />
      </mesh>
      <ZoomSurface deskView target="phone" size={SCREEN} pixels={[360, 780]} position={[0, TOP + 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <PhoneScreen />
      </ZoomSurface>
      {/* 전면 카메라 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP + 0.0226, -0.27]}>
        <circleGeometry args={[0.008, 12]} />
        <meshBasicMaterial color={scenePalette.furniture.black} />
      </mesh>
    </Interactive>
  );
}
