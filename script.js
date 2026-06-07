

// GRAVITY - Physics Engine v3.1 — Physics & Realism Update

// ── Stars Background ─────────────────────────────────────────────
var starCanvas = document.getElementById('stars');
var sCtx = starCanvas.getContext('2d');

function resizeStars() {
starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;
sCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
for (var i = 0; i < 280; i++) {
var x = Math.random() * starCanvas.width;
var y = Math.random() * starCanvas.height;
var r = Math.random() * 1.3;
var a = Math.random() * 0.7 + 0.1;
sCtx.beginPath();
sCtx.arc(x, y, r, 0, Math.PI * 2);
sCtx.fillStyle = 'rgba(255,255,255,' + a + ')';
sCtx.fill();
}
}
resizeStars();

// ── Sim Canvas ────────────────────────────────────────────────────
var canvas = document.getElementById('sim');
var ctx = canvas.getContext('2d');

function resize() {
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', function() { resize(); resizeStars(); });

// ── Camera ────────────────────────────────────────────────────────
var camera = { x: 0, y: 0, zoom: 1.0, minZoom: 0.1, maxZoom: 5.0 };

function screenToWorld(sx, sy) {
return {
x: (sx - canvas.width / 2 - camera.x) / camera.zoom,
y: (sy - canvas.height / 2 - camera.y) / camera.zoom
};
}

function worldToScreen(wx, wy) {
return {
x: wx * camera.zoom + canvas.width / 2 + camera.x,
y: wy * camera.zoom + canvas.height / 2 + camera.y
};
}

function updateZoomUI() {
var pct = Math.round(camera.zoom * 100);
document.getElementById('v-zoom').textContent = pct + '%';
document.getElementById('s-zoom').textContent = pct;
var slider = document.querySelector('input[oninput*="zoom"]');
if (slider) slider.value = pct;
}

function changeZoom(factor) {
camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom * factor));
updateZoomUI();
}

function resetView() {
camera.x = 0; camera.y = 0; camera.zoom = 1.0;
updateZoomUI();
}

function trackCenter() {
if (bodies.length === 0) return;
var tx = 0, ty = 0, totalM = 0;
for (var i = 0; i < bodies.length; i++) {
tx += bodies[i].x * bodies[i].mass;
ty += bodies[i].y * bodies[i].mass;
totalM += bodies[i].mass;
}
if (totalM === 0) return;
camera.x = -(tx / totalM) * camera.zoom;
camera.y = -(ty / totalM) * camera.zoom;
}

canvas.addEventListener('wheel', function(e) {
e.preventDefault();
var factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
var wx = (e.clientX - canvas.width / 2 - camera.x) / camera.zoom;
var wy = (e.clientY - canvas.height / 2 - camera.y) / camera.zoom;
camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom * factor));
camera.x = e.clientX - canvas.width / 2 - wx * camera.zoom;
camera.y = e.clientY - canvas.height / 2 - wy * camera.zoom;
updateZoomUI();
}, { passive: false });

var isPanning = false;
var panStart = { x: 0, y: 0 };
var panCamStart = { x: 0, y: 0 };

canvas.addEventListener('mousedown', function(e) {
if (e.button === 1 || e.button === 2) {
e.preventDefault();
isPanning = true;
panStart = { x: e.clientX, y: e.clientY };
panCamStart = { x: camera.x, y: camera.y };
canvas.style.cursor = 'grab';
}
});
canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

// ── State ─────────────────────────────────────────────────────────
var bodies = [];
var particles = [];
var shockwaves = [];
var nebulae = []; // NEW: nebula clouds after supernovae
var paused = false;
var simTime = 0;
var novaCount = 0;
var frameCount = 0;
var G = 1.0;
var damping = 0.999;
var trailLen = 80;
var spawnType = 'planet';
var spawnMode = 'launch';
var customRadius = 0;
var customMass = 0;
var timeWarp = 1.0; // NEW: time warp multiplier

// ── Star Temperature System ───────────────────────────────────────
// Stars get a temperature class that determines color and size
// Classes: M (red), K (orange), G (yellow, like sun), F (white-yellow), A (white), B (blue-white), O (blue)
var starClasses = ['M', 'K', 'G', 'F', 'A', 'B', 'O'];
var starClassColors = {
'M': 'hsl(10,80%,55%)',
'K': 'hsl(25,85%,60%)',
'G': 'hsl(48,100%,70%)',
'F': 'hsl(55,90%,80%)',
'A': 'hsl(200,30%,90%)',
'B': 'hsl(215,80%,80%)',
'O': 'hsl(225,100%,75%)'
};
var starClassGlows = {
'M': '#ff4422',
'K': '#ff8833',
'G': '#ffcc00',
'F': '#ffe880',
'A': '#ccddff',
'B': '#88aaff',
'O': '#4466ff'
};
var starClassMassMin = { 'M': 80, 'K': 150, 'G': 250, 'F': 350, 'A': 450, 'B': 600, 'O': 800 };
var starClassMassMax = { 'M': 150, 'K': 250, 'G': 350, 'F': 450, 'A': 600, 'B': 800, 'O': 1200 };
var starClassRadiusMin = { 'M': 8, 'K': 10, 'G': 13, 'F': 15, 'A': 17, 'B': 19, 'O': 22 };
var starClassRadiusMax = { 'M': 11, 'K': 13, 'G': 16, 'F': 18, 'A': 20, 'B': 23, 'O': 28 };

function randomStarClass() {
// Weighted: M stars are most common, O are rarest
var weights = [40, 25, 15, 8, 5, 4, 3];
var total = 0;
for (var i = 0; i < weights.length; i++) total += weights[i];
var roll = Math.random() * total;
var sum = 0;
for (var j = 0; j < weights.length; j++) {
sum += weights[j];
if (roll < sum) return starClasses[j];
}
return 'G';
}

// ── Body Constructor ──────────────────────────────────────────────
function getRadius(type, starClass) {
if (customRadius > 0) return customRadius;
if (type === 'planet') return 5 + Math.random() * 9;
if (type === 'star') {
var sc = starClass || 'G';
return starClassRadiusMin[sc] + Math.random() * (starClassRadiusMax[sc] - starClassRadiusMin[sc]);
}
if (type === 'blackhole') return 13 + Math.random() * 7;
if (type === 'comet') return 2 + Math.random() * 3;
if (type === 'asteroid') return 2 + Math.random() * 2;
return 8;
}

