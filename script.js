

// ═══════════════════════════════════════════════════════════════════
// GRAVITY — Physics Engine v3.0
// Features: zoom/pan, realistic physics, collision events, size control
// ═══════════════════════════════════════════════════════════════════

// ── Stars Background ─────────────────────────────────────────────
const starCanvas = document.getElementById('stars');
const sCtx = starCanvas.getContext('2d');

function resizeStars() {
starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;
sCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
for (let i = 0; i < 280; i++) {
const x = Math.random() * starCanvas.width;
const y = Math.random() * starCanvas.height;
const r = Math.random() * 1.3;
const a = Math.random() * 0.7 + 0.1;
sCtx.beginPath();
sCtx.arc(x, y, r, 0, Math.PI * 2);
sCtx.fillStyle = `rgba(255,255,255,${a})`;
sCtx.fill();
}
}
resizeStars();

// ── Sim Canvas ────────────────────────────────────────────────────
const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');

function resize() {
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); resizeStars(); });

// ── Camera / Zoom / Pan ───────────────────────────────────────────
const camera = {
x: 0, // pan offset x
y: 0, // pan offset y
zoom: 1.0,
minZoom: 0.1,
maxZoom: 5.0
};

// Convert screen coords → world coords
function screenToWorld(sx, sy) {
return {
x: (sx - canvas.width / 2 - camera.x) / camera.zoom,
y: (sy - canvas.height / 2 - camera.y) / camera.zoom
};
}

// Convert world coords → screen coords
function worldToScreen(wx, wy) {
return {
x: wx * camera.zoom + canvas.width / 2 + camera.x,
y: wy * camera.zoom + canvas.height / 2 + camera.y
};
}

function changeZoom(factor) {
camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom * factor));
document.getElementById('v-zoom').textContent = Math.round(camera.zoom * 100) + '%';
document.getElementById('s-zoom').textContent = Math.round(camera.zoom * 100);
const slider = document.querySelector('input[oninput*="zoom"]');
if (slider) slider.value = Math.round(camera.zoom * 100);
}

function resetView() {
camera.x = 0; camera.y = 0; camera.zoom = 1.0;
document.getElementById('v-zoom').textContent = '100%';
document.getElementById('s-zoom').textContent = '100';
const slider = document.querySelector('input[oninput*="zoom"]');
if (slider) slider.value = 100;
}

function trackCenter() {
if (bodies.length === 0) return;
// Find center of mass
let tx = 0, ty = 0, totalM = 0;
for (const b of bodies) { tx += b.x * b.mass; ty += b.y * b.mass; totalM += b.mass; }
if (totalM === 0) return;
tx /= totalM; ty /= totalM;
camera.x = -tx * camera.zoom;
camera.y = -ty * camera.zoom;
}

// Mouse-wheel zoom
canvas.addEventListener('wheel', (e) => {
e.preventDefault();
const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
// Zoom toward mouse position
const wx = (e.clientX - canvas.width / 2 - camera.x) / camera.zoom;
const wy = (e.clientY - canvas.height / 2 - camera.y) / camera.zoom;
camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom * factor));
camera.x = e.clientX - canvas.width / 2 - wx * camera.zoom;
camera.y = e.clientY - canvas.height / 2 - wy * camera.zoom;
document.getElementById('v-zoom').textContent = Math.round(camera.zoom * 100) + '%';
document.getElementById('s-zoom').textContent = Math.round(camera.zoom * 100);
const slider = document.querySelector('input[oninput*="zoom"]');
if (slider) slider.value = Math.round(camera.zoom * 100);
}, { passive: false });

// Middle-mouse / right-click pan
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panCamStart = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
if (e.button === 1 || e.button === 2) {
e.preventDefault();
isPanning = true;
panStart = { x: e.clientX, y: e.clientY };
panCamStart = { x: camera.x, y: camera.y };
canvas.style.cursor = 'grab';
}
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ── Simulation State ──────────────────────────────────────────────
let bodies = [];
let particles = [];
let shockwaves = [];
let paused = false;
let simTime = 0;
let novaCount = 0;
let frameCount = 0;

let G = 1.0;
let damping = 0.999;
let trailLen = 80;
let spawnType = 'planet';
let spawnMode = 'launch';

// Custom size/mass overrides (0 = auto)
let customRadius = 0;
let customMass = 0;

