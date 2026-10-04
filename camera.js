// camera.js — zoom, pan, follow, and screen<->world coordinate conversion

//view
var camera = { x: 0, y: 0, zoom: 1.0, minZoom: 0.1, maxZoom: 5.0 };
var followTarget = null;
var isFollowing = false;

function screenToWorld(screen_x, sy) {
return {
x: (screen_x - canvas.width / 2 - camera.x) / camera.zoom,
y: (sy - canvas.height / 2 - camera.y) / camera.zoom
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
isFollowing = false; followTarget = null;
updateZoomUI();
updateFollowBtn();
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

function toggleFollow() {
if (!selectedBody) return;
isFollowing = !isFollowing;
followTarget = isFollowing ? selectedBody : null;
updateFollowBtn();
}

function updateFollowBtn() {
var btn = document.getElementById('follow-btn');
if (btn) btn.classList.toggle('active', isFollowing);
var ibtn = document.querySelector('.insp-btn');
if (ibtn) ibtn.classList.toggle('active', isFollowing);
}

function applyFollow() {
if (!isFollowing || !followTarget || followTarget.dead) {
if (isFollowing) { isFollowing = false; updateFollowBtn(); }
return;
}
camera.x = -followTarget.x * camera.zoom;
camera.y = -followTarget.y * camera.zoom;
}

canvas.addEventListener('wheel', function(e) {
e.preventDefault();
var factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
var worldX = (e.clientX - canvas.width / 2 - camera.x) / camera.zoom;
var worldY = (e.clientY - canvas.height / 2 - camera.y) / camera.zoom;
camera.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, camera.zoom * factor));
camera.x = e.clientX - canvas.width / 2 - worldX * camera.zoom;
camera.y = e.clientY - canvas.height / 2 - worldY * camera.zoom;
updateZoomUI();
}, { passive: false });

var isPanning = false;
var panStart = { x: 0, y: 0 };
var panCamStart = { x: 0, y: 0 };

canvas.addEventListener('mousedown', function(e) {
if (e.button === 1 || e.button === 2) {
e.preventDefault();
isPanning = true;
isFollowing = false; followTarget = null; updateFollowBtn();
panStart = { x: e.clientX, y: e.clientY };
panCamStart = { x: camera.x, y: camera.y };
canvas.style.cursor = 'grab';
}
});
canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

// Picks the body under a screen-space point (used by input.js for click-to-select)
function bodyAtScreen(screen_x, sy) {
var world = screenToWorld(screen_x, sy);
var best = null, bestDist = Infinity;
for (var i = 0; i < bodies.length; i++) {
var deltaX = bodies[i].x - world.x, deltaY = bodies[i].y - world.y;
var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
var hitRadius = Math.max(bodies[i].radius, 10 / camera.zoom);
if (distance < hitRadius && distance < bestDist) { best = bodies[i]; bestDist = distance; }
}
return best;
}
