// ui.js — buttons, sliders, inspector panel, event log, encyclopedia

// --- Selection & inspector ---
function selectBody(body) {
selectedBody = body;
followTarget = isFollowing ? body : null;
updateInspector();
document.getElementById('inspector').classList.remove('hidden');
}

function deselectBody() {
selectedBody = null;
isFollowing = false; followTarget = null;
updateFollowBtn();
document.getElementById('inspector').classList.add('hidden');
}

function deleteSelected() {
if (!selectedBody) return;
selectedBody.dead = true;
var survivingBodies = [];
for (var i = 0; i < bodies.length; i++) {
if (!bodies[i].dead) survivingBodies.push(bodies[i]);
}
bodies = survivingBodies;
deselectBody();
}

function updateInspector() {
if (!selectedBody) return;
var currentBody = selectedBody;
var icons = { planet: '🪐', star: '⭐', blackhole: '🕳️', comet: '☄️', asteroid: '🪨', pulsar: '💫' };
var spd = Math.sqrt(currentBody.vx * currentBody.vx + currentBody.vy * currentBody.vy);
var period = '—';
var nearestMass = 0, nearestDist = Infinity;
for (var i = 0; i < bodies.length; i++) {
if (bodies[i] === currentBody) continue;
var deltaX = bodies[i].x - currentBody.x, deltaY = bodies[i].y - currentBody.y;
var d = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
if (d < nearestDist && bodies[i].mass > currentBody.mass) { nearestDist = d; nearestMass = bodies[i].mass; }
}
if (nearestMass > 0 && nearestDist < 1000) {
var T = 2 * Math.PI * Math.sqrt(Math.pow(nearestDist, 3) / (G * nearestMass));
period = T.toFixed(0) + ' u';
}
var classStr = currentBody.starClass ? ' (' + currentBody.starClass + ')' : '';
document.getElementById('inspector-icon').textContent = icons[currentBody.type] || '●';
document.getElementById('inspector-title').textContent = currentBody.type.toUpperCase() + classStr;
document.getElementById('inspector-body').innerHTML =
'<div class="stat-row"><span>MASS</span><span class="stat-val">' + currentBody.mass.toFixed(1) + '</span></div>' +
'<div class="stat-row"><span>RADIUS</span><span class="stat-val">' + currentBody.radius.toFixed(1) + '</span></div>' +
'<div class="stat-row"><span>SPEED</span><span class="stat-val">' + spd.toFixed(2) + ' u/s</span></div>' +
'<div class="stat-row"><span>POS X</span><span class="stat-val">' + currentBody.x.toFixed(0) + '</span></div>' +
'<div class="stat-row"><span>POS Y</span><span class="stat-val">' + currentBody.y.toFixed(0) + '</span></div>' +
'<div class="stat-row"><span>PERIOD</span><span class="stat-val">' + period + '</span></div>' +
(currentBody.hasRings ? '<div class="stat-row"><span>RINGS</span><span class="stat-val">YES</span></div>' : '') +
(currentBody.starClass ? '<div class="stat-row"><span>CLASS</span><span class="stat-val">' + currentBody.starClass + '</span></div>' : '');
var mult = (currentBody.gravityMult !== undefined) ? currentBody.gravityMult : 1.0;
document.getElementById('slider-bodygravity').value = Math.round(mult * 10);
document.getElementById('v-bodygravity').textContent = mult.toFixed(1) + 'x';
}

function setBodyGravity(val) {
if (!selectedBody) return;
var mult = parseFloat(val) / 10;
selectedBody.gravityMult = mult;
document.getElementById('v-bodygravity').textContent = mult.toFixed(1) + 'x';
}