// ── Body Configs ──────────────────────────────────────────────────
const typeConfigs = {
planet: {
radius: () => customRadius > 0 ? customRadius : 6 + Math.random() * 8,
mass: () => customMass > 0 ? customMass : 5 + Math.random() * 10,
color: () => `hsl(${200 + Math.random() * 60},70%,60%)`,
glow: '#4488ff',
isStationary: false
},
star: {
radius: () => customRadius > 0 ? customRadius : 12 + Math.random() * 10,
mass: () => customMass > 0 ? customMass : 300 + Math.random() * 200,
color: () => `hsl(${160 + Math.random() * 40},80%,75%)`,
glow: '#00ffcc',
isStationary: false
},
blackhole: {
radius: () => customRadius > 0 ? customRadius : 10 + Math.random() * 8,
mass: () => customMass > 0 ? customMass : 120 + Math.random() * 180,
color: () => '#111',
glow: '#9900ff',
isStationary: false
},
comet: {
radius: () => customRadius > 0 ? customRadius : 4 + Math.random() * 5,
mass: () => customMass > 0 ? customMass : 2 + Math.random() * 5,
color: () => `hsl(${170 + Math.random() * 30},90%,65%)`,
glow: '#44ffdd',
isStationary: false
}
};

// ── Body Class ────────────────────────────────────────────────────
class Body {
constructor(x, y, vx, vy, type) {
const cfg = typeConfigs[type];
this.x = x; this.y = y;
this.vx = vx; this.vy = vy;
this.type = type;
this.radius = cfg.radius();
this.mass = cfg.mass();
this.color = cfg.color();
this.glow = cfg.glow;
this.trail = [];
this.dead = false;
// Stars and black holes prefer to stay still unless a sufficiently large mass moves them
this.isHeavy = (type === 'star' || type === 'blackhole');
}
}

// ── Particle Class ────────────────────────────────────────────────
class Particle {
constructor(x, y, vx, vy, color, life, size) {
this.x = x; this.y = y;
this.vx = vx; this.vy = vy;
this.color = color;
this.life = life;
this.maxLife = life;
this.size = size;
}
update(dt) {
this.x += this.vx * dt;
this.y += this.vy * dt;
this.vx *= 0.97;
this.vy *= 0.97;
this.life -= dt;
}
get alive() { return this.life > 0; }
get alpha() { return Math.max(0, this.life / this.maxLife); }
}

// ── Shockwave Class ───────────────────────────────────────────────
class Shockwave {
constructor(x, y, maxR, color) {
this.x = x; this.y = y;
this.r = 0;
this.maxR = maxR;
this.color = color;
this.life = 1;
}
update(dt) {
this.r += dt * 8;
this.life = 1 - (this.r / this.maxR);
}
get alive() { return this.life > 0; }
}

// ── Event Details Database ────────────────────────────────────────
const eventDetails = {
supernova: {
icon: '💥',
title: 'SUPERNOVA',
body: (data) => `<strong>Type II Supernova</strong><br> Two stars collided and their combined mass exceeded the <strong>Tolman–Oppenheimer–Volkoff limit</strong>.<br><br> Combined mass: <strong>${data.mass ? Math.round(data.mass) : '?'} units</strong><br>
Position: <strong>(${data.x ? Math.round(data.x) : '?'}, ${data.y ? Math.round(data.y) : '?'})</strong><br><br>
The explosion releases more energy than the Sun will emit in its entire lifetime.
A <strong>neutron star</strong> (black hole) has formed from the remnant core.`
},
tidal: {
icon: '🌀',
title: 'TIDAL DISRUPTION EVENT',
body: (data) => `<strong>Tidal Disruption Event (TDE)</strong><br>
A star ventured too close to a black hole and was torn apart by <strong>tidal forces</strong>.<br><br>
The star's mass is being accreted onto the black hole, forming a bright <strong>accretion disk</strong>.
This releases X-ray flares visible across the galaxy.<br><br>
New black hole mass: <strong>${data.mass ? Math.round(data.mass) : '?'} units</strong>`
},
merge: {
icon: '🔵',
title: 'PLANETARY MERGER',
body: (data) => `<strong>Accretionary Collision</strong><br> Two bodies collided and merged into a single larger body.<br><br> This is how planets form — through <strong>accretion</strong>: small bodies collide, stick together, and grow over millions of years.<br><br> New body mass: <strong>${data.mass ? Math.round(data.mass) : '?'} units</strong><br>
New radius: <strong>${data.radius ? Math.round(data.radius) : '?'} units</strong>`
},
orbit: {
icon: '🪐',
title: 'ORBIT ESTABLISHED',
body: (data) => `<strong>Stable Keplerian Orbit</strong><br> A new body has been inserted into orbit around a massive anchor.<br><br> Orbital radius: <strong>${data.dist ? Math.round(data.dist) : '?'} units</strong><br>
Orbital velocity: <strong>${data.speed ? data.speed.toFixed(2) : '?'} units/s</strong><br><br> Orbital mechanics follow <strong>Kepler's Third Law</strong>: T² ∝ a³, where T is the period and a is the semi-major axis.`
},
neutron: {
icon: '🌑',
title: 'NEUTRON STAR FORMED',
body: () => `<strong>Neutron Star / Black Hole Remnant</strong><br> After a supernova, the core collapses under gravity. If massive enough, it becomes a <strong>black hole</strong>.<br><br> Neutron stars are so dense that a teaspoon would weigh <strong>~10 billion tonnes</strong> on Earth.<br><br> This remnant will continue to exert gravitational influence on surrounding bodies.`
},
blackhole_absorb: {
icon: '🕳️',
title: 'GRAVITATIONAL ABSORPTION',
body: (data) => `<strong>Event Horizon Crossing</strong><br> A body crossed the <strong>Schwarzschild radius</strong> (event horizon) of a black hole.<br><br> Once inside, nothing — not even light — can escape. The body is now part of the black hole's mass.<br><br> New black hole mass: <strong>${data.mass ? Math.round(data.mass) : '?'} units</strong>`
}
};

