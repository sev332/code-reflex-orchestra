# LUCID Illustrator — Full Spec Master Plan
## Goal: Match or Exceed Adobe Illustrator

---

## CURRENT STATE AUDIT

### ✅ What We Have (Solid Foundation)
| System | Status | Quality |
|--------|--------|---------|
| **Geometry Core** | ✅ Complete | Cubic Bézier eval, derivative, curvature, subdivision, flattening, arc-length, tight bounds, closest-point, curve fitting, intersections, offsetting |
| **Stroke Core** | ✅ Complete | Width profiles (uniform/sampled/pressure/procedural/tapered), pressure curves, caps (butt/round/square/tapered), joins (miter/round/bevel), stroke expansion pipeline, Chaikin smoothing, RDP simplification |
| **Brush Core** | ✅ Complete | Input stabilizers (none/moving-avg/lazy-mouse/pulled-string/catmull-rom), dynamic signal mapping (pressure/tilt/velocity/curvature→width/opacity), BrushSession pipeline, 5 built-in presets |
| **Node Editing** | ✅ Complete | Shape→path conversion, anchor/handle hit testing, anchor manipulation with handle mirroring, add/delete anchors, transform handles (9-handle bounding box), scale/rotate transforms |
| **Path Operations** | ✅ Partial | RDP simplify, reverse, offset, boolean ops (union/subtract/intersect — bounding-box approximation only) |
| **Renderer** | ✅ Complete | Canvas2D: grid, artboard, shapes (rect/ellipse/polygon/star/line), brush strokes (variable-width), live preview (shape/brush/line/pen), node overlay, transform handles |
| **UI/UX** | ✅ Good | 16-tool palette, properties panel, layers panel, color swatches, brush presets, zoom controls, keyboard shortcuts |
| **Command History** | ✅ Partial | 200-deep stack, execute/undo/redo — but NOT wired to most operations |

### ❌ What's Missing (vs Adobe Illustrator)

---

## PHASE 1: CORE DRAWING COMPLETION
*Priority: Critical — These are table-stakes features*

