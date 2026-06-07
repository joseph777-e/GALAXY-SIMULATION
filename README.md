# GRAVITY — N-Body Physics Playground

An interactive browser simulation where you spawn planets, stars, comets, and black holes, then watch them orbit, collide, and explode under real-ish gravity.

No install needed — just open `index.html` in any modern browser.

## What it does

- **N-body gravity** — every body pulls on every other body
- **Collisions** — bodies merge, stars trigger supernovae, black holes absorb matter
- **Spawn & launch** — click and drag on the canvas to fling new bodies into the scene
- **Auto-orbit mode** — click near a massive body to insert a stable orbit
- **Presets** — solar system, binary stars, black hole system, and chaos mode
- **Zoom & pan** — scroll to zoom, middle-mouse or right-drag to pan
- **Live stats** — body count, supernova count, sim time, and zoom level
- **Event log** — click events in the log for a short science explanation

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

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page layout, UI panels, and controls |
| `style.css` | Dark space theme, panel styling, animations |
| `script.js` | Physics engine, rendering, input, and presets |

## Tech

Plain **HTML + CSS + JavaScript** with the Canvas API. No frameworks or build step.

## License

Personal project — use and modify freely.