// ── Show Event Detail ─────────────────────────────────────────────
function showEventDetail(type, data) {
const info = eventDetails[type];
if (!info) return;
document.getElementById('event-detail-icon').textContent = info.icon;
document.getElementById('event-detail-title').textContent = info.title;
document.getElementById('event-detail-body').innerHTML = info.body(data);
document.getElementById('event-detail').classList.remove('hidden');
}

function closeDetail() {
document.getElementById('event-detail').classList.add('hidden');
}

// ── Supernova ─────────────────────────────────────────────────────
function triggerSupernova(x, y, mass, color) {
novaCount++;
logEvent('💥 SUPERNOVA', 'supernova', { x, y, mass });

const flash = document.getElementById('flash');
flash.style.opacity = '0.4';
setTimeout(() => { flash.style.opacity = '0'; }, 130);

shockwaves.push(new Shockwave(x, y, mass * 3.5, '#fff8e0'));
shockwaves.push(new Shockwave(x, y, mass * 2.5, '#ff8800'));
shockwaves.push(new Shockwave(x, y, mass * 1.5, '#ff2200'));

const count = Math.floor(80 + mass * 0.6);
for (let i = 0; i < count; i++) {
const angle = Math.random() * Math.PI * 2;
const speed = 1 + Math.random() * 10;
const hue = Math.random() < 0.5
? `hsl(${20 + Math.random() * 40},100%,70%)` : `hsl(${200 + Math.random() * 60},80%,80%)`;
particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, hue, 70 + Math.random() * 80, 1 + Math.random() * 3));
}
for (let i = 0; i < 25; i++) {
const angle = Math.random() * Math.PI * 2;
const speed = 5 + Math.random() * 14;
particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, '#ffffff', 50 + Math.random() * 40, 0.8));
}

setTimeout(() => {
const remnant = new Body(x, y, 0, 0, 'blackhole');
remnant.mass = mass * 0.4;
remnant.radius = Math.max(8, mass * 0.06);
bodies.push(remnant);
logEvent('🌑 NEUTRON STAR FORMED', 'neutron', {});
}, 450);
}