### 1.1 Pen Tool Overhaul
- [ ] **Bézier handle dragging on anchor creation** — drag from anchor to create curves (Illustrator's #1 feature)
- [ ] **Alt/Option click to convert smooth↔corner** anchor points
- [ ] **Close path** — click first anchor to close
- [ ] **Continue existing path** — click endpoint to extend
- [ ] **Pen preview rubber-band** — live curve preview while placing
- [ ] **Curvature Tool** — simplified pen (auto smooth anchors, click-only)

### 1.2 Pencil Tool Enhancement
- [ ] **Auto-smooth with curve fitting** — convert freehand to clean Bézier paths
- [ ] **Fidelity/Smoothness slider** — control curve fitting tolerance
- [ ] **Edit existing paths** — draw over to reshape
- [ ] **Close path on overlap detection**

### 1.3 Shape Tools Completion
- [ ] **Rounded Rectangle** — separate tool with corner radius control
- [ ] **Live Corners** — drag corner widgets on any shape to round individually
- [ ] **Arc tool** — draw arcs (open paths)
- [ ] **Spiral tool** — logarithmic/Archimedean spirals
- [ ] **Rectangular/Polar Grid** tools
- [ ] **Flare tool** — lens flare generation
- [ ] **Shape precise input** — click canvas to enter exact dimensions dialog

### 1.4 Text System (Complete Rebuild)
- [ ] **Point text** — click to create single-line text
- [ ] **Area text** — drag to create text box with wrapping
- [ ] **Type on a path** — flow text along any path
- [ ] **Font picker** with preview, search, categories
- [ ] **Character panel** — tracking, kerning, leading, baseline shift
- [ ] **Paragraph panel** — alignment, indents, spacing
- [ ] **Text outlines** — convert text to editable paths
- [ ] **OpenType features** — ligatures, alternates, small caps

---

## PHASE 2: APPEARANCE & COLOR SYSTEM
*Priority: High — Visual quality depends on this*

### 2.1 Gradient System
- [ ] **Linear gradient tool** — interactive on-canvas editing
- [ ] **Radial gradient tool** — center, focal point, radius
- [ ] **Freeform gradient** — mesh-like gradient with arbitrary color stops
- [ ] **Gradient on stroke** — apply along/across/within stroke
- [ ] **Gradient panel** with color stop editing, angle, type switching

### 2.2 Color System
- [ ] **Color picker** — HSB/RGB/CMYK/HEX with spectrum + slider
- [ ] **Swatches panel** — save, organize, pattern/gradient swatches
- [ ] **Color groups** — harmonies (complementary, triadic, etc.)
- [ ] **Recolor Artwork** — remap all colors at once
- [ ] **Global colors** — change once, update everywhere
- [ ] **Live Paint** — fill regions between overlapping paths

### 2.3 Appearance Panel
- [ ] **Multiple fills & strokes** per object
- [ ] **Effects stack** — ordered list of effects per object
- [ ] **Graphic Styles** — save & apply appearance combinations
- [ ] **Opacity per fill/stroke** independently

### 2.4 Brush System Enhancement
- [ ] **Art Brushes** — stretch artwork along path
- [ ] **Scatter Brushes** — distribute objects along path
- [ ] **Pattern Brushes** — tile pattern along path (start/end/corner tiles)
- [ ] **Blob Brush** — paint filled shapes that auto-merge
- [ ] **Brush library panel** — categorized presets
- [ ] **Custom brush creation** from artwork

---

## PHASE 3: TRANSFORM & MODIFY TOOLS
*Priority: High — Productivity multipliers*

### 3.1 Transform Tools
- [ ] **Rotate Tool** — click to set origin, drag to rotate (with copy)
- [ ] **Reflect Tool** — mirror across axis
- [ ] **Scale Tool** — proportional/non-proportional with origin
- [ ] **Shear Tool** — skew objects
- [ ] **Free Transform Tool** — perspective distort, free distort
- [ ] **Transform panel** — precise numeric input (X, Y, W, H, rotation, shear)
- [ ] **Transform Each** — apply transform to each selected object independently

### 3.2 Reshape Tools
- [ ] **Width Tool** — drag to create variable-width stroke profiles
- [ ] **Warp Tool** — push/pull pixels/points
- [ ] **Twirl Tool** — rotate points around center
- [ ] **Pucker Tool** — pull points toward center
- [ ] **Bloat Tool** — push points away from center
- [ ] **Scallop Tool** — add random wavy detail
- [ ] **Crystallize Tool** — add spike detail
- [ ] **Wrinkle Tool** — add wrinkle detail
- [ ] **Puppet Warp** — pin-based mesh deformation
- [ ] **Envelope Distort** — warp object into shape (make with warp/mesh/top object)

### 3.3 Scissors & Knife
- [ ] **Scissors Tool** — cut path at point
- [ ] **Knife Tool** — freehand cut through objects
- [ ] **Eraser Tool Enhancement** — erase through paths cleanly (split into new paths)

### 3.4 Shape Builder
- [ ] **Shape Builder Tool** — drag across regions to merge/subtract (Illustrator's most-loved modern tool)
- [ ] **Smart highlighting** of mergeable regions
- [ ] **Alt-click to subtract** regions

---

## PHASE 4: PATHFINDER & BOOLEAN (PROPER)
*Priority: High — Current booleans are bounding-box approximations*

### 4.1 Real Boolean Operations
- [ ] **Proper path-path intersection** using Greiner-Hormann or Weiler-Atherton algorithm
- [ ] **Unite** — merge overlapping shapes
- [ ] **Minus Front** — subtract front from back
- [ ] **Minus Back** — subtract back from front
- [ ] **Intersect** — keep only overlapping area
- [ ] **Exclude** — keep only non-overlapping areas
- [ ] **Divide** — split at all intersections
- [ ] **Trim** — remove hidden parts
- [ ] **Merge** — like unite but removes hidden fills
- [ ] **Crop** — clip to front shape
- [ ] **Outline** — divide at intersections, keep strokes

### 4.2 Compound Paths
- [ ] **Make Compound Path** — combine paths with even-odd fill rule (holes)
- [ ] **Release Compound Path**
- [ ] **Compound path rendering** with fill-rule support

---

## PHASE 5: LAYERS, GROUPS & ORGANIZATION
*Priority: Medium — Workflow efficiency*

### 5.1 Layer System Enhancement
- [ ] **Sublayers** — nested layer hierarchy
- [ ] **Layer reordering** — drag to reorder
- [ ] **Layer targeting** — click to select all on layer
- [ ] **Layer clipping masks**
- [ ] **Layer appearance** — apply effects/opacity to entire layer
- [ ] **Layer colors** — selection highlight colors per layer

### 5.2 Groups & Isolation
- [ ] **Group/Ungroup** (Ctrl+G / Ctrl+Shift+G)
- [ ] **Isolation Mode** — double-click group to edit contents
- [ ] **Nested groups**
- [ ] **Clipping Masks** — clip contents to shape
- [ ] **Opacity Masks** — gradient-based masking

### 5.3 Symbols
- [ ] **Symbol panel** — reusable artwork instances
- [ ] **Symbol editing** — edit master, update all instances
- [ ] **9-slice scaling** for symbols
- [ ] **Symbol Sprayer** tools (spray, size, spin, stain, screen, style)

### 5.4 Object Management
- [ ] **Align panel** — align/distribute to selection/artboard/key object (WORKING, currently placeholder)
- [ ] **Distribute spacing** — equal spacing between objects
- [ ] **Arrange** — bring to front/back, forward/backward
- [ ] **Copy/Paste in place** / **Paste on all artboards**

---

## PHASE 6: EFFECTS & FILTERS
*Priority: Medium — Creative capabilities*

### 6.1 Illustrator Effects (Vector)
- [ ] **Drop Shadow**
- [ ] **Inner/Outer Glow**
- [ ] **Feather**
- [ ] **Gaussian Blur** (rasterized)
- [ ] **Stylize** — round corners, add arrowheads
- [ ] **Distort & Transform** — roughen, zig-zag, pucker/bloat, transform effect
- [ ] **Path effects** — offset path, outline stroke, outline object

### 6.2 Blend Tool
- [ ] **Blend between shapes** — morph with specified steps
- [ ] **Blend along spine** — blend distributed on a path
- [ ] **Smooth color/specified steps/specified distance** options

### 6.3 Pattern System
- [ ] **Pattern Editor** — tile editing with live preview
- [ ] **Pattern types** — grid, brick, hex
- [ ] **Pattern fill** for objects
- [ ] **Pattern transform** — scale/rotate pattern independently of object

### 6.4 Mesh Gradient
- [ ] **Gradient Mesh** — create mesh grid on shape
- [ ] **Color individual mesh points**
- [ ] **Adjust mesh topology**

---

## PHASE 7: ARTBOARDS & WORKSPACE
*Priority: Medium — Professional workflow*

### 7.1 Artboard System
- [ ] **Multiple artboards** — independent canvas areas
- [ ] **Artboard tool** — create, resize, reorder, rename
- [ ] **Artboard presets** — common sizes (A4, Letter, iPhone, etc.)
- [ ] **Artboard navigation** — panel with thumbnails
- [ ] **Rearrange artboards**

### 7.2 Rulers, Guides & Smart Guides
- [ ] **Rulers** — horizontal/vertical with unit display
- [ ] **Guides** — drag from rulers; lock/unlock/clear
- [ ] **Smart Guides** — real-time snapping with dimension labels
- [ ] **Alignment guides** — snap to edges/centers of other objects
- [ ] **Spacing guides** — equal spacing indicators
- [ ] **Measure tool** — dimension annotation

### 7.3 Views
- [ ] **Outline mode** — wireframe view (Ctrl+Y)
- [ ] **Pixel Preview** — rasterized preview
- [ ] **Overprint Preview**
- [ ] **GPU Preview** — smooth rendering
- [ ] **Custom views** — save zoom/position presets

---

## PHASE 8: IMPORT/EXPORT & FILE HANDLING
*Priority: Medium — Interoperability*

### 8.1 Export
- [ ] **SVG export** — with optimization options
- [ ] **PNG export** — with resolution/scale options
- [ ] **PDF export** — vector PDF
- [ ] **Export for Screens** — batch export artboards
- [ ] **Copy as SVG** to clipboard

### 8.2 Import
- [ ] **SVG import** — parse and create entities
- [ ] **Image import** — place raster images
- [ ] **Image Trace** — convert raster to vector paths
- [ ] **Paste from clipboard**

### 8.3 File Format
- [ ] **Native .lucid format** — JSON-based save/load
- [ ] **Auto-save** — periodic saves to localStorage/IndexedDB
- [ ] **Version history** — restore previous saves

---

## PHASE 9: ADVANCED FEATURES (Exceed Illustrator)
*Priority: Low — Differentiators*

### 9.1 AI-Powered Features
- [ ] **AI Shape Suggest** — draw rough shape, AI suggests clean version
- [ ] **AI Color Harmony** — suggest palettes from context
- [ ] **AI Path Cleanup** — auto-smooth and simplify messy paths
- [ ] **Text to Vector** — generate vector art from prompts (via Gemini)
- [ ] **Smart Selection** — AI-powered grouping suggestions

### 9.2 Real-Time Collaboration
- [ ] **Multi-cursor** — see other users' cursors
- [ ] **Live sync** — real-time updates via Supabase Realtime
- [ ] **Comments** — annotate designs

### 9.3 Plugin/Extension System
- [ ] **Plugin API** — JavaScript extension points
- [ ] **Custom tools** — register new tools
- [ ] **Custom effects** — register new effects

### 9.4 Performance
- [ ] **WebGL renderer** — GPU-accelerated rendering for complex scenes
- [ ] **Spatial indexing** (R-tree) — fast hit testing for 10k+ objects
- [ ] **Worker-based path operations** — offload booleans/intersections to Web Worker
- [ ] **Level-of-detail** — simplify distant objects when zoomed out

---

## IMPLEMENTATION PRIORITY ORDER

### Sprint 1 (Foundation Critical)
1. Wire undo/redo to ALL operations (currently disconnected)
2. Pen tool Bézier handle creation
3. Text system (point text + area text)
4. Proper color picker
5. SVG export

### Sprint 2 (Core Tools)
6. Gradient system (linear + radial)
7. Shape Builder tool
8. Scissors/Knife tools  
9. Proper boolean operations (Greiner-Hormann)
10. Groups + Isolation mode

### Sprint 3 (Transform & Effects)
11. Transform tools (rotate/reflect/scale/shear with origin)
12. Width tool (variable-width strokes)
13. Drop shadow / glow effects
14. Blend tool
15. Clipping masks

### Sprint 4 (Professional Workflow)
16. Multiple artboards
17. Smart guides
18. Rulers + guides
19. SVG import
20. Image Trace (basic)

### Sprint 5 (Polish & Advanced)
21. Appearance panel (multi-fill/stroke)
22. Pattern system
23. Symbols
24. Gradient mesh
25. AI-powered features

---

## TECHNICAL NOTES

### Architecture Principles
- **Canvas2D primary** — proven, stable, sufficient for most operations
- **WebGL secondary** — for GPU-accelerated rendering when >1000 objects
- **Immutable state** — all mutations through command pattern for undo/redo
- **Modular engines** — each subsystem (geometry, stroke, brush, text, gradient) is its own module
- **Type-safe throughout** — full TypeScript types for all data structures

### File Structure (Target)
```
src/lib/drawing-engine/
├── types.ts              ✅ Core ontology
├── engine.ts             ✅ State manager + command history
├── renderer.ts           ✅ Canvas2D renderer
├── geometry-core.ts      ✅ Math substrate
├── stroke-core.ts        ✅ Stroke expansion
├── brush-core.ts         ✅ Brush sessions
├── node-editing.ts       ✅ Direct selection
├── path-operations.ts    ✅ Boolean ops
├── useDrawingEngine.ts   ✅ React hook
├── text-engine.ts        🔲 Text layout & rendering
├── gradient-engine.ts    🔲 Gradient creation & rendering
├── color-system.ts       🔲 Color picker, swatches, harmonies
├── effects-engine.ts     🔲 Drop shadow, blur, glow
├── blend-engine.ts       🔲 Shape blending
├── pattern-engine.ts     🔲 Pattern creation & tiling
├── symbol-engine.ts      🔲 Symbol instances
├── boolean-engine.ts     🔲 Proper Greiner-Hormann booleans
├── image-trace.ts        🔲 Raster-to-vector
├── svg-io.ts             🔲 SVG import/export
├── smart-guides.ts       🔲 Snapping & alignment hints
└── webgl-renderer.ts     🔲 GPU-accelerated renderer
```

### Key Metrics
- **Current**: ~3,500 lines of engine code across 9 files
- **Target**: ~15,000-20,000 lines across 20+ files
- **Tools**: 16 current → 40+ target
- **Panels**: 2 current (Properties, Layers) → 8+ target
