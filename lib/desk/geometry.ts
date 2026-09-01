import * as THREE from 'three';

/**
 * 모서리가 둥근 상자. 둥근 사각형을 bevel 있는 ExtrudeGeometry로 뽑아서 모든 모서리가 부드럽게 보인다.
 * 중심이 원점이고 w(x) × h(y) × d(z) 크기다.
 */
export function createRoundedBoxGeometry(w: number, h: number, d: number, radius = 0.03): THREE.BufferGeometry {
  const r = Math.min(radius, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const sw = w - 2 * r;
  const sd = d - 2 * r;
  const shape = new THREE.Shape();
  shape.moveTo(-sw / 2 + r, -sd / 2);
  shape.lineTo(sw / 2 - r, -sd / 2);
  shape.quadraticCurveTo(sw / 2, -sd / 2, sw / 2, -sd / 2 + r);
  shape.lineTo(sw / 2, sd / 2 - r);
  shape.quadraticCurveTo(sw / 2, sd / 2, sw / 2 - r, sd / 2);
  shape.lineTo(-sw / 2 + r, sd / 2);
  shape.quadraticCurveTo(-sw / 2, sd / 2, -sw / 2, sd / 2 - r);
  shape.lineTo(-sw / 2, -sd / 2 + r);
  shape.quadraticCurveTo(-sw / 2, -sd / 2, -sw / 2 + r, -sd / 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h - 2 * r,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: 3,
    curveSegments: 6,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -(h - 2 * r) / 2, 0);
  return geo;
}

/** 아치형(반원 + 직사각형) 평면. 쥐구멍에 쓴다. */
export function createArchGeometry(halfWidth: number, straightHeight: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth, 0);
  shape.lineTo(halfWidth, 0);
  shape.lineTo(halfWidth, straightHeight);
  shape.absarc(0, straightHeight, halfWidth, 0, Math.PI, false);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 16);
}

