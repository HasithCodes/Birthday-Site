/* ============================================================
   PAGE ROUTING LOGIC
   ============================================================ */
const PAGE_ORDER = ['page-home', 'page-gallery', 'page-cake'];
const NAV_BUTTONS = {
  'page-home': 'nav-home',
  'page-gallery': 'nav-gallery',
  'page-cake': 'nav-cake'
};
const TRANSITION_MS = 500;
const SLIDE_DISTANCE = 60; // px the pages travel sideways

let currentPage = 'page-home';
let isTransitioning = false;

function navigateTo(pageId) {
  // Ignore clicks on the page we're already on, or mid-animation clicks
  // that would otherwise leave two pages visible at once.
  if (isTransitioning || pageId === currentPage) return;

  const outgoing = document.getElementById(currentPage);
  const incoming = document.getElementById(pageId);
  if (!incoming) return;

  isTransitioning = true;

  // Direction: moving right through the nav slides left, and vice versa.
  const forward = PAGE_ORDER.indexOf(pageId) > PAGE_ORDER.indexOf(currentPage);
  const enterFrom = forward ? SLIDE_DISTANCE : -SLIDE_DISTANCE;

  // Outgoing page exits toward the opposite side.
  outgoing.style.setProperty('--shift', `${-enterFrom}px`);
  outgoing.classList.remove('active');

  // Park the incoming page on its starting side, then force the browser to
  // acknowledge that position before animating — without this reflow the two
  // style changes are batched into one frame and no transition happens.
  incoming.style.setProperty('--shift', `${enterFrom}px`);
  void incoming.offsetWidth;
  incoming.classList.add('active');

  // Nav pill state
  Object.values(NAV_BUTTONS).forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  document.getElementById(NAV_BUTTONS[pageId]).classList.add('active');

  currentPage = pageId;

  if (pageId === 'page-cake' && clickState === 0 && !cakeRenderer) {
    init3DChocolateCake();
  }

  setTimeout(() => {
    outgoing.style.removeProperty('--shift');
    incoming.style.removeProperty('--shift');
    isTransitioning = false;
  }, TRANSITION_MS);
}

/* ============================================================
   INTERACTIVE STATE CONTROLLER
   ============================================================ */
let clickState = 0; // 0: 3D Chocolate Cake, 1: Teddy, 2: Smooth 3D Heart

function handleInteractiveClick() {
  const cakeBox = document.getElementById('cake');
  const status = document.getElementById('wish-status');

  if (clickState === 0) {
    // State 0 -> 1: Blow Candles on Chocolate Cake & transition to Teddy
    stop3DChocolateCake();
    cakeBox.innerHTML = '<span class="pink-teddy">🧸</span>';
    status.innerText = '✨ Tap the teddy bear to reveal a sweet surprise! ✨';
    status.style.color = '#ff69b4';
    launchFireworks();
    clickState = 1;

  } else if (clickState === 1) {
    // State 1 -> 2: Smooth 3D Claymorphic Heart Mesh
    clickState = 2;
    cakeBox.innerHTML = '<canvas id="heartCanvas"></canvas>';
    status.innerText = '💖 May your heart always be full of joy! 💖';
    status.style.color = '#ff1493';

    initSmooth3DHeart();

  } else if (clickState === 2) {
    // State 2 -> 0: Reset back to 3D Chocolate Cake
    stopLocal3DHeart();
    cakeBox.innerHTML = '<canvas id="cakeCanvas"></canvas>';
    status.innerText = 'Tap the chocolate cake to blow the candles!';
    status.style.color = '#00f0ff';
    clickState = 0;
    init3DChocolateCake();
  }
}

/* ============================================================
   HIGH-DETAIL 3D CHOCOLATE CAKE ENGINE
   ============================================================ */
let cakeRenderer = null, cakeScene = null, cakeCamera = null, cakeAnimationId = null;
let cakeGroup = null, flameFlames = [], flameLights = [];