function getMass(type, starClass) {
if (customMass > 0) return customMass;
if (type === 'planet') return 5 + Math.random() * 12;
if (type === 'star') {
var sc = starClass || 'G';
return starClassMassMin[sc] + Math.random() * (starClassMassMax[sc] - starClassMassMin[sc]);
}
if (type === 'blackhole') return 500 + Math.random() * 600;
if (type === 'comet') return 1 + Math.random() * 2;
if (type === 'asteroid') return 0.5 + Math.random() * 1.5;
return 10;
}

function getColor(type, starClass) {
if (type === 'planet') return 'hsl(' + (180 + Math.random() * 100) + ',' + (50 + Math.random() * 30) + '%,' + (45 + Math.random() * 25) + '%)';
if (type === 'star') return starClassColors[starClass || 'G'];
if (type === 'blackhole') return '#111';
if (type === 'comet') return 'hsl(' + (160 + Math.random() * 40) + ',80%,75%)';
if (type === 'asteroid') return 'hsl(' + (20 + Math.random() * 20) + ',' + (15 + Math.random() * 15) + '%,' + (40 + Math.random() * 20) + '%)';
return '#ffffff';
}

function getGlow(type, starClass) {
if (type === 'planet') return '#4488ff';
if (type === 'star') return starClassGlows[starClass || 'G'];
if (type === 'blackhole') return '#9900ff';
if (type === 'comet') return '#00ffcc';
if (type === 'asteroid') return '#886644';
return '#ffffff';
}

// Does this planet have rings? Based on mass and a random roll
function shouldHaveRings(body) {
if (body.type !== 'planet') return false;
return body.mass > 10 && Math.random() < 0.35;
}

function Body(x, y, vx, vy, type) {
this.x = x; this.y = y;
this.vx = vx; this.vy = vy;
this.type = type;
this.starClass = (type === 'star') ? randomStarClass() : null;
this.radius = getRadius(type, this.starClass);
this.mass = getMass(type, this.starClass);
this.color = getColor(type, this.starClass);
this.glow = getGlow(type, this.starClass);
this.trail = [];
this.dead = false;
this.isHeavy = (type === 'star' || type === 'blackhole');
// Rings
this.hasRings = false;
this.ringTilt = 0;
this.ringColor = '';
// Day/night (assigned after construction for planets near stars)
this.nearestStarAngle = 0;
}

// ── Particle Constructor ──────────────────────────────────────────
function Particle(x, y, vx, vy, color, life, size) {
this.x = x; this.y = y;
this.vx = vx; this.vy = vy;
this.color = color;
this.life = life;
this.maxLife = life;
this.size = size;
}

Particle.prototype.update = function(dt) {
this.x += this.vx * dt;
this.y += this.vy * dt;
this.vx *= 0.97;
this.vy *= 0.97;
this.life -= dt;
};

Particle.prototype.isAlive = function() { return this.life > 0; };
Particle.prototype.alpha = function() { return Math.max(0, this.life / this.maxLife); };

// ── Shockwave Constructor ─────────────────────────────────────────
function Shockwave(x, y, maxR, color) {
this.x = x; this.y = y;
this.r = 0;
this.maxR = maxR;
this.color = color;
this.life = 1;
}

Shockwave.prototype.update = function(dt) {
this.r += dt * 8;
this.life = 1 - (this.r / this.maxR);
};

Shockwave.prototype.isAlive = function() { return this.life > 0; };

// ── Nebula Constructor (NEW) ──────────────────────────────────────
function Nebula(x, y, color) {
this.x = x; this.y = y;
this.color = color;
this.life = 1.0;
this.maxRadius = 80 + Math.random() * 60;
this.clouds = [];
// Generate random cloud puffs
for (var i = 0; i < 12; i++) {
this.clouds.push({
ox: (Math.random() - 0.5) * this.maxRadius * 1.2,
oy: (Math.random() - 0.5) * this.maxRadius * 1.2,
r: 15 + Math.random() * 35
});
}
}

Nebula.prototype.update = function(dt) {
this.life -= dt * 0.003;
};

Nebula.prototype.isAlive = function() { return this.life > 0; };

// ── Event Details ─────────────────────────────────────────────────
function showEventDetail(type, data) {
var icon = '', title = '', body = '';
if (type === 'supernova') {
icon = '💥'; title = 'SUPERNOVA';
body = '<strong>Type II Supernova</strong><br>Two stars collided and their combined mass exceeded the Tolman-Oppenheimer-Volkoff limit.<br><br>'
+ 'Combined mass: <strong>' + (data.mass ? Math.round(data.mass) : '?') + ' units</strong><br>'
+ 'Position: <strong>(' + (data.x ? Math.round(data.x) : '?') + ', ' + (data.y ? Math.round(data.y) : '?') + ')</strong><br><br>'
+ 'The explosion releases more energy than the Sun will emit in its entire lifetime. A <strong>neutron star</strong> (black hole remnant) has formed from the collapsing core.';
} else if (type === 'tidal') {
icon = '🌀'; title = 'TIDAL DISRUPTION EVENT';
body = '<strong>Tidal Disruption Event (TDE)</strong><br>A star ventured too close to a black hole and was torn apart by <strong>tidal forces</strong>.<br><br>'
+ 'The star\'s mass is accreted onto the black hole, forming a bright <strong>accretion disk</strong> that releases X-ray flares.<br><br>'
+ 'New black hole mass: <strong>' + (data.mass ? Math.round(data.mass) : '?') + ' units</strong>';
} else if (type === 'roche') {
icon = '💫'; title = 'ROCHE LIMIT EXCEEDED';
body = '<strong>Roche Limit Tidal Disruption</strong><br>A smaller body came within the <strong>Roche limit</strong> of a much more massive body.<br><br>'
+ 'Within this boundary, tidal forces from the larger body exceed the gravitational self-attraction holding the smaller body together — tearing it apart into a ring of debris.<br><br>'
+ 'This is how <strong>planetary rings</strong> like Saturn\'s actually form.';
} else if (type === 'merge') {
icon = '🔵'; title = 'PLANETARY MERGER';
body = '<strong>Accretionary Collision</strong><br>Two bodies collided and merged into one larger body.<br><br>'
+ 'This is how planets form — through <strong>accretion</strong>: small bodies collide, stick together, and grow over millions of years.<br><br>'
+ 'New mass: <strong>' + (data.mass ? Math.round(data.mass) : '?') + ' units</strong>';
} else if (type === 'orbit') {
icon = '🪐'; title = 'ORBIT ESTABLISHED';
body = '<strong>Stable Keplerian Orbit</strong><br>A new body has been inserted into orbit around a massive anchor.<br><br>'
+ 'Orbital radius: <strong>' + (data.dist ? Math.round(data.dist) : '?') + ' units</strong><br>'
+ 'Orbital velocity: <strong>' + (data.speed ? data.speed.toFixed(2) : '?') + ' u/s</strong><br><br>'
+ 'Kepler\'s Third Law: T² ∝ a³, where T is the period and a is the semi-major axis.';
} else if (type === 'neutron') {
icon = '🌑'; title = 'NEUTRON STAR FORMED';
body = '<strong>Neutron Star / Black Hole Remnant</strong><br>After a supernova, the core collapses under gravity.<br><br>'
+ 'Neutron stars are so dense that a teaspoon would weigh <strong>~10 billion tonnes</strong> on Earth.<br><br>'
+ 'This remnant will continue to exert gravitational influence on surrounding bodies.';
} else if (type === 'absorbed') {
icon = '🕳️'; title = 'GRAVITATIONAL ABSORPTION';
body = '<strong>Event Horizon Crossing</strong><br>A body crossed the Schwarzschild radius of a black hole.<br><br>'
+ 'Once inside, nothing — not even light — can escape.<br><br>'
+ 'New black hole mass: <strong>' + (data.mass ? Math.round(data.mass) : '?') + ' units</strong>';
} else if (type === 'starclass') {
icon = '⭐'; title = 'STAR SPAWNED — CLASS ' + (data.cls || '?');
var classDesc = {
'M': 'Red Dwarf — the most common stars in the universe. Small, cool, and extremely long-lived (trillions of years).',
'K': 'Orange Dwarf — slightly larger than red dwarfs. Considered ideal for habitable planets due to stable output.',
'G': 'Yellow Dwarf — our own Sun is a G-type star. Medium mass, ~10 billion year lifespan.',
'F': 'Yellow-White Star — hotter and brighter than the Sun. Lifespan around 3-7 billion years.',
'A': 'White Star — very bright and hot. Only ~1-3 billion year lifespan.',
'B': 'Blue-White Giant — extremely luminous. Burns through fuel in ~10-100 million years.',
'O': 'Blue Supergiant — the rarest and most massive stars. Lifespan of only ~1-3 million years before a violent supernova.'
};
body = classDesc[data.cls] || 'Unknown star class.';
}
document.getElementById('event-detail-icon').textContent = icon;
document.getElementById('event-detail-title').textContent = title;
document.getElementById('event-detail-body').innerHTML = body;
document.getElementById('event-detail').classList.remove('hidden');
}