// ── Collision ─────────────────────────────────────────────────────
function handleCollision(i, j) {
const a = bodies[i], b = bodies[j];
if (a.dead || b.dead) return;

const bothStars = a.type === 'star' && b.type === 'star';
const starHitsBH = (a.type === 'star' && b.type === 'blackhole') || (a.type === 'blackhole' && b.type === 'star');

const totalMass = a.mass + b.mass;
const nx = (a.x * a.mass + b.x * b.mass) / totalMass;
const ny = (a.y * a.mass + b.y * b.mass) / totalMass;
const nvx = (a.vx * a.mass + b.vx * b.mass) / totalMass;
const nvy = (a.vy * a.mass + b.vy * b.mass) / totalMass;

a.dead = true; b.dead = true;
bodies = bodies.filter(bd => !bd.dead);

if (bothStars) {
triggerSupernova(nx, ny, totalMass, a.color);

} else if (starHitsBH) {
logEvent('🌀 TIDAL DISRUPTION', 'tidal', { mass: totalMass });
const bh = a.type === 'blackhole' ? a : b;
const newBH = new Body(nx, ny, nvx, nvy, 'blackhole');
newBH.mass = totalMass;
newBH.radius = Math.cbrt(Math.pow(bh.radius, 3) + 60);
for (let k = 0; k < 50; k++) {
const angle = Math.random() * Math.PI * 2;
const speed = 2 + Math.random() * 6;
particles.push(new Particle(nx, ny, Math.cos(angle) * speed, Math.sin(angle) * speed,
`hsl(${280 + Math.random() * 60},100%,70%)`, 60 + Math.random() * 60, 1.5));
}
bodies.push(newBH);

} else {
const bigger = a.mass >= b.mass ? a : b;
const smaller = a.mass < b.mass ? a : b;
const newBody = new Body(nx, ny, nvx, nvy, bigger.type);
newBody.mass = totalMass;
newBody.radius = Math.cbrt(Math.pow(a.radius, 3) + Math.pow(b.radius, 3));
newBody.color = bigger.color;
newBody.glow = bigger.glow;

// Small splash particles
for (let k = 0; k < 20; k++) {
const angle = Math.random() * Math.PI * 2;
const speed = 1 + Math.random() * 4;
particles.push(new Particle(nx, ny, Math.cos(angle) * speed, Math.sin(angle) * speed,
smaller.color, 20 + Math.random() * 30, 1 + Math.random() * 2));
}

if (bigger.type === 'blackhole') {
logEvent('🕳️ BH ABSORBED BODY', 'blackhole_absorb', { mass: totalMass });
} else {
logEvent('🔵 BODIES MERGED', 'merge', { mass: totalMass, radius: newBody.radius });
}
bodies.push(newBody);
}
}

// ── Orbit Helper ──────────────────────────────────────────────────
function spawnInOrbit(screenX, screenY, type) {
const world = screenToWorld(screenX, screenY);
const x = world.x, y = world.y;

let nearest = null, nearestDist = Infinity;
for (const b of bodies) {
const dx = b.x - x, dy = b.y - y;
const dist = Math.sqrt(dx * dx + dy * dy);
if (dist < nearestDist && b.mass > 20) { nearest = b; nearestDist = dist; }
}
if (!nearest || nearestDist < nearest.radius * 1.5) {
bodies.push(new Body(x, y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, type));
return;
}

const dx = x - nearest.x, dy = y - nearest.y;
const dist = Math.sqrt(dx * dx + dy * dy);
const speed = Math.sqrt(G * nearest.mass / dist) * 0.98;
const vx = (-dy / dist) * speed + nearest.vx;
const vy = (dx / dist) * speed + nearest.vy;
bodies.push(new Body(x, y, vx, vy, type));
logEvent('🪐 ORBIT INSERTED', 'orbit', { dist, speed });
}

// ── Physics Step ──────────────────────────────────────────────────
function step(dt) {
if (paused) return;
simTime += dt * 0.016;

// Record trails
for (const b of bodies) {
b.trail.push({ x: b.x, y: b.y });
if (b.trail.length > trailLen) b.trail.shift();
}

// Apply gravity
for (let i = 0; i < bodies.length; i++) {
let fx = 0, fy = 0;
const a = bodies[i];
if (a.dead) continue;

for (let j = 0; j < bodies.length; j++) {
if (i === j) continue;
const b = bodies[j];
if (b.dead) continue;

const dx = b.x - a.x, dy = b.y - a.y;
const dist2 = dx * dx + dy * dy;
const minDist = (a.radius + b.radius) * 1.05;

if (dist2 < minDist * minDist) {
if (!a.dead && !b.dead) {
handleCollision(i, j);
return; // restart after mutation
}
continue;
}

const softening = 4; // softening factor prevents singularities
const dist = Math.sqrt(dist2 + softening);
const force = G * a.mass * b.mass / (dist2 + softening);
fx += force * dx / dist;
fy += force * dy / dist;
}

// Stars/Black holes: dampen their acceleration heavily to keep them anchored
// unless a body much more massive is pulling them
if (a.isHeavy) {
// Only allow movement if the net force is large relative to mass
// (i.e., another very massive body is pulling them)
const accel = Math.sqrt(fx * fx + fy * fy) / a.mass;
const threshold = 0.01; // minimum acceleration before heavy bodies move
if (accel < threshold) {
fx = 0; fy = 0;
} else {
// Still move, but dampen significantly so they drift slowly
fx *= 0.3;
fy *= 0.3;
}
}

a.vx += (fx / a.mass) * dt;
a.vy += (fy / a.mass) * dt;
a.vx *= damping;
a.vy *= damping;
}

for (const b of bodies) { b.x += b.vx * dt; b.y += b.vy * dt; }

// Update particles
for (const p of particles) p.update(dt);
particles = particles.filter(p => p.alive);

// Update shockwaves
for (const s of shockwaves) s.update(dt);
shockwaves = shockwaves.filter(s => s.alive);

// Remove escaped bodies (in world coords)
const escapeMargin = 3000;
bodies = bodies.filter(b =>
b.x > -escapeMargin && b.x < escapeMargin &&
b.y > -escapeMargin && b.y < escapeMargin
);
}

