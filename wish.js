/* ===== КНОПКА "ПЕРЕЙТИ К ПОЖЕЛАНИЮ" ===== */
const wishBtn = document.getElementById('wish-btn');
const wishButtonWrap = document.getElementById('wish-button-wrap');
const wishScreen = document.getElementById('wish-screen');
const wishFinal = document.getElementById('wish-final');
const transitionFlash = document.getElementById('transition-flash');

wishBtn.addEventListener('click', () => {
  wishButtonWrap.classList.add('hide');
  transitionFlash.classList.add('active');
  startBgMusic();

  setTimeout(() => {
    document.getElementById('birthday-title').classList.remove('show');
    wishScreen.classList.add('active');
    wishScreen.scrollTop = 0;

    const firstBlock = document.querySelector('.wish-block');
    if (firstBlock) firstBlock.classList.add('visible');
  }, 500);

  setTimeout(() => {
    transitionFlash.classList.remove('active');
  }, 900);
});

/* ===== ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ ===== */
const wishBlocks = document.querySelectorAll('.wish-block');

const wishObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      if (wishFinal && entry.target.contains(wishFinal)) {
        wishFinal.classList.add('visible');
      }
    }
  });
}, {
  root: document.getElementById('wish-screen'),
  threshold: 0.35
});

wishBlocks.forEach(block => wishObserver.observe(block));

/* ===== "ЗАКАТ" ФОНА ПО МЕРЕ ЧТЕНИЯ ДНЕВНИКА ===== */
const duskStops = [
  { at: 0,    color: [248, 241, 225] },
  { at: 0.5,  color: [242, 225, 190] },
  { at: 1,    color: [234, 201, 152] }
];
let duskFraction = 0;

function lerp(a, b, t) { return a + (b - a) * t; }