function closeDetail() {
document.getElementById('event-detail').classList.add('hidden');
}

// ── Event Log ─────────────────────────────────────────────────────
function logEvent(msg, detailType, detailData) {
var log = document.getElementById('eventlog');
var el = document.createElement('div');
el.className = 'event-item';
el.textContent = msg;
if (detailType) {
el.style.cursor = 'pointer';
(function(t, d) {
el.addEventListener('click', function() { showEventDetail(t, d || {}); });
})(detailType, detailData);
}
log.appendChild(el);
while (log.children.length > 6) log.removeChild(log.firstChild);
setTimeout(function() { el.classList.add('fade'); }, 3500);
setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
}

// ── Supernova ─────────────────────────────────────────────────────
function triggerSupernova(x, y, mass, color) {
novaCount++;
logEvent('💥 SUPERNOVA', 'supernova', { x: x, y: y, mass: mass });

var flash = document.getElementById('flash');
flash.style.opacity = '0.4';
setTimeout(function() { flash.style.opacity = '0'; }, 130);

shockwaves.push(new Shockwave(x, y, mass * 3.5, '#fff8e0'));
shockwaves.push(new Shockwave(x, y, mass * 2.5, '#ff8800'));
shockwaves.push(new Shockwave(x, y, mass * 1.5, '#ff2200'));

// Spawn nebula cloud
nebulae.push(new Nebula(x, y, color || '#ff6600'));
// Second nebula ring in different hue
nebulae.push(new Nebula(x, y, '#4466ff'));

var count = Math.floor(80 + mass * 0.5);
var i, angle, speed, hue;
for (i = 0; i < count; i++) {
angle = Math.random() * Math.PI * 2;
speed = 1 + Math.random() * 10;
hue = Math.random() < 0.5
? 'hsl(' + (20 + Math.random() * 40) + ',100%,70%)'
: 'hsl(' + (200 + Math.random() * 60) + ',80%,80%)';
particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, hue, 70 + Math.random() * 80, 1 + Math.random() * 3));
}
for (i = 0; i < 25; i++) {
var a2 = Math.random() * Math.PI * 2;
var s2 = 5 + Math.random() * 14;
particles.push(new Particle(x, y, Math.cos(a2) * s2, Math.sin(a2) * s2, '#ffffff', 50 + Math.random() * 40, 0.8));
}

setTimeout(function() {
var remnant = new Body(x, y, 0, 0, 'blackhole');
remnant.mass = mass * 0.4;
remnant.radius = Math.max(8, mass * 0.06);
bodies.push(remnant);
logEvent('🌑 NEUTRON STAR FORMED', 'neutron', {});
}, 450);
}

// ── Roche Limit (NEW) ─────────────────────────────────────────────
// Roche limit: d = R_primary * (2 * M_primary / M_secondary)^(1/3)
// If a small body enters this, it gets torn apart into debris
function checkRocheLimit(i, j) {
var a = bodies[i], b = bodies[j];
if (a.dead || b.dead) return false;
// Only applies when mass ratio is large (big body vs small body)
var bigger, smaller;
if (a.mass > b.mass * 5) { bigger = a; smaller = b; }
else if (b.mass > a.mass * 5) { bigger = b; smaller = a; }
else return false;

var dx = smaller.x - bigger.x;
var dy = smaller.y - bigger.y;
var dist = Math.sqrt(dx * dx + dy * dy);
// Roche limit formula (simplified)
var rocheLimit = bigger.radius * 2.44 * Math.pow(bigger.mass / smaller.mass, 1/3);

if (dist < rocheLimit && dist > bigger.radius + smaller.radius) {
return { bigger: bigger, smaller: smaller, x: smaller.x, y: smaller.y };
}
return false;
}