// ── Render ────────────────────────────────────────────────────────
function draw() {
ctx.fillStyle = 'rgba(2,2,10,0.18)';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.save();
// Apply camera transform: center, pan, zoom
ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
ctx.scale(camera.zoom, camera.zoom);

// ── Shockwaves ────────────────────────────────────────────────
for (const s of shockwaves) {
ctx.beginPath();
ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba(s.color, s.life * 0.7);
ctx.lineWidth = (3 * s.life) / camera.zoom;
ctx.stroke();
}

// ── Particles ─────────────────────────────────────────────────
for (const p of particles) {
ctx.beginPath();
ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
if (p.color.startsWith('hsl')) {
ctx.fillStyle = p.color.replace('hsl(', 'hsla(').replace(')', `, ${p.alpha})`);
} else {
ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
}
ctx.fill();
}

// ── Bodies ────────────────────────────────────────────────────
for (const b of bodies) {
// Trail
if (b.trail.length > 1 && trailLen > 0) {
for (let t = 1; t < b.trail.length; t++) {
const alpha = (t / b.trail.length) * 0.45;
const lw = Math.max(0.5, (t / b.trail.length) * b.radius * 0.35);
ctx.beginPath();
ctx.moveTo(b.trail[t - 1].x, b.trail[t - 1].y);
ctx.lineTo(b.trail[t].x, b.trail[t].y);
ctx.strokeStyle = hexToRgba(b.glow, alpha);
ctx.lineWidth = lw;
ctx.lineCap = 'round';
ctx.stroke();
}
}

// Outer glow
const glowR = b.radius * (b.type === 'blackhole' ? 3 : 4);
const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, glowR);
grad.addColorStop(0, hexToRgba(b.glow, b.type === 'blackhole' ? 0.3 : 0.25));
grad.addColorStop(1, hexToRgba(b.glow, 0));
ctx.beginPath(); ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
ctx.fillStyle = grad; ctx.fill();

// Body surface
const bodyGrad = ctx.createRadialGradient(
b.x - b.radius * 0.3, b.y - b.radius * 0.3, 0,
b.x, b.y, b.radius
);
if (b.type === 'blackhole') {
bodyGrad.addColorStop(0, '#333');
bodyGrad.addColorStop(0.4, '#111');
bodyGrad.addColorStop(1, '#000');
} else {
bodyGrad.addColorStop(0, lighten(b.color));
bodyGrad.addColorStop(1, b.color);
}
ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
ctx.fillStyle = bodyGrad; ctx.fill();

// Special effects
if (b.type === 'blackhole') {
ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 1.7, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba('#9900ff', 0.45);
ctx.lineWidth = 2 / camera.zoom; ctx.stroke();
ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.3, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba('#cc44ff', 0.2);
ctx.lineWidth = 1 / camera.zoom; ctx.stroke();
}
if (b.type === 'star') {
const flicker = 0.7 + Math.sin(simTime * 3 + b.x) * 0.3;
const corona = ctx.createRadialGradient(b.x, b.y, b.radius, b.x, b.y, b.radius * 2.2);
corona.addColorStop(0, hexToRgba(b.glow, 0.13 * flicker));
corona.addColorStop(1, hexToRgba(b.glow, 0));
ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.2, 0, Math.PI * 2);
ctx.fillStyle = corona; ctx.fill();
}
if (b.type === 'comet') {
// Comet tail (in direction of motion, reversed)
const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
if (speed > 0.01) {
const tx = -b.vx / speed, ty = -b.vy / speed;
const tailLen = Math.min(60, speed * 20);
const tailGrad = ctx.createLinearGradient(b.x, b.y, b.x + tx * tailLen, b.y + ty * tailLen);
tailGrad.addColorStop(0, hexToRgba(b.glow, 0.6));
tailGrad.addColorStop(1, hexToRgba(b.glow, 0));
ctx.beginPath();
ctx.moveTo(b.x, b.y);
ctx.lineTo(b.x + tx * tailLen, b.y + ty * tailLen);
ctx.strokeStyle = tailGrad;
ctx.lineWidth = b.radius * 0.7;
ctx.lineCap = 'round';
ctx.stroke();
}
}
}