/** 모서리를 둥글린 삼각형(코). 위가 넓고 아래가 뾰족하다. */
export function createRoundedTriangleGeometry(w: number, h: number, r: number): THREE.BufferGeometry {
  const pts = [new THREE.Vector2(-w / 2, h / 2), new THREE.Vector2(w / 2, h / 2), new THREE.Vector2(0, -h / 2)];
  const shape = new THREE.Shape();
  for (let i = 0; i < 3; i++) {
    const prev = pts[(i + 2) % 3];
    const cur = pts[i];
    const next = pts[(i + 1) % 3];
    const d1 = prev.clone().sub(cur).normalize();
    const d2 = next.clone().sub(cur).normalize();
    const p1 = cur.clone().addScaledVector(d1, r);
    const p2 = cur.clone().addScaledVector(d2, r);
    if (i === 0) shape.moveTo(p1.x, p1.y);
    else shape.lineTo(p1.x, p1.y);
    shape.quadraticCurveTo(cur.x, cur.y, p2.x, p2.y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 6);
}

/** 고양이 머리: 위가 넓고 턱이 좁은 둥근 역삼각형으로 구를 변형한다. */
export function createCatSkullGeometry(radius: number): THREE.SphereGeometry {
  const geo = new THREE.SphereGeometry(radius, 48, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = y / radius; // -1 턱 .. +1 정수리
    const widen = 1.12 + 0.34 * k;
    const flatten = k < 0 ? 1 - 0.18 * -k : 1;
    pos.setXYZ(i, x * widen, y * 0.92 * flatten, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * 고양이 몸통(식빵 자세). 길이 방향 반경 프로필을 회전시킨 뒤 아랫면을 평평하게 자른다.
 * 앞(머리 쪽, +z)이 낮고 뒤가 두껍다. 바닥은 y = -0.2 × scaleY 에 평평하게 닿는다.
 */
export function createCatBodyGeometry(): THREE.LatheGeometry {
  const profile = [
    [0, 0], [0.12, 0.02], [0.18, 0.1], [0.215, 0.22], [0.25, 0.35], [0.285, 0.48], [0.27, 0.58], [0.17, 0.65], [0, 0.68],
  ].map(([r, l]) => new THREE.Vector2(r, l));
  const geo = new THREE.LatheGeometry(profile, 48);
  geo.rotateX(-Math.PI / 2); // 길이 방향이 -z. 앞 끝이 z = 0
  geo.translate(0, 0, 0.34); // 앞 +0.34, 뒤 -0.34
  const pos = geo.attributes.position;
  const FLOOR = -0.2;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0) pos.setY(i, Math.max(FLOOR, y * 1.45));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** 귀 프로필: 끝이 둥근 원뿔. 밑면이 y = 0. */
export function createEarGeometry(radius: number, height: number, baseOffset = 0): THREE.LatheGeometry {
  const profile = [
    [radius, 0], [radius * 0.92, height * 0.38], [radius * 0.66, height * 0.7],
    [radius * 0.36, height * 0.88], [radius * 0.14, height * 0.97], [0, height],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(profile, 24);
  geo.scale(1.6, 1, 0.6);
  if (baseOffset) geo.translate(0, baseOffset, 0);
  return geo;
}

/**
 * 평면 격자의 각 정점을 대상 메시 표면에 투영해서 곡면에 밀착하는 패치를 만든다.
 * 고양이 눈 데칼처럼 얼굴을 감싸야 하는 2D 그림에 쓴다. 대상 메시는 부모와 같은 좌표계에 있어야 한다.
 */
export function createSurfacePatch(
  target: THREE.Mesh,
  center: THREE.Vector3,
  u: THREE.Vector3,
  v: THREE.Vector3,
  w: number,
  h: number,
  segments: number,
  mirrorU: boolean,
  lift = 0.004,
): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(w, h, segments, segments);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const ray = new THREE.Raycaster();
  const p = new THREE.Vector3();
  const dir = new THREE.Vector3();
  target.updateMatrixWorld(true);
  for (let i = 0; i < pos.count; i++) {
    p.copy(center).addScaledVector(u, pos.getX(i)).addScaledVector(v, pos.getY(i));
    dir.copy(p).normalize();
    ray.set(p.clone().addScaledVector(dir, 0.4), dir.clone().negate());
    const hit = ray.intersectObject(target, false)[0];
    if (hit && hit.face) p.copy(hit.point).addScaledVector(hit.face.normal, lift);
    pos.setXYZ(i, p.x, p.y, p.z);
    if (mirrorU) uv.setX(i, 1 - uv.getX(i));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** 위에서 아래로 레이를 쏴서 메시 표면의 점과 법선을 얻는다. 귀 밑동 배치용. */
export function probeDown(target: THREE.Mesh, x: number, z: number, fromY = 0.6): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  const ray = new THREE.Raycaster();
  target.updateMatrixWorld(true);
  ray.set(new THREE.Vector3(x, fromY, z), new THREE.Vector3(0, -1, 0));
  const hit = ray.intersectObject(target, false)[0];
  if (!hit || !hit.face) return null;
  return { point: hit.point.clone(), normal: hit.face.normal.clone() };
}

/** 앞(-z 방향)으로 레이를 쏴서 표면의 점과 법선을 얻는다. 코 배치용. */
export function probeForward(target: THREE.Mesh, x: number, y: number, fromZ = 0.8): { point: THREE.Vector3; normal: THREE.Vector3 } | null {
  const ray = new THREE.Raycaster();
  target.updateMatrixWorld(true);
  ray.set(new THREE.Vector3(x, y, fromZ), new THREE.Vector3(0, 0, -1));
  const hit = ray.intersectObject(target, false)[0];
  if (!hit || !hit.face) return null;
  return { point: hit.point.clone(), normal: hit.face.normal.clone() };
}

/**
 * 꼬리처럼 매 프레임 형태가 바뀌는 튜브. 지오메트리를 한 번만 만들고 정점만 갱신한다.
 * 프레임마다 TubeGeometry를 새로 만들면 할당과 GPU 업로드가 반복돼 프레임이 크게 떨어진다.
 */
export class DeformableTube {
  readonly geometry: THREE.BufferGeometry;
  private readonly tubular: number;
  private readonly radial: number;
  private readonly radius: number;

  constructor(curve: THREE.Curve<THREE.Vector3>, tubular = 20, radius = 0.036, radial = 8) {
    this.tubular = tubular;
    this.radial = radial;
    this.radius = radius;
    const base = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', base.getAttribute('position').clone());
    this.geometry.setAttribute('normal', base.getAttribute('normal').clone());
    this.geometry.setAttribute('uv', base.getAttribute('uv').clone());
    this.geometry.setIndex(base.getIndex());
    base.dispose();
  }

  /** 커브가 바뀐 뒤 호출한다. 접선 프레임을 다시 구해 정점과 법선만 덮어쓴다. */
  update(curve: THREE.Curve<THREE.Vector3>): void {
    const frames = curve.computeFrenetFrames(this.tubular, false);
    const pos = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const nor = this.geometry.getAttribute('normal') as THREE.BufferAttribute;
    const p = new THREE.Vector3();
    let i = 0;
    for (let s = 0; s <= this.tubular; s++) {
      const center = curve.getPointAt(s / this.tubular);
      const N = frames.normals[s];
      const B = frames.binormals[s];
      for (let r = 0; r <= this.radial; r++) {
        const v = (r / this.radial) * Math.PI * 2;
        const sin = Math.sin(v);
        const cos = -Math.cos(v);
        const nx = cos * N.x + sin * B.x;
        const ny = cos * N.y + sin * B.y;
        const nz = cos * N.z + sin * B.z;
        p.set(center.x + this.radius * nx, center.y + this.radius * ny, center.z + this.radius * nz);
        pos.setXYZ(i, p.x, p.y, p.z);
        nor.setXYZ(i, nx, ny, nz);
        i++;
      }
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  dispose(): void {
    this.geometry.dispose();
  }
}
