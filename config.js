// config.js — global simulation settings, shared state, and star-class lookup tables

// Canvas + context (declared here, first, so camera.js and input.js can safely
// call canvas.addEventListener(...) at load time)
var canvas = document.getElementById('sim');
var ctx = canvas.getContext('2d');

// Shared entity collections
var bodies = [];
var particles = [];
var shockwaves = [];
var nebulae = [];
var gravityWells = [];
var orbitGuides = [];
var showOrbitGuides = false; 
var paused = false;
var simTime = 0;
var novaCount = 0;
var frameCount = 0;
var G = 1.0;
var damping = 1.0;
var trailLen = 80;
var spawnType = 'planet';
var spawnMode = 'launch';
var customRadius = 0;
var customMass = 0;
var timeWarp = 1.0;
var wellStrength = 500;

// Currently selected/inspected body (shared across camera, physics, rendering, ui)
var selectedBody = null;

// Star classification tables
var starClasses = ['M', 'K', 'G', 'F', 'A', 'B', 'O'];
var starClassColors = {
'M': 'hsl(10,80%,55%)', 'K': 'hsl(25,85%,60%)', 'G': 'hsl(48,100%,70%)',
'F': 'hsl(55,90%,80%)', 'A': 'hsl(200,30%,90%)', 'B': 'hsl(215,80%,80%)', 'O': 'hsl(225,100%,75%)'
};
var starClassGlows = {
'M': '#ff4422', 'K': '#ff8833', 'G': '#ffcc00',
'F': '#ffe880', 'A': '#ccddff', 'B': '#88aaff', 'O': '#4466ff'
};
var starClassMassMin = { 'M': 80, 'K': 150, 'G': 250, 'F': 350, 'A': 450, 'B': 600, 'O': 800 };
var starClassMassMax = { 'M': 150, 'K': 250, 'G': 350, 'F': 450, 'A': 600, 'B': 800, 'O': 1200 };
var starClassRadiusMin = { 'M': 8, 'K': 10, 'G': 13, 'F': 15, 'A': 17, 'B': 19, 'O': 22 };
var starClassRadiusMax = { 'M': 11, 'K': 13, 'G': 16, 'F': 18, 'A': 20, 'B': 23, 'O': 28 };