// ── Drag Preview Arrow ────────────────────────────────────────
if (isDragging && spawnMode === 'launch' && !isPanning) {
const ws = screenToWorld(dragStart.sx, dragStart.sy);
const we = screenToWorld(mouseScreen.x, mouseScreen.y);
const dx = we.x - ws.x, dy = we.y - ws.y;
const len = Math.sqrt(dx * dx + dy * dy);
if (len > 3) {
ctx.beginPath(); ctx.moveTo(ws.x, ws.y); ctx.lineTo(we.x, we.y);
ctx.strokeStyle = 'rgba(200,255,0,0.6)';
ctx.lineWidth = 1.5 / camera.zoom;
ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom]);
ctx.stroke(); ctx.setLineDash([]);

const angle = Math.atan2(dy, dx);
const hw = 10 / camera.zoom;
ctx.beginPath();
ctx.moveTo(we.x, we.y);
ctx.lineTo(we.x - hw * Math.cos(angle - 0.4), we.y - hw * Math.sin(angle - 0.4));
ctx.lineTo(we.x - hw * Math.cos(angle + 0.4), we.y - hw * Math.sin(angle + 0.4));
ctx.closePath();
ctx.fillStyle = 'rgba(200,255,0,0.7)'; ctx.fill();

ctx.beginPath(); ctx.arc(ws.x, ws.y, 8 / camera.zoom, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(200,255,0,0.4)';
ctx.lineWidth = 1 / camera.zoom; ctx.stroke();
}
}

// ── Orbit Mode Preview ────────────────────────────────────────
if (spawnMode === 'orbit') {
const wm = screenToWorld(mouseScreen.x, mouseScreen.y);
let nearest = null, nearestDist = Infinity;
for (const b of bodies) {
const dx = b.x - wm.x, dy = b.y - wm.y;
const dist = Math.sqrt(dx * dx + dy * dy);
if (dist < nearestDist && b.mass > 20) { nearest = b; nearestDist = dist; }
}
if (nearest && nearestDist < 600) {
ctx.beginPath(); ctx.arc(nearest.x, nearest.y, nearestDist, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(0,200,255,0.12)';
ctx.lineWidth = 1 / camera.zoom;
ctx.setLineDash([3 / camera.zoom, 5 / camera.zoom]);
ctx.stroke(); ctx.setLineDash([]);
ctx.beginPath(); ctx.arc(nearest.x, nearest.y, nearest.radius * 2.5, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(0,200,255,0.3)';
ctx.lineWidth = 1.5 / camera.zoom; ctx.stroke();
}
}

ctx.restore();
}

// ── Input ─────────────────────────────────────────────────────────
let isDragging = false;
let dragStart = { sx: 0, sy: 0}; // screen coords
let mouseScreen = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
if (e.button !== 0) return; // only left click
if (spawnMode === 'orbit') {
spawnInOrbit(e.clientX, e.clientY, spawnType);
} else {
dragStart = { sx: e.clientX, sy: e.clientY };
isDragging = true;
}
});

canvas.addEventListener('mousemove', (e) => {
mouseScreen = { x: e.clientX, y: e.clientY };
if (isPanning) {
camera.x = panCamStart.x + (e.clientX - panStart.x);
camera.y = panCamStart.y + (e.clientY - panStart.y);
}
});

canvas.addEventListener('mouseup', (e) => {
if (e.button === 1 || e.button === 2) {
isPanning = false;
canvas.style.cursor = 'crosshair';
return;
}
if (!isDragging) return;
isDragging = false;
const world = screenToWorld(dragStart.sx, dragStart.sy);
const dx = e.clientX - dragStart.sx;
const dy = e.clientY - dragStart.sy;
// Velocity inversely scaled by zoom so drag feels consistent
const velScale = 0.06 / camera.zoom;
bodies.push(new Body(world.x, world.y, dx * velScale, dy * velScale, spawnType));
});

// Touch support
let touchDragStart = null;
canvas.addEventListener('touchstart', (e) => {
e.preventDefault();
const t = e.touches[0];
touchDragStart = { sx: t.clientX, sy: t.clientY };
mouseScreen = { x: t.clientX, y: t.clientY };
if (spawnMode !== 'orbit') isDragging = true;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
e.preventDefault();
const t = e.touches[0];
mouseScreen = { x: t.clientX, y: t.clientY };
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
e.preventDefault();
isDragging = false;
const t = e.changedTouches[0];
if (spawnMode === 'orbit') {
spawnInOrbit(t.clientX, t.clientY, spawnType);
} else if (touchDragStart) {
const world = screenToWorld(touchDragStart.sx, touchDragStart.sy);
const dx = t.clientX - touchDragStart.sx;
const dy = t.clientY - touchDragStart.sy;
const velScale = 0.06 / camera.zoom;
bodies.push(new Body(world.x, world.y, dx * velScale, dy * velScale, spawnType));
}
touchDragStart = null;
}, { passive: false });

