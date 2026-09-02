'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { ZoomSurface } from './ZoomSurface';
import { NotebookPages } from '../surfaces/NotebookPages';
import { RoundedBox } from './RoundedBox';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { COVER_D, COVER_T, COVER_W, NOTEBOOK_YAW, PAPER_D, PAPER_H, PAPER_W, PAPER_X, positions, TOP, zoomPoses } from '@/lib/desk/layout';
import { createRoundedBoxGeometry } from '@/lib/desk/geometry';
import { drawLeather } from '@/lib/desk/leather';
import { requestShadowUpdate } from '@/lib/desk/shadows';
import { prefersReducedMotion } from '@/lib/desk/runtime';

// 표지·속지 치수는 lib/desk/layout.ts에 있다. 확대 구도가 같은 숫자를 봐야 하기 때문이다
const PAPER_TOP = TOP + COVER_T + PAPER_H; // 속지 윗면
/** 닫힌 공책의 전체 높이. 밴드가 이 위를 지난다 */
const BOOK_H = COVER_T * 2 + PAPER_H;
/** 앞표지 회전축의 높이. 닫혀 있을 때는 속지 위, 다 펼치면 책상 위에 눕는다 */
const HINGE_CLOSED = TOP + COVER_T + PAPER_H + COVER_T / 2;
const HINGE_OPEN = TOP + COVER_T / 2;
/** 가죽 결 텍스처 한 변. 1m에 네 번 반복된다 */
const LEATHER_TEX = 512;
const LEATHER_REPEAT = 4;
const BAND_X = 0.27;
// 표지가 열리는 각도. 책등을 축으로 왼쪽으로 넘어가 책상에 눕는다
const OPEN_ANGLE = Math.PI;
// 펼치는 연출 전체 길이(초). 카메라가 다가오는 시간 안에 끝나야 한다
const OPEN_DURATION = 1.1;
// 연출 진행도에서 밴드가 빠지는 구간과 표지가 열리는 구간. 살짝 겹쳐야 끊겨 보이지 않는다
const BAND_PHASE = 0.34;
const COVER_PHASE_START = 0.28;
// 밴드가 오른쪽으로 밀려나는 거리
const BAND_SLIDE = 0.22;