function init3DChocolateCake() {
  const canvas = document.getElementById('cakeCanvas');
  if (!canvas) return;

  const box = document.getElementById('cake');
  const width = box.clientWidth;
  const height = box.clientHeight;

  cakeRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  cakeRenderer.setSize(width, height);
  cakeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

  cakeScene = new THREE.Scene();
  cakeCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  cakeCamera.position.set(0, 3.2, 8.5);
  cakeCamera.lookAt(0, 0, 0);

  // Studio Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  cakeScene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  mainLight.position.set(6, 10, 8);
  cakeScene.add(mainLight);

  const rimLight = new THREE.DirectionalLight(0xff007f, 0.4);
  rimLight.position.set(-6, -2, -5);
  cakeScene.add(rimLight);

  cakeGroup = new THREE.Group();

  // Materials
  const chocDarkMat = new THREE.MeshStandardMaterial({ color: 0x2b170c, roughness: 0.35, metalness: 0.1 });
  const chocFudgeMat = new THREE.MeshStandardMaterial({ color: 0x4a2912, roughness: 0.2, metalness: 0.05 });
  const chocGlazeMat = new THREE.MeshStandardMaterial({ color: 0x1f0f07, roughness: 0.12, metalness: 0.15 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfff5ea, roughness: 0.3 });
  const cherryMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.15, metalness: 0.2 });
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xf0f3f8, roughness: 0.2, metalness: 0.1 });

  // 1. Sleek Cake Plate
  const plateGeo = new THREE.CylinderGeometry(2.7, 2.1, 0.15, 64);
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.position.y = -1.4;
  cakeGroup.add(plateMesh);

  // 2. Bottom Chocolate Tier
  const tier1Geo = new THREE.CylinderGeometry(2.0, 2.0, 1.1, 64);
  const tier1 = new THREE.Mesh(tier1Geo, chocDarkMat);
  tier1.position.y = -0.75;
  cakeGroup.add(tier1);

  // Cream Filling Line Tier 1
  const cream1Geo = new THREE.CylinderGeometry(2.02, 2.02, 0.12, 64);
  const cream1 = new THREE.Mesh(cream1Geo, creamMat);
  cream1.position.y = -0.75;
  cakeGroup.add(cream1);

  // 3. Top Chocolate Tier
  const tier2Geo = new THREE.CylinderGeometry(1.35, 1.35, 0.95, 64);
  const tier2 = new THREE.Mesh(tier2Geo, chocFudgeMat);
  tier2.position.y = 0.25;
  cakeGroup.add(tier2);

  // Cream Filling Line Tier 2
  const cream2Geo = new THREE.CylinderGeometry(1.37, 1.37, 0.1, 64);
  const cream2 = new THREE.Mesh(cream2Geo, creamMat);
  cream2.position.y = 0.25;
  cakeGroup.add(cream2);

  // 4. Glossy Chocolate Drip Glaze Cap
  const glazeGeo = new THREE.CylinderGeometry(1.38, 1.4, 0.25, 64);
  const glaze = new THREE.Mesh(glazeGeo, chocGlazeMat);
  glaze.position.y = 0.65;
  cakeGroup.add(glaze);

  // 5. Decorative Cream Dollops & Cherries on Top
  const dollopCount = 7;
  for (let i = 0; i < dollopCount; i++) {
    const angle = (i / dollopCount) * Math.PI * 2;
    const radius = 1.0;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Cream dollop
    const dGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const dollop = new THREE.Mesh(dGeo, creamMat);
    dollop.scale.set(1, 0.75, 1);
    dollop.position.set(x, 0.82, z);
    cakeGroup.add(dollop);

    // Shiny Cherry on top of each dollop
    const cherryGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const cherry = new THREE.Mesh(cherryGeo, cherryMat);
    cherry.position.set(x, 0.96, z);
    cakeGroup.add(cherry);
  }

  // Colorful Sprinkles scattered on Top Tier
  const sprinkleColors = [0xff007f, 0x00f0ff, 0xffd700, 0x00ff87, 0xffffff];
  for (let i = 0; i < 40; i++) {
    const r = Math.random() * 1.1;
    const theta = Math.random() * Math.PI * 2;
    const sGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
    const sMat = new THREE.MeshStandardMaterial({
      color: sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)],
      roughness: 0.3
    });
    const sprinkle = new THREE.Mesh(sGeo, sMat);
    sprinkle.position.set(Math.cos(theta) * r, 0.79, Math.sin(theta) * r);
    sprinkle.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    cakeGroup.add(sprinkle);
  }

  // 6. 3D Candles & Animated Flames
  const candleColors = [0xff007f, 0x00f0ff, 0xffd700];
  const candlePositions = [
    { x: -0.45, z: 0.2 },
    { x: 0, z: -0.35 },
    { x: 0.45, z: 0.2 }
  ];

  flameFlames = [];
  flameLights = [];

  candlePositions.forEach((pos, idx) => {
    // Candle stick
    const cGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 16);
    const cMat = new THREE.MeshStandardMaterial({
      color: candleColors[idx % candleColors.length],
      roughness: 0.3
    });
    const candle = new THREE.Mesh(cGeo, cMat);
    candle.position.set(pos.x, 1.05, pos.z);
    cakeGroup.add(candle);

    // Candle Wick
    const wickGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(pos.x, 1.38, pos.z);
    cakeGroup.add(wick);

    // Animated Flame Cone
    const fGeo = new THREE.ConeGeometry(0.09, 0.28, 16);
    const fMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flame = new THREE.Mesh(fGeo, fMat);
    flame.position.set(pos.x, 1.55, pos.z);
    cakeGroup.add(flame);
    flameFlames.push(flame);

    // Flame Inner Core Glow
    const coreGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(pos.x, 1.48, pos.z);
    cakeGroup.add(core);

    // Dynamic Point Light for each Flame
    const pLight = new THREE.PointLight(0xffaa00, 1.2, 3);
    pLight.position.set(pos.x, 1.6, pos.z);
    cakeGroup.add(pLight);
    flameLights.push(pLight);
  });

  cakeScene.add(cakeGroup);
  render3DChocolateCake();
}

