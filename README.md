# GRAVITY — N-Body Physics Playground

An interactive space simulation for spawning planets, stars, comets, asteroids and black holes and watching gravity pull them around.



## Try it

**[Play GRAVITY](https://joseph777-e.github.io/GALAXY-SIMULATION/)**

Nothing to install — just open the link and start spawning objects.

## Features

- Spawn planets, stars, comets, asteroids, pulsars and black holes
- Set mass, size and starting velocity for each object
- Objects orbit, collide and get thrown around by gravity in real time
- Collisions merge objects or break them into debris
- Different star classes have different properties
- Click an object to inspect its stats
- Adjustable simulation speed
- Pan and zoom around the simulation

## How it works

GRAVITY runs entirely in the browser, built with HTML, CSS and JavaScript, rendered on a canvas.

Every object tracks its own position, velocity, mass and a few other properties. Each frame, the simulation calculates how every object pulls on every other object and updates their movement accordingly — that's the core N-body loop everything else sits on top of.

On top of the base gravity model there's a collision system, star classification, black holes, and object destruction. Most of the work went into getting these systems to coexist without stepping on each other. The collision/debris system was the worst offender — debris created from a breakup could trigger another breakup, which created more debris, and one collision could snowball into most of the simulation exploding at once. Fixing it meant tracing through the breakup logic and making sure debris could scatter without re-triggering the same checks that spawned it.

## What I learned

- Gravity and velocity calculations
- Working with vectors and movement
- Collision detection
- Updating a large number of objects every frame without it falling over
- Random generation for star/object variety
- Debugging chains of cause and effect that aren't obvious from the symptom

Most of the build was: make something, test it, break something else, figure out why, fix it, repeat. A few fixes for one system quietly broke a completely unrelated one, which is most of where the debugging time went.

## Built with

- HTML
- CSS
- JavaScript
- HTML Canvas

## Credits

Built by Joseph.

AI was used as a development helper for parts of the physics calculations and some of the math.
