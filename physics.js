// physics.js — simulation rules: gravity, collisions, roche-limit teardown, orbit placement

//supanova
function triggerSupernova(x, y, mass, color) {
novaCount++;
logEvent('💥 SUPERNOVA', 'supernova', { x: x, y: y, mass: mass });
var flash = document.getElementById('flash');
flash.style.opacity = '0.4';
setTimeout(function() { flash.style.opacity = '0'; }, 130);
shockwaves.push(new Shockwave(x, y, mass * 3.5, '#fff8e0'));
shockwaves.push(new Shockwave(x, y, mass * 2.5, '#ff8800'));
shockwaves.push(new Shockwave(x, y, mass * 1.5, '#ff2200'));
nebulae.push(new Nebula(x, y, color || '#ff6600'));
nebulae.push(new Nebula(x, y, '#4466ff'));
var i, angle, speed, hue;
var count = Math.min(60, Math.floor(40 + mass * 0.1));
for (i = 0; i < count; i++) {
angle = Math.random() * Math.PI * 2; speed = 1 + Math.random() * 10;
hue = Math.random() < 0.5 ? 'hsl(' + (20 + Math.random() * 40) + ',100%,70%)' : 'hsl(' + (200 + Math.random() * 60) + ',80%,80%)';
particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, hue, 70 + Math.random() * 80, 1 + Math.random() * 3));
}
for (i = 0; i < 25; i++) {
var a2 = Math.random() * Math.PI * 2, s2 = 5 + Math.random() * 14;
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

// roche limit 
function checkRocheLimit(i, j) {
var firstBody = bodies[i], secondBody = bodies[j];
if (firstBody.dead || secondBody.dead || firstBody.type === 'asteroid' || secondBody.type === 'asteroid') return false;
var bigger, smaller;
if (firstBody.mass > secondBody.mass * 5) { bigger = firstBody; smaller = secondBody; }
else if (secondBody.mass > firstBody.mass * 5) { bigger = secondBody; smaller = firstBody; }
else return false;
var deltaX = smaller.x - bigger.x, deltaY = smaller.y - bigger.y;
var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

var biggerDensity = bigger.rocheDensity || (bigger.mass / Math.pow(bigger.radius, 3));
var smallerDensity = smaller.rocheDensity || (smaller.mass / Math.pow(smaller.radius, 3));
var rocheLimit = bigger.radius * 2.44 * Math.cbrt(biggerDensity / smallerDensity);
if (distance < rocheLimit && distance > bigger.radius + smaller.radius) {
return { bigger: bigger, smaller: smaller };
}
return false;
}

function triggerRocheTeardown(smaller, bigger) {
smaller.dead = true;
var survivingBodies = [];
for (var k = 0; k < bodies.length; k++) { if (!bodies[k].dead) survivingBodies.push(bodies[k]); }
bodies = survivingBodies;
logEvent('💫 ROCHE LIMIT — TORN APART', 'roche', {});
var count = Math.min(5, 3 + Math.floor(smaller.mass * 0.2));
for (var i = 0; i < count; i++) {   
var baseAngle = Math.atan2(smaller.y - bigger.y, smaller.x - bigger.x);
var spread = (Math.random() - 0.5) * Math.PI * 0.6;
var angle = baseAngle + spread;
var speed = 0.8 + Math.random() * 2.5;
var debris = new Body(
smaller.x + (Math.random() - 0.5) * smaller.radius * 3,
smaller.y + (Math.random() - 0.5) * smaller.radius * 3,
smaller.vx + Math.cos(angle) * speed, smaller.vy + Math.sin(angle) * speed, 'asteroid'
);
bodies.push(debris);
}
for (var j = 0; j < 67; j++) {
var pa = Math.random() * Math.PI * 2, ps = 1 + Math.random() * 3;
particles.push(new Particle(smaller.x, smaller.y, Math.cos(pa) * ps, Math.sin(pa) * ps, smaller.color, 25 + Math.random() * 25, 1 + Math.random() * 2));

}
}





// Collision
function handleCollision(i, j) {
var firstBody = bodies[i], secondBody = bodies[j];
if (firstBody.dead || secondBody.dead) return;
var bothStars = (firstBody.type === 'star' && secondBody.type === 'star');
var starHitsBH = (firstBody.type === 'star' && secondBody.type === 'blackhole') || (firstBody.type === 'blackhole' && secondBody.type === 'star');
var totalMass = firstBody.mass + secondBody.mass;
var nx = (firstBody.x * firstBody.mass + secondBody.x * secondBody.mass) / totalMass;
var ny = (firstBody.y * firstBody.mass + secondBody.y * secondBody.mass) / totalMass;
var nvx = (firstBody.vx * firstBody.mass + secondBody.vx * secondBody.mass) / totalMass;
var nvy = (firstBody.vy * firstBody.mass + secondBody.vy * secondBody.mass) / totalMass;
firstBody.dead = true; secondBody.dead = true;
if (selectedBody === firstBody || selectedBody === secondBody) deselectBody();
var survivingBodies = [];
for (var k = 0; k < bodies.length; k++) { if (!bodies[k].dead) survivingBodies.push(bodies[k]); }
bodies = survivingBodies;

if (bothStars) {
triggerSupernova(nx, ny, totalMass, firstBody.color);
} else if (starHitsBH) {
logEvent('🌀 TIDAL DISRUPTION', 'tidal', { mass: totalMass });
var bh = (firstBody.type === 'blackhole') ? firstBody : secondBody;
var newBH = new Body(nx, ny, nvx, nvy, 'blackhole');
newBH.mass = totalMass; newBH.radius = Math.cbrt(Math.pow(bh.radius, 3) + 60);
for (var p = 0; p < 50; p++) {
var pa2 = Math.random() * Math.PI * 2, ps2 = 2 + Math.random() * 6;
particles.push(new Particle(nx, ny, Math.cos(pa2) * ps2, Math.sin(pa2) * ps2, 'hsl(' + (280 + Math.random() * 60) + ',100%,70%)', 60 + Math.random() * 60, 1.5));
}
bodies.push(newBH);
} else {
var bigger = (firstBody.mass >= secondBody.mass) ? firstBody : secondBody;
var smaller = (firstBody.mass < secondBody.mass) ? firstBody : secondBody;
var merged = new Body(nx, ny, nvx, nvy, bigger.type);
merged.mass = totalMass;
merged.radius = Math.cbrt(Math.pow(firstBody.radius, 3) + Math.pow(secondBody.radius, 3));
merged.color = bigger.color; merged.glow = bigger.glow; merged.starClass = bigger.starClass;
if (merged.type === 'planet' && merged.mass > 12) { merged.hasRings = true; merged.ringTilt = Math.random() * 0.5 + 0.1; merged.ringColor = bigger.color; }
for (var spawnParticle = 0; spawnParticle < 20; spawnParticle++) {
var particleAngle = Math.random() * Math.PI * 2, particleSpeed = 1 + Math.random() * 4;
particles.push(new Particle(nx, ny, Math.cos(particleAngle) * particleSpeed, Math.sin(particleAngle) * particleSpeed, smaller.color, 20 + Math.random() * 30, 1 + Math.random() * 2));
}
if (bigger.type === 'blackhole') logEvent('🕳️ BH ABSORBED BODY', 'absorbed', { mass: totalMass });
else logEvent('🔵 BODIES MERGED', 'merge', { mass: totalMass, radius: merged.radius });
bodies.push(merged);
}
}

// helperss orbit
function spawnInOrbit(screenX, screenY, type) {
var world = screenToWorld(screenX, screenY);
var x = world.x, y = world.y;
var nearest = null, nearestDist = Infinity;
for (var i = 0; i < bodies.length; i++) {
var deltaX = bodies[i].x - x, deltaY = bodies[i].y - y;
var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
if (distance < nearestDist && bodies[i].mass > 20) { nearest = bodies[i]; nearestDist = distance; }
}
if (!nearest || nearestDist < nearest.radius * 1.5) {
bodies.push(new Body(x, y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, type));
return;
}
var dx = x - nearest.x, dy = y - nearest.y;
var d = Math.sqrt(dx * dx + dy * dy);
var speed = Math.sqrt(G * nearest.mass / d);
var vx = (-dy / d) * speed + nearest.vx;
var vy = (dx / d) * speed + nearest.vy;
var newBody = new Body(x, y, vx, vy, type);
if (newBody.type === 'planet' && shouldHaveRings(newBody)) { newBody.hasRings = true; newBody.ringTilt = Math.random() * 0.5 + 0.1; newBody.ringColor = newBody.color; }
bodies.push(newBody);
logEvent('🪐 ORBIT INSERTED', 'orbit', { distance: d, speed: speed });
}

function updateDayNight() {
var i, j, currentBody, star, deltaX, deltaY, distance, bestDist;
for (i = 0; i < bodies.length; i++) {
currentBody = bodies[i];
if (currentBody.type !== 'planet') continue;
bestDist = Infinity;
for (j = 0; j < bodies.length; j++) {
star = bodies[j];
if (star.type !== 'star') continue;
deltaX = star.x - currentBody.x; deltaY = star.y - currentBody.y; distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
if (distance < bestDist) { bestDist = distance; currentBody.nearestStarAngle = Math.atan2(deltaY, deltaX); }
}
}
}


function step(dt) {
if (paused) return;
simTime += dt * 0.016;
var i, j, currentBody, otherBody, deltaX, deltaY, distSq, minDist, distance, force, forceX, forceY;

for (i = 0; i < bodies.length; i++) {
currentBody = bodies[i];
currentBody.trail.push({ x: currentBody.x, y: currentBody.y });
if (currentBody.trail.length > trailLen) currentBody.trail.shift();

if (currentBody.type === 'pulsar') {
currentBody.pulsarAngle += dt * 0.18;
currentBody.pulsarPhase += dt * 0.05;
}
}

for (i = 0; i < bodies.length; i++) {
forceX = 0; forceY = 0;
currentBody = bodies[i];
if (currentBody.dead) continue;

for (j = 0; j < bodies.length; j++) {
if (i === j) continue;
otherBody = bodies[j]; if (otherBody.dead) continue;
deltaX = otherBody.x - currentBody.x; deltaY = otherBody.y - currentBody.y; distSq = deltaX * deltaX + deltaY * deltaY;


minDist = (currentBody.radius + otherBody.radius) * 0.85;
if (distSq < minDist * minDist) {
if (!currentBody.dead && !otherBody.dead) { handleCollision(i, j); return; }
continue;
}
var rocheResult = checkRocheLimit(i, j);
if (rocheResult) { triggerRocheTeardown(rocheResult.smaller, rocheResult.bigger); return; }
var softening = 100;
distance = Math.sqrt(distSq + softening);
force = G * currentBody.mass * otherBody.mass / (distSq + softening);
force *= otherBody.gravityMult;
forceX += force * deltaX / distance; forceY += force * deltaY / distance;
}

for (j = 0; j < gravityWells.length; j++) {
var well = gravityWells[j];
deltaX = well.x - currentBody.x; deltaY = well.y - currentBody.y; distSq = deltaX * deltaX + deltaY * deltaY;
var softDist = Math.sqrt(distSq + 100);
var wforce = well.strength * currentBody.mass / (distSq + 100);
forceX += wforce * deltaX / softDist; forceY += wforce * deltaY / softDist;
}

// stars movement and blqck hole too
currentBody.vx += (forceX / currentBody.mass) * dt; currentBody.vy += (forceY / currentBody.mass) * dt;
currentBody.vx *= damping; currentBody.vy *= damping;
}

for (i = 0; i < bodies.length; i++) { bodies[i].x += bodies[i].vx * dt; bodies[i].y += bodies[i].vy * dt; }

var aliveP = [];
for (i = 0; i < particles.length; i++) { particles[i].update(dt); if (particles[i].isAlive()) aliveP.push(particles[i]); }
particles = aliveP;

var aliveW = [];
for (i = 0; i < shockwaves.length; i++) { shockwaves[i].update(dt); if (shockwaves[i].isAlive()) aliveW.push(shockwaves[i]); }
shockwaves = aliveW;

var aliveN = [];
for (i = 0; i < nebulae.length; i++) { nebulae[i].update(dt); if (nebulae[i].isAlive()) aliveN.push(nebulae[i]); }
nebulae = aliveN;

var escapeMargin = 4000;
var survivingBodies = [];
for (i = 0; i < bodies.length; i++) {
currentBody = bodies[i];
if (currentBody.x > -escapeMargin && currentBody.x < escapeMargin && currentBody.y > -escapeMargin && currentBody.y < escapeMargin) survivingBodies.push(currentBody);
else if (currentBody === selectedBody) deselectBody();
}
if (survivingBodies.length > 120) {
survivingBodies.sort(function(currentBody, otherBody) { return otherBody.mass - currentBody.mass; });
survivingBodies = survivingBodies.slice(0, 120);
if (selectedBody && survivingBodies.indexOf(selectedBody) === -1) deselectBody();
}
bodies = survivingBodies;

if (frameCount % 30 === 0) updateDayNight();
}