let cakeAnimTime = 0;

function render3DChocolateCake() {
  if (clickState !== 0) return;
  cakeAnimationId = requestAnimationFrame(render3DChocolateCake);

  cakeAnimTime += 0.02;

  // Gentle Cake Floating & 3D Rotation
  if (cakeGroup) {
    cakeGroup.rotation.y = Math.sin(cakeAnimTime * 0.7) * 0.35;
    cakeGroup.rotation.x = Math.cos(cakeAnimTime * 0.5) * 0.08 + 0.12;
    cakeGroup.position.y = Math.sin(cakeAnimTime * 1.4) * 0.1;
  }

  // Candle Flame Flickering Animation Logic
  flameFlames.forEach((flame, idx) => {
    const flicker = Math.sin(cakeAnimTime * 12 + idx * 2) * 0.12 + (Math.random() - 0.5) * 0.08;
    flame.scale.set(1 + flicker, 1 + flicker * 1.5, 1 + flicker);
    if (flameLights[idx]) {
      flameLights[idx].intensity = 1.2 + flicker * 2;
    }
  });

  cakeRenderer.render(cakeScene, cakeCamera);
}

function stop3DChocolateCake() {
  if (cakeAnimationId) cancelAnimationFrame(cakeAnimationId);
  if (cakeRenderer) {
    cakeRenderer.dispose();
    cakeRenderer = null;
  }
}

/* ============================================================
   HIGH-DPI SMOOTH 3D HEART ENGINE
   ============================================================ */
let localRenderer = null, localScene = null, localCamera = null, localAnimationId = null;
let localHeartMesh = null, localHeartGroup = null;

