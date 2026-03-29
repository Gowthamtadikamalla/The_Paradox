# The Paradox

A surreal, browser-native 3D puzzle game built with **Three.js**, **TypeScript**, and **3D Gaussian Splatting** (`@sparkjsdev/spark`). Two layered worlds explore impossible architecture, gravity, and time dilation without leaving the web.

**Hero banner:** Drop your best wide, cinematic Dream City Gaussian Splat screenshot into the repo (for example `docs/hero-banner.png`) and add:

`![Dream City — Gaussian Splat](docs/hero-banner.png)`

---

## Inspiration

We have always been drawn to mind-bending sci-fi: the dream-within-a-dream architecture of *Inception*, localized gravity distortion in *Interstellar*, and the environmental puzzles of *Portal*. We wanted those cinematic ideas on the web—atmospheric, brain-teasing, and native to the browser.

We also wanted to push **3D Gaussian Splatting** beyond static viewing: dense, photoreal environments as the backbone of **interactive gameplay**.

---

## What it does

**The Paradox** is a two-layer 3D puzzle exploration game, entirely in the browser.

### Layer 1: The Dream City

Players enter a fractured, surreal cityscape. A HUD compass guides exploration through impossible geometry. Find three visual anomalies—the **Anomaly Origin**, the **Rotating Room**, and the **Clock Courtyard**—to reconcile the fracture, reach a cryptic chamber, and use a **totem** to leave the dream.

### Layer 2: The Desolate Exoplanet Observatory

A physics and time-bending puzzle. A **Blue Metronome** ticks at 1 Hz; a **Red Metronome** runs wild under a localized gravity fracture. Players locate, pick up, and carry a glowing **Gravity Dampener**. Distance from an anchor changes localized time dilation on the red pendulum; the goal is to find the spatial sweet spot where both pendulums **synchronize** and the paradox collapses.

---

## How we built it

| Area | Details |
|------|---------|
| **Engine & physics** | Custom TypeScript + **Three.js**; collision via **Three.js octrees**; smooth, sub-stepped first-person movement. |
| **Gaussian splatting** | **`@sparkjsdev/spark`** renders dense **`.spz`** splats as the visual core of the worlds (no heavy polygon meshes for those scenes). |
| **Game systems** | Modular **InteractionSystem**, **TriggerSystem**, and **TransitionSystem**—pickups bound to the camera matrix, triggers, and clean disposal across world loads. |
| **Layer 2 math** | Time dilation updated in the render loop. Red pendulum speed uses a dampening curve from radial distance on the **XZ plane** (height was flattened so the puzzle stays fair): |

$$
\text{Speed} = \max\left(1.0,\ 10.0 - \frac{20.0}{\text{Distance} + 1.0}\right)
$$

Radial distance on **XZ** drives the sine-wave phase of the red pendulum in real time.

---

## Challenges

- **Splats vs. collision** — Splats are not solid geometry. We aligned invisible **glTF collider** meshes with **`.spz`** splats so the player does not fall through the world.
- **Dilation feel** — Early **3D** distance (including vertical offset between metronomes and floor) made sync unfair. We moved to a **flattened XZ** relationship so dampening reads intuitively.
- **Performance** — Millions of splats plus continuous octree queries needed tight render loops, physics sub-stepping, and disciplined disposal of materials/textures during **seamless** world transitions.

---

## Accomplishments

- Gaussian splats driving a **fully playable** WebGL experience in a normal browser.
- **Seamless, in-code** transition between two very different worlds—no full-page reloads or heavy loading chrome.
- The moment the math **clicks** and red and blue metronomes lock into sync.

---

## What we learned

Deeper **WebGL / Three.js** matrix work, game state in a web-only stack (no Unity/Unreal), pendulum-style motion, localized time-dilation approximations, and production use of **Gaussian Splatting** on the web.

---

## What's next

- **WebXR** — Refactor camera for headsets and physical movement through the spaces.
- **More layers** — Non-Euclidean portals, reverse-time gravity zones, Escher-style gravity inversion.
- **Procedural audio** — Tie render-loop math to **Web Audio** so ticks, cracks, and ambience follow the simulation spatially.

---

## Getting started

**Requirements:** Node.js 18+ recommended.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production build
npm run preview  # serve the build locally
```

---

## Tech stack

- [Three.js](https://threejs.org/)
- [Vite](https://vitejs.dev/)
- TypeScript
- [@sparkjsdev/spark](https://www.npmjs.com/package/@sparkjsdev/spark) (Gaussian splats / `.spz`)

---

## Team

- **Pranay Bathini**
- **Gowtham Krishna**
- **Dhanush Garikapati**

---

## License

This project is private unless you add an explicit license file.
