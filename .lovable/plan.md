

# LUCID Browser OS — Full Application Suite Plan

## Current State
We have 8 pages: Chat, Orchestration, Documents, Code IDE, Image Editor, Audio Editor, Video Editor, Map.

## Thinking: What does a full computer/browser OS need?

A computer is used for: **communication, productivity, creativity, engineering, entertainment, organization, and system management.** Let's map every major application category:

### Already Built (8 pages)
1. **Chat** — AI assistant hub
2. **Orchestration** — AI workflow/pipeline studio
3. **Documents** — Word processor / document builder
4. **Code IDE** — Software development
5. **Image Editor** — Raster/vector editing
6. **Audio Editor** — DAW / audio production
7. **Video Editor** — NLE / video production
8. **Map** — Geospatial / navigation

### New Pages Needed (proposed 14 additions → 22 total)

**Productivity:**
9. **Spreadsheet** — Excel-equivalent with formulas, charts, pivot tables, AI-assisted data analysis. Cell grid, formula bar, sheet tabs, charting engine.
10. **Calendar** — Full scheduling system with day/week/month/year views, event creation, reminders, AI scheduling assistant. Integrates with tasks.
11. **Email** — Inbox/compose/folders, rich text editor, AI drafting/summarization, threading. Could integrate with real SMTP or simulate.
12. **Tasks/Projects** — Kanban + Gantt + list views, project management, sprint planning, AI task decomposition. Think Notion/Linear hybrid.

**Communication:**
13. **Comms Hub** — Discord-like real-time messaging with channels, threads, voice/video call UI, screen sharing UI. The Agent Discord already exists as infrastructure — this becomes the user-facing version.

**Creative / 3D:**
14. **3D Studio** — This is the big one. A hybrid of SolidWorks (parametric CAD) + Unreal Engine (scene composition, materials, lighting) + shader hub. Built on React Three Fiber + Three.js. Features: scene graph, transform gizmos, material editor (node-based shader graph), geometry primitives + mesh import, a massive shader library browser (pulling from Shadertoy/GLSL Sandbox concepts), physics preview, export. This is a full workspace.

**Data & Analytics:**
15. **Dashboard Builder** — Drag-and-drop dashboard/chart builder. Connect to data sources, build visualizations, AI-generated insights. Think Grafana/Metabase meets AI.
16. **Database Explorer** — Visual database management, table editor, query builder (SQL + natural language), schema visualizer, migration tools. Connects to Supabase and external DBs.

**System & Dev Tools:**
17. **Terminal** — Full terminal emulator page (beyond the bottom drawer). Multiple sessions, SSH-like interface, command history, AI shell assistant.
18. **API Studio** — Postman-equivalent. Build/test/document APIs, collections, environment variables, mock servers, AI-generated tests. Integrates with the Code IDE.

**Knowledge & Research:**
19. **Browser/Research** — Embedded web browser + research workspace. Bookmarks, reading list, web clipper, AI summarization of pages, side-by-side comparison. Tab management.
20. **Notes/Wiki** — Lightweight wiki/knowledge base with bidirectional linking, graph view of connections, AI-assisted organization. Think Obsidian in the browser.

**Media & Files:**
21. **File Manager** — OS-level file browser for all project assets, cloud storage, drag-drop organization, preview pane, metadata editor.
22. **Presentations** — Slide deck builder with AI-generated slides, templates, animations, presenter mode. PowerPoint/Keynote equivalent.

### Honorable mentions (future phases, not now):
- **Music Player / Media Library** — media consumption
- **Settings / Control Panel** — system-wide preferences (could be a page or modal)
- **App Store / Extensions** — plugin marketplace
- **PDF Viewer/Editor** — dedicated PDF tools
- **Whiteboard** — infinite canvas, freeform drawing, diagramming (Figma/Miro style)

## Architecture Impact

The top bar currently shows all 8 tabs inline. With 22 pages, we need a different approach:

**Option A: Grouped tab bar** — Categories (Productivity, Creative, Dev, Comms) with dropdowns
**Option B: App launcher** — A grid/dock launcher (like macOS Launchpad) with the top bar showing only pinned/open apps
**Option C: Scrollable tab bar with overflow menu** — Keep current pattern but add a "more" dropdown

**Recommendation: Option B — App Launcher + pinned tabs.** The top bar shows pinned/recently-used apps (user-configurable, ~6-8 visible), plus an app grid launcher button that opens a full overlay showing all 22 apps organized by category. This is the most OS-like pattern and scales indefinitely.

## Implementation Strategy

Given the scale, I recommend building in waves:

**Wave 1 — Core Productivity (highest impact):**
- Spreadsheet, Calendar, Email, Tasks/Projects

**Wave 2 — Creative & Engineering:**
- 3D Studio, Presentations

**Wave 3 — Dev & Data:**
- Terminal (full page), API Studio, Database Explorer, Dashboard Builder

**Wave 4 — Knowledge & System:**
- Browser/Research, Notes/Wiki, File Manager, Comms Hub

**Wave 5 — App Launcher refactor:**
- Rebuild top bar into pinned tabs + app launcher grid

Each app follows the established pattern: main content area + page-specific left drawer + shared right AI drawer + bottom bar.

## Technical Considerations

- **Spreadsheet**: Canvas-based grid renderer for performance (thousands of cells). Formula parser. Chart integration via Recharts.
- **3D Studio**: React Three Fiber + Drei for scene, custom shader editor with Monaco + GLSL, transform controls, scene graph tree in left drawer.
- **Calendar**: Custom date grid, drag-to-create events, integration with Tasks page.
- **Email**: Rich text compose with the document editor engine, AI draft/reply.
- **Terminal**: xterm.js or custom terminal emulator, WebSocket to edge functions for command execution.
- **App Launcher**: CSS grid overlay with categories, search, frecency-based ordering.

## Summary

```text
Current:  8 pages
Proposed: 22 pages (14 new)

Categories:
├── AI & Core:      Chat, Orchestration
├── Productivity:   Documents, Spreadsheet, Calendar, Email, Tasks, Presentations
├── Creative:       Image, Audio, Video, 3D Studio
├── Dev & Data:     Code IDE, Terminal, API Studio, Database, Dashboard Builder
├── Knowledge:      Browser/Research, Notes/Wiki
├── System:         File Manager, Map, Comms Hub
```

Shall I start building? I'd recommend **Wave 1 (Spreadsheet + Calendar + Email + Tasks) + the App Launcher refactor** first, since the top bar needs to handle 22 pages before we add them all.

