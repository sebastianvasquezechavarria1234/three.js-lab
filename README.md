<div align="center">

# ⭐ Three.js Lab

### A living laboratory for experimenting with 3D graphics in the browser

[![Made with Three.js](https://img.shields.io/badge/Made%20with-Three.js-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![GSAP](https://img.shields.io/badge/Animations-GSAP-88CE02?style=for-the-badge)](https://greensock.com/gsap/)
[![No Build Tools](https://img.shields.io/badge/No%20Bundlers-Zero%20Dependencies-blue?style=for-the-badge)]()

[View Live Demo](https://sebas-dev.vercel.app/)

</div>

---

## About this project

This is not a copied tutorial. Not a downloaded template that was slightly modified. Every line of code here was written with intention: to learn, to experiment, and to create something that feels alive.

Three.js Lab is a laboratory where I explored everything that can be achieved with Three.js without relying on complicated build tools. Just modern HTML, JavaScript, and a lot of curiosity to understand how things work from the inside.

Each group in the scene represents a different challenge. Every texture, every shadow, every particle was placed there on purpose. There is no dead code. No leftover "just in case" features.

This project is the sum of hours of trial and error, of searching for answers, of understanding why something wasn't working, and of the satisfaction of finally seeing it come to life.

---

## What problem does it solve?

It doesn't solve a business problem. It's not a production app. It's something harder to achieve: **understanding**.

This project is my way of answering questions that documentation alone can't answer:

- How do you generate procedural terrain with custom shaders?
- How do you load a 3D model and clone it across the scene?
- How do you create particle systems that move over time?
- How do you make 3D interactions with raycasting?
- How do you structure a complex scene without everything becoming chaos?

Each group in the scene is the answer to one of those questions.

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🌳 **Hierarchical 3D models** | Tree.glb model loaded and cloned within nested sub-groups |
| 🌫️ **Particle system** | 40 orbiting petals + fog particle with webp texture |
| 🏔️ **Procedural terrain** | Custom GLSL shader with 15 octaves of 3D Simplex noise |
| 💡 **Animated lights** | 6 luminous spheres with PointLight moving sinusoidally |
| 🧊 **PBR textures** | Wood (2K) and marble (1K) with basecolor, normal, roughness, height, AO |
| 🔤 **Interactive 3D text** | "sebastian v." in Luckiest Guy font, orange hover + click modal |
| 🪟 **Animated modal** | Smooth GSAP transitions: scale, rotation, blur and fade |
| 🖱️ **Orbital controls** | Free camera with damping to explore the scene |
| 📱 **Responsive** | Adapts to window size with automatic camera updates |

---

## Project Architecture

```
pratica-threejs/
│
├── index.html              ← Entry: canvas, modal, links, importmap
├── main.js                 ← Core: scene, groups, shaders, animations
├── style.css               ← Styles: font, modal, canvas, footer buttons
│
├── font/
│   ├── LuckiestGuy-Regular.ttf        ← Font for CSS (modal)
│   └── Luckiest Guy_Regular.json      ← Font for Three.js (3D text)
│
├── img/
│   ├── fog-5.webp          ← Fog particle texture
│   └── petal.webp          ← Petal texture for orbiting particles
│
├── models/
│   └── Tree.glb            ← 3D tree model (GLTF Binary)
│
└── textures/
    ├── pared/              ← Marble textures for walls
    │   ├── marble_108_basecolor-1K.png
    │   ├── marble_108_height-1K.png
    │   ├── marble_108_normal-1K.png
    │   └── marble_108_roughness-1K.png
    │
    └── plane/              ← Wood textures for base floor
        ├── woodplank_39_AmbientOcclusion-2K.jpg
        ├── woodplank_39_BaseColor-2K.jpg
        ├── woodplank_39_Height-2K.jpg
        ├── woodplank_39_Normal-2K.jpg
        └── woodplank_39_Roughness-2K.jpg
```

**Total files:** 17 | **Total asset size:** ~4.5 MB

---

## Technologies Used

### 3D Engine

| Technology | Version | Purpose |
|------------|---------|---------|
| Three.js | 0.170.0 | Core 3D rendering engine |
| OrbitControls | — | Camera controls with damping |
| GLTFLoader | — | Loading .glb models |
| FontLoader + TextGeometry | — | 3D text rendering |

### Animation

| Technology | Version | Purpose |
|------------|---------|---------|
| GSAP | 3.12.5 | Modal and DOM transition animations |

### Asset Formats

| Format | Count | Purpose |
|--------|-------|---------|
| GLB (GLTF Binary) | 1 | 3D tree model |
| PNG (1K) | 4 | PBR marble textures |
| JPG (2K) | 5 | PBR wood textures |
| WebP | 2 | Particle textures |
| TTF | 1 | Font typeface |
| JSON | 1 | Font for Three.js |

---

## The Scene: 5 Groups, 5 Challenges

Each group in the scene is an independent laboratory. All coexist on a 20×20 plane divided into quadrants.

### 🔴 Group 1 — Hierarchical Trees

*Position: (-5, 0.01, -5)*

A 10×10 plane with 4 sub-groups of 5×5 each. Each sub-group has a different color (orange, purple, cyan, pink) and a cloned Tree.glb model at half scale.

The goal was to understand how Three.js's scene graph works: how groups nest, how transformations are inherited, and how to clone models without duplicating geometry in memory.

### 🟢 Group 2 — Particles and Fog

*Position: (5, 0.01, -5)*

A large fog particle (size 12) using fog-5.webp as texture. Surrounded by 40 petals orbiting an invisible center at radius 3. The petals update every frame by directly manipulating the position buffer.

This group taught me that particles in Three.js aren't magic: they're arrays of numbers you move manually.

### 🔵 Group 3 — Procedural Terrain

*Position: (-5, 0.01, 5)*

The most technical of all. A `ShaderMaterial` with a vertex shader implementing 15 octaves of 3D Simplex noise. Each octave has a different frequency and amplitude, creating elevations that range from green grass to white snow, passing through brown earth.

The fragment shader colors by height: green at the bottom, brown in the middle, white at the top. No external textures. Pure mathematics.

```
Elevation: max(0, simplex_noise * total_amplitude)
Colors:    green (0-40%) → brown (40-60%) → white (60-100%)
```

### 🟡 Group 4 — Room with Lights and Text

*Position: (5, 0.01, 5)*

Two marble walls (pared-1 back wall, pared-2 side wall with full PBR textures). Six luminous spheres of different colors moving with sinusoidal functions, each with its own PointLight at intensity 150.

In the center, 3D text "sebastian v." using the Luckiest Guy font. On hover it turns orange. On click, a modal opens with GSAP animation.

### ⬛ Group 5 — Ceiling

*Position: (5, 10, 5)*

An inverted plane on the ceiling. Simple, but necessary to complete the room in group 4.

---

## How It Works

```
1. The browser loads index.html
   └─→ Loads GSAP from CDN
   └─→ Resolves the Three.js importmap
   └─→ Executes main.js as ES module

2. main.js loads all assets with Promise.all()
   └─→ 9 PBR textures (wood + marble)
   └─→ 2 particle textures
   └─→ 1 GLB model
   └─→ 1 font (separate load)

3. Once ready, constructs the scene
   └─→ WebGL renderer with antialiasing
   └─→ Perspective camera (FOV 60)
   └─→ Orbital controls with damping
   └─→ Lighting: ambient + directional + 6 point lights

4. Creates the 5 groups with their objects

5. Starts the animation loop (requestAnimationFrame)
   └─→ Updates orbiting particles
   └─→ Moves luminous spheres
   └─→ Updates controls
   └─→ Renders the scene

6. Listens for interactions
   └─→ Raycaster for text hover/click
   └─→ Modal with GSAP
   └─→ Automatic camera resize
```

---

## Installation

### Requirements

- A modern browser (Chrome, Firefox, Safari, Edge)
- A local server (can't open via `file://` due to ES modules)

### Steps

```bash
# Clone the repository
git clone https://github.com/sebastianvasquezechavarria1234/three.js-lab.git

# Enter the directory
cd three.js-lab

# Start a local server
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js (if http-server is installed)
npx http-server -p 8000

# Option 3: VS Code with Live Server
```

Open `http://localhost:8000` in your browser.

### Environment Variables

None needed. This is a static project with no backend or APIs.

---

## Scene Configuration

| Parameter | Value |
|-----------|-------|
| Canvas resolution | Full window size |
| Max pixel ratio | 2 (prevent HiDPI performance issues) |
| Background color | Black (`#000000`) |
| Camera position | `(0, 10, 20)` looking at origin |
| Camera FOV | 60° |
| Near plane | 0.1 |
| Far plane | 1000 |
| OrbitControls damping | 0.05 |
| Terrain segments | 128×128 |
| Simplex noise octaves | 15 |
| Petal particles | 40 |
| Orbit radius | 3.0 |
| Point lights | 6 (intensity 150, distance 25) |
| Modal animation duration | 0.4–0.6s |

---

## Best Practices Applied

- **Async loading with Promise.all**: All assets load before scene construction, preventing missing texture issues
- **Limited pixel ratio**: `Math.min(devicePixelRatio, 2)` to avoid overloading mobile GPUs
- **ES modules without bundler**: Using importmaps to import Three.js directly from CDN
- **Hierarchical scene graph**: Nested groups for organizing objects with relative transformations
- **Mixed materials**: `MeshStandardMaterial` for standard objects, `ShaderMaterial` for procedural terrain
- **Manual particle buffers**: Direct position array manipulation for efficient orbital movement
- **NDC raycaster**: Normalized device coordinates for precise interaction detection

---

## Possible Future Improvements

- Add dynamic shadows with `ShadowMap`
- Implement post-processing (bloom, SSAO)
- Add 3D positional audio
- Create more procedural shaders (water, fire, clouds)
- Add animations with Three.js animation mixer
- Implement LOD (Level of Detail) for distant models
- Add a GPU compute-based particle system

---

## Notes for Developers

- The wood textures (`textures/plane/`) are loaded but only the basecolor is applied to the base plane. The other layers (normal, roughness, AO) are available if a more realistic finish is desired
- Marble textures are applied differently per wall: pared-1 uses only basecolor, pared-2 uses the full PBR package
- The terrain uses `max(0, elevation)` to prevent negative values that would create geometry below the plane
- The Luckiest Guy font loads in two formats: `.ttf` for CSS (modal) and `.json` for Three.js (3D text)
- Light animation timings are randomly generated with `Math.random()` when creating each sphere
- GSAP is only used for DOM animations (modal), not for 3D objects

---

## Credits

- **3D Engine**: [Three.js](https://threejs.org/) — the heart of everything
- **Animations**: [GSAP](https://greensock.com/gsap/) — for transitions that feel natural
- **Typography**: [Luckiest Guy](https://fonts.google.com/specimen/Luckiest+Guy) — with personality
- **PBR Textures**: [ambientCG](https://ambientcg.com/) — marble and wood of quality
- **3D Model**: Tree.glb — stylized tree for the scene
- **Simplex Noise**: GLSL implementation based on the work of Stefan Gustavson and Ashima Arts

---

<div align="center">

*Some projects aren't built to solve a problem.*
*They're built to ask questions.*

*And sometimes, on the way to finding answers,*
*you end up creating something you didn't even know could exist.*

*This project is that.*

**Sebastián V** ❤️

</div>