// --- Event log / detail popovers ---
function showEventDetail(type, data) {
var icon = '', title = '', body = '';
if (type === 'supernova') {
icon = '💥'; title = 'SUPERNOVA';
body = '<strong>Type II Supernova</strong><br>Two stars collided, exceeding the Tolman-Oppenheimer-Volkoff limit.<br><br>'
+ 'Combined mass: <strong>' + (data.mass ? Math.round(data.mass) : '?') + ' units</strong><br>'
+ 'The explosion releases more energy than the Sun emits in its entire lifetime. A neutron star remnant has formed.';
} else if (type === 'tidal') {
icon = '🌀'; title = 'TIDAL DISRUPTION EVENT';
body = '<strong>Tidal Disruption Event (TDE)</strong><br>A star was torn apart by the tidal forces of the black hole, forming a bright accretion disk of X-ray flares.<br><br>'
+ 'New black hole mass: <strong>' + (data.mass ? Math.round(data.mass) : '?') + ' units</strong>';
} else if (type === 'roche') {
icon = '💫'; title = 'ROCHE LIMIT EXCEEDED';
body = '<strong>Roche Limit Tidal Disruption</strong><br>Within the Roche limit, tidal forces exceed the body\'s self-gravity, tearing it apart into debris.<br><br>This is how the rings of Saturn actually formed.';
} else if (type === 'merge') {
icon = '🔵'; title = 'PLANETARY MERGER';
body = '<strong>Accretionary Collision</strong><br>Two bodies merged. This is how planets form through accretion over millions of years.<br><br>'
+ 'New mass: <strong>' + (data.mass ? Math.round(data.mass) : '?') + ' units</strong>';
} else if (type === 'orbit') {
icon = '🪐'; title = 'ORBIT ESTABLISHED';
body = '<strong>Stable Keplerian Orbit</strong><br>'
+ 'Radius: <strong>' + (data.distance ? Math.round(data.distance) : '?') + ' units</strong><br>'
+ 'Velocity: <strong>' + (data.speed ? data.speed.toFixed(2) : '?') + ' u/s</strong><br><br>'
+ 'Third Law of Kepler: T² ∝ a³';
} else if (type === 'neutron') {
icon = '🌑'; title = 'NEUTRON STAR FORMED';
body = '<strong>Neutron Star Remnant</strong><br>The collapsed core of a supernova. A teaspoon would weigh ~10 billion tonnes on Earth.';
} else if (type === 'absorbed') {
icon = '🕳️'; title = 'GRAVITATIONAL ABSORPTION';
body = '<strong>Event Horizon Crossing</strong><br>Nothing — not even light — escapes once inside.<br><br>'
+ 'New black hole mass: <strong>' + (data.mass ? Math.round(data.mass) : '?') + ' units</strong>';
} else if (type === 'starclass') {
var classDesc = {
'M': 'Red Dwarf — most common stars. Small, cool, and extremely long-lived (trillions of years).',
'K': 'Orange Dwarf — slightly larger than red dwarfs. Stable output, ideal for habitable planets.',
'G': 'Yellow Dwarf — our Sun is a G-type. Medium mass, ~10 billion year lifespan.',
'F': 'Yellow-White Star — hotter and brighter than the Sun. Lifespan 3-7 billion years.',
'A': 'White Star — very bright and hot. Only 1-3 billion year lifespan.',
'B': 'Blue-White Giant — extremely luminous. Burns out in 10-100 million years.',
'O': 'Blue Supergiant — rarest and most massive. Lifespan of only 1-3 million years before a violent supernova.'
};
icon = '⭐'; title = 'STAR SPAWNED — CLASS ' + (data.cls || '?');
body = classDesc[data.cls] || 'Unknown class.';
} else if (type === 'pulsar') {
icon = '💫'; title = 'PULSAR SYSTEM';
body = '<strong>Millisecond Pulsar</strong><br>A rapidly rotating neutron star emitting beams of electromagnetic radiation. '
+ 'Pulsars spin hundreds of times per second and are among the most precise clocks in the universe.<br><br>'
+ 'The beams sweep space like a cosmic lighthouse, visible only when aimed at Earth.';
}
document.getElementById('event-detail-icon').textContent = icon;
document.getElementById('event-detail-title').textContent = title;
document.getElementById('event-detail-body').innerHTML = body;
document.getElementById('event-detail').classList.remove('hidden');
}

function closeDetail() {
document.getElementById('event-detail').classList.add('hidden');
}


function logEvent(msg, detailType, detailData) {
var log = document.getElementById('eventlog');
var el = document.createElement('div');
el.className = 'event-item';
el.textContent = msg;
if (detailType) {
el.style.cursor = 'pointer';
(function(t, d) { el.addEventListener('click', function() { showEventDetail(t, d || {}); }); })(detailType, detailData);
}
log.appendChild(el);
while (log.children.length > 6) log.removeChild(log.firstChild);
setTimeout(function() { el.classList.add('fade'); }, 3500);
setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
}

// --- Spawn controls, sliders, pause, panel ---
function setType(type, el) {
spawnType = type;
var btns = document.querySelectorAll('.type-btn');
for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
el.classList.add('active');
}

function setSpawnMode(mode) {
spawnMode = mode;
document.getElementById('mode-launch-btn').classList.toggle('active', mode === 'launch');
document.getElementById('mode-orbit-btn').classList.remove('active');
document.getElementById('mode-orbit-btn').classList.toggle('orbit-active', mode === 'orbit');
document.getElementById('mode-gravity-btn').classList.remove('active');
document.getElementById('mode-gravity-btn').classList.toggle('active', mode === 'gravity');
document.getElementById('orbit-hint').classList.toggle('visible', mode === 'orbit');
document.getElementById('gravity-hint').classList.toggle('visible', mode === 'gravity');
document.getElementById('hint').style.opacity = (mode === 'orbit' || mode === 'gravity') ? '0' : '';
if (mode !== 'gravity') gravityWells = [];
}

