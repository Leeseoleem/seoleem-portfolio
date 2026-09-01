'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Interactive } from './Interactive';
import { ZoomSurface } from './ZoomSurface';
import { NotebookPages } from '../surfaces/NotebookPages';
import { RoundedBox } from './RoundedBox';
import { useDeskStore } from '@/stores/useDeskStore';
import { scenePalette } from '@/lib/desk/palette';
import { positions, TOP, zoomPoses } from '@/lib/desk/layout';
import { prefersReducedMotion } from '@/lib/desk/runtime';

const COVER_W = 0.72;
const COVER_D = 0.94;
const COVER_H = 0.07;
// 속지는 책등 쪽(왼쪽)만 표지 안으로 들어가고 나머지 세 변으로 비어져 나온다
const PAPER_OUT = 0.004;
const PAPER_IN = 0.006;
const PAPER_W = COVER_W - PAPER_IN + PAPER_OUT;
const PAPER_D = COVER_D + PAPER_OUT * 2;
const PAPER_X = (PAPER_OUT + PAPER_IN) / 2;
const PAPER_TOP = TOP + 0.04; // 속지 윗면
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
  const edge = COVER_D / 2 + PAPER_OUT; // 속지 바깥면
  return new THREE.CatmullRomCurve3([
    p(0.008, edge - 0.004),
    p(0.036, edge - 0.001),
    p(0.062, edge),
    p(0.076, edge - 0.026),
    p(0.079, 0.32),
    p(0.079, 0),
    p(0.079, -0.32),
    p(0.076, -(edge - 0.026)),
    p(0.062, -edge),
    p(0.036, -(edge - 0.001)),
    p(0.008, -(edge - 0.004)),
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
  const cover = useRef<THREE.Group>(null);
  const bandGroup = useRef<THREE.Group>(null);
  const bandMat = useRef<THREE.MeshStandardMaterial>(null);
  /** 펼치는 연출의 진행도. 0이 닫힘, 1이 완전히 펼쳐진 상태 */
  const t = useRef(0);

  const band = useMemo(() => new THREE.TubeGeometry(bandCurve(), 160, 0.011, 12, false), []);
  useEffect(() => () => band.dispose(), [band]);

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

    if (cover.current) cover.current.rotation.z = OPEN_ANGLE * openP;
    if (bandGroup.current) {
      bandGroup.current.position.x = BAND_SLIDE * bandOff;
      bandGroup.current.visible = bandOff < 0.99;
    }
    if (bandMat.current) bandMat.current.opacity = 1 - bandOff;
  });

  return (
    <Interactive label="공책" position={positions.notebook} rotation={[0, 0.22, 0]} onActivate={() => zoomTo('notebook', zoomPoses.notebook)}>
      {/* 속지. 책등 쪽(왼쪽)만 표지 안으로 들어가고 나머지 세 변으로 비어져 나온다.
          높이를 낮춰 고무 밴드와 겹치지 않게 한다 */}
      <RoundedBox
        size={[PAPER_W, 0.02, PAPER_D]}
        radius={0.008}
        color={scenePalette.furniture.paper}
        roughness={0.95}
        position={[PAPER_X, TOP + 0.03, 0]}
        castShadow={false}
      />
      {/* 표지. 책등(왼쪽 모서리)을 축으로 회전하도록 그 자리에 그룹을 두고 안에서 밀어 놓는다 */}
      <group ref={cover} position={[-COVER_W / 2, TOP + COVER_H / 2, 0]}>
        <RoundedBox size={[COVER_W, COVER_H, COVER_D]} color={scenePalette.furniture.kraft} roughness={0.9} position={[COVER_W / 2, 0, 0]} />
        {/* 표지에 붙인 빈 라벨. 테두리 판 위에 안쪽 종이를 얹어 두 겹으로 만든다 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[COVER_W / 2, COVER_H / 2 + 0.0005, -0.12]}>
          <planeGeometry args={[0.34, 0.14]} />
          <meshStandardMaterial color={scenePalette.notebook.labelBorder} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[COVER_W / 2, COVER_H / 2 + 0.0007, -0.12]}>
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
