// presets.js — one-shot preset scenarios (solar system, binary stars, black hole, pulsar, etc.)

//some presets

function spawnChaos() {
var types = ['planet', 'star', 'comet', 'planet', 'planet', 'comet', 'asteroid'];
var worldWidth = canvas.width / camera.zoom, wh = canvas.height / camera.zoom;
for (var i = 0; i < 30; i++) {
bodies.push(new Body((Math.random() - 0.5) * worldWidth, (Math.random() - 0.5) * wh, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, types[Math.floor(Math.random() * types.length)]));
}
logEvent('💥 CHAOS MODE ACTIVATED', null, null);
}

function spawnOrbit() {
clearAll();
var star = new Body(0, 0, 0, 0, 'star');

star.starClass = 'G'; star.mass = 500; star.radius = 22; star.vx = 0; star.vy = 0;
star.color = starClassColors['G']; star.glow = starClassGlows['G'];
bodies.push(star);

var orbits = [95, 140, 195, 270, 355, 450, 555, 680];
var cols = ['#aaa39b', '#d69262', '#4e89cf', '#c76853', '#d2a46d', '#d8c895', '#8ac9c2', '#5b70c7'];
var radii = [3.2, 3.8, 4.6, 5.2, 9.5, 8.2, 7.2, 7.0];
var masses = [0.03, 0.05, 0.08, 0.12, 0.35, 0.25, 0.20, 0.18];
var hasRingsArr = [false, false, false, false, false, true, true, false];
var systemPx = 0, systemPy = 0;
orbitGuides = orbits.map(function(radius) { return { primary: star, radius: radius }; });
for (var i = 0; i < orbits.length; i++) {
var r = orbits[i], angle = Math.random() * Math.PI * 2;
var speed = Math.sqrt(G * (star.mass + masses[i]) / r);
var planet = new Body(Math.cos(angle) * r, Math.sin(angle) * r, -Math.sin(angle) * speed, Math.cos(angle) * speed, 'planet');
planet.color = cols[i]; planet.radius = radii[i]; planet.mass = masses[i];

planet.rocheDensity = 0.12;
if (hasRingsArr[i]) { planet.hasRings = true; planet.ringTilt = 0.25 + Math.random() * 0.2; planet.ringColor = cols[i]; }
bodies.push(planet);
}
spawnAsteroidBeltAt(230, 25, star, true);

systemPx = 0;
systemPy = 0;
for (var p = 1; p < bodies.length; p++) {
systemPx += bodies[p].mass * bodies[p].vx;
systemPy += bodies[p].mass * bodies[p].vy;
}
star.vx = -systemPx / star.mass;
star.vy = -systemPy / star.mass;
resetView();
logEvent('🌞 SOLAR SYSTEM SPAWNED', null, null);
}

function spawnAsteroidBeltAt(radius, count, centralBody, stable) {
   for (var i = 0; i < count; i++) {
       var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
       var r = radius + (Math.random() - 0.5) * (stable ? 16 : 30);
        var speed = Math.sqrt(G * centralBody.mass / r) * (stable ? 1 : (0.95 + Math.random() * 0.1));
       var asteroid = new Body(centralBody.x + Math.cos(angle) * r, centralBody.y + Math.sin(angle) * r, -Math.sin(angle) * speed + centralBody.vx, Math.cos(angle) * speed + centralBody.vy, 'asteroid');
    if (stable) { asteroid.mass = 0.02; asteroid.radius = 1.2; }
    bodies.push(asteroid);
    }
}

function spawnAsteroidBelt() {
var central = null;
for (var i = 0; i < bodies.length; i++) { if (bodies[i].type === 'star' || bodies[i].type === 'blackhole') { central = bodies[i]; break; } }
if (!central) { logEvent('⚠ ADD A STAR FIRST', null, null); return; }
spawnAsteroidBeltAt(200 + Math.random() * 100, 40, central);
logEvent('🪨 ASTEROID BELT SPAWNED', null, null);
}