function initSmooth3DHeart() {
  const canvas = document.getElementById('heartCanvas');
  const box = document.getElementById('cake');
  const width = box.clientWidth;
  const height = box.clientHeight;

  localRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  localRenderer.setSize(width, height);
  localRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

  localScene = new THREE.Scene();
  localCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  localCamera.position.z = 8;

  // Studio Lighting for Smooth Soft Clay Surface
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  localScene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.1);
  mainLight.position.set(5, 8, 7);
  localScene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xffb6c1, 0.5);
  fillLight.position.set(-5, -5, -4);
  localScene.add(fillLight);

  // Create Smooth Extruded 3D Heart Shape Path
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.bezierCurveTo(0, 0.5, -0.5, 1.4, -1.2, 1.4);
  shape.bezierCurveTo(-2.2, 1.4, -2.2, 0.3, -2.2, 0.3);
  shape.bezierCurveTo(-2.2, -0.8, -1.2, -1.7, 0, -2.6);
  shape.bezierCurveTo(1.2, -1.7, 2.2, -0.8, 2.2, 0.3);
  shape.bezierCurveTo(2.2, 0.3, 2.2, 1.4, 1.2, 1.4);
  shape.bezierCurveTo(0.5, 1.4, 0, 0.5, 0, 0.5);

  const extrudeSettings = {
    depth: 0.7,
    bevelEnabled: true,
    bevelSegments: 16,
    steps: 2,
    bevelThickness: 0.45,
    bevelSize: 0.45
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();

  // Smooth Matte Pink Material
  const material = new THREE.MeshStandardMaterial({
    color: 0xec4886,
    roughness: 0.28,
    metalness: 0.08
  });

  localHeartMesh = new THREE.Mesh(geometry, material);
  localHeartGroup = new THREE.Group();
  localHeartGroup.add(localHeartMesh);

  // Initial scaling for spawn pop animation
  localHeartGroup.scale.set(0.01, 0.01, 0.01);
  localScene.add(localHeartGroup);

  launchFireworks();
  renderSmooth3DHeart();
}

let heartAnimTime = 0;

function renderSmooth3DHeart() {
  if (clickState !== 2) return;
  localAnimationId = requestAnimationFrame(renderSmooth3DHeart);

  heartAnimTime += 0.03;

  // Pop & Scale Entrance Logic
  if (localHeartGroup.scale.x < 0.95) {
    const currentScale = localHeartGroup.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, 1.0, 0.12);
    localHeartGroup.scale.set(newScale, newScale, newScale);
  } else {
    // Continuous Heartbeat & Floating Motion
    const pulse = 1 + Math.sin(heartAnimTime * 3) * 0.04;
    localHeartGroup.scale.set(pulse, pulse, pulse);
  }

  // 3D Soft Floating Tilt & Angle
  localHeartGroup.rotation.y = Math.sin(heartAnimTime * 0.8) * 0.2 + 0.35;
  localHeartGroup.rotation.x = Math.cos(heartAnimTime * 0.6) * 0.1 - 0.1;
  localHeartGroup.position.y = Math.sin(heartAnimTime * 1.5) * 0.12;

  localRenderer.render(localScene, localCamera);
}

function stopLocal3DHeart() {
  if (localAnimationId) cancelAnimationFrame(localAnimationId);
  if (localHeartMesh) {
    localHeartMesh.geometry.dispose();
    localHeartMesh.material.dispose();
  }
  if (localRenderer) {
    localRenderer.dispose();
    localRenderer = null;
  }
}

// Initialize 3D Chocolate Cake automatically on load
window.addEventListener('load', () => {
  init3DChocolateCake();
});

/* ============================================================
   THREE.JS BACKGROUND CELEBRATION ENGINE
   ============================================================ */
const isMobile = window.innerWidth < 768;
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const palette = [0xff007f, 0x00f0ff, 0x7f00ff, 0xffd700, 0x00ff87, 0xff69b4, 0xffffff];

/* --- 1. Confetti Rain --- */
const confettiGroup = new THREE.Group();
scene.add(confettiGroup);
const confettiList = [];
const confettiCount = isMobile ? 90 : 170;
const planeGeo = new THREE.PlaneGeometry(0.25, 0.4);
const circleGeo = new THREE.CircleGeometry(0.18, 10);