// ── UI Controls ───────────────────────────────────────────────────
function setType(type, el) {
spawnType = type;
document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
el.classList.add('active');
}

function setSpawnMode(mode) {
spawnMode = mode;
const launchBtn = document.getElementById('mode-launch-btn');
const orbitBtn = document.getElementById('mode-orbit-btn');
launchBtn.classList.toggle('active', mode === 'launch');
orbitBtn.classList.remove('active');
orbitBtn.classList.toggle('orbit-active', mode === 'orbit');
document.getElementById('orbit-hint').classList.toggle('visible', mode === 'orbit');
document.getElementById('hint').style.opacity = mode === 'orbit' ? '0' : '';
}

function updateSlider(name, val) {
const v = parseFloat(val);
if (name === 'gravity') {
G = v / 10;
document.getElementById('v-gravity').textContent = G.toFixed(1);
} else if (name === 'damping') {
damping = v / 1000;
document.getElementById('v-damping').textContent = damping.toFixed(3);
} else if (name === 'trail') {
trailLen = parseInt(v);
document.getElementById('v-trail').textContent = trailLen;
} else if (name === 'zoom') {
camera.zoom = v / 100;
document.getElementById('v-zoom').textContent = Math.round(v) + '%';
document.getElementById('s-zoom').textContent = Math.round(v);
} else if (name === 'spawnRadius') {
customRadius = parseInt(v);
document.getElementById('v-spawnRadius').textContent = customRadius;
} else if (name === 'spawnMass') {
customMass = parseInt(v);
document.getElementById('v-spawnMass').textContent = customMass === 0 ? 'auto' : customMass;
}
}

function togglePause() {
paused = !paused;
const btn = document.getElementById('pause-btn');
btn.textContent = paused ? '▶ RESUME' : '⏸ PAUSE';
btn.classList.toggle('active', paused);
}