function applyDuskGradient() {
  const max = wishScreen.scrollHeight - wishScreen.clientHeight;
  duskFraction = max > 0 ? Math.min(Math.max(wishScreen.scrollTop / max, 0), 1) : 0;

  let lower = duskStops[0], upper = duskStops[duskStops.length - 1];
  for (let i = 0; i < duskStops.length - 1; i++) {
    if (duskFraction >= duskStops[i].at && duskFraction <= duskStops[i + 1].at) {
      lower = duskStops[i];
      upper = duskStops[i + 1];
      break;
    }
  }
  const span = upper.at - lower.at || 1;
  const t = (duskFraction - lower.at) / span;
  const r = Math.round(lerp(lower.color[0], upper.color[0], t));
  const g = Math.round(lerp(lower.color[1], upper.color[1], t));
  const b = Math.round(lerp(lower.color[2], upper.color[2], t));
  wishScreen.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

wishScreen.addEventListener('scroll', () => {
  requestAnimationFrame(applyDuskGradient);
}, { passive: true });

/* ===== ПАРАЛЛАКС ФОТО ПРИ СКРОЛЛЕ ===== */
const wishPhotos = document.querySelectorAll('.wish-photo img');

function updateParallax() {
  const viewportCenter = window.innerHeight / 2;
  wishPhotos.forEach(img => {
    const rect = img.getBoundingClientRect();
    const distance = (rect.top + rect.height / 2) - viewportCenter;
    const offset = Math.max(Math.min(distance * -0.06, 40), -40);
    img.style.setProperty('--parallax-y', `${offset}px`);
    img.style.transform = `translateY(${offset}px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))`;
  });
}

wishScreen.addEventListener('scroll', () => {
  requestAnimationFrame(updateParallax);
}, { passive: true });

/* ===== 3D-НАКЛОН ФОТО ЗА КУРСОРОМ ===== */
wishPhotos.forEach(img => {
  img.parentElement.addEventListener('mousemove', (e) => {
    const rect = img.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    img.style.setProperty('--tilt-x', `${py * -8}deg`);
    img.style.setProperty('--tilt-y', `${px * 8}deg`);
    updateParallax();
  });
  img.parentElement.addEventListener('mouseleave', () => {
    img.style.setProperty('--tilt-x', '0deg');
    img.style.setProperty('--tilt-y', '0deg');
    updateParallax();
  });
});
/* ===== ЧАСТИЦЫ НА ЭКРАНЕ ПОЖЕЛАНИЯ ===== */
const wishParticlesCanvas = document.createElement('canvas');
wishParticlesCanvas.id = 'wish-particles-canvas';
wishScreen.prepend(wishParticlesCanvas);
const wishParticlesCtx = wishParticlesCanvas.getContext('2d');

const wishParticleColors = ['#C98A2E', '#D65C74', '#3E938C', '#FFF6E5', '#DD8354'];
let wishParticles = [];

function resizeWishParticlesCanvas() {
  wishParticlesCanvas.width = window.innerWidth;
  wishParticlesCanvas.height = window.innerHeight;
}

function createWishParticles() {
  wishParticles = [];
  const count = Math.floor((wishParticlesCanvas.width * wishParticlesCanvas.height) / 18000);
  for (let i = 0; i < count; i++) {
    wishParticles.push({
      x: Math.random() * wishParticlesCanvas.width,
      y: Math.random() * wishParticlesCanvas.height,
      size: Math.random() * 2 + 0.8,
      baseAlpha: Math.random() * 0.5 + 0.25,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.008,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: (Math.random() - 0.5) * 0.15,
      color: wishParticleColors[Math.floor(Math.random() * wishParticleColors.length)]
    });
  }
}

function animateWishParticles() {
  wishParticlesCtx.clearRect(0, 0, wishParticlesCanvas.width, wishParticlesCanvas.height);

  wishParticles.forEach(p => {
    p.twinklePhase += p.twinkleSpeed;
    p.x += p.driftX;
    p.y += p.driftY;

    if (p.x < 0) p.x = wishParticlesCanvas.width;
    if (p.x > wishParticlesCanvas.width) p.x = 0;
    if (p.y < 0) p.y = wishParticlesCanvas.height;
    if (p.y > wishParticlesCanvas.height) p.y = 0;

    const twinkle = (Math.sin(p.twinklePhase) + 1) / 2;
    const duskBoost = 0.55 + duskFraction * 0.75;
    const alpha = p.baseAlpha * (0.4 + twinkle * 0.6) * duskBoost;
    const size = p.size * (0.8 + twinkle * 0.5) * (0.85 + duskFraction * 0.35);

    wishParticlesCtx.globalAlpha = alpha;
    wishParticlesCtx.fillStyle = p.color;
    wishParticlesCtx.shadowColor = p.color;
    wishParticlesCtx.shadowBlur = (6 + twinkle * 5) * (0.8 + duskFraction * 0.6);
    wishParticlesCtx.beginPath();
    wishParticlesCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
    wishParticlesCtx.fill();
    wishParticlesCtx.shadowBlur = 0;
  });
  wishParticlesCtx.globalAlpha = 1;

  requestAnimationFrame(animateWishParticles);
}

function initWishParticles() {
  resizeWishParticlesCanvas();
  createWishParticles();
}

window.addEventListener('resize', () => {
  if (wishScreen.classList.contains('active')) initWishParticles();
});

wishBtn.addEventListener('click', () => {
  setTimeout(initWishParticles, 550);
});

animateWishParticles();

/* ===== ВЗРЫВ СЕРДЕЧКА ===== */
const heartBtn = document.getElementById('heart-btn');
const heartCanvas = document.getElementById('heart-canvas');
const heartCtx = heartCanvas.getContext('2d');
heartCanvas.width = window.innerWidth;
heartCanvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  heartCanvas.width = window.innerWidth;
  heartCanvas.height = window.innerHeight;
});

let heartParticles = [];
let finaleBursts = [];
let finaleFlashes = [];
let finaleConfetti = [];
const finaleColors = ['#C98A2E', '#D65C74', '#3E938C', '#DD8354', '#E8B85C'];

function spawnFinaleBurst(x, y, scale = 1) {
  const burstColor = finaleColors[Math.floor(Math.random() * finaleColors.length)];
  const count = Math.floor(36 * scale);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2;
    const speed = (Math.random() * 5 + 3) * scale;
    finaleBursts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color: Math.random() < 0.65 ? burstColor : finaleColors[Math.floor(Math.random() * finaleColors.length)],
      size: Math.random() * 3 + 2.2,
      glow: Math.random() * 14 + 8,
      trail: []
    });
  }
  finaleFlashes.push({ x, y, radius: 4, alpha: 0.9, color: burstColor });
}

