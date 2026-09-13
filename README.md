# GRAVITY — N-Body Physics Playground

An interactive space simulation where you can create planets, stars, comets, asteroids and black holes and watch them interact through gravity.

![GRAVITY screenshot](YOUR_SCREENSHOT_HERE)

## 🚀 Try it

**[Play GRAVITY](https://joseph777-e.github.io/GALAXY-SIMULATION/)**

## Quick start

There's nothing to install.

Just open the link above and start creating objects.

## Features

- 🌍 Spawn planets, stars, comets, asteroids, pulsars and black holes
- 🪐 Give objects different masses, sizes and starting velocities
- 🌀 Watch objects orbit, collide and get thrown around by gravity
- 💥 Collisions can merge objects or create debris
- ⭐ Different star classes have different properties
- 🔭 Select objects and inspect their information
- ⏩ Change the simulation speed
- 🌌 Pan and zoom around the simulation

## How it works

GRAVITY is made with **HTML, CSS and JavaScript** and runs directly in the browser.

The simulation keeps track of each object's position, velocity, mass and other properties. Every update, the program calculates how the objects affect each other and changes their movement based on those calculations.

I also added different systems on top of the basic gravity simulation, such as collisions, different types of stars, black holes and object destruction.

The difficult part wasn't just making the objects move. It was getting all of these systems to work together without constantly breaking each other.

For example, at one point objects created as debris could trigger another breakup, which created even more debris. This could basically turn one event into a giant chain reaction. I had to find what was causing it and change the logic so the debris could scatter without starting the whole process again.

## What I learned

This project taught me a lot about how different parts of a program can interact with each other.

I got more comfortable with:

- Gravity and velocity calculations
- Vectors and movement
- Collision detection
- Updating objects every frame
- Random generation
- JavaScript
- Debugging problems that aren't immediately obvious

A lot of the development was basically:

**make something → test it → break something → figure out why → fix it → repeat**

And there were definitely some moments where fixing one thing broke something completely unrelated.

## AI usage

I used AI as a development helper for parts of the JavaScript structure, physics calculations and some of the maths.

It helped me understand and get unstuck on certain parts, but I still had to put the systems together, test them, find bugs and work out why things weren't behaving correctly.

The project went through a lot of testing and debugging rather than being generated once and left alone.

## Built with

- HTML
- CSS
- JavaScript
- HTML Canvas

## Credits

Built by Joseph.

AI was used as a development helper for parts of the code and physics calculations.