function smoothstep(from: number, to: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

/**
 * 고무 밴드 경로. 표지 위를 한 줄로 지나 양쪽 모서리를 넘고, 속지 안으로 들어가 끝난다.
 *
 * 되돌아오는 줄을 두면 어디에 숨기든 나가는 줄과 나란히 놓이는 구간이 생겨
 * 두 갈래로 갈라지거나 뭉쳐 보인다. 그래서 앞뒤 방향으로 한 번도 뒤집히지 않는 열린 경로로 만들고,
 * 잘린 양 끝은 불투명한 속지·표지 안에 파묻어 감춘다.
 */
function bandCurve() {
  const p = (y: number, z: number) => new THREE.Vector3(BAND_X, TOP + y, z);
  const edge = COVER_D / 2; // 표지 앞뒤 면
  const top = BOOK_H + 0.008; // 표지 위에 3mm쯤 파묻힌 높이
  return new THREE.CatmullRomCurve3([
    p(0.006, edge - 0.004),
    p(BOOK_H * 0.55, edge - 0.001),
    p(BOOK_H * 0.95, edge),
    p(top - 0.002, edge - 0.026),
    p(top, 0.32),
    p(top, 0),
    p(top, -0.32),
    p(top - 0.002, -(edge - 0.026)),
    p(BOOK_H * 0.95, -edge),
    p(BOOK_H * 0.55, -(edge - 0.001)),
    p(0.006, -(edge - 0.004)),
  ]);
}

/**
 * 공책. 크라프트 표지, 빈 라벨, 세로 고무 밴드, 짧은 리본 책갈피.
 *
 * 클릭하면 표지가 책등을 축으로 넘어가 펼쳐지고, 카메라가 다 다가온 뒤 속지 위로 NotebookPages(DOM)가 올라온다.
 * 순서가 있다. 펼칠 때는 고무 밴드가 먼저 옆으로 빠지고 그다음 표지가 넘어간다. 닫을 때는 그 반대다.
 */
export function Notebook() {
  const zoomTo = useDeskStore((s) => s.zoomTo);
  const invalidate = useThree((s) => s.invalidate);
  const cover = useRef<THREE.Group>(null);
  const bandGroup = useRef<THREE.Group>(null);
  const bandMat = useRef<THREE.MeshStandardMaterial>(null);
  /** 펼치는 연출의 진행도. 0이 닫힘, 1이 완전히 펼쳐진 상태 */
  const t = useRef(0);
  const lastT = useRef(-1);

  const band = useMemo(() => new THREE.TubeGeometry(bandCurve(), 160, 0.011, 12, false), []);
  useEffect(() => () => band.dispose(), [band]);

  // 가죽 결. 표지 지오메트리(Extrude)의 UV는 미터 단위라 repeat가 곧 1m당 반복 횟수다
  const leather = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = LEATHER_TEX;
    const ctx = c.getContext('2d');
    if (ctx) drawLeather(ctx, LEATHER_TEX);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(LEATHER_REPEAT, LEATHER_REPEAT);
    tex.anisotropy = 4;
    return tex;
  }, []);
  useEffect(() => () => leather.dispose(), [leather]);
  const coverGeo = useMemo(() => createRoundedBoxGeometry(COVER_W, COVER_T, COVER_D, 0.004), []);
  useEffect(() => () => coverGeo.dispose(), [coverGeo]);

  useFrame((_, delta) => {
    const { phase, zoomed } = useDeskStore.getState();
    const target = zoomed === 'notebook' && (phase === 'zoomed' || phase === 'transition') ? 1 : 0;
    // 확대가 끝난 뒤에는 렌더가 요청될 때만 돌기 때문에, 그 시점에 남은 진행도를 한 번에 맞춘다
    if (prefersReducedMotion() || phase === 'zoomed') {
      t.current = target;
    } else {
      const step = Math.min(delta, 0.05) / OPEN_DURATION;
      t.current = Math.min(1, Math.max(0, t.current + (target ? step : -step)));
    }

    // 펼칠 때는 밴드가 먼저 빠지고 표지가 열린다. 닫을 때는 진행도가 거꾸로 흐르며 순서도 뒤집힌다
    const bandOff = smoothstep(0, BAND_PHASE, t.current);
    const openP = smoothstep(COVER_PHASE_START, 1, t.current);

    if (cover.current) {
      cover.current.rotation.z = OPEN_ANGLE * openP;
      // 회전축이 속지 높이에 고정돼 있으면 다 펼친 표지가 책상 위에 떠 있게 된다.
      // 넘어가는 동안 축을 책상까지 내려서 표지가 바닥에 눕게 한다
      cover.current.position.y = HINGE_CLOSED + (HINGE_OPEN - HINGE_CLOSED) * openP;
    }
    // 표지·밴드가 움직이는 동안은 그림자도 따라가야 한다. 멈춰 있을 때는 요청하지 않는다
    if (t.current !== lastT.current) {
      lastT.current = t.current;
      requestShadowUpdate();
      // 확대 상태에서는 요청이 있을 때만 그린다. Room이 이 요청을 다음 프레임에 처리하므로 한 프레임 더 부른다
      invalidate();
    }
    if (bandGroup.current) {
      bandGroup.current.position.x = BAND_SLIDE * bandOff;
      bandGroup.current.visible = bandOff < 0.99;
    }
    if (bandMat.current) bandMat.current.opacity = 1 - bandOff;
  });

  return (
    <Interactive label="공책" position={positions.notebook} rotation={[0, NOTEBOOK_YAW, 0]} onActivate={() => zoomTo('notebook', zoomPoses.notebook)}>
      {/* 뒤표지. 책상에 놓인 얇은 판 */}
      <mesh geometry={coverGeo} position={[0, TOP + COVER_T / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={leather} bumpMap={leather} bumpScale={0.002} roughness={0.72} />
      </mesh>
      {/* 속지. 앞뒤 표지 사이를 꽉 채우는 덩어리. 책등에는 붙고 나머지 세 변은 표지보다 조금 안쪽이라
          옆에서 보면 두 표지 사이로 종이 단면이 보인다 */}
      <RoundedBox
        size={[PAPER_W, PAPER_H, PAPER_D]}
        radius={0.004}
        color={scenePalette.furniture.paper}
        roughness={0.95}
        position={[PAPER_X, TOP + COVER_T + PAPER_H / 2, 0]}
        castShadow={false}
      />
      {/* 앞표지. 책등(왼쪽 모서리)을 축으로 회전하도록 그 자리에 그룹을 두고 안에서 밀어 놓는다 */}
      <group ref={cover} position={[-COVER_W / 2, HINGE_CLOSED, 0]}>
        <mesh geometry={coverGeo} position={[COVER_W / 2, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial map={leather} bumpMap={leather} bumpScale={0.002} roughness={0.72} />
        </mesh>
        {/* 표지에 붙인 빈 라벨. 테두리 판 위에 안쪽 종이를 얹어 두 겹으로 만든다 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[COVER_W / 2, COVER_T / 2 + 0.0005, -0.12]}>
          <planeGeometry args={[0.34, 0.14]} />
          <meshStandardMaterial color={scenePalette.notebook.labelBorder} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[COVER_W / 2, COVER_T / 2 + 0.0007, -0.12]}>
          <planeGeometry args={[0.326, 0.126]} />
          <meshStandardMaterial color={scenePalette.notebook.labelPaper} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* 펼쳐진 속지 위에 얹히는 DOM. 디자인 시안이 여기 들어간다 */}
      <ZoomSurface waitForZoom target="notebook" size={[PAPER_W, PAPER_D]} pixels={[720, 940]} position={[PAPER_X, PAPER_TOP + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <NotebookPages />
      </ZoomSurface>
      {/* 세로 고무 밴드. 앞모서리에서 표지 위를 지나 뒷모서리까지 이어지는 곡선 하나다.
          조각을 이어붙이면 맞닿는 곳이 벌어져 끊어져 보인다.
          펼칠 때는 이 그룹이 오른쪽으로 밀려나며 벗겨진다 */}
      <group ref={bandGroup}>
        <mesh geometry={band} castShadow={false}>
          <meshStandardMaterial ref={bandMat} color={scenePalette.notebook.band} roughness={0.85} transparent />
        </mesh>
      </group>
      {/* 리본 책갈피 */}
      <mesh rotation={[-Math.PI / 2, 0, 0.15]} position={[0.06, TOP + 0.004, 0.505]}>
        <planeGeometry args={[0.05, 0.075]} />
        <meshStandardMaterial color={scenePalette.notebook.ribbon} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </Interactive>
  );
}