function spawnFinaleConfetti() {
  for (let i = 0; i < 26; i++) {
    finaleConfetti.push({
      x: Math.random() * heartCanvas.width,
      y: -20,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 3 + 2,
      color: finaleColors[Math.floor(Math.random() * finaleColors.length)],
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

function drawFinaleLayer() {
  finaleFlashes.forEach((f, index) => {
    f.radius += 5.5;
    f.alpha -= 0.05;
    heartCtx.globalAlpha = Math.max(f.alpha, 0);
    const grad = heartCtx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
    grad.addColorStop(0, f.color);
    grad.addColorStop(1, 'transparent');
    heartCtx.fillStyle = grad;
    heartCtx.beginPath();
    heartCtx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    heartCtx.fill();
    if (f.alpha <= 0) finaleFlashes.splice(index, 1);
  });
  heartCtx.globalAlpha = 1;

  finaleBursts.forEach((p, index) => {
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 4) p.trail.shift();
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.985;
    p.vy += 0.03;
    p.alpha -= 0.013;

    if (p.trail.length > 1) {
      heartCtx.globalAlpha = Math.max(p.alpha, 0) * 0.35;
      heartCtx.strokeStyle = p.color;
      heartCtx.lineWidth = p.size * 0.6;
      heartCtx.beginPath();
      heartCtx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let t = 1; t < p.trail.length; t++) heartCtx.lineTo(p.trail[t].x, p.trail[t].y);
      heartCtx.stroke();
    }

    heartCtx.globalAlpha = Math.max(p.alpha, 0);
    heartCtx.fillStyle = p.color;
    heartCtx.shadowColor = p.color;
    heartCtx.shadowBlur = p.glow;
    heartCtx.beginPath();
    heartCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    heartCtx.fill();
    heartCtx.shadowBlur = 0;
    if (p.alpha <= 0) finaleBursts.splice(index, 1);
  });
  heartCtx.globalAlpha = 1;

  finaleConfetti.forEach((p, index) => {
    p.swayPhase += p.swaySpeed;
    p.y += p.speed;
    p.x += Math.sin(p.swayPhase) * p.swayAmount;
    p.angle += p.spin;
    heartCtx.save();
    heartCtx.translate(p.x, p.y);
    heartCtx.rotate(p.angle);
    heartCtx.fillStyle = p.color;
    heartCtx.shadowColor = p.color;
    heartCtx.shadowBlur = 4;
    if (p.isStrip) {
      heartCtx.fillRect(-2, -p.length / 2, 4, p.length);
    } else {
      heartCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    }
    heartCtx.restore();
    if (p.y > heartCanvas.height + 20) finaleConfetti.splice(index, 1);
  });
  heartCtx.shadowBlur = 0;
}

function drawHeartShape(cx, size) {
  heartCtx.beginPath();
  heartCtx.moveTo(0, size * 0.3);
  heartCtx.bezierCurveTo(0, 0, -size, 0, -size, size * 0.3);
  heartCtx.bezierCurveTo(-size, size * 0.7, 0, size * 0.9, 0, size * 1.2);
  heartCtx.bezierCurveTo(0, size * 0.9, size, size * 0.7, size, size * 0.3);
  heartCtx.bezierCurveTo(size, 0, 0, 0, 0, size * 0.3);
  heartCtx.closePath();
}

let heartRings = [];
let heartSparks = [];

function triggerHeartBurst() {
  const rect = heartBtn.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  heartBtn.style.transform = 'scale(1.4) rotate(-10deg)';
  setTimeout(() => { heartBtn.style.transform = ''; }, 220);

  /* скачивание секретного видео */
  const secretLink = document.getElementById('secret-download');
  if (secretLink) secretLink.click();

  heartRings.push({ x: originX, y: originY, radius: 5, alpha: 0.8 });

  for (let i = 0; i < 44; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 3;
    heartParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 6 + 4,
      alpha: 1,
      color: ['#C98A2E', '#D65C74', '#3E938C'][Math.floor(Math.random() * 3)]
    });
  }

  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    heartSparks.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2 + 1,
      alpha: 1,
      color: '#FFF6E5'
    });
  }
}

