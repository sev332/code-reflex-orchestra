

# 3D Studio → Unreal-Class Engine: Phased Upgrade Plan

## Current State
A basic React Three Fiber scene editor with: primitives (cube/sphere/cylinder/cone/torus/plane), 3 light types, PBR material inspector, 6 GLSL shader presets, transform gizmos, undo, environment presets, grid/snap. No physics, no animation system, no particle system, no post-processing, no terrain, no CSG, no skeletal meshes, no LOD, no viewport modes.

---

## Phase 1 — Rendering Pipeline (Post-Processing & PBR)
**Goal: Unreal-quality visual output**

- Add `@react-three/postprocessing` pipeline: Bloom, SSAO, SSR, Depth of Field, Tone Mapping, Vignette, Chromatic Aberration, Motion Blur
- Per-effect toggle + intensity controls in a new "Render Settings" inspector tab
- Upgrade material system: emission maps, normal map slot, roughness/metalness map slots, displacement mapping, clearcoat, transmission (glass), sheen (fabric)
- Add PBR material presets library (Metal, Glass, Wood, Concrete, Fabric, Plastic, Water, Skin — 20+)
- HDR environment map upload + custom HDRI support
- Realtime shadow quality controls (shadow map resolution, bias, cascade count)

**Files:** `Studio3DPage.tsx` (post-processing stack), new `src/components/Studio3D/MaterialLibrary.tsx`, new `src/components/Studio3D/RenderSettings.tsx`

---

## Phase 2 — Animation & Timeline System
**Goal: Unreal Sequencer equivalent**

- Keyframe animation engine: position, rotation, scale, material properties over time
- Timeline UI at bottom of viewport: scrubber, keyframe diamonds, play/pause/loop
- Easing curves (linear, ease-in/out, cubic bezier, bounce, elastic)
- Per-object animation tracks with multi-track editing
- Animation preview mode (play in viewport)
- Export animation data as JSON

**Files:** new `src/components/Studio3D/AnimationTimeline.tsx`, new `src/lib/3d-engine/animation-engine.ts`, new `src/lib/3d-engine/keyframe-types.ts`

---

## Phase 3 — Physics Engine (Rapier Integration)
**Goal: Unreal physics simulation**

- Integrate `@react-three/rapier` for rigid body physics
- Per-object physics properties panel: mass, friction, restitution, collider type (box/sphere/mesh/convex hull)
- Physics simulation play/pause/step
- Constraints: hinge, ball, fixed, prismatic joints
- Ragdoll preset
- Gravity controls, physics debug wireframe overlay

**Files:** new `src/components/Studio3D/PhysicsPanel.tsx`, new `src/lib/3d-engine/physics-config.ts`

---

## Phase 4 — Particle System (Niagara-Class)
**Goal: VFX particle editor**

- GPU-instanced particle emitter system
- Emitter types: point, sphere, cone, mesh surface
- Particle properties: lifetime, velocity, size curve, color gradient over life, gravity, drag
- Presets: fire, smoke, sparks, rain, snow, magic, explosion, dust
- Visual particle editor panel with live preview
- Multiple emitters per scene

**Files:** new `src/components/Studio3D/ParticleEditor.tsx`, new `src/lib/3d-engine/particle-system.ts`

---

## Phase 5 — Advanced Geometry & Tools
**Goal: Unreal modeling toolkit**

- CSG Boolean operations (union, subtract, intersect) via custom mesh math
- Subdivision surface modifier
- Mesh deformation tools (bend, twist, taper, lattice)
- Procedural geometry generators: terrain (noise-based heightmap), stairs, arch, spiral
- Vertex painting mode
- UV unwrap visualization
- LOD system with distance-based mesh switching

**Files:** new `src/lib/3d-engine/csg-engine.ts`, new `src/lib/3d-engine/terrain-generator.ts`, new `src/components/Studio3D/ProceduralTools.tsx`

---

## Phase 6 — Viewport & Camera System
**Goal: Unreal viewport parity**

- Multi-viewport layout: quad view (perspective + top + front + right), configurable splits
- Camera bookmarks (save/recall camera positions)
- Cinematic camera: focal length, sensor size, depth of field preview
- Camera path animation (spline-based flythrough)
- Viewport render modes: solid, wireframe, normals, UV, depth, AO-only
- Screenshot/render to image at configurable resolution
- Orthographic camera toggle per viewport

**Files:** new `src/components/Studio3D/ViewportManager.tsx`, new `src/components/Studio3D/CameraSystem.tsx`

---

## Phase 7 — Scene Management & World Building
**Goal: Unreal world composition**

- Hierarchical scene graph with drag-to-reparent
- Prefab system: save object groups as reusable prefabs
- Scene layers with visibility/lock per layer
- Instanced rendering for repeated objects (forests, crowds)
- Fog volumes (exponential, height-based)
- Sky system: procedural sky with sun position, clouds, atmospheric scattering
- Decal system for surface projections

**Files:** new `src/components/Studio3D/SceneManager.tsx`, new `src/components/Studio3D/PrefabLibrary.tsx`, new `src/lib/3d-engine/instancing-engine.ts`

---

## Phase 8 — Scripting & Blueprints
**Goal: Unreal Blueprint visual scripting**

- Node-based visual scripting using `@xyflow/react` (already installed)
- Event nodes: OnClick, OnCollision, OnTimer, OnKeyPress
- Action nodes: Move, Rotate, Scale, SetMaterial, PlayAnimation, SpawnParticle, PlaySound
- Logic nodes: Branch, Loop, Random, Compare, Variable Get/Set
- Live preview of script execution in viewport
- Script library with templates

**Files:** new `src/components/Studio3D/BlueprintEditor.tsx`, new `src/lib/3d-engine/blueprint-runtime.ts`

---

## Implementation Order & Dependencies

```text
Phase 1 (Rendering)     ← No dependencies, immediate visual impact
    ↓
Phase 2 (Animation)     ← Needs Phase 1 materials for animated props
    ↓
Phase 3 (Physics)       ← Independent, but benefits from Phase 2 timeline
    ↓
Phase 4 (Particles)     ← Uses Phase 1 post-processing for bloom/glow
    ↓
Phase 5 (Geometry)      ← Independent core tools
    ↓
Phase 6 (Viewports)     ← Better experience for all prior phases
    ↓
Phase 7 (World)         ← Needs all prior systems for complex scenes
    ↓
Phase 8 (Blueprints)    ← Ties everything together with interactivity
```

Each phase is self-contained and shippable. I will implement them one at a time, each fully production-quality before moving to the next.