function clearAll() {
bodies = []; particles = []; shockwaves = [];
ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ── Panel Toggle ──────────────────────────────────────────────────
let panelCollapsed = false;
function togglePanel() {
panelCollapsed = !panelCollapsed;
document.getElementById('panel').classList.toggle('collapsed', panelCollapsed);
document.getElementById('panel-toggle-icon').textContent = panelCollapsed ? '▶' : '◀';
}

// ── Presets ───────────────────────────────────────────────────────
function spawnChaos() {
const types = ['planet', 'star', 'comet', 'planet', 'planet', 'comet'];
for (let i = 0; i < 30; i++) {
// Spawn in world coords spread across visible area
const ww = canvas.width / camera.zoom;
const wh = canvas.height / camera.zoom;
const x = (Math.random() - 0.5) * ww;
const y = (Math.random() - 0.5) * wh;
const t = types[Math.floor(Math.random() * types.length)];
bodies.push(new Body(x, y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, t));
}
logEvent('💥 CHAOS MODE ACTIVATED', null, null);
}

function spawnOrbit() {
clearAll();
// Place star at world origin (0,0)
const star = new Body(0, 0, 0, 0, 'star');
star.mass = 800; star.radius = 22; star.vx = 0; star.vy = 0;
bodies.push(star);

const orbits = [90, 160, 240, 330, 430];
const cols = ['#6eb5ff', '#ffaa44', '#44ff88', '#ff4488', '#bb88ff'];
orbits.forEach((r, i) => {
const angle = Math.random() * Math.PI * 2;
const speed = Math.sqrt(G * star.mass / r) * 0.97;
const b = new Body(
Math.cos(angle) * r, Math.sin(angle) * r,
-Math.sin(angle) * speed, Math.cos(angle) * speed,
'planet'
);
b.color = cols[i]; b.radius = 5 + i * 1.8; b.mass = 4 + i * 2;
bodies.push(b);
});
// Reset camera to see everything
resetView();
logEvent('🌞 SOLAR SYSTEM SPAWNED', null, null);
}

function spawnBinaryStars() {
clearAll();
const d = 130;
// Binary stars orbit each other — calculate mutual orbit speed
// For two equal masses: v = sqrt(GM / (4d)) for each
const starMass = 300;
const mutualSpeed = Math.sqrt(G * starMass / (2 * d)) * 0.95;

const s1 = new Body(-d, 0, 0, -mutualSpeed, 'star');
s1.mass = starMass; s1.radius = 18;
const s2 = new Body(d, 0, 0, mutualSpeed, 'star');
s2.mass = starMass; s2.radius = 18;
// Allow binary stars to move (they orbit each other)
s1.isHeavy = false; s2.isHeavy = false;
bodies.push(s1, s2);

for (let i = 0; i < 3; i++) {
const r = 300 + i * 80;
const angle = Math.random() * Math.PI * 2;
const speed = Math.sqrt(G * (s1.mass + s2.mass) / r) * 0.95;
const p = new Body(
Math.cos(angle) * r, Math.sin(angle) * r,
-Math.sin(angle) * speed, Math.cos(angle) * speed,
'planet'
);
p.mass = 6; p.radius = 6; bodies.push(p);
}
resetView();
logEvent('⭐ BINARY STAR SYSTEM SPAWNED', null, null);
}

function spawnBlackHoleSystem() {
clearAll();
const bh = new Body(0, 0, 0, 0, 'blackhole');
bh.mass = 1200; bh.radius = 20;
bodies.push(bh);

for (let i = 0; i < 5; i++) {
const r = 100 + i * 80;
const angle = (i / 5) * Math.PI * 2;
const speed = Math.sqrt(G * bh.mass / r) * 0.97;
const p = new Body(
Math.cos(angle) * r, Math.sin(angle) * r,
-Math.sin(angle) * speed, Math.cos(angle) * speed,
'planet'
);
p.radius = 5 + Math.random() * 5;
p.mass = 5 + Math.random() * 10;
bodies.push(p);
}
// A few comets in eccentric orbits
for (let i = 0; i < 3; i++) {
const r = 200 + Math.random() * 200;
const angle = Math.random() * Math.PI * 2;
const speed = Math.sqrt(G * bh.mass / r) * (0.6 + Math.random() * 0.6);
const c = new Body(
Math.cos(angle) * r, Math.sin(angle) * r,
-Math.sin(angle) * speed * 0.8, Math.cos(angle) * speed * 1.2,
'comet'
);
bodies.push(c);
}
resetView();
logEvent('🕳️ BLACK HOLE SYSTEM SPAWNED', null, null);
}

// ── Event Log ─────────────────────────────────────────────────────
function logEvent(msg, detailType, detailData) {
const log = document.getElementById('eventlog');
const el = document.createElement('div');
el.className = 'event-item';
el.textContent = msg;

if (detailType) {
el.style.cursor = 'pointer';
el.addEventListener('click', () => showEventDetail(detailType, detailData || {}));
}

log.appendChild(el);
while (log.children.length > 6) log.removeChild(log.firstChild);
setTimeout(() => el.classList.add('fade'), 3500);
setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
}

// ── Stats ─────────────────────────────────────────────────────────
function updateStats() {
document.getElementById('s-bodies').textContent = bodies.length;
document.getElementById('s-nova').textContent = novaCount;
document.getElementById('s-time').textContent = simTime.toFixed(1);
document.getElementById('s-zoom').textContent = Math.round(camera.zoom * 100);
}

// ── Helpers ───────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
if (!hex) return `rgba(200,200,200,${alpha})`;
if (hex.startsWith('hsl')) {
return hex.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
}
if (hex === '#111' || hex === '#000') return `rgba(10,10,10,${alpha})`;
if (hex.startsWith('#') && hex.length === 7) {
const r = parseInt(hex.slice(1, 3), 16);
const g = parseInt(hex.slice(3, 5), 16);
const b = parseInt(hex.slice(5, 7), 16);
return `rgba(${r},${g},${b},${alpha})`;
}
return `rgba(200,200,200,${alpha})`;
}

function lighten(color) {
if (color.startsWith('hsl')) {
return color.replace(/(\d+)%\)/, (m, p) => `${Math.min(100, parseInt(p) + 22)}%)`);
}
return color;
}

// ── Main Loop ─────────────────────────────────────────────────────
let last = null;
function loop(ts) {
if (!last) last = ts;
const dt = Math.min((ts - last) / 16.67, 3);
last = ts;
frameCount++;
step(dt);
draw();
if (frameCount % 10 === 0) updateStats();
requestAnimationFrame(loop);
}

function startSim() {
document.getElementById('intro').classList.add('hidden');
spawnOrbit();
requestAnimationFrame(loop);
}