heartBtn.addEventListener('click', triggerHeartBurst);
heartBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    triggerHeartBurst();
  }
});

function animateHearts() {
  heartCtx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);

  drawFinaleLayer();

  heartRings.forEach((r, index) => {
    r.radius += 4;
    r.alpha -= 0.03;
    heartCtx.save();
    heartCtx.globalAlpha = Math.max(r.alpha, 0);
    heartCtx.strokeStyle = '#E8B85C';
    heartCtx.lineWidth = 2;
    heartCtx.shadowColor = '#E8B85C';
    heartCtx.shadowBlur = 12;
    heartCtx.beginPath();
    heartCtx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    heartCtx.stroke();
    heartCtx.restore();
    if (r.alpha <= 0) heartRings.splice(index, 1);
  });

  heartSparks.forEach((s, index) => {
    s.x += s.vx;
    s.y += s.vy;
    s.alpha -= 0.02;
    heartCtx.globalAlpha = Math.max(s.alpha, 0);
    heartCtx.fillStyle = s.color;
    heartCtx.shadowColor = s.color;
    heartCtx.shadowBlur = 6;
    heartCtx.beginPath();
    heartCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    heartCtx.fill();
    heartCtx.shadowBlur = 0;
    if (s.alpha <= 0) heartSparks.splice(index, 1);
  });
  heartCtx.globalAlpha = 1;

  heartParticles.forEach((p, index) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.alpha -= 0.012;

    heartCtx.save();
    heartCtx.globalAlpha = Math.max(p.alpha, 0);
    heartCtx.translate(p.x, p.y);
    heartCtx.fillStyle = p.color;
    heartCtx.shadowColor = p.color;
    heartCtx.shadowBlur = 10;
    drawHeartShape(0, p.size);
    heartCtx.fill();
    heartCtx.restore();

    if (p.alpha <= 0) heartParticles.splice(index, 1);
  });

  requestAnimationFrame(animateHearts);
}
animateHearts();

/* ===== СВЕЧА "ЗАГАДАЙ ЖЕЛАНИЕ" — КУЛЬМИНАЦИЯ ===== */
const wishCandle = document.getElementById('wish-candle');
let candleBusy = false;

function spawnSmoke(originX, originY) {
  for (let i = 0; i < 6; i++) {
    const puff = document.createElement('span');
    puff.className = 'smoke-puff';
    puff.style.left = `${originX - 4}px`;
    puff.style.top = `${originY}px`;
    puff.style.setProperty('--smoke-x', `${(Math.random() - 0.5) * 40}px`);
    puff.style.animationDelay = `${i * 0.08}s`;
    document.body.appendChild(puff);
    puff.addEventListener('animationend', () => puff.remove());
  }
}

function triggerGrandFinale() {
  transitionFlash.classList.add('active');
  setTimeout(() => transitionFlash.classList.remove('active'), 900);

  const w = window.innerWidth;
  const h = window.innerHeight;
  const points = [
    [0.2, 0.28], [0.5, 0.18], [0.8, 0.28],
    [0.32, 0.45], [0.68, 0.45], [0.5, 0.58]
  ];
  points.forEach((pt, i) => {
    setTimeout(() => spawnFinaleBurst(w * pt[0], h * pt[1], 0.9 + Math.random() * 0.5), i * 260);
  });

  spawnFinaleConfetti();
  [400, 900, 1500, 2200, 3000].forEach(delay => setTimeout(spawnFinaleConfetti, delay));
}

const wishCandleHint = document.getElementById('wish-candle-hint');

function blowCandle() {
  if (candleBusy) return;
  candleBusy = true;

  const rect = wishCandle.getBoundingClientRect();
  spawnSmoke(rect.left + rect.width / 2, rect.top - 26);
  wishCandle.classList.add('blown');
  if (wishCandleHint) wishCandleHint.classList.add('faded');

  setTimeout(triggerGrandFinale, 300);

  setTimeout(() => {
    wishCandle.classList.remove('blown');
    candleBusy = false;
  }, 5200);
}

wishCandle.addEventListener('click', blowCandle);
wishCandle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    blowCandle();
  }
});