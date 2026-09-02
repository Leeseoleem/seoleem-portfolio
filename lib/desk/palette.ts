// 3D 씬에서 쓰는 모든 색을 한곳에 모은다. 컴포넌트 안에서 색상 리터럴을 쓰지 않는다.
// UI(DOM) 쪽 토큰은 app/globals.css에 있고, 여기는 three 재질 전용이다.

export const scenePalette = {
  room: {
    // 책상보다 한 단계 어둡고 탁하게. 밝은 책상이 벽에 묻히지 않게 하는 바탕이다
    wallDay: '#cdb5a1',
    wallNight: '#2b3552',
    floorDay: '#a07b58',
    floorNight: '#3b322f',
    backgroundDay: '#cdb5a1',
    backgroundNight: '#1c2338',
  },
  furniture: {
    // 화이트 워시 우드. 실제 작업 책상을 따른다. 대비는 벽을 한 단계 내리고 그림자로 만든다
    wood: '#ece3d4',
    woodDark: '#d6cbb8',
    beige: '#d9d2c0',
    beigeDark: '#b9b2a0',
    // 모니터 껍데기. 오래된 플라스틱처럼 베이지보다 살짝 누렇다
    crt: '#ddd3bb',
    crtSlot: '#8f8878',
    black: '#14141a',
    paper: '#f2ede2',
    kraft: '#b98a5a',
    ceramic: '#e8e2d0',
    white: '#f4f1ea',
    vent: '#a9a08c',
    coffee: '#4a2b16',
    cable: '#2a2a2e',
  },
  // 책상 위 마우스(입력장치). 쥐구멍의 생쥐는 아래 mouse 항목이다
  pointer: {
    wheel: '#eceae2',
  },
  lamp: {
    bulbOff: '#3a3226',
    bulbOn: '#fff1c8',
    lightWarm: '#ffc98a',
    headGlow: '#ffc98a',
  },
  light: {
    ambientDay: '#fff1e0',
    ambientNight: '#8fa4ff',
    hemiSkyDay: '#fff0e0',
    hemiSkyNight: '#7f93d8',
    hemiGround: '#8c7259',
    fill: '#fff4e6',
    screenGlow: '#7fb6ff',
  },
  led: {
    on: '#5cff7a',
    off: '#2a2a2a',
    hdd: '#ffb020',
  },
  notebook: {
    band: '#2f3a4a',
    ribbon: '#d8574a',
    labelPaper: '#f4efe4',
    labelBorder: '#c9c1b0',
  },
  cat: {
    fur: '#8b9099',
    toe: '#74797f',
    innerEar: '#d9a3a8',
    nose: '#e2606c',
    cushion: '#e8a9b6',
    cushionButton: '#d08a9a',
  },
  mouse: {
    fur: '#b9b3ad',
    ear: '#e0b3b3',
    eye: '#111111',
    nose: '#e08a8a',
    hole: '#14100e',
    holeTrim: '#caa88e',
  },
} as const;

// 2D 캔버스(모니터·폰·눈)용 색. CSS 문자열 그대로 쓴다.
export const canvasPalette = {
  boot: {
    background: '#000000',
    text: '#ffffff',
    intro: '#c9c9c9',
    footer: '#9a9a9a',
    barBorder: '#8a8a8a',
    barTop: '#6da2ff',
    barBottom: '#1d4fd1',
    flag: ['#f35325', '#81bc06', '#05a6f0', '#ffba08'],
  },
  // 책상 윗면 나무결. 바탕은 scenePalette.furniture.wood와 같아야 둥근 모서리와 이어진다
  wood: {
    base: '#ece3d4',
    grainDark: '#d9cbb6',
    grainLight: '#f6f0e6',
    seam: '#cfc1ab',
  },
  // 키보드 상판에 그리는 키 배열
  keyboard: {
    base: '#a8a190',
    key: '#e6e0d0',
    keyEdge: '#9c9584',
  },
  // 마우스 껍데기에 새기는 선. 셸 표면 텍스처로 그린다
  pointer: {
    body: '#dcd6c6',
    line: '#8c8574',
    slot: '#6f6a5c',
  },
  shutdown: {
    top: '#3b6fd6',
    bottom: '#1b3f9c',
    text: '#ffffff',
  },
  phone: {
    wallpaperA: '#1b2a55',
    wallpaperB: '#3a2f6b',
    wallpaperC: '#0d1a3a',
    blobWarm: 'rgba(255,150,120,0.35)',
    blobCool: 'rgba(120,200,255,0.3)',
    statusLight: '#ffffff',
    statusDark: '#111111',
    label: 'rgba(255,255,255,0.92)',
    dock: 'rgba(255,255,255,0.16)',
    homeIndicatorLight: 'rgba(255,255,255,0.8)',
    homeIndicatorDark: '#111111',
    settingsBackground: '#f2f2f7',
    settingsCard: '#ffffff',
    settingsDivider: '#e5e5ea',
    settingsText: '#111111',
    settingsMuted: '#8e8e93',
    settingsLink: '#3478f6',
    toggleOn: '#34c759',
    toggleOff: '#d1d1d6',
    toggleKnob: '#ffffff',
    appBackground: '#0f1115',
    appMuted: '#9aa4b2',
    appText: '#ffffff',
  },
  catEye: {
    irisCenter: '#dfe57a',
    irisMid: '#a9c23a',
    irisEdge: '#5b7a1e',
    pupil: '#101410',
    shine: 'rgba(255,255,255,0.95)',
    lineDark: '#121412',
    lineFaint: 'rgba(18,20,18,0.22)',
  },
  doc: {
    paper: '#f5f1e8',
    ink: '#2a2a2a',
    muted: '#777777',
    line: '#bcb7ab',
  },
} as const;