function triggerRocheTeardown(smaller, bigger) {
smaller.dead = true;
var newBodies = [];
for (var k = 0; k < bodies.length; k++) {
if (!bodies[k].dead) newBodies.push(bodies[k]);
}
bodies = newBodies;

logEvent('💫 ROCHE LIMIT — TORN APART', 'roche', {});

// Scatter debris in an arc
var count = 12 + Math.floor(smaller.mass * 2);
for (var i = 0; i < count; i++) {
var baseAngle = Math.atan2(smaller.y - bigger.y, smaller.x - bigger.x);
var spread = (Math.random() - 0.5) * Math.PI * 0.6;
var angle = baseAngle + spread;
var speed = 0.8 + Math.random() * 2.5;
var debris = new Body(
smaller.x + (Math.random() - 0.5) * smaller.radius * 3,
smaller.y + (Math.random() - 0.5) * smaller.radius * 3,
smaller.vx + Math.cos(angle) * speed,
smaller.vy + Math.sin(angle) * speed,
'asteroid'
);
debris.mass = smaller.mass / count;
debris.radius = 1.5 + Math.random() * 1.5;
bodies.push(debris);
}
// Visual burst
for (var j = 0; j < 20; j++) {
var pa = Math.random() * Math.PI * 2;
var ps = 1 + Math.random() * 3;
particles.push(new Particle(smaller.x, smaller.y, Math.cos(pa) * ps, Math.sin(pa) * ps,
smaller.color, 25 + Math.random() * 25, 1 + Math.random() * 2));
}
}

// ── Collision ─────────────────────────────────────────────────────
function handleCollision(i, j) {
var a = bodies[i], b = bodies[j];
if (a.dead || b.dead) return;

var bothStars = (a.type === 'star' && b.type === 'star');
var starHitsBH = (a.type === 'star' && b.type === 'blackhole') || (a.type === 'blackhole' && b.type === 'star');
var totalMass = a.mass + b.mass;
var nx = (a.x * a.mass + b.x * b.mass) / totalMass;
var ny = (a.y * a.mass + b.y * b.mass) / totalMass;
var nvx = (a.vx * a.mass + b.vx * b.mass) / totalMass;
var nvy = (a.vy * a.mass + b.vy * b.mass) / totalMass;

a.dead = true; b.dead = true;
var newBodies = [];
for (var k = 0; k < bodies.length; k++) {
if (!bodies[k].dead) newBodies.push(bodies[k]);
}
bodies = newBodies;

if (bothStars) {
triggerSupernova(nx, ny, totalMass, a.color);

} else if (starHitsBH) {
logEvent('🌀 TIDAL DISRUPTION', 'tidal', { mass: totalMass });
var bh = (a.type === 'blackhole') ? a : b;
var newBH = new Body(nx, ny, nvx, nvy, 'blackhole');
newBH.mass = totalMass;
newBH.radius = Math.cbrt(Math.pow(bh.radius, 3) + 60);
for (var p = 0; p < 50; p++) {
var pa = Math.random() * Math.PI * 2;
var ps = 2 + Math.random() * 6;
particles.push(new Particle(nx, ny, Math.cos(pa) * ps, Math.sin(pa) * ps,
'hsl(' + (280 + Math.random() * 60) + ',100%,70%)', 60 + Math.random() * 60, 1.5));
}
bodies.push(newBH);

} else {
var bigger = (a.mass >= b.mass) ? a : b;
var smaller = (a.mass < b.mass) ? a : b;
var merged = new Body(nx, ny, nvx, nvy, bigger.type);
merged.mass = totalMass;
merged.radius = Math.cbrt(Math.pow(a.radius, 3) + Math.pow(b.radius, 3));
merged.color = bigger.color;
merged.glow = bigger.glow;
merged.starClass = bigger.starClass;
// Merged planet might gain rings
if (merged.type === 'planet' && merged.mass > 12) {
merged.hasRings = true;
merged.ringTilt = Math.random() * 0.5 + 0.1;
merged.ringColor = bigger.color;
}
for (var sp = 0; sp < 20; sp++) {
var sa = Math.random() * Math.PI * 2;
var ss = 1 + Math.random() * 4;
particles.push(new Particle(nx, ny, Math.cos(sa) * ss, Math.sin(sa) * ss,
smaller.color, 20 + Math.random() * 30, 1 + Math.random() * 2));
}
if (bigger.type === 'blackhole') {
logEvent('🕳️ BH ABSORBED BODY', 'absorbed', { mass: totalMass });
} else {
logEvent('🔵 BODIES MERGED', 'merge', { mass: totalMass, radius: merged.radius });
}
bodies.push(merged);
}
}

// ── Orbit Helper ──────────────────────────────────────────────────
function spawnInOrbit(screenX, screenY, type) {
var world = screenToWorld(screenX, screenY);
var x = world.x, y = world.y;
var nearest = null, nearestDist = Infinity;
for (var i = 0; i < bodies.length; i++) {
var dx = bodies[i].x - x, dy = bodies[i].y - y;
var dist = Math.sqrt(dx * dx + dy * dy);
if (dist < nearestDist && bodies[i].mass > 20) { nearest = bodies[i]; nearestDist = dist; }
}
if (!nearest || nearestDist < nearest.radius * 1.5) {
bodies.push(new Body(x, y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, type));
return;
}
var ddx = x - nearest.x, ddy = y - nearest.y;
var d = Math.sqrt(ddx * ddx + ddy * ddy);
var speed = Math.sqrt(G * nearest.mass / d) * 0.98;
var vx = (-ddy / d) * speed + nearest.vx;
var vy = (ddx / d) * speed + nearest.vy;
var nb = new Body(x, y, vx, vy, type);
// Assign rings to planets
if (nb.type === 'planet' && shouldHaveRings(nb)) {
nb.hasRings = true;
nb.ringTilt = Math.random() * 0.5 + 0.1;
nb.ringColor = nb.color;
}
bodies.push(nb);
logEvent('🪐 ORBIT INSERTED', 'orbit', { dist: d, speed: speed });
}

// ── Day/Night helper ──────────────────────────────────────────────
function updateDayNight() {
var i, j, b, star, dx, dy, dist, bestDist;
for (i = 0; i < bodies.length; i++) {
b = bodies[i];
if (b.type !== 'planet') continue;
bestDist = Infinity;
for (j = 0; j < bodies.length; j++) {
star = bodies[j];
if (star.type !== 'star') continue;
dx = star.x - b.x; dy = star.y - b.y;
dist = Math.sqrt(dx * dx + dy * dy);
if (dist < bestDist) {
bestDist = dist;
b.nearestStarAngle = Math.atan2(dy, dx);
}
}
}
}

