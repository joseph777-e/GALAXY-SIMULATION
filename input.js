// input.js — mouse/touch spawning, dragging, and well-placement (camera panning lives in camera.js)

var isDragging = false;
var isWellDragging = false;
var dragStart = { screen_x: 0, sy: 0 };
var mouseScreen = { x: 0, y: 0 };

canvas.addEventListener('mousedown', function(e) {
if (e.button !== 0) return;
if (spawnMode === 'gravity') {
var world = screenToWorld(e.clientX, e.clientY);
gravityWells.push(new GravityWell(world.x, world.y, wellStrength));
isWellDragging = true;
return;
}
var hit = bodyAtScreen(e.clientX, e.clientY);
if (hit) { selectBody(hit); return; }
if (selectedBody) { deselectBody(); return; }
if (spawnMode === 'orbit') {
spawnInOrbit(e.clientX, e.clientY, spawnType);
} else {
dragStart = { screen_x: e.clientX, sy: e.clientY };
isDragging = true;
}
});

canvas.addEventListener('mousemove', function(e) {
mouseScreen = { x: e.clientX, y: e.clientY };
if (isPanning) {
camera.x = panCamStart.x + (e.clientX - panStart.x);
camera.y = panCamStart.y + (e.clientY - panStart.y);
}
if (isWellDragging && gravityWells.length > 0) {
var world = screenToWorld(e.clientX, e.clientY);
gravityWells[gravityWells.length - 1].x = world.x;
gravityWells[gravityWells.length - 1].y = world.y;
}
});

canvas.addEventListener('mouseup', function(e) {
if (e.button === 1 || e.button === 2) {
isPanning = false; canvas.style.cursor = 'crosshair'; return;
}
if (isWellDragging) {
isWellDragging = false;
if (gravityWells.length > 0) gravityWells.pop();
return;
}
if (!isDragging) return;
isDragging = false;
var world = screenToWorld(dragStart.screen_x, dragStart.sy);
var deltaX = e.clientX - dragStart.screen_x, deltaY = e.clientY - dragStart.sy;
var velScale = 0.06 / camera.zoom;
var newBody = new Body(world.x, world.y, deltaX * velScale, deltaY * velScale, spawnType);
if (newBody.type === 'planet' && shouldHaveRings(newBody)) { newBody.hasRings = true; newBody.ringTilt = Math.random() * 0.5 + 0.1; newBody.ringColor = newBody.color; }
if (newBody.type === 'star') logEvent('⭐ STAR SPAWNED — CLASS ' + newBody.starClass, 'starclass', { cls: newBody.starClass });
bodies.push(newBody);
});

var touchDragStart = null;
canvas.addEventListener('touchstart', function(e) {
e.preventDefault();
var t = e.touches[0];
touchDragStart = { screen_x: t.clientX, sy: t.clientY };
mouseScreen = { x: t.clientX, y: t.clientY };
if (spawnMode === 'gravity') {
var world = screenToWorld(t.clientX, t.clientY);
gravityWells.push(new GravityWell(world.x, world.y, wellStrength));
isWellDragging = true;
} else if (spawnMode !== 'orbit') isDragging = true;
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
e.preventDefault();
var t = e.touches[0];
mouseScreen = { x: t.clientX, y: t.clientY };
if (isWellDragging && gravityWells.length > 0) {
var world = screenToWorld(t.clientX, t.clientY);
gravityWells[gravityWells.length - 1].x = world.x;
gravityWells[gravityWells.length - 1].y = world.y;
}
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
e.preventDefault();
isDragging = false;
if (isWellDragging) { isWellDragging = false; if (gravityWells.length > 0) gravityWells.pop(); return; }
var t = e.changedTouches[0];
if (spawnMode === 'orbit') spawnInOrbit(t.clientX, t.clientY, spawnType);

else if (touchDragStart) {
var world = screenToWorld(touchDragStart.screen_x, touchDragStart.sy);
var deltaX = t.clientX - touchDragStart.screen_x, deltaY = t.clientY - touchDragStart.sy;
bodies.push(new Body(world.x, world.y, deltaX * 0.06 / camera.zoom, deltaY * 0.06 / camera.zoom, spawnType));
}

touchDragStart = null;
}, { passive: false });