function spawnBinaryStars() {
clearAll();
var d = 130, starMass = 300;
var mutualSpeed = Math.sqrt(G * starMass / (2 * d)) * 0.95;
var s1 = new Body(-d, 0, 0, -mutualSpeed, 'star');
s1.starClass = 'B'; s1.mass = starMass; s1.radius = 18; s1.isHeavy = false;
s1.color = starClassColors['B']; s1.glow = starClassGlows['B'];
var s2 = new Body(d, 0, 0, mutualSpeed, 'star');
s2.starClass = 'M'; s2.mass = starMass; s2.radius = 18; s2.isHeavy = false;
s2.color = starClassColors['M']; s2.glow = starClassGlows['M'];
bodies.push(s1, s2);
for (var i = 0; i < 3; i++) {
var r = 300 + i * 80, angle = Math.random() * Math.PI * 2;
var speed = Math.sqrt(G * (s1.mass + s2.mass) / r) * 0.95;
var planet = new Body(Math.cos(angle) * r, Math.sin(angle) * r, -Math.sin(angle) * speed, Math.cos(angle) * speed, 'planet');
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
bh.mass = 1200; bh.radius = 20; bodies.push(bh);
for (var i = 0; i < 5; i++) {
var r = 100 + i * 80, angle = (i / 5) * Math.PI * 2;
var speed = Math.sqrt(G * bh.mass / r) * 0.97;
var planet = new Body(Math.cos(angle) * r, Math.sin(angle) * r, -Math.sin(angle) * speed, Math.cos(angle) * speed, 'planet');
planet.radius = 5 + Math.random() * 5; planet.mass = 5 + Math.random() * 10;
if (i === 2) { planet.hasRings = true; planet.ringTilt = 0.28; planet.ringColor = planet.color; }
bodies.push(planet);
}
for (var j = 0; j < 3; j++) {
var cr = 200 + Math.random() * 200, ca = Math.random() * Math.PI * 2;
var cs = Math.sqrt(G * bh.mass / cr) * (0.6 + Math.random() * 0.6);
bodies.push(new Body(Math.cos(ca) * cr, Math.sin(ca) * cr, -Math.sin(ca) * cs * 0.8, Math.cos(ca) * cs * 1.2, 'comet'));
}
resetView();
logEvent('🕳️ BLACK HOLE SYSTEM SPAWNED', null, null);
}

//  Fig-Eight 
function spawnFigureEight() {
clearAll();

var m = 120;
var scale = 180;
var vscale = 1.8;

var pos = [
{ x: -0.97000436, y: 0.24308753 },
{ x: 0.97000436, y: -0.24308753 },
{ x: 0, y: 0 }
 ];

var vel = [
{ vx: 0.93240737 / 2, vy: 0.86473146 / 2 },
{ vx: 0.93240737 / 2, vy: 0.86473146 / 2 },
{ vx: -0.93240737, vy: -0.86473146 }
 ];
var colors = ['#ff6644', '#44aaff', '#88ff44'];
for (var i = 0; i < 3; i++) {
var currentBody = new Body(pos[i].x * scale, pos[i].y * scale, vel[i].vx * vscale, vel[i].vy * vscale, 'star');
currentBody.mass = m; currentBody.radius = 14; currentBody.isHeavy = false;
currentBody.starClass = (i === 0 ? 'M' : (i === 1 ? 'B' : 'G'));
currentBody.color = colors[i];
currentBody.glow = colors[i];
bodies.push(currentBody);
}
resetView();
logEvent('∞ FIGURE-8 ORBIT SPAWNED', null, null);
}

//  Rogue Flyby 
function spawnRogueFlyby() {

if (bodies.length === 0) spawnOrbit();

var cx = 0, cy = 0, tm = 0;
for (var i = 0; i < bodies.length; i++) { cx += bodies[i].x * bodies[i].mass; cy += bodies[i].y * bodies[i].mass; tm += bodies[i].mass; }
if (tm > 0) { cx /= tm; cy /= tm; }

var rogue = new Body(cx - 800, cy + (Math.random() - 0.5) * 200, 3.5 + Math.random() * 1.5, (Math.random() - 0.5) * 0.8, 'star');
rogue.starClass = 'O';
rogue.mass = 180;
rogue.radius = 16;
rogue.isHeavy = false;
rogue.color = starClassColors['O'];
rogue.glow = starClassGlows['O'];
bodies.push(rogue);
logEvent('☄️ ROGUE STAR FLYBY', null, null);
}


function spawnGalaxyCollision() {
clearAll();
var galaxies = [
{ cx: -320, cy: -80, vx: 1.1, vy: 0.3, starCount: 2, planetCount: 8, starMass: 350 },
{ cx: 320, cy: 80, vx: -1.1, vy: -0.3, starCount: 2, planetCount: 8, starMass: 350 }
 ];
var starCls = [['G', 'K'], ['B', 'M']];
for (var g = 0; g < 2; g++) {
var gx = galaxies[g];

for (var s = 0; s < gx.starCount; s++) {
var offset = (s - 0.5) * 40;
var st = new Body(gx.cx + offset, gx.cy + offset * 0.3, gx.vx, gx.vy, 'star');
st.starClass = starCls[g][s % 2];
st.mass = gx.starMass; st.radius = 18; st.isHeavy = false;
st.color = starClassColors[st.starClass]; st.glow = starClassGlows[st.starClass];
bodies.push(st);
}

for (var p = 0; p < gx.planetCount; p++) {
var orbitR = 80 + p * 35;
var ang = (p / gx.planetCount) * Math.PI * 2 + Math.random() * 0.4;
var spd = Math.sqrt(G * gx.starMass * gx.starCount / orbitR) * 0.9;
var planet = new Body(
gx.cx + Math.cos(ang) * orbitR,
gx.cy + Math.sin(ang) * orbitR,
gx.vx - Math.sin(ang) * spd,
gx.vy + Math.cos(ang) * spd,
'planet'
);
planet.mass = 5 + Math.random() * 8; planet.radius = 4 + Math.random() * 4;
bodies.push(planet);
}
// A few comets
for (var c = 0; c < 3; c++) {
var cr = 300 + Math.random() * 100, ca = Math.random() * Math.PI * 2;
var comet = new Body(gx.cx + Math.cos(ca) * cr, gx.cy + Math.sin(ca) * cr, gx.vx + (Math.random() - 0.5) * 2, gx.vy + (Math.random() - 0.5) * 2, 'comet');
bodies.push(comet);
}
}
resetView();
logEvent('🌌 GALAXY COLLISION INCOMING', null, null);
}


function spawnPulsar() {
clearAll();
// pulras star
var pulsar = new Body(0, 0, 0, 0, 'pulsar');
pulsar.mass = 200; pulsar.radius = 7;
pulsar.pulsarAngle = 0; pulsar.pulsarPhase = 0;
bodies.push(pulsar);

var orbits = [90, 160, 240, 340];
var cols = ['#aaddff', '#ffcc88', '#88ffcc', '#ff88cc'];
for (var i = 0; i < orbits.length; i++) {
  var r = orbits[i], angle = Math.random() * Math.PI * 2;
  var speed = Math.sqrt(G * pulsar.mass / r) * 0.97;
    var planet = new Body(Math.cos(angle) * r, Math.sin(angle) * r, -Math.sin(angle) * speed, Math.cos(angle) * speed, 'planet');
planet.color = cols[i]; planet.radius = 4 + i * 1.5; planet.mass = 3 + i * 2;
bodies.push(planet);
}


// Debris field close in
for (var j = 0; j < 15; j++) {
   var dr = 45 + Math.random() * 25, da = Math.random() * Math.PI * 2;
   var dspeed = Math.sqrt(G * pulsar.mass / dr) * (0.9 + Math.random() * 0.2);
    var debris = new Body(Math.cos(da) * dr, Math.sin(da) * dr, -Math.sin(da) * dspeed, Math.cos(da) * dspeed, 'asteroid');
debris.mass = 0.8; debris.radius = 2;
bodies.push(debris);
}
resetView();
logEvent('💫 PULSAR SYSTEM SPAWNED', 'pulsar', {});
}
