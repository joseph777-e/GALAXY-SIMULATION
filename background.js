

//  Background 

var starCanvas = document.getElementById('stars');
var sCtx = starCanvas.getContext('2d');
var starField = [];
var nebulaClouds = [];

function buildStarField() {
var w = starCanvas.width, h = starCanvas.height;
var starColors = ['255,255,255', '255,246,220', '255,224,180', '210,225,255', '175,200,255', '255,200,170'];
var count = Math.round((w * h) / 2200);
starField = [];
for (var i = 0; i < count; i++) {
var glow = Math.random() < 0.035;
starField.push({
x: Math.random() * w,
y: Math.random() * h,
r: glow ? (Math.random() * 1.3 + 1.1) : (Math.random() * 0.9 + 0.2),
baseAlpha: glow ? (Math.random() * 0.25 + 0.65) : (Math.random() * 0.55 + 0.12),
color: starColors[Math.floor(Math.random() * starColors.length)],
twinkleSpeed: Math.random() * 0.0018 + 0.0004,
twinklePhase: Math.random() * Math.PI * 2,
glow: glow
});
}

var nebulaColors = ['70,55,150', '30,75,135', '110,40,95', '20,95,115'];
nebulaClouds = [];
var clouds = 4;
for (var j = 0; j < clouds; j++) {
nebulaClouds.push({
x: Math.random() * w,
y: Math.random() * h,
r: Math.random() * (Math.max(w, h) * 0.32) + Math.max(w, h) * 0.16,
color: nebulaColors[j % nebulaColors.length],
alpha: Math.random() * 0.05 + 0.025
});
}
}

function resizeStars() {
starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;
buildStarField();
drawStars(0);
}

function drawStars(ts) {
var w = starCanvas.width, h = starCanvas.height, i;
sCtx.clearRect(0, 0, w, h);

for (i = 0; i < nebulaClouds.length; i++) {
var c = nebulaClouds[i];
var ng = sCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
ng.addColorStop(0, 'rgba(' + c.color + ',' + c.alpha + ')');
ng.addColorStop(1, 'rgba(' + c.color + ',0)');
sCtx.fillStyle = ng;
sCtx.fillRect(0, 0, w, h);
}

sCtx.save();
sCtx.translate(w * 0.5, h * 0.5);
sCtx.rotate(-0.4);
var band = sCtx.createLinearGradient(0, -h * 0.16, 0, h * 0.16);
band.addColorStop(0, 'rgba(190,200,255,0)');
band.addColorStop(0.5, 'rgba(190,200,255,0.045)');
band.addColorStop(1, 'rgba(190,200,255,0)');
sCtx.fillStyle = band;
sCtx.fillRect(-w, -h * 0.16, w * 2, h * 0.32);
sCtx.restore();

for (i = 0; i < starField.length; i++) {
var star = starField[i];
var tw = Math.sin(ts * star.twinkleSpeed + star.twinklePhase) * (star.glow ? 0.2 : 0.32);
var a = Math.max(0, Math.min(1, star.baseAlpha + tw));
if (star.glow) {
var gg = sCtx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 4.5);
gg.addColorStop(0, 'rgba(' + star.color + ',' + (a * 0.45) + ')');
gg.addColorStop(1, 'rgba(' + star.color + ',0)');
sCtx.beginPath(); sCtx.arc(star.x, star.y, star.r * 4.5, 0, Math.PI * 2); sCtx.fillStyle = gg; sCtx.fill();
}
sCtx.beginPath();
sCtx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
sCtx.fillStyle = 'rgba(' + star.color + ',' + a + ')';
sCtx.fill();
}
}
resizeStars();