function updateSlider(name, val) {
var v = parseFloat(val);
if (name === 'gravity') { G = v / 10; document.getElementById('v-gravity').textContent = G.toFixed(1); }
 else if (name === 'damping') { damping = v / 1000; document.getElementById('v-damping').textContent = damping.toFixed(3); }
   else if (name === 'trail') { trailLen = parseInt(val); document.getElementById('v-trail').textContent = trailLen; }
    else if (name === 'zoom') { camera.zoom = v / 100; document.getElementById('v-zoom').textContent = Math.round(v) + '%'; document.getElementById('s-zoom').textContent = Math.round(v); }
     else if (name === 'spawnRadius') { customRadius = parseInt(val); document.getElementById('v-spawnRadius').textContent = customRadius; }
      else if (name === 'spawnMass') { customMass = parseInt(val); document.getElementById('v-spawnMass').textContent = customMass === 0 ? 'auto' : customMass; }
       else if (name === 'timewarp') { timeWarp = v; document.getElementById('v-timewarp').textContent = v.toFixed(1) + 'x'; }
        else if (name === 'wellstrength') { wellStrength = v; document.getElementById('v-wellstrength').textContent = Math.round(v); }


}

function togglePause() {
paused = !paused;
var btn = document.getElementById('pause-btn');
btn.textContent = paused ? '▶ RESUME' : '⏸ PAUSE';
btn.classList.toggle('active', paused);
}

function clearAll() {
bodies = []; particles = []; shockwaves = []; nebulae = []; gravityWells = []; orbitGuides = [];
deselectBody();
ctx.clearRect(0, 0, canvas.width, canvas.height);
}

var panelCollapsed = false;
function togglePanel() {
panelCollapsed = !panelCollapsed;
document.getElementById('panel').classList.toggle('collapsed', panelCollapsed);
document.getElementById('panel-toggle-icon').textContent = panelCollapsed ? '▶' : '◀';
}

// --- Stats readout ---
function updateStats() {
document.getElementById('s-bodies').textContent = bodies.length;
document.getElementById('s-nova').textContent = novaCount;
document.getElementById('s-time').textContent = simTime.toFixed(1);
document.getElementById('s-zoom').textContent = Math.round(camera.zoom * 100);
if (selectedBody && !selectedBody.dead) updateInspector();
}

