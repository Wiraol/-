/* ===== ЭЛЕМЕНТЫ ===== */
const pullScreen = document.getElementById('pull-screen');
const pullHint = document.getElementById('pull-hint');
let triggered = false;

/* ===== КАНВАСЫ ===== */
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
const canvas = document.getElementById('fx-canvas');
const ctx = canvas.getContext('2d');
const ropeCanvas = document.getElementById('rope-canvas');
const ropeCtx = ropeCanvas.getContext('2d');

const colors = ['#C98A2E', '#D65C74', '#3E938C', '#DD8354', '#E8B85C'];

function resizeCanvases() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ropeCanvas.width = window.innerWidth;
  ropeCanvas.height = window.innerHeight;
  layoutRopePoints();
}

/* ===== ФИЗИКА ВЕРЁВКИ ===== */
const NUM_POINTS = 15;
const SEGMENT_LENGTH = 15;
const ANCHOR_Y = 0;
const GRAVITY = 0;
const SPRING_K = 0.08;
const COHESION_K = 0.4;
const DAMPING = 0.85;
const MOUSE_RADIUS = 70;
const MOUSE_STRENGTH = 0.5;
const HANDLE_RADIUS = 45;
const TRIGGER_THRESHOLD = 360;

let ropePoints = [];
let mouseX = window.innerWidth / 2;
let mouseY = 0;
let mouseActive = false;
let isDraggingHandle = false;

function createRopePoints() {
  ropePoints = [];
  const anchorX = ropeCanvas.width / 2;
  for (let i = 0; i < NUM_POINTS; i++) {
    ropePoints.push({
      x: anchorX,
      y: ANCHOR_Y + i * SEGMENT_LENGTH,
      vx: 0,
      vy: 0,
      restX: anchorX,
      restY: ANCHOR_Y + i * SEGMENT_LENGTH
    });
  }
}

function layoutRopePoints() {
  if (!ropePoints.length) return;
  const anchorX = ropeCanvas.width / 2;
  ropePoints.forEach((p, i) => {
    p.restX = anchorX;
    p.restY = ANCHOR_Y + i * SEGMENT_LENGTH;
  });
}

function updateMousePos(e) {
  const t = e.touches ? e.touches[0] : e;
  mouseX = t.clientX;
  mouseY = t.clientY;
  mouseActive = true;
}
window.addEventListener('mousemove', updateMousePos);
window.addEventListener('touchmove', updateMousePos, { passive: true });

function checkGrab(e) {
  if (triggered || !ropePoints.length) return;
  const t = e.touches ? e.touches[0] : e;
  const last = ropePoints[ropePoints.length - 1];
  const dx = t.clientX - last.x;
  const dy = t.clientY - last.y;
  if (Math.sqrt(dx * dx + dy * dy) < HANDLE_RADIUS + 25) {
    isDraggingHandle = true;
  }
}
window.addEventListener('mousedown', checkGrab);
window.addEventListener('touchstart', checkGrab, { passive: true });
window.addEventListener('mouseup', () => { isDraggingHandle = false; });
window.addEventListener('touchend', () => { isDraggingHandle = false; });

let idleClock = 0;

