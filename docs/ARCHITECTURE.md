# Architecture and engineering decisions

## A static application

`site/index.html` loads `app.js`, which fetches the learning datasets and handles hash routes. Feature modules mount into the main content region and return cleanup functions. The application has no backend, account database, or required API secrets.

| Feature | Main files |
| --- | --- |
| Homepage and interactive station | `observatory.js`, `orbit-view.js`, `v4.css` |
| Lessons and learning paths | `academy.js`, `campus.js`, `data/missions*.json`, `data/learning-paths*.json` |
| Arcade models and UI | `flight-deck.js`, `flight-deck.css` |
| Controller, beam, reliability studio | `design-studio.js`, `design-studio.css` |
| Foundation labs | `foundation-lab.js`, `foundation-lab.css` |
| Settlement services | `settlement-builder.js`, `settlement-builder.css` |
| Project studies | `projects-data.js`, `projects-expansion.js`, `campus.js` |
| Local progress and reviews | `journey-store.js`, `workbench-store.js` |
| Speaker excerpts | `reels.js`, `reels.css`, `data/reels.json` |
| Sharing studio | `share.html`, `share.js`, `share.css` |

## Models worth inspecting

- **Lunar descent:** fixed-step integration, thrust direction, fuel consumption, ground crossing, and independent touchdown limits. An example guidance controller makes the challenges demonstrably solvable.
- **Orbital transfer:** vis-viva and a two-impulse transfer model. Reaching the target radius and matching circular velocity are separate conditions. Playback time is accelerated.
- **Robot arm:** two-link forward/inverse kinematics, reachability, two configuration branches, and link/obstacle checks.
- **Control studio:** a mass-spring-damper system with PID control, actuator saturation, anti-windup, and a disturbance input.
- **Beam studio:** small-deflection cantilever relationships; the drawing exaggerates displacement while numerical metrics retain their units.
- **Reliability studio:** an r-out-of-n model separating independent channel failures from a common failure probability.

Every model is intentionally scoped for learning. Read the equations and assumptions in the interface before interpreting a result beyond the exercise.

## Data and privacy

The application saves progress in browser storage. Different features use separate namespaces; a Mission Control backup does not include every feature's data. Studio snapshots have their own export. The privacy page explains the boundaries.

Google Fonts, Vercel, and YouTube involve external requests. Reel thumbnails can load before playback; the player loads after a click. A failed privacy-enhanced player can be replaced only after the visitor chooses the labeled standard-player fallback. Moving between excerpts removes the previous player.

## Tradeoffs

Static hosting keeps deployment simple and the application usable without accounts. Progress remains device/browser-specific. Browser storage can be unavailable or cleared, so exports matter. External talks can change or disappear. Testing uses analytical model checks and lightweight DOM/storage harnesses, supplemented by real-browser verification for playback, downloads, focus, and responsive layout.
