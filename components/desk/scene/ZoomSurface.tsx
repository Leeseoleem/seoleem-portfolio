'use client';

import { useEffect, type ReactNode } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useDeskStore, type ZoomTarget } from '@/stores/useDeskStore';

// drei의 Html transform 모드는 월드 1 단위를 400 / distanceFactor 픽셀로 그린다.
// 기본값과 같은 값을 직접 넘겨서, 라이브러리 기본값이 바뀌어도 크기가 흔들리지 않게 한다.
const DISTANCE_FACTOR = 10;
const PX_PER_UNIT = 400 / DISTANCE_FACTOR;

interface ZoomSurfaceProps {
  /** 어떤 오브젝트를 확대했을 때 나타나는 화면인지 */
  target: ZoomTarget;
  /** 3D 상의 평면 크기(미터). 오브젝트의 화면 면과 같아야 한다 */
  size: [number, number];
  /** 그 화면을 CSS 픽셀로 몇으로 볼지. 안에 들어갈 UI는 이 크기를 기준으로 만든다 */
  pixels: [number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  /**
   * 책상 뷰에서도 계속 띄운다. 화면이 있는 오브젝트(모니터·핸드폰)에 쓴다.
   * 멀리 보이는 모습과 확대한 모습이 같은 코드에서 나오므로 둘이 어긋날 수 없다.
   * 이때 클릭은 3D 쪽이 받아야 확대가 되므로, 확대 상태에서만 입력을 받는다.
   */
  deskView?: boolean;
  /**
   * 카메라가 다 다가온 뒤에만 띄운다. 공책처럼 확대되는 동안 오브젝트가 열리는 연출이 있을 때 쓴다.
   * 연출 진행도로 판단하지 않는 이유는, 매 프레임 도는 루프에서 상태를 바꾸면
   * 그 상태 변경이 다시 렌더를 부르며 서로 물릴 수 있기 때문이다.
   */
  waitForZoom?: boolean;
  children: ReactNode;
}

/**
 * 3D 오브젝트의 화면 면 위에 실제 DOM을 얹는다. 확대된 동안에만 나타난다.
 *
 * 캔버스 텍스처가 아니라 진짜 DOM이므로 그 안은 평범한 React 컴포넌트로 만들면 된다.
 * 텍스트 선택, 스크롤, 접근성, CSS 트랜지션이 그대로 동작한다.
 * 좌표는 부모 그룹 기준이라 오브젝트가 움직여도 화면이 따라간다.
 */
export function ZoomSurface({ target, size, pixels, position, rotation, deskView = false, waitForZoom = false, children }: ZoomSurfaceProps) {
  const phase = useDeskStore((s) => s.phase);
  const zoomed = useDeskStore((s) => s.zoomed);
  const onThis = zoomed === target && (phase === 'zoomed' || (!waitForZoom && phase === 'transition'));
  // 부팅 화면과 종료 연출은 캔버스가 그리므로 그때는 비운다
  const active = onThis || (deskView && phase !== 'boot' && phase !== 'off');
  if (!active) return null;
  return <Surface {...{ size, pixels, position, rotation, onThis, children }} />;
}

interface SurfaceProps {
  size: [number, number];
  pixels: [number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  onThis: boolean;
  children: ReactNode;
}

function Surface({ size, pixels, position, rotation, onThis, children }: SurfaceProps) {
  const invalidate = useThree((s) => s.invalidate);
  // 확대 상태에서는 요청이 있을 때만 렌더된다. drei는 이 DOM의 위치·크기 변환을 프레임마다 계산해
  // 넣으므로, 렌더가 멈춘 상태에서 마운트되면 변환이 한 번도 적용되지 않아 원본 픽셀 크기로 깔린다.
  // 마운트 직후 몇 프레임을 강제로 요청해서 제자리를 잡게 한다
  useEffect(() => {
    let left = 3;
    let raf = 0;
    const tick = () => {
      invalidate();
      if (--left > 0) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);

  // 픽셀 크기의 div를 평면 크기에 정확히 맞춘다.
  // drei의 transform 모드는 월드 1 단위를 PX_PER_UNIT 픽셀로 그리므로 그만큼 곱해야 한다.
  const scale = (size[0] / pixels[0]) * PX_PER_UNIT;
  return (
    <Html
      transform
      distanceFactor={DISTANCE_FACTOR}
      position={position}
      rotation={rotation}
      scale={scale}
      occlude={false}
      zIndexRange={[8, 0]}
      /* drei가 DOM을 감싸는 div의 pointer-events. 확대 상태가 아닐 때 켜두면
         그 div가 캔버스로 갈 마우스 이벤트를 삼켜서 다른 오브젝트의 호버가 풀리지 않는다 */
      pointerEvents={onThis ? 'auto' : 'none'}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="zoom-surface"
        style={{ width: pixels[0], height: pixels[1], pointerEvents: onThis ? 'auto' : 'none' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </Html>
  );
}