function updateRope() {
  ropePoints[0].x = ropePoints[0].restX;
  ropePoints[0].y = ANCHOR_Y;
  idleClock += 0.02;

  for (let i = 1; i < ropePoints.length; i++) {
    const p = ropePoints[i];
    const isHandle = i === ropePoints.length - 1;

    if (isHandle && isDraggingHandle) {
      p.x = mouseX;
      p.y = mouseY;
      p.vx = 0;
      p.vy = 0;
    } else {
      const idleSway = !mouseActive && !isDraggingHandle
        ? Math.sin(idleClock + i * 0.4) * (i / ropePoints.length) * 3.5
        : 0;
      let fx = (p.restX + idleSway - p.x) * SPRING_K;
      let fy = (p.restY - p.y) * SPRING_K;

      const prev = ropePoints[i - 1];
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const diff = (dist - SEGMENT_LENGTH) / dist;
      fx -= dx * diff * COHESION_K;
      fy -= dy * diff * COHESION_K;

      if (mouseActive) {
        const mdx = mouseX - p.x;
        const mdy = mouseY - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 0.001;
        if (mdist < MOUSE_RADIUS) {
          const force = (1 - mdist / MOUSE_RADIUS) * MOUSE_STRENGTH;
          fx += (mdx / mdist) * force;
          fy += (mdy / mdist) * force;
        }
      }

      p.vx = (p.vx + fx) * DAMPING;
      p.vy = (p.vy + fy) * DAMPING;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  const handle = ropePoints[ropePoints.length - 1];
  if (!triggered && handle.y > TRIGGER_THRESHOLD) {
    triggerEffect();
  }
}

let ropeSparks = [];

function spawnRopeSpark() {
  if (!isDraggingHandle || !ropePoints.length) return;
  const handle = ropePoints[ropePoints.length - 1];
  const pullAmount = Math.min(handle.y / TRIGGER_THRESHOLD, 1);
  if (Math.random() < 0.25 + pullAmount * 0.5) {
    ropeSparks.push({
      x: handle.x + (Math.random() - 0.5) * HANDLE_RADIUS,
      y: handle.y + (Math.random() - 0.5) * HANDLE_RADIUS,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -Math.random() * 1.5 - 0.3,
      size: Math.random() * 2.5 + 1,
      alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function drawRopeSparks() {
  spawnRopeSpark();
  ropeSparks.forEach((s, i) => {
    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= 0.02;
    ropeCtx.globalAlpha = Math.max(s.alpha, 0);
    ropeCtx.fillStyle = s.color;
    ropeCtx.shadowColor = s.color;
    ropeCtx.shadowBlur = 8;
    ropeCtx.beginPath();
    ropeCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ropeCtx.fill();
    ropeCtx.shadowBlur = 0;
    if (s.alpha <= 0) ropeSparks.splice(i, 1);
  });
  ropeCtx.globalAlpha = 1;
}

function drawRope() {
  ropeCtx.clearRect(0, 0, ropeCanvas.width, ropeCanvas.height);

  ropeCtx.beginPath();
  ropeCtx.moveTo(ropePoints[0].x, ropePoints[0].y);
  for (let i = 1; i < ropePoints.length - 1; i++) {
    const xc = (ropePoints[i].x + ropePoints[i + 1].x) / 2;
    const yc = (ropePoints[i].y + ropePoints[i + 1].y) / 2;
    ropeCtx.quadraticCurveTo(ropePoints[i].x, ropePoints[i].y, xc, yc);
  }
  const last = ropePoints[ropePoints.length - 1];
  ropeCtx.lineTo(last.x, last.y);
  ropeCtx.strokeStyle = '#C98A2E';
  ropeCtx.lineWidth = 4;
  ropeCtx.shadowColor = '#E8B85C';
  ropeCtx.shadowBlur = 12;
  ropeCtx.stroke();
  ropeCtx.shadowBlur = 0;

  const grad = ropeCtx.createRadialGradient(last.x - 15, last.y - 15, 5, last.x, last.y, HANDLE_RADIUS);
  grad.addColorStop(0, '#FFE9BA');
  grad.addColorStop(1, '#C98A2E');
  ropeCtx.beginPath();
  ropeCtx.fillStyle = grad;
  ropeCtx.shadowColor = '#E8B85C';
  ropeCtx.shadowBlur = 25;
  ropeCtx.arc(last.x, last.y, HANDLE_RADIUS, 0, Math.PI * 2);
  ropeCtx.fill();
  ropeCtx.shadowBlur = 0;

  drawRopeSparks();
}

function ropeLoop() {
  if (triggered) return;
  updateRope();
  drawRope();
  requestAnimationFrame(ropeLoop);
}

/* ===== ЗАПУСК ЭФФЕКТОВ ===== */
function triggerEffect() {
  if (triggered) return;
  triggered = true;
  pullHint.style.display = 'none';

  const fireworksSound = document.getElementById('sound-fireworks');
  const hornSound = document.getElementById('sound-horn');
  fireworksSound.currentTime = 0;
  hornSound.currentTime = 0;
  fireworksSound.play().catch(() => {});
  hornSound.play().catch(() => {});

  startFireworks();
  startConfettiSerpentine();

  setTimeout(() => {
    pullScreen.style.opacity = '0';
    setTimeout(() => {
      pullScreen.style.display = 'none';
    }, 800);
  }, 900);

  setTimeout(() => {
    document.getElementById('birthday-title').classList.add('show');
  }, 1800);

  setTimeout(() => {
    document.getElementById('wish-button-wrap').classList.add('show');
  }, 1800 + 5500);
}

/* ===== ФОНОВЫЕ СФЕРЫ (боке) ===== */
let glowOrbs = [];
const ORB_COUNT = 6;

function createGlowOrbs() {
  glowOrbs = [];
  for (let i = 0; i < ORB_COUNT; i++) {
    glowOrbs.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      radius: Math.random() * 120 + 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.15 + 0.1
    });
  }
}

/* ===== МЕРЦАЮЩИЕ ЗВЁЗДЫ ===== */
let ambientParticles = [];
const AMBIENT_COUNT = 60;

function createAmbientParticles() {
  ambientParticles = [];
  for (let i = 0; i < AMBIENT_COUNT; i++) {
    ambientParticles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      size: Math.random() * 1.8 + 0.8,
      baseAlpha: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.3 - 0.15,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

/* ===== ПАДАЮЩИЕ ЗВЁЗДЫ ===== */
let shootingStars = [];

function maybeSpawnShootingStar() {
  if (Math.random() < 0.006) {
    shootingStars.push({
      x: Math.random() * bgCanvas.width * 0.6,
      y: Math.random() * bgCanvas.height * 0.3,
      vx: Math.random() * 6 + 8,
      vy: Math.random() * 3 + 3,
      life: 1
    });
  }
}

function animateBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  glowOrbs.forEach(orb => {
    orb.x += orb.vx;
    orb.y += orb.vy;
    if (orb.x < -orb.radius) orb.x = bgCanvas.width + orb.radius;
    if (orb.x > bgCanvas.width + orb.radius) orb.x = -orb.radius;
    if (orb.y < -orb.radius) orb.y = bgCanvas.height + orb.radius;
    if (orb.y > bgCanvas.height + orb.radius) orb.y = -orb.radius;

    const gradient = bgCtx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
    gradient.addColorStop(0, orb.color);
    gradient.addColorStop(1, 'transparent');

    bgCtx.globalAlpha = orb.alpha;
    bgCtx.fillStyle = gradient;
    bgCtx.beginPath();
    bgCtx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    bgCtx.fill();
  });
  bgCtx.globalAlpha = 1;

  ambientParticles.forEach(p => {
    p.twinklePhase += p.twinkleSpeed;
    p.x += p.drift;
    if (p.x < -10) p.x = bgCanvas.width + 10;
    if (p.x > bgCanvas.width + 10) p.x = -10;

    const twinkle = (Math.sin(p.twinklePhase) + 1) / 2;
    const alpha = p.baseAlpha * (0.4 + twinkle * 0.6);
    const size = p.size * (0.8 + twinkle * 0.5);

    bgCtx.globalAlpha = alpha;
    bgCtx.fillStyle = p.color;
    bgCtx.shadowColor = p.color;
    bgCtx.shadowBlur = 8 + twinkle * 6;
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.shadowBlur = 0;
  });
  bgCtx.globalAlpha = 1;

  maybeSpawnShootingStar();
  shootingStars.forEach((s, index) => {
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.02;

    bgCtx.save();
    bgCtx.globalAlpha = Math.max(s.life, 0);
    bgCtx.strokeStyle = '#FFF6E5';
    bgCtx.shadowColor = '#FFF6E5';
    bgCtx.shadowBlur = 12;
    bgCtx.lineWidth = 2;
    bgCtx.beginPath();
    bgCtx.moveTo(s.x, s.y);
    bgCtx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
    bgCtx.stroke();
    bgCtx.restore();

    if (s.life <= 0 || s.x > bgCanvas.width + 50) shootingStars.splice(index, 1);
  });

  requestAnimationFrame(animateBg);
}

/* ===== САЛЮТЫ ===== */
let fireworkParticles = [];

let fireworkFlashes = [];

function createFirework(x, y, scale = 1) {
  const burstColor = colors[Math.floor(Math.random() * colors.length)];
  const count = Math.floor(38 * scale);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
    const speed = (Math.random() * 5 + 3) * scale;
    fireworkParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color: Math.random() < 0.65 ? burstColor : colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 3 + 2.5,
      glow: Math.random() * 15 + 10,
      trail: []
    });
  }
  fireworkFlashes.push({ x, y, radius: 4, alpha: 0.9, color: burstColor });
}

function startFireworks() {
  createFirework(canvas.width * 0.3, canvas.height * 0.35, 1);
  setTimeout(() => createFirework(canvas.width * 0.7, canvas.height * 0.3, 1.1), 450);
  setTimeout(() => createFirework(canvas.width * 0.5, canvas.height * 0.22, 1.3), 900);
  setTimeout(() => createFirework(canvas.width * 0.18, canvas.height * 0.45, 0.8), 1350);
  setTimeout(() => createFirework(canvas.width * 0.82, canvas.height * 0.42, 0.8), 1650);
}

/* ===== КОНФЕТТИ ===== */
let confettiParticles = [];

function createConfettiBatch() {
  for (let i = 0; i < 28; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: -20,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 360,
      spin: Math.random() * 0.2 - 0.1,
      isStrip: Math.random() > 0.5,
      length: Math.random() * 20 + 10,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.01,
      swayAmount: Math.random() * 1.2 + 0.4
    });
  }
}

