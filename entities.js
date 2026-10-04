// entities.js — what things are: Body/Particle/Shockwave/Nebula/GravityWell + body-attribute helpers

function randomStarClass() {
var weights = [40, 25, 15, 8, 5, 4, 3];
var total = 0;
for (var i = 0; i < weights.length; i++) total += weights[i];
var roll = Math.random() * total, sum = 0;
for (var j = 0; j < weights.length; j++) { sum += weights[j]; if (roll < sum) return starClasses[j]; }
return 'G';
}

// ── Body Constructor ──────────────────────────────────────────────
function getRadius(type, sc) {
if (customRadius > 0) return customRadius;
if (type === 'planet') return 5 + Math.random() * 9;
if (type === 'star') return starClassRadiusMin[sc || 'G'] + Math.random() * (starClassRadiusMax[sc || 'G'] - starClassRadiusMin[sc || 'G']);
if (type === 'blackhole') return 13 + Math.random() * 7;
if (type === 'comet') return 2 + Math.random() * 3;
if (type === 'asteroid') return 2 + Math.random() * 2;
if (type === 'pulsar') return 7;
return 8;
}

function getMass(type, sc) {
if (customMass > 0) return customMass;
if (type === 'planet') return 5 + Math.random() * 12;
if (type === 'star') return starClassMassMin[sc || 'G'] + Math.random() * (starClassMassMax[sc || 'G'] - starClassMassMin[sc || 'G']);
if (type === 'blackhole') return 500 + Math.random() * 600;
if (type === 'comet') return 1 + Math.random() * 2;
if (type === 'asteroid') return 0.5 + Math.random() * 1.5;
if (type === 'pulsar') return 200;
return 10;
}

function getColor(type, sc) {
if (type === 'planet') return 'hsl(' + (180 + Math.random() * 100) + ',' + (50 + Math.random() * 30) + '%,' + (45 + Math.random() * 25) + '%)';
if (type === 'star') return starClassColors[sc || 'G'];
if (type === 'blackhole') return '#111';
if (type === 'comet') return 'hsl(' + (160 + Math.random() * 40) + ',80%,75%)';
if (type === 'asteroid') return 'hsl(' + (20 + Math.random() * 20) + ',' + (15 + Math.random() * 15) + '%,' + (40 + Math.random() * 20) + '%)';
if (type === 'pulsar') return '#aaddff';
return '#ffffff';
}

function getGlow(type, sc) {
if (type === 'planet') return '#4488ff';
if (type === 'star') return starClassGlows[sc || 'G'];
if (type === 'blackhole') return '#9900ff';
if (type === 'comet') return '#00ffcc';
if (type === 'asteroid') return '#886644';
if (type === 'pulsar') return '#00ccff';
return '#ffffff';
}

function shouldHaveRings(body) {
return body.type === 'planet' && body.mass > 10 && Math.random() < 0.35;
}

function Body(x, y, vx, vy, type) {
this.x = x; this.y = y; this.vx = vx; this.vy = vy;
this.type = type;
this.starClass = (type === 'star') ? randomStarClass() : null;
this.radius = getRadius(type, this.starClass);
this.mass = getMass(type, this.starClass);
this.color = getColor(type, this.starClass);
this.glow = getGlow(type, this.starClass);
this.trail = [];
this.dead = false;
this.isHeavy = (type === 'star' || type === 'blackhole' || type === 'pulsar');
this.gravityMult = 1.0;
this.hasRings = false; this.ringTilt = 0; this.ringColor = '';
this.nearestStarAngle = 0;

this.pulsarAngle = 0;
this.pulsarPhase = 0;
}


function Particle(x, y, vx, vy, color, life, size) {
this.x = x; 
this.y = y; 
this.vx = vx; 
this.vy = vy;
this.color = color; 
this.life = life; 
this.maxLife = life; 
this.size = size;
}                       
Particle.prototype.update = function(dt) {
this.x += this.vx * dt; this.y += this.vy * dt;
this.vx *= 0.97; this.vy *= 0.97; this.life -= dt;
};
Particle.prototype.isAlive = function() { return this.life > 0; };
Particle.prototype.alpha = function() { return Math.max(0, this.life / this.maxLife); };


function Shockwave(x, y, maxR, color) {
this.x = x; this.y = y; this.r = 0; this.maxR = maxR;
this.color = color; this.life = 1;
}
Shockwave.prototype.update = function(dt) { this.r += dt * 8; this.life = 1 - (this.r / this.maxR); };
Shockwave.prototype.isAlive = function() { return this.life > 0; };


function Nebula(x, y, color) {
this.x = x; this.y = y; this.color = color; this.life = 1.0;
this.maxRadius = 80 + Math.random() * 60; this.clouds = [];
for (var i = 0; i < 12; i++) {
this.clouds.push({ ox: (Math.random() - 0.5) * this.maxRadius * 1.2, oy: (Math.random() - 0.5) * this.maxRadius * 1.2, r: 15 + Math.random() * 35 });
}
}

Nebula.prototype.update = function(dt) { this.life -= dt * 0.003; };
Nebula.prototype.isAlive = function() { return this.life > 0; };


function GravityWell(x, y, strength) {
this.x = x; this.y = y; this.strength = strength; this.active = true;
}