// ── Physics Step ──────────────────────────────────────────────────
function step(dt) {
if (paused) return;
// Apply time warp
dt = dt * timeWarp;
simTime += dt * 0.016;

var i, j, b, bb, a, dx, dy, dist2, minDist, dist, force, fx, fy, accel;

// Record trails
for (i = 0; i < bodies.length; i++) {
b = bodies[i];
b.trail.push({ x: b.x, y: b.y });
if (b.trail.length > trailLen) b.trail.shift();
}

// Apply gravity + Roche check
for (i = 0; i < bodies.length; i++) {
fx = 0; fy = 0;
a = bodies[i];
if (a.dead) continue;

for (j = 0; j < bodies.length; j++) {
if (i === j) continue;
bb = bodies[j];
if (bb.dead) continue;

dx = bb.x - a.x; dy = bb.y - a.y;
dist2 = dx * dx + dy * dy;
minDist = (a.radius + bb.radius) * 1.05;

if (dist2 < minDist * minDist) {
if (!a.dead && !bb.dead) { handleCollision(i, j); return; }
continue;
}

// Roche limit check
var rocheResult = checkRocheLimit(i, j);
if (rocheResult) {
triggerRocheTeardown(rocheResult.smaller, rocheResult.bigger);
return;
}

var softening = 4;
dist = Math.sqrt(dist2 + softening);
force = G * a.mass * bb.mass / (dist2 + softening);
fx += force * dx / dist;
fy += force * dy / dist;
}

if (a.isHeavy) {
accel = Math.sqrt(fx * fx + fy * fy) / a.mass;
if (accel < 0.01) { fx = 0; fy = 0; }
else { fx *= 0.3; fy *= 0.3; }
}
a.vx += (fx / a.mass) * dt;
a.vy += (fy / a.mass) * dt;
a.vx *= damping;
a.vy *= damping;
}

for (i = 0; i < bodies.length; i++) {
bodies[i].x += bodies[i].vx * dt;
bodies[i].y += bodies[i].vy * dt;
}

// Update particles
var aliveParticles = [];
for (i = 0; i < particles.length; i++) {
particles[i].update(dt);
if (particles[i].isAlive()) aliveParticles.push(particles[i]);
}
particles = aliveParticles;

// Update shockwaves
var aliveWaves = [];
for (i = 0; i < shockwaves.length; i++) {
shockwaves[i].update(dt);
if (shockwaves[i].isAlive()) aliveWaves.push(shockwaves[i]);
}
shockwaves = aliveWaves;

// Update nebulae
var aliveNebulae = [];
for (i = 0; i < nebulae.length; i++) {
nebulae[i].update(dt);
if (nebulae[i].isAlive()) aliveNebulae.push(nebulae[i]);
}
nebulae = aliveNebulae;

// Remove escaped bodies
var escapeMargin = 4000;
var survivingBodies = [];
for (i = 0; i < bodies.length; i++) {
b = bodies[i];
if (b.x > -escapeMargin && b.x < escapeMargin && b.y > -escapeMargin && b.y < escapeMargin) {
survivingBodies.push(b);
}
}
bodies = survivingBodies;

// Update day/night every 30 frames
if (frameCount % 30 === 0) updateDayNight();
}

// ── Helpers ───────────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
if (!hex) return 'rgba(200,200,200,' + alpha + ')';
if (hex.indexOf('hsl') === 0) {
return hex.replace('hsl(', 'hsla(').replace(')', ',' + alpha + ')');
}
if (hex === '#111' || hex === '#000') return 'rgba(10,10,10,' + alpha + ')';
if (hex.charAt(0) === '#' && hex.length === 7) {
var r = parseInt(hex.slice(1, 3), 16);
var g = parseInt(hex.slice(3, 5), 16);
var bv = parseInt(hex.slice(5, 7), 16);
return 'rgba(' + r + ',' + g + ',' + bv + ',' + alpha + ')';
}
return 'rgba(200,200,200,' + alpha + ')';
}

function lighten(color) {
if (color.indexOf('hsl') === 0) {
return color.replace(/(\d+)%\)/, function(m, p) { return Math.min(100, parseInt(p) + 22) + '%)'; });
}
return color;
}