function startConfettiSerpentine() {
  createConfettiBatch();
  setTimeout(createConfettiBatch, 600);
  setTimeout(createConfettiBatch, 1300);
  setTimeout(createConfettiBatch, 2200);
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  fireworkFlashes.forEach((f, index) => {
    f.radius += 5.5;
    f.alpha -= 0.06;
    ctx.globalAlpha = Math.max(f.alpha, 0);
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
    grad.addColorStop(0, f.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
    if (f.alpha <= 0) fireworkFlashes.splice(index, 1);
  });
  ctx.globalAlpha = 1;

  fireworkParticles.forEach((p, index) => {
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 4) p.trail.shift();

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.985;
    p.vy += 0.03;
    p.alpha -= 0.014;

    if (p.trail.length > 1) {
      ctx.globalAlpha = Math.max(p.alpha, 0) * 0.35;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let t = 1; t < p.trail.length; t++) ctx.lineTo(p.trail[t].x, p.trail[t].y);
      ctx.stroke();
    }

    ctx.globalAlpha = Math.max(p.alpha, 0);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (p.alpha <= 0) fireworkParticles.splice(index, 1);
  });
  ctx.globalAlpha = 1;

  confettiParticles.forEach((p, index) => {
    p.swayPhase += p.swaySpeed;
    p.y += p.speed;
    p.x += Math.sin(p.swayPhase) * p.swayAmount;
    p.angle += p.spin;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 4;
    if (p.isStrip) {
      ctx.fillRect(-2, -p.length / 2, 4, p.length);
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    }
    ctx.restore();

    if (p.y > canvas.height + 20) confettiParticles.splice(index, 1);
  });
  ctx.shadowBlur = 0;

  requestAnimationFrame(animate);
}

/* ===== ИНИЦИАЛИЗАЦИЯ ===== */
resizeCanvases();
createRopePoints();
layoutRopePoints();
createAmbientParticles();
createGlowOrbs();

window.addEventListener('resize', () => {
  resizeCanvases();
  createAmbientParticles();
  createGlowOrbs();
});

ropeLoop();
animateBg();
animate();