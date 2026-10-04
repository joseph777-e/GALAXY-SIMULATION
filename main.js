// main.js — entry point: resize, animation loop, start button

// GRAVITY project :)
window.alert("Heads up — this isn't a perfectly accurate physics sim, just something fun to mess around with. Still adding stuff to it.");

function resize() {
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', function() { resize(); resizeStars(); });

var last = null;
function loop(ts) {
if (!last) last = ts;
var dt = Math.min((ts - last) / 16.67, 3);
last = ts; frameCount++;

// into close orbits and can make bodies fall into their primary unexpectedly.
var totalDt = dt * timeWarp;
var substeps = Math.max(1, Math.ceil(totalDt));
var subDt = totalDt / substeps;
for (var i = 0; i < substeps; i++) step(subDt);
draw();
if (frameCount % 2 === 0) drawStars(ts);
if (frameCount % 10 === 0) updateStats();
requestAnimationFrame(loop);
}

function startSim() {
    document.getElementById("intro").style.display = "none";
    spawnOrbit();

    

    requestAnimationFrame(loop);
}
