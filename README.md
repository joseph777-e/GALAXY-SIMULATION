# GRAVITY — N-Body Physics Playground

An interactive browser simulation where you spawn planets, stars, comets, black holes, and asteroids — then watch them orbit, collide, tear apart, and explode under real-ish gravity.

**Engine v3.1** — no install needed. Open `index.html` in any modern browser.

**Live demo:** [https://joseph777-e.github.io/GALAXY-SIMULATION/](https://joseph777-e.github.io/GALAXY-SIMULATION/)

## What it does

- **N-body gravity** — every body pulls on every other body
- **Collisions** — bodies merge, stars trigger supernovae, black holes absorb matter
- **Star classes** — M through O spectral types with different colors and sizes
- **Planet rings** — some planets spawn with Saturn-style rings
- **Day/night** — planets show a lit side facing the nearest star
- **Roche limit** — small bodies get torn apart near massive ones
- **Nebula clouds** — colorful remnants after supernovae
- **Gravitational lensing** — visual distortion around black holes
- **Spawn & launch** — click and drag on the canvas to fling new bodies
- **Auto-orbit mode** — click near a massive body to insert a stable orbit
- **Presets** — solar system (with asteroid belt), binary stars, black hole system, chaos mode
- **Zoom & pan** — scroll to zoom, middle-mouse or right-drag to pan
- **Live stats** — body count, supernova count, sim time, and zoom level
- **Event log** — click events for a short science explanation

## How to run

1. Download or clone this repo
2. Open `index.html` in Chrome, Firefox, or Edge

Or run a local server (optional):

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`

## Controls

| Action | Control |
|--------|---------|
| Start simulation | **Launch Simulation** on intro screen |
| Spawn + launch | Left-click and drag on canvas |
| Auto-orbit spawn | Switch to **Auto-Orbit**, then click |
| Zoom in / out | Mouse scroll wheel, or **+** / **−** buttons |
| Pan view | Middle-mouse drag or right-click drag |
| Reset / center view | **Reset View** / **Center View** in panel |
| Pause | **Pause** button |
| Toggle side panel | **◀** tab on the right edge |

## Side panel

- **Spawn Type** — Planet, Star, Black Hole, Comet
- **Body Size** — custom radius and mass (0 mass = auto by type)
- **Spawn Mode** — Launch (drag) or Auto-Orbit
- **Physics** — gravity strength, damping, trail length
- **View** — zoom slider, reset/center camera
- **Presets** — Chaos, Solar System, Binary Stars, Black Hole, Clear All

## Performance tips

This sim is CPU-heavy with many bodies and effects. For smoother play:

- Lower **Trail Length** to 0–20
- Avoid spamming **Chaos Mode**
- Use **Pause** when not watching
- Hit **Clear All** after big explosions or if there is alot of bodies 

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page layout, UI panels, and controls |
| `style.css` | Dark space theme, panel styling, animations |
| `script.js` | Physics engine, rendering, input, and presets |

## Tech

Plain **HTML + CSS + JavaScript** used AI to build most structures for the java script phyics engine and the maths calculation for speed and gravity outcomes but i also had to debugg many things on my own.

## License

Personal project — use and modify freely. But it would be bettter if u also supported ty... :)