// ── Draw Planet Rings ─────────────────────────────────────────────
function drawRings(b) {
var tilt = b.ringTilt || 0.25;
var innerR = b.radius * 1.5;
var outerR = b.radius * 2.6;
var color = b.ringColor || b.color;

ctx.save();
ctx.translate(b.x, b.y);
ctx.scale(1, tilt); // squash y to simulate 3D tilt

// Outer ring
ctx.beginPath();
ctx.arc(0, 0, outerR, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba(color, 0.35);
ctx.lineWidth = (outerR - innerR) * 0.5;
ctx.stroke();

// Inner ring (slightly different hue)
ctx.beginPath();
ctx.arc(0, 0, innerR + (outerR - innerR) * 0.25, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba(color, 0.2);
ctx.lineWidth = (outerR - innerR) * 0.35;
ctx.stroke();

ctx.restore();
}

// ── Draw Gravitational Lensing ─────────────────────────────────────
function drawLensing(b) {
if (b.type !== 'blackhole') return;
var lensR = b.radius * 5;
// Draw distortion rings that suggest light bending
var steps = 3;
for (var s = 0; s < steps; s++) {
var fr = (s + 1) / steps;
var ringR = b.radius * 2.5 + fr * (lensR - b.radius * 2.5);
var alpha = (1 - fr) * 0.12;
ctx.beginPath();
ctx.arc(b.x, b.y, ringR, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(180,100,255,' + alpha + ')';
ctx.lineWidth = (1 + (1 - fr) * 3) / camera.zoom;
ctx.stroke();
}
// Einstein ring effect — bright arc
ctx.beginPath();
ctx.arc(b.x, b.y, b.radius * 3.2, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(255,255,255,0.06)';
ctx.lineWidth = 2 / camera.zoom;
ctx.stroke();
}

// ── Draw Nebula ───────────────────────────────────────────────────
function drawNebula(n) {
var alpha = n.life * 0.18;
for (var c = 0; c < n.clouds.length; c++) {
var cloud = n.clouds[c];
var grad = ctx.createRadialGradient(
n.x + cloud.ox, n.y + cloud.oy, 0,
n.x + cloud.ox, n.y + cloud.oy, cloud.r * (2 - n.life)
);
grad.addColorStop(0, hexToRgba(n.color, alpha * 0.8));
grad.addColorStop(1, hexToRgba(n.color, 0));
ctx.beginPath();
ctx.arc(n.x + cloud.ox, n.y + cloud.oy, cloud.r * (2 - n.life), 0, Math.PI * 2);
ctx.fillStyle = grad;
ctx.fill();
}
}

// ── Day/Night side on planet ──────────────────────────────────────
function drawDayNight(b) {
if (b.nearestStarAngle === undefined) return;
var angle = b.nearestStarAngle;
// Night side: dark gradient opposite to the star
var nightGrad = ctx.createRadialGradient(
b.x - Math.cos(angle) * b.radius * 0.3,
b.y - Math.sin(angle) * b.radius * 0.3,
b.radius * 0.1,
b.x, b.y, b.radius
);
nightGrad.addColorStop(0, 'rgba(0,0,0,0)');
nightGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
nightGrad.addColorStop(1, 'rgba(0,0,20,0.55)');
ctx.beginPath();
ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
ctx.fillStyle = nightGrad;
ctx.fill();
}

// ── Render ────────────────────────────────────────────────────────
function draw() {
ctx.fillStyle = 'rgba(2,2,10,0.18)';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.save();
ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
ctx.scale(camera.zoom, camera.zoom);

var i, s, p, b, t, grad, bodyGrad, glowR, lw;

// Nebulae (behind everything)
for (i = 0; i < nebulae.length; i++) {
drawNebula(nebulae[i]);
}

// Shockwaves
for (i = 0; i < shockwaves.length; i++) {
s = shockwaves[i];
ctx.beginPath();
ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba(s.color, s.life * 0.7);
ctx.lineWidth = (3 * s.life) / camera.zoom;
ctx.stroke();
}

// Particles
for (i = 0; i < particles.length; i++) {
p = particles[i];
ctx.beginPath();
ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
if (p.color.indexOf('hsl') === 0) {
ctx.fillStyle = p.color.replace('hsl(', 'hsla(').replace(')', ',' + p.alpha() + ')');
} else {
ctx.fillStyle = 'rgba(255,255,255,' + p.alpha() + ')';
}
ctx.fill();
}

// Rings behind bodies (back half)
for (i = 0; i < bodies.length; i++) {
b = bodies[i];
if (b.hasRings) {
ctx.save();
ctx.globalAlpha = 0.5;
drawRings(b);
ctx.globalAlpha = 1;
ctx.restore();
}
}

// Bodies
for (i = 0; i < bodies.length; i++) {
b = bodies[i];

// Lensing effect (behind the body visually)
if (b.type === 'blackhole') drawLensing(b);

// Trail
if (b.trail.length > 1 && trailLen > 0) {
for (t = 1; t < b.trail.length; t++) {
var trailAlpha = (t / b.trail.length) * 0.45;
lw = Math.max(0.5, (t / b.trail.length) * b.radius * 0.35);
ctx.beginPath();
ctx.moveTo(b.trail[t - 1].x, b.trail[t - 1].y);
ctx.lineTo(b.trail[t].x, b.trail[t].y);
ctx.strokeStyle = hexToRgba(b.glow, trailAlpha);
ctx.lineWidth = lw;
ctx.lineCap = 'round';
ctx.stroke();
}
}

// Outer glow
glowR = b.radius * (b.type === 'blackhole' ? 3 : 4);
grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, glowR);
grad.addColorStop(0, hexToRgba(b.glow, b.type === 'blackhole' ? 0.3 : 0.25));
grad.addColorStop(1, hexToRgba(b.glow, 0));
ctx.beginPath(); ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
ctx.fillStyle = grad; ctx.fill();

// Body surface
bodyGrad = ctx.createRadialGradient(b.x - b.radius * 0.3, b.y - b.radius * 0.3, 0, b.x, b.y, b.radius);
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

// Day/night on planets
if (b.type === 'planet') drawDayNight(b);

// Black hole accretion rings
if (b.type === 'blackhole') {
ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 1.7, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba('#9900ff', 0.45);
ctx.lineWidth = 2 / camera.zoom; ctx.stroke();
ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.3, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba('#cc44ff', 0.2);
ctx.lineWidth = 1 / camera.zoom; ctx.stroke();
}

// Star corona (color based on star class)
if (b.type === 'star') {
var flicker = 0.7 + Math.sin(simTime * 3 + b.x) * 0.3;
var corona = ctx.createRadialGradient(b.x, b.y, b.radius, b.x, b.y, b.radius * 2.5);
corona.addColorStop(0, hexToRgba(b.glow, 0.14 * flicker));
corona.addColorStop(1, hexToRgba(b.glow, 0));
ctx.beginPath(); ctx.arc(b.x, b.y, b.radius * 2.5, 0, Math.PI * 2);
ctx.fillStyle = corona; ctx.fill();
// Star class label (only when zoomed in enough)
if (camera.zoom > 1.5 && b.starClass) {
ctx.fillStyle = 'rgba(255,255,255,0.55)';
ctx.font = (b.radius * 0.7) + 'px Space Mono, monospace';
ctx.textAlign = 'center';
ctx.fillText(b.starClass, b.x, b.y + b.radius + 10 / camera.zoom);
}
}

// Comet tail
if (b.type === 'comet') {
var cspeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
if (cspeed > 0.01) {
var tx = -b.vx / cspeed, ty = -b.vy / cspeed;
var tailLen2 = Math.min(70, cspeed * 18);
var tailGrad = ctx.createLinearGradient(b.x, b.y, b.x + tx * tailLen2, b.y + ty * tailLen2);
tailGrad.addColorStop(0, hexToRgba(b.glow, 0.65));
tailGrad.addColorStop(1, hexToRgba(b.glow, 0));
ctx.beginPath();
ctx.moveTo(b.x, b.y);
ctx.lineTo(b.x + tx * tailLen2, b.y + ty * tailLen2);
ctx.strokeStyle = tailGrad;
ctx.lineWidth = b.radius * 0.8;
ctx.lineCap = 'round';
ctx.stroke();
}
}
}

// Rings in front of bodies (front half overlay)
for (i = 0; i < bodies.length; i++) {
b = bodies[i];
if (b.hasRings) {
ctx.save();
ctx.globalAlpha = 0.7;
// Clip to only show the top half of the ring (in front of planet)
ctx.beginPath();
ctx.rect(b.x - b.radius * 4, b.y - b.radius * 4, b.radius * 8, b.radius * 4);
ctx.clip();
drawRings(b);
ctx.restore();
}
}

// Drag arrow
if (isDragging && spawnMode === 'launch' && !isPanning) {
var ws = screenToWorld(dragStart.sx, dragStart.sy);
var we = screenToWorld(mouseScreen.x, mouseScreen.y);
var adx = we.x - ws.x, ady = we.y - ws.y;
var alen = Math.sqrt(adx * adx + ady * ady);
if (alen > 3) {
ctx.beginPath(); ctx.moveTo(ws.x, ws.y); ctx.lineTo(we.x, we.y);
ctx.strokeStyle = 'rgba(200,255,0,0.6)';
ctx.lineWidth = 1.5 / camera.zoom;
ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom]);
ctx.stroke(); ctx.setLineDash([]);
var angle = Math.atan2(ady, adx);
var hw = 10 / camera.zoom;
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

// Orbit preview
if (spawnMode === 'orbit') {
var wm = screenToWorld(mouseScreen.x, mouseScreen.y);
var nearest2 = null, nearestDist2 = Infinity;
for (i = 0; i < bodies.length; i++) {
var odx = bodies[i].x - wm.x, ody = bodies[i].y - wm.y;
var od = Math.sqrt(odx * odx + ody * ody);
if (od < nearestDist2 && bodies[i].mass > 20) { nearest2 = bodies[i]; nearestDist2 = od; }
}
if (nearest2 && nearestDist2 < 600) {
ctx.beginPath(); ctx.arc(nearest2.x, nearest2.y, nearestDist2, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(0,200,255,0.12)';
ctx.lineWidth = 1 / camera.zoom;
ctx.setLineDash([3 / camera.zoom, 5 / camera.zoom]);
ctx.stroke(); ctx.setLineDash([]);
ctx.beginPath(); ctx.arc(nearest2.x, nearest2.y, nearest2.radius * 2.5, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(0,200,255,0.3)';
ctx.lineWidth = 1.5 / camera.zoom; ctx.stroke();
}
}

ctx.restore();
}

// ── Input ─────────────────────────────────────────────────────────
var isDragging = false;
var dragStart = { sx: 0, sy: 0 };
var mouseScreen = { x: 0, y: 0 };

canvas.addEventListener('mousedown', function(e) {
if (e.button !== 0) return;
if (spawnMode === 'orbit') {
spawnInOrbit(e.clientX, e.clientY, spawnType);
} else {
dragStart = { sx: e.clientX, sy: e.clientY };
isDragging = true;
}
});

canvas.addEventListener('mousemove', function(e) {
mouseScreen = { x: e.clientX, y: e.clientY };
if (isPanning) {
camera.x = panCamStart.x + (e.clientX - panStart.x);
camera.y = panCamStart.y + (e.clientY - panStart.y);
}
});

canvas.addEventListener('mouseup', function(e) {
if (e.button === 1 || e.button === 2) {
isPanning = false;
canvas.style.cursor = 'crosshair';
return;
}
if (!isDragging) return;
isDragging = false;
var world = screenToWorld(dragStart.sx, dragStart.sy);
var dx = e.clientX - dragStart.sx;
var dy = e.clientY - dragStart.sy;
var velScale = 0.06 / camera.zoom;
var nb = new Body(world.x, world.y, dx * velScale, dy * velScale, spawnType);
// Assign rings to spawned planets
if (nb.type === 'planet' && shouldHaveRings(nb)) {
nb.hasRings = true;
nb.ringTilt = Math.random() * 0.5 + 0.1;
nb.ringColor = nb.color;
}
// Log star class
if (nb.type === 'star') {
logEvent('⭐ STAR SPAWNED — CLASS ' + nb.starClass, 'starclass', { cls: nb.starClass });
}
bodies.push(nb);
});

var touchDragStart = null;
canvas.addEventListener('touchstart', function(e) {
e.preventDefault();
var t = e.touches[0];
touchDragStart = { sx: t.clientX, sy: t.clientY };
mouseScreen = { x: t.clientX, y: t.clientY };
if (spawnMode !== 'orbit') isDragging = true;
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
e.preventDefault();
var t = e.touches[0];
mouseScreen = { x: t.clientX, y: t.clientY };
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
e.preventDefault();
isDragging = false;
var t = e.changedTouches[0];
if (spawnMode === 'orbit') {
spawnInOrbit(t.clientX, t.clientY, spawnType);
} else if (touchDragStart) {
var world = screenToWorld(touchDragStart.sx, touchDragStart.sy);
var dx = t.clientX - touchDragStart.sx;
var dy = t.clientY - touchDragStart.sy;
var velScale = 0.06 / camera.zoom;
bodies.push(new Body(world.x, world.y, dx * velScale, dy * velScale, spawnType));
}
touchDragStart = null;
}, { passive: false });

// ── UI ─────────────────────────────────────────────────────────────
function setType(type, el) {
spawnType = type;
var btns = document.querySelectorAll('.type-btn');
for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
el.classList.add('active');
}

function setSpawnMode(mode) {
spawnMode = mode;
var launchBtn = document.getElementById('mode-launch-btn');
var orbitBtn = document.getElementById('mode-orbit-btn');
if (mode === 'launch') {
launchBtn.classList.add('active');
orbitBtn.classList.remove('active');
orbitBtn.classList.remove('orbit-active');
} else {
launchBtn.classList.remove('active');
orbitBtn.classList.remove('active');
orbitBtn.classList.add('orbit-active');
}
document.getElementById('orbit-hint').classList.toggle('visible', mode === 'orbit');
document.getElementById('hint').style.opacity = mode === 'orbit' ? '0' : '';
}

function updateSlider(name, val) {
var v = parseFloat(val);
if (name === 'gravity') {
G = v / 10;
document.getElementById('v-gravity').textContent = G.toFixed(1);
} else if (name === 'damping') {
damping = v / 1000;
document.getElementById('v-damping').textContent = damping.toFixed(3);
} else if (name === 'trail') {
trailLen = parseInt(val);
document.getElementById('v-trail').textContent = trailLen;
} else if (name === 'zoom') {
camera.zoom = v / 100;
document.getElementById('v-zoom').textContent = Math.round(v) + '%';
document.getElementById('s-zoom').textContent = Math.round(v);
} else if (name === 'spawnRadius') {
customRadius = parseInt(val);
document.getElementById('v-spawnRadius').textContent = customRadius;
} else if (name === 'spawnMass') {
customMass = parseInt(val);
document.getElementById('v-spawnMass').textContent = customMass === 0 ? 'auto' : customMass;
} else if (name === 'timewarp') {
timeWarp = v;
document.getElementById('v-timewarp').textContent = v.toFixed(1) + 'x';
}
}

function togglePause() {
paused = !paused;
var btn = document.getElementById('pause-btn');
btn.textContent = paused ? '▶ RESUME' : '⏸ PAUSE';
btn.classList.toggle('active', paused);
}

function clearAll() {
bodies = []; particles = []; shockwaves = []; nebulae = [];
ctx.clearRect(0, 0, canvas.width, canvas.height);
}

var panelCollapsed = false;
function togglePanel() {
panelCollapsed = !panelCollapsed;
document.getElementById('panel').classList.toggle('collapsed', panelCollapsed);
document.getElementById('panel-toggle-icon').textContent = panelCollapsed ? '▶' : '◀';
}

// ── Presets ────────────────────────────────────────────────────────
function spawnChaos() {
var types = ['planet', 'star', 'comet', 'planet', 'planet', 'comet', 'asteroid'];
var ww = canvas.width / camera.zoom;
var wh = canvas.height / camera.zoom;
for (var i = 0; i < 30; i++) {
var x = (Math.random() - 0.5) * ww;
var y = (Math.random() - 0.5) * wh;
var tp = types[Math.floor(Math.random() * types.length)];
bodies.push(new Body(x, y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, tp));
}
logEvent('💥 CHAOS MODE ACTIVATED', null, null);
}

function spawnOrbit() {
clearAll();
var star = new Body(0, 0, 0, 0, 'star');
star.starClass = 'G';
star.mass = 800; star.radius = 22; star.vx = 0; star.vy = 0;
star.color = starClassColors['G']; star.glow = starClassGlows['G'];
bodies.push(star);

var orbits = [90, 160, 240, 330, 430];
var cols = ['#6eb5ff', '#ffaa44', '#44ff88', '#ff4488', '#bb88ff'];
var hasRingsArr = [false, false, true, false, true];
for (var i = 0; i < orbits.length; i++) {
var r = orbits[i];
var angle = Math.random() * Math.PI * 2;
var speed = Math.sqrt(G * star.mass / r) * 0.97;
var planet = new Body(
Math.cos(angle) * r, Math.sin(angle) * r,
-Math.sin(angle) * speed, Math.cos(angle) * speed,
'planet'
);
planet.color = cols[i];
planet.radius = 5 + i * 1.8;
planet.mass = 4 + i * 3;
if (hasRingsArr[i]) {
planet.hasRings = true;
planet.ringTilt = 0.25 + Math.random() * 0.2;
planet.ringColor = cols[i];
}
bodies.push(planet);
}
// Add asteroid belt between orbits 2 and 3
spawnAsteroidBeltAt(195, 30, star);
resetView();
logEvent('🌞 SOLAR SYSTEM SPAWNED', null, null);
}

function spawnAsteroidBeltAt(radius, count, centralBody) {
for (var i = 0; i < count; i++) {
var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
var r = radius + (Math.random() - 0.5) * 30;
var speed = Math.sqrt(G * centralBody.mass / r) * (0.95 + Math.random() * 0.1);
var asteroid = new Body(
centralBody.x + Math.cos(angle) * r,
centralBody.y + Math.sin(angle) * r,
-Math.sin(angle) * speed + centralBody.vx,
Math.cos(angle) * speed + centralBody.vy,
'asteroid'
);
bodies.push(asteroid);
}
logEvent('🪨 ASTEROID BELT SPAWNED', null, null);
}

function spawnAsteroidBelt() {
// Find a suitable central star or use origin
var central = null;
for (var i = 0; i < bodies.length; i++) {
if (bodies[i].type === 'star' || bodies[i].type === 'blackhole') { central = bodies[i]; break; }
}
if (!central) {
logEvent('⚠ NO STAR FOUND — ADD A STAR FIRST', null, null);
return;
}
spawnAsteroidBeltAt(200 + Math.random() * 100, 40, central);
}

function spawnBinaryStars() {
clearAll();
var d = 130;
var starMass = 300;
var mutualSpeed = Math.sqrt(G * starMass / (2 * d)) * 0.95;
var s1 = new Body(-d, 0, 0, -mutualSpeed, 'star');
s1.starClass = 'B'; s1.mass = starMass; s1.radius = 18; s1.isHeavy = false;
s1.color = starClassColors['B']; s1.glow = starClassGlows['B'];
var s2 = new Body(d, 0, 0, mutualSpeed, 'star');
s2.starClass = 'M'; s2.mass = starMass; s2.radius = 18; s2.isHeavy = false;
s2.color = starClassColors['M']; s2.glow = starClassGlows['M'];
bodies.push(s1, s2);
for (var i = 0; i < 3; i++) {
var r = 300 + i * 80;
var angle = Math.random() * Math.PI * 2;
var speed = Math.sqrt(G * (s1.mass + s2.mass) / r) * 0.95;
var planet = new Body(
Math.cos(angle) * r, Math.sin(angle) * r,
-Math.sin(angle) * speed, Math.cos(angle) * speed,
'planet'
);
planet.mass = 6; planet.radius = 6;
if (i === 1) { planet.hasRings = true; planet.ringTilt = 0.3; planet.ringColor = planet.color; }
bodies.push(planet);
}
resetView();
logEvent('⭐ BINARY STAR SYSTEM SPAWNED', null, null);
}

function spawnBlackHoleSystem() {
clearAll();
var bh = new Body(0, 0, 0, 0, 'blackhole');
bh.mass = 1200; bh.radius = 20;
bodies.push(bh);
for (var i = 0; i < 5; i++) {
var r = 100 + i * 80;
var angle = (i / 5) * Math.PI * 2;
var speed = Math.sqrt(G * bh.mass / r) * 0.97;
var planet = new Body(
Math.cos(angle) * r, Math.sin(angle) * r,
-Math.sin(angle) * speed, Math.cos(angle) * speed,
'planet'
);
planet.radius = 5 + Math.random() * 5;
planet.mass = 5 + Math.random() * 10;
if (i === 2) { planet.hasRings = true; planet.ringTilt = 0.28; planet.ringColor = planet.color; }
bodies.push(planet);
}
for (var j = 0; j < 3; j++) {
var cr = 200 + Math.random() * 200;
var ca = Math.random() * Math.PI * 2;
var cs = Math.sqrt(G * bh.mass / cr) * (0.6 + Math.random() * 0.6);
var comet = new Body(
Math.cos(ca) * cr, Math.sin(ca) * cr,
-Math.sin(ca) * cs * 0.8, Math.cos(ca) * cs * 1.2,
'comet'
);
bodies.push(comet);
}
resetView();
logEvent('🕳️ BLACK HOLE SYSTEM SPAWNED', null, null);
}

// ── Stats & Loop ──────────────────────────────────────────────────
function updateStats() {
document.getElementById('s-bodies').textContent = bodies.length;
document.getElementById('s-nova').textContent = novaCount;
document.getElementById('s-time').textContent = simTime.toFixed(1);
document.getElementById('s-zoom').textContent = Math.round(camera.zoom * 100);
}

var last = null;
function loop(ts) {
if (!last) last = ts;
var dt = Math.min((ts - last) / 16.67, 3);
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