for (let i = 0; i < confettiCount; i++) {
  const isCircle = Math.random() > 0.6;
  const mat = new THREE.MeshStandardMaterial({
    color: palette[Math.floor(Math.random() * palette.length)],
    metalness: 0.8,
    roughness: 0.2,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(isCircle ? circleGeo : planeGeo, mat);
  mesh.position.set(
    (Math.random() - 0.5) * 32,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 16
  );

  mesh.userData = {
    fallSpeed: 0.04 + Math.random() * 0.05,
    rotSpeedX: (Math.random() - 0.5) * 0.08,
    rotSpeedY: (Math.random() - 0.5) * 0.08,
    rotSpeedZ: (Math.random() - 0.5) * 0.05,
    swaySpeed: 1 + Math.random() * 2,
    swayAmp: 0.015 + Math.random() * 0.02,
    phase: Math.random() * Math.PI * 2
  };

  confettiList.push(mesh);
  confettiGroup.add(mesh);
}

/* --- 2. Floating Gifts --- */
const giftGroup = new THREE.Group();
scene.add(giftGroup);

function createGiftBox(boxColor, ribbonColor) {
  const giftContainer = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const boxMat = new THREE.MeshStandardMaterial({ color: boxColor, metalness: 0.4, roughness: 0.2 });
  giftContainer.add(new THREE.Mesh(boxGeo, boxMat));

  const rib1Geo = new THREE.BoxGeometry(1.25, 0.25, 1.25);
  const ribMat = new THREE.MeshStandardMaterial({ color: ribbonColor, metalness: 0.9, roughness: 0.1 });
  giftContainer.add(new THREE.Mesh(rib1Geo, ribMat));

  const rib2 = new THREE.Mesh(rib1Geo, ribMat);
  rib2.rotation.z = Math.PI / 2;
  giftContainer.add(rib2);

  const bowGeo = new THREE.TorusGeometry(0.2, 0.08, 10, 16);
  const bow1 = new THREE.Mesh(bowGeo, ribMat);
  bow1.position.y = 0.7;
  bow1.rotation.x = Math.PI / 4;
  giftContainer.add(bow1);

  const bow2 = new THREE.Mesh(bowGeo, ribMat);
  bow2.position.y = 0.7;
  bow2.rotation.x = -Math.PI / 4;
  giftContainer.add(bow2);

  return giftContainer;
}

const giftList = [];
const giftColors = [
  { box: 0xff007f, rib: 0xffd700 },
  { box: 0x7f00ff, rib: 0x00f0ff },
  { box: 0x00f0ff, rib: 0xff69b4 },
  { box: 0xffd700, rib: 0xff007f }
];

giftColors.forEach((c, idx) => {
  const gift = createGiftBox(c.box, c.rib);
  const scale = isMobile ? 0.45 : 0.65;
  gift.scale.set(scale, scale, scale);

  const posX = (idx % 2 === 0 ? -1 : 1) * (isMobile ? 5 : 9);
  const posY = (Math.random() - 0.5) * 10;
  const posZ = (Math.random() - 0.5) * 4;
  gift.position.set(posX, posY, posZ);

  gift.userData = {
    floatSpeed: 0.8 + Math.random() * 0.5,
    rotSpeed: (Math.random() - 0.5) * 0.015,
    baseY: posY,
    phase: Math.random() * Math.PI * 2
  };

  giftList.push(gift);
  giftGroup.add(gift);
});

/* --- 3. Shimmering Starbursts --- */
const starCount = isMobile ? 120 : 250;
const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 40;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;

  const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
  starColors[i * 3] = c.r;
  starColors[i * 3 + 1] = c.g;
  starColors[i * 3 + 2] = c.b;
}

starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starSystem = new THREE.Points(starGeo, new THREE.PointsMaterial({
  size: 0.14,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
}));
scene.add(starSystem);

/* --- 4. Cursor Sparkle Trail --- */
const trailParticles = [];

function addSparkleTrail(clientX, clientY) {
  const vec = new THREE.Vector3(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
    0.5
  );
  vec.unproject(camera);
  const dir = vec.sub(camera.position).normalize();
  const distance = (0 - camera.position.z) / dir.z;
  const pos = camera.position.clone().add(dir.multiplyScalar(distance));

  for (let i = 0; i < 2; i++) {
    const pMat = new THREE.PointsMaterial({
      size: 0.15 + Math.random() * 0.15,
      color: palette[Math.floor(Math.random() * palette.length)],
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute([pos.x, pos.y, pos.z], 3));
    const particle = new THREE.Points(pGeo, pMat);

    particle.userData = {
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      vz: (Math.random() - 0.5) * 0.08,
      life: 1.0
    };

    scene.add(particle);
    trailParticles.push(particle);
  }
}

window.addEventListener('mousemove', (e) => addSparkleTrail(e.clientX, e.clientY));
window.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) addSparkleTrail(e.touches[0].clientX, e.touches[0].clientY);
});