// --- Encyclopedia ---
//  jk 
var encyclopediaEntries = [
{ id: 'supernova', icon: '💥', title: 'Supernova', sub: 'Stellar explosion', color: '#ff6633',
fact: 'A supernova can briefly outshine its entire host galaxy.',
desc: 'Basically a star runs out of fuel, the core can\'t hold itself up anymore, and it collapses in on itself so fast that it rebounds and blows the rest of the star apart. What\'s left behind is either a neutron star or, if the original star was big enough, a black hole. Also most of the heavier elements around us (iron, gold, all of it) got made in these explosions, which is a fun thing to think about.',
simulate: 'spawnBinaryStars', link: 'https://en.wikipedia.org/wiki/Supernova' },
{ id: 'blackhole', icon: '🕳️', title: 'Black Hole', sub: 'Spacetime singularity', color: '#9900ff',
fact: 'The one at the center of M87 is about 6.5 billion times the mass of the Sun.',
desc: 'A region where gravity got so strong that not even light can get back out past a certain point (the event horizon). They form from collapsed massive stars, and there are also supermassive ones sitting in the middle of pretty much every big galaxy, including ours — ours is called Sagittarius A*.',
simulate: 'spawnBlackHoleSystem', link: 'https://en.wikipedia.org/wiki/Black_hole' },
{ id: 'binary', icon: '⭐', title: 'Binary Stars', sub: 'Gravitational dance', color: '#ffcc00',
fact: 'Over half the stars in the Milky Way aren\'t alone — they\'re in pairs or small groups.',
desc: 'Two stars locked in orbit around their shared center of mass. Sometimes they\'re basically touching, sometimes they\'re light-years apart and barely count as "together." These systems are actually how astronomers figure out how much stars weigh, since you can measure the orbit and work backward.',
simulate: 'spawnBinaryStars', link: 'https://en.wikipedia.org/wiki/Binary_star' },
{ id: 'figureeight', icon: '∞', title: 'Figure-8 Orbit', sub: '3-body choreography', color: '#00ffcc',
fact: 'Found in 1993 — it\'s one of the only stable solutions to the 3-body problem anyone knows of.',
desc: 'Three equal-mass bodies chasing each other around a figure-8 shaped path forever, staying perfectly in sync. The three-body problem is notoriously chaotic (that\'s a whole other rabbit hole), so finding a configuration that\'s actually periodic and stable like this one is kind of a big deal mathematically. I added this preset mostly because it looks unreasonably clean when it\'s running.',
simulate: 'spawnFigureEight', link: 'https://en.wikipedia.org/wiki/Three-body_problem' },
{ id: 'galaxy', icon: '🌌', title: 'Galaxy Collision', sub: 'Cosmic merger event', color: '#4466ff',
fact: 'The Milky Way and Andromeda are headed toward each other, ETA roughly 4.5 billion years.',
desc: 'Individual stars almost never actually smash into each other in a galaxy collision — there\'s just too much empty space between them. What actually happens is the gravity of the two galaxies drags everything into new shapes, kicks off a bunch of new star formation, and over a long time the two galaxies settle into one bigger blob.',
simulate: 'spawnGalaxyCollision', link: 'https://en.wikipedia.org/wiki/Galaxy_merger' },
{ id: 'pulsar', icon: '💫', title: 'Pulsar', sub: 'Cosmic lighthouse', color: '#00ccff',
fact: 'The fastest known pulsar spins over 700 times a second.',
desc: 'A spinning neutron star that fires beams of radiation out from its poles. If Earth happens to be in the path of that beam, we see it flick on and off like a lighthouse every time it spins around. Some of them are more precise than atomic clocks, which still feels unreal to me.',
simulate: 'spawnPulsar', link: 'https://en.wikipedia.org/wiki/Pulsar' },
{ id: 'rogue', icon: '☄️', title: 'Rogue Flyby', sub: 'Intergalactic intruder', color: '#ff9944',
fact: 'The first confirmed interstellar visitor to our solar system, Oumuamua, showed up in 2017.',
desc: 'Not every object out there is tied to a star system — some are just drifting through on their own. When one of these passes close enough to a solar system, its gravity can mess with existing orbits, or in extreme cases fling a planet out entirely. There\'s a theory the early solar system had a close call or two like this.',
simulate: 'spawnRogueFlyby', link: 'https://en.wikipedia.org/wiki/Rogue_planet' },
{ id: 'tidal', icon: '🌀', title: 'Tidal Disruption', sub: 'Roche limit event', color: '#ff4488',
fact: 'Saturn\'s rings might be what\'s left of a moon that got torn apart this way.',
desc: 'If something gets too close to a much more massive object, the difference in gravity between its near side and far side can literally rip it apart — that distance is called the Roche limit. Black holes do this to stars sometimes, and the flare from it can be seen from ridiculously far away.',
simulate: 'spawnBlackHoleSystem', link: 'https://en.wikipedia.org/wiki/Tidal_disruption_event' }
];

var selectedEncEntry = null;

function openEncyclopedia() {
var enc = document.getElementById('encyclopedia');
enc.classList.remove('hidden');
setTimeout(function() { enc.classList.add('open'); }, 10);
buildEncList();
}

function closeEncyclopedia() {
var enc = document.getElementById('encyclopedia');
enc.classList.remove('open');
setTimeout(function() { enc.classList.add('hidden'); }, 350);
}

function buildEncList() {
var list = document.getElementById('enc-list');
list.innerHTML = '';
for (var i = 0; i < encyclopediaEntries.length; i++) {
(function(entry) {
var item = document.createElement('div');
item.className = 'enc-item';
item.style.borderLeftColor = entry.color;
item.innerHTML =
'<div class="enc-item-icon">' + entry.icon + '</div>' +
'<div class="enc-item-text">' +
'<div class="enc-item-title">' + entry.title + '</div>' +
'<div class="enc-item-sub">' + entry.sub + '</div>' +
'</div>' +
'<div class="enc-item-play">▶</div>';
item.addEventListener('click', function() {
document.querySelectorAll('.enc-item').forEach(function(el) { el.classList.remove('active'); });
item.classList.add('active');
showEncDetail(entry);
});
list.appendChild(item);
})(encyclopediaEntries[i]);
}
}

function showEncDetail(entry) {
selectedEncEntry = entry;
var detail = document.getElementById('enc-detail');
detail.classList.remove('hidden');
document.getElementById('enc-detail-icon').textContent = entry.icon;
document.getElementById('enc-detail-title').textContent = entry.title;
document.getElementById('enc-detail-subtitle').textContent = entry.sub;
document.getElementById('enc-detail-fact').textContent = '⚡ ' + entry.fact;
document.getElementById('enc-detail-desc').textContent = entry.desc;
var simBtn = document.getElementById('enc-simulate-btn');
var linkBtn = document.getElementById('enc-link-btn');
simBtn.onclick = function() {
    closeEncyclopedia();
    if (entry.simulate && window[entry.simulate]) {
        window[entry.simulate]();
    }
};
}