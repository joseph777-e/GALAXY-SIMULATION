##GRAVITY — N-Body Physics Playground

This is an interactive space simulation that allowas to collide planets, change  their gravity and see what would happen by alltering the gravity of different bodies in space.

## Try it ;

**[Play GRAVITY](https://joseph777-e.github.io/GALAXY-SIMULATION/)**

Click to start

## Features

-you can spawn different space bodies such as ; sun, planet, comets, black holes too... yeah for now its just that 
- you can also chnage their gravity and watch them respond to the changes like they would do in real life (approximately)
- create your own spacial scenarios and interact and play around with it 

## How it works

Gravity basically run intirely on the browser and is made by html, css and javascript(wich was mostly made by AI cause i suck at it :/ )

Every object (the space bodies) tracks its own position, velocity, mass and a few other properties. Each frame, the simulation calculates how every object pulls on every other object and updates their movement accordingly — that's the core N-body loop everything else sits on top of.

On top of the base gravity model there's a collision system, star classification, black holes, and object destruction. Most of the work went into getting these systems to coexist without stepping on each other or creating a bunch of mess. The collision/debris system was the worst offender — debris created from a breakup could trigger another breakup, which created more debris, and one collision could snowball into most of the simulation exploding at once. Fixing it meant tracing through the breakup logic and making sure debris could scatter without re-triggering the same checks that spawned it. Andas i said before i suck at javascript so when i tell you i had a hard time just know i did.

## What I learned :


- javascript and how its functions work
- Gravity and velocity calculations and formulas and how to implement them in java script 
- Collision detections
- Updating a large number of objects every frame without it falling over.

- Debugging chains of cause and effect that aren't obvious from the symptom

Most of the build was: make something, test it, break something else, figure out why, fix it, repeat. A few fixes for one system quietly broke a completely unrelated one(mostly cause i wasnt famliar with how vairables worked in java script at the time), which is most of where the debugging time went.

## Built with

- HTML
- CSS
- JavaScript
- HTML Canvas

## Credits

Built by Joseph (aka BIGjo-).
and some ai....