/* --- Lighting Setup --- */
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const bgMainLight = new THREE.PointLight(0xffd700, 3, 50);
bgMainLight.position.set(10, 15, 10);
scene.add(bgMainLight);

camera.position.z = 15;

/* --- 5. 3D Fireworks System --- */
const activeFireworks = [];

function createFireworkExplosion(x, y, z) {
  const particleCount = isMobile ? 70 : 130;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  const particleColors = new Float32Array(particleCount * 3);

  const baseColor = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const speed = Math.random() * 0.22 + 0.08;

    velocities.push(new THREE.Vector3(
      speed * Math.sin(phi) * Math.cos(theta),
      speed * Math.sin(phi) * Math.sin(theta),
      speed * Math.cos(phi)
    ));

    const c = baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.1, 0, 0);
    particleColors[i * 3] = c.r;
    particleColors[i * 3 + 1] = c.g;
    particleColors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const pSystem = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending
  }));
  scene.add(pSystem);

  activeFireworks.push({ system: pSystem, velocities: velocities, life: 1.0 });
}

function launchFireworks() {
  const burstCount = isMobile ? 5 : 8;
  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => {
      const x = (Math.random() - 0.5) * (isMobile ? 8 : 14);
      const y = (Math.random() - 0.5) * 8 + 1;
      const z = (Math.random() - 0.5) * 6;
      createFireworkExplosion(x, y, z);
    }, i * 220);
  }
}

/* --- Main Render Loop --- */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // Confetti physics
  confettiList.forEach((c) => {
    const u = c.userData;
    c.position.y -= u.fallSpeed;
    c.position.x += Math.sin(elapsed * u.swaySpeed + u.phase) * u.swayAmp;
    c.rotation.x += u.rotSpeedX;
    c.rotation.y += u.rotSpeedY;
    c.rotation.z += u.rotSpeedZ;
    if (c.position.y < -20) {
      c.position.y = 20;
      c.position.x = (Math.random() - 0.5) * 32;
    }
  });

  // Gifts floating
  giftList.forEach((g) => {
    const u = g.userData;
    g.position.y = u.baseY + Math.sin(elapsed * u.floatSpeed + u.phase) * 0.7;
    g.rotation.y += u.rotSpeed;
  });

  starSystem.rotation.y = elapsed * 0.03;

  // Sparkle trails
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const p = trailParticles[i];
    p.userData.life -= 0.035;
    p.material.opacity = Math.max(0, p.userData.life);
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;

    if (p.userData.life <= 0) {
      scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      trailParticles.splice(i, 1);
    }
  }

  // Fireworks
  for (let i = activeFireworks.length - 1; i >= 0; i--) {
    const fw = activeFireworks[i];
    fw.life -= 0.014;
    fw.system.material.opacity = Math.max(0, fw.life);

    const positions = fw.system.geometry.attributes.position.array;
    for (let j = 0; j < fw.velocities.length; j++) {
      const v = fw.velocities[j];
      v.y -= 0.0025;
      v.multiplyScalar(0.975);
      positions[j * 3] += v.x;
      positions[j * 3 + 1] += v.y;
      positions[j * 3 + 2] += v.z;
    }
    fw.system.geometry.attributes.position.needsUpdate = true;

    if (fw.life <= 0) {
      scene.remove(fw.system);
      fw.system.geometry.dispose();
      fw.system.material.dispose();
      activeFireworks.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Keep the cake / heart canvases sharp when the layout reflows.
  const box = document.getElementById('cake');
  if (!box) return;
  const w = box.clientWidth;
  const h = box.clientHeight;
  if (w === 0 || h === 0) return;

  if (cakeRenderer && cakeCamera) {
    cakeCamera.aspect = w / h;
    cakeCamera.updateProjectionMatrix();
    cakeRenderer.setSize(w, h);
  }
  if (localRenderer && localCamera) {
    localCamera.aspect = w / h;
    localCamera.updateProjectionMatrix();
    localRenderer.setSize(w, h);
  }
});
