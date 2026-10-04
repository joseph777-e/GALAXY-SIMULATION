// rendering.js — all canvas drawing: bodies, trails, rings, lensing, pulsar beams, particles, shockwaves

// Helpers 
function hexToRgba(hex, alpha) {
if (!hex) return 'rgba(200,200,200,' + alpha + ')';
if (hex.indexOf('hsl') === 0) return hex.replace('hsl(', 'hsla(').replace(')', ',' + alpha + ')');
if (hex === '#111' || hex === '#000') return 'rgba(10,10,10,' + alpha + ')';
if (hex.charAt(0) === '#' && hex.length === 7) {
var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), bv = parseInt(hex.slice(5, 7), 16);
return 'rgba(' + r + ',' + g + ',' + bv + ',' + alpha + ')';
}
return 'rgba(200,200,200,' + alpha + ')';
}

function lighten(color) {
    if (color.indexOf('hsl') === 0) {
        return color.replace(/(\d+)%\)$/, function(m, p) {
            return Math.min(100, parseInt(p) + 22) + '%)';
        });
    }
    return color;
}

// ringssss
function drawRings(currentBody) {
var tilt = currentBody.ringTilt || 0.25;
var innerR = currentBody.radius * 1.5, outerR = currentBody.radius * 2.6;
var color = currentBody.ringColor || currentBody.color;
ctx.save(); ctx.translate(currentBody.x, currentBody.y); ctx.scale(1, tilt);
ctx.beginPath(); ctx.arc(0, 0, outerR, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba(color, 0.35); ctx.lineWidth = (outerR - innerR) * 0.5; ctx.stroke();
ctx.beginPath(); ctx.arc(0, 0, innerR + (outerR - innerR) * 0.25, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba(color, 0.2); ctx.lineWidth = (outerR - innerR) * 0.35; ctx.stroke();
ctx.restore();
}


function drawLensing(currentBody) {
if (currentBody.type !== 'blackhole') return;
var lensR = currentBody.radius * 5;
for (var s = 0; s < 3; s++) {
var fr = (s + 1) / 3;
var ringR = currentBody.radius * 2.5 + fr * (lensR - currentBody.radius * 2.5);
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, ringR, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(180,100,255,' + ((1 - fr) * 0.12) + ')';
ctx.lineWidth = (1 + (1 - fr) * 3) / camera.zoom; ctx.stroke();
}
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, currentBody.radius * 3.2, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2 / camera.zoom; ctx.stroke();
}


function drawPulsarBeams(currentBody) {
var beamLen = 160;
var beamWidth = 8;
// Two opposite beams that rotate
for (var beam = 0; beam < 2; beam++) {
var angle = currentBody.pulsarAngle + beam * Math.PI;
var pulse = 0.4 + 0.6 * Math.abs(Math.sin(currentBody.pulsarPhase * 6 + beam * Math.PI));
var grad = ctx.createLinearGradient(
currentBody.x, currentBody.y,
currentBody.x + Math.cos(angle) * beamLen,
currentBody.y + Math.sin(angle) * beamLen
);
grad.addColorStop(0, 'rgba(100,220,255,' + (0.9 * pulse) + ')');
grad.addColorStop(0.3, 'rgba(60,160,255,' + (0.5 * pulse) + ')');
grad.addColorStop(1, 'rgba(0,80,200,0)');
ctx.save();
ctx.beginPath();
ctx.moveTo(currentBody.x, currentBody.y);
ctx.lineTo(currentBody.x + Math.cos(angle) * beamLen, currentBody.y + Math.sin(angle) * beamLen);
ctx.strokeStyle = grad;
ctx.lineWidth = beamWidth * pulse / camera.zoom;
ctx.lineCap = 'round';
ctx.stroke();
ctx.restore();
}
// Pulsing glow ring
var glowPulse = 0.3 + 0.7 * Math.abs(Math.sin(currentBody.pulsarPhase * 6));
ctx.beginPath();
ctx.arc(currentBody.x, currentBody.y, currentBody.radius * 2.5, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(0,200,255,' + (0.4 * glowPulse) + ')';
ctx.lineWidth = 3 / camera.zoom;
ctx.stroke();
}


function drawNebula(n) {
var alpha = n.life * 0.18;
for (var c = 0; c < n.clouds.length; c++) {
var cloud = n.clouds[c];
var gr = ctx.createRadialGradient(n.x + cloud.ox, n.y + cloud.oy, 0, n.x + cloud.ox, n.y + cloud.oy, cloud.r * (2 - n.life));
gr.addColorStop(0, hexToRgba(n.color, alpha * 0.8));
gr.addColorStop(1, hexToRgba(n.color, 0));
ctx.beginPath(); ctx.arc(n.x + cloud.ox, n.y + cloud.oy, cloud.r * (2 - n.life), 0, Math.PI * 2);
ctx.fillStyle = gr; ctx.fill();
}
}


function drawDayNight(currentBody) {
if (currentBody.nearestStarAngle === undefined) return;
var angle = currentBody.nearestStarAngle;
var ng = ctx.createRadialGradient(currentBody.x - Math.cos(angle) * currentBody.radius * 0.3, currentBody.y - Math.sin(angle) * currentBody.radius * 0.3, currentBody.radius * 0.1, currentBody.x, currentBody.y, currentBody.radius);
ng.addColorStop(0, 'rgba(0,0,0,0)'); ng.addColorStop(0.6, 'rgba(0,0,0,0)'); ng.addColorStop(1, 'rgba(0,0,20,0.55)');
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, currentBody.radius, 0, Math.PI * 2); ctx.fillStyle = ng; ctx.fill();
}


function drawGravityWells() {
for (var i = 0; i < gravityWells.length; i++) {
var gravityWell = gravityWells[i];
var t = simTime * 2;
for (var ring = 0; ring < 4; ring++) {
var rr = 15 + ring * 18 + (t % 18);
var al = (1 - ring / 4) * 0.4;
ctx.beginPath(); ctx.arc(gravityWell.x, gravityWell.y, rr / camera.zoom, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(255,153,68,' + al + ')';
ctx.lineWidth = 1.5 / camera.zoom; ctx.stroke();
}
ctx.beginPath(); ctx.arc(gravityWell.x, gravityWell.y, 6 / camera.zoom, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(255,153,68,0.8)'; ctx.fill();
}
}


function draw() {
ctx.fillStyle = 'rgba(2,2,10,0.18)';
ctx.fillRect(0, 0, canvas.width, canvas.height);

applyFollow();

ctx.save();
ctx.translate(canvas.width / 2 + camera.x, canvas.height / 2 + camera.y);
ctx.scale(camera.zoom, camera.zoom);

var i, shockwave, particle, currentBody, t, grad, bodyGrad, glowR, lw;

for (i = 0; i < nebulae.length; i++) drawNebula(nebulae[i]);


if (showOrbitGuides) {
for (i = 0; i < orbitGuides.length; i++) {
var guide = orbitGuides[i];
if (!guide.primary || guide.primary.dead) continue;
ctx.beginPath();
ctx.arc(guide.primary.x, guide.primary.y, guide.radius, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(235,210,190,0.38)';
ctx.lineWidth = 1 / camera.zoom;
ctx.stroke();
}
}

for (i = 0; i < shockwaves.length; i++) {
shockwave = shockwaves[i];
ctx.beginPath(); ctx.arc(shockwave.x, shockwave.y, shockwave.r, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba(shockwave.color, shockwave.life * 0.7);
ctx.lineWidth = (3 * shockwave.life) / camera.zoom; ctx.stroke();
}

for (i = 0; i < particles.length; i++) {
particle = particles[i];
ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
ctx.fillStyle = particle.color.indexOf('hsl') === 0
? particle.color.replace('hsl(', 'hsla(').replace(')', ',' + particle.alpha() + ')')
: 'rgba(255,255,255,' + particle.alpha() + ')';
ctx.fill();
}


for (i = 0; i < bodies.length; i++) {
currentBody = bodies[i];
if (currentBody.hasRings) { ctx.save(); ctx.globalAlpha = 0.5; drawRings(currentBody); ctx.restore(); }
}

// Bodies
for (i = 0; i < bodies.length; i++) {
currentBody = bodies[i];
if (currentBody.type === 'blackhole') drawLensing(currentBody);
if (currentBody.type === 'pulsar') drawPulsarBeams(currentBody);

if (currentBody.trail.length > 1 && trailLen > 0) {
for (t = 1; t < currentBody.trail.length; t++) {
var ta = (t / currentBody.trail.length) * 0.45;
lw = Math.max(0.5, (t / currentBody.trail.length) * currentBody.radius * 0.35);
ctx.beginPath(); ctx.moveTo(currentBody.trail[t - 1].x, currentBody.trail[t - 1].y); ctx.lineTo(currentBody.trail[t].x, currentBody.trail[t].y);
ctx.strokeStyle = hexToRgba(currentBody.glow, ta); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke();
}
}


glowR = currentBody.radius * (currentBody.type === 'blackhole' ? 3 : 4);
grad = ctx.createRadialGradient(currentBody.x, currentBody.y, 0, currentBody.x, currentBody.y, glowR);
grad.addColorStop(0, hexToRgba(currentBody.glow, currentBody.type === 'blackhole' ? 0.3 : 0.25));
grad.addColorStop(1, hexToRgba(currentBody.glow, 0));
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, glowR, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();

bodyGrad = ctx.createRadialGradient(currentBody.x - currentBody.radius * 0.3, currentBody.y - currentBody.radius * 0.3, 0, currentBody.x, currentBody.y, currentBody.radius);
if (currentBody.type === 'blackhole') {
bodyGrad.addColorStop(0, '#333'); bodyGrad.addColorStop(0.4, '#111'); bodyGrad.addColorStop(1, '#000');
} else {
bodyGrad.addColorStop(0, lighten(currentBody.color)); bodyGrad.addColorStop(1, currentBody.color);
}
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, currentBody.radius, 0, Math.PI * 2); ctx.fillStyle = bodyGrad; ctx.fill();

if (currentBody.type === 'planet') drawDayNight(currentBody);

if (currentBody.type === 'blackhole') {
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, currentBody.radius * 1.7, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba('#9900ff', 0.45); ctx.lineWidth = 2 / camera.zoom; ctx.stroke();
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, currentBody.radius * 2.3, 0, Math.PI * 2);
ctx.strokeStyle = hexToRgba('#cc44ff', 0.2); ctx.lineWidth = 1 / camera.zoom; ctx.stroke();
}

if (currentBody.type === 'star') {
var flicker = 0.7 + Math.sin(simTime * 3 + currentBody.x) * 0.3;
var corona = ctx.createRadialGradient(currentBody.x, currentBody.y, currentBody.radius, currentBody.x, currentBody.y, currentBody.radius * 2.5);
corona.addColorStop(0, hexToRgba(currentBody.glow, 0.14 * flicker)); corona.addColorStop(1, hexToRgba(currentBody.glow, 0));
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, currentBody.radius * 2.5, 0, Math.PI * 2); ctx.fillStyle = corona; ctx.fill();
if (camera.zoom > 1.5 && currentBody.starClass) {
ctx.fillStyle = 'rgba(255,255,255,0.55)';
ctx.font = (currentBody.radius * 0.7) + 'px Space Mono, monospace';
ctx.textAlign = 'center';
ctx.fillText(currentBody.starClass, currentBody.x, currentBody.y + currentBody.radius + 10 / camera.zoom);
}
}

if (currentBody.type === 'comet') {
var cspeed = Math.sqrt(currentBody.vx * currentBody.vx + currentBody.vy * currentBody.vy);
if (cspeed > 0.01) {
var ctx_tx = -currentBody.vx / cspeed, ctx_ty = -currentBody.vy / cspeed;
var tl2 = Math.min(70, cspeed * 18);
var tg = ctx.createLinearGradient(currentBody.x, currentBody.y, currentBody.x + ctx_tx * tl2, currentBody.y + ctx_ty * tl2);
tg.addColorStop(0, hexToRgba(currentBody.glow, 0.65)); tg.addColorStop(1, hexToRgba(currentBody.glow, 0));
ctx.beginPath(); ctx.moveTo(currentBody.x, currentBody.y); ctx.lineTo(currentBody.x + ctx_tx * tl2, currentBody.y + ctx_ty * tl2);
ctx.strokeStyle = tg; ctx.lineWidth = currentBody.radius * 0.8; ctx.lineCap = 'round'; ctx.stroke();
}
}


if (currentBody === selectedBody) {
ctx.beginPath(); ctx.arc(currentBody.x, currentBody.y, currentBody.radius + 5 / camera.zoom, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(200,255,0,0.8)'; ctx.lineWidth = 1.5 / camera.zoom;
ctx.setLineDash([4 / camera.zoom, 3 / camera.zoom]); ctx.stroke(); ctx.setLineDash([]);
}
}


for (i = 0; i < bodies.length; i++) {
currentBody = bodies[i];
if (currentBody.hasRings) {
ctx.save(); ctx.globalAlpha = 0.7;
ctx.beginPath(); ctx.rect(currentBody.x - currentBody.radius * 4, currentBody.y - currentBody.radius * 4, currentBody.radius * 8, currentBody.radius * 4); ctx.clip();
drawRings(currentBody); ctx.restore();
}
}

drawGravityWells();

// Drag arrow
if (isDragging && spawnMode === 'launch' && !isPanning) {
var ws = screenToWorld(dragStart.screen_x, dragStart.sy);
var we = screenToWorld(mouseScreen.x, mouseScreen.y);
var arrowDX = we.x - ws.x, arrowDY = we.y - ws.y, alen = Math.sqrt(arrowDX * arrowDX + arrowDY * arrowDY);
if (alen > 3) {
ctx.beginPath(); ctx.moveTo(ws.x, ws.y); ctx.lineTo(we.x, we.y);
ctx.strokeStyle = 'rgba(200,255,0,0.6)'; ctx.lineWidth = 1.5 / camera.zoom;
ctx.setLineDash([4 / camera.zoom, 4 / camera.zoom]); ctx.stroke(); ctx.setLineDash([]);
var ang = Math.atan2(arrowDY, arrowDX), hw = 10 / camera.zoom;
ctx.beginPath(); ctx.moveTo(we.x, we.y);
ctx.lineTo(we.x - hw * Math.cos(ang - 0.4), we.y - hw * Math.sin(ang - 0.4));
ctx.lineTo(we.x - hw * Math.cos(ang + 0.4), we.y - hw * Math.sin(ang + 0.4));
ctx.closePath(); ctx.fillStyle = 'rgba(200,255,0,0.7)'; ctx.fill();
ctx.beginPath(); ctx.arc(ws.x, ws.y, 8 / camera.zoom, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(200,255,0,0.4)'; ctx.lineWidth = 1 / camera.zoom; ctx.stroke();
}
}


if (spawnMode === 'orbit') {
var wm = screenToWorld(mouseScreen.x, mouseScreen.y);
var near2 = null, nearestDist = Infinity;
for (i = 0; i < bodies.length; i++) {
var hoverDX = bodies[i].x - wm.x, hoverDY = bodies[i].y - wm.y, od = Math.sqrt(hoverDX * hoverDX + hoverDY * hoverDY);
if (od < nearestDist && bodies[i].mass > 20) { near2 = bodies[i]; nearestDist = od; }
}
if (near2 && nearestDist < 600) {
ctx.beginPath(); ctx.arc(near2.x, near2.y, nearestDist, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(0,200,255,0.12)'; ctx.lineWidth = 1 / camera.zoom;
ctx.setLineDash([3 / camera.zoom, 5 / camera.zoom]); ctx.stroke(); ctx.setLineDash([]);
ctx.beginPath(); ctx.arc(near2.x, near2.y, near2.radius * 2.5, 0, Math.PI * 2);
ctx.strokeStyle = 'rgba(0,200,255,0.3)'; ctx.lineWidth = 1.5 / camera.zoom; ctx.stroke();
}
}

ctx.restore();
}
