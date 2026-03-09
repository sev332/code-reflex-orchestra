// ═══════════════════════════════════════════════════════════════
// App Definitions — Static registrations for all 24 LUCID apps
// Each defines capabilities, system prompt fragment, and metadata
// ═══════════════════════════════════════════════════════════════

import type { AppRegistration } from './types';
import { appRegistry } from './app-registry';

const definitions: AppRegistration[] = [
  // ─── Productivity ─────────────────────────────────────────
  {
    id: 'tasks', name: 'Tasks', icon: 'CheckSquare', category: 'productivity',
    description: 'Task and project management with priorities, due dates, and status tracking.',
    systemPromptFragment: `You can create, edit, complete, and delete tasks. You can filter by status, priority, or due date. Suggest task breakdowns for complex work.`,
    capabilities: [
      { id: 'tasks.create', name: 'Create Task', description: 'Create a new task with title, description, priority, and due date', category: 'create', examples: ['create a task to review the design', 'add a high priority task for tomorrow'], parameters: [{ name: 'title', type: 'string', description: 'Task title', required: true }, { name: 'priority', type: 'enum', description: 'Priority level', required: false, enumValues: ['low', 'medium', 'high', 'urgent'] }, { name: 'dueDate', type: 'string', description: 'ISO date', required: false }] },
      { id: 'tasks.complete', name: 'Complete Task', description: 'Mark a task as completed', category: 'write', examples: ['mark the design review as done', 'complete all tasks'] },
      { id: 'tasks.list', name: 'List Tasks', description: 'List tasks with optional filters', category: 'read', examples: ['show me my tasks', 'what tasks are due today?'] },
      { id: 'tasks.delete', name: 'Delete Task', description: 'Delete a task', category: 'delete', requiresConfirmation: true, examples: ['delete the old task'] },
      { id: 'tasks.analyze', name: 'Analyze Workload', description: 'Analyze task distribution and suggest optimizations', category: 'analyze', examples: ['analyze my workload', 'am I overloaded?'] },
    ],
  },
  {
    id: 'calendar', name: 'Calendar', icon: 'Calendar', category: 'productivity',
    description: 'Calendar with events, scheduling, and time management.',
    systemPromptFragment: `You can create, edit, and delete calendar events. You can check availability and suggest optimal meeting times.`,
    capabilities: [
      { id: 'cal.create', name: 'Create Event', description: 'Create a calendar event', category: 'create', examples: ['schedule a meeting tomorrow at 2pm', 'add a reminder for Friday'] },
      { id: 'cal.list', name: 'List Events', description: 'Show events for a date range', category: 'read', examples: ['what do I have today?', 'show this week'] },
      { id: 'cal.delete', name: 'Delete Event', description: 'Remove an event', category: 'delete', requiresConfirmation: true },
      { id: 'cal.suggest', name: 'Suggest Time', description: 'Find optimal time slots', category: 'analyze', examples: ['when am I free this week?'] },
    ],
  },
  {
    id: 'email', name: 'Email', icon: 'Mail', category: 'productivity',
    description: 'Email client with inbox, compose, and organization.',
    systemPromptFragment: `You can draft emails, search inbox, summarize threads, and suggest replies. You can organize with labels and filters.`,
    capabilities: [
      { id: 'email.draft', name: 'Draft Email', description: 'Compose a new email', category: 'create', examples: ['write an email to the team about the update', 'draft a reply'] },
      { id: 'email.search', name: 'Search Emails', description: 'Search inbox by keyword, sender, or date', category: 'read', examples: ['find emails from Alex', 'search for invoices'] },
      { id: 'email.summarize', name: 'Summarize Thread', description: 'Summarize an email thread', category: 'analyze', examples: ['summarize this thread', 'what was the last email about?'] },
      { id: 'email.reply', name: 'Suggest Reply', description: 'Generate a reply suggestion', category: 'create', examples: ['suggest a reply', 'help me respond to this'] },
    ],
  },
  {
    id: 'spreadsheet', name: 'Spreadsheet', icon: 'Table', category: 'productivity',
    description: 'Spreadsheet editor with formulas, charts, and data analysis.',
    systemPromptFragment: `You can create formulas, format cells, generate charts, analyze data patterns, and import/export CSV. You can write complex formulas and pivot table logic.`,
    capabilities: [
      { id: 'sheet.formula', name: 'Create Formula', description: 'Write or explain a spreadsheet formula', category: 'create', examples: ['sum column B', 'create a VLOOKUP formula'] },
      { id: 'sheet.chart', name: 'Generate Chart', description: 'Create a chart from data', category: 'create', examples: ['make a bar chart of sales data', 'visualize the trends'] },
      { id: 'sheet.analyze', name: 'Analyze Data', description: 'Analyze patterns in spreadsheet data', category: 'analyze', examples: ['what are the trends?', 'find outliers'] },
      { id: 'sheet.format', name: 'Format Cells', description: 'Apply formatting to cells', category: 'write', examples: ['make headers bold', 'color code by value'] },
      { id: 'sheet.import', name: 'Import Data', description: 'Import data from CSV or other format', category: 'import', examples: ['import this CSV', 'paste data'] },
    ],
  },

  // ─── Creative ─────────────────────────────────────────────
  {
    id: 'illustrator', name: 'Illustrator', icon: 'PenTool', category: 'creative',
    description: 'Vector illustration and graphic design tool with layers, paths, shapes, and effects.',
    systemPromptFragment: `You can create/edit vector shapes, paths, text, and groups. You can apply fills, strokes, gradients, effects, and transforms. You know about layers, artboards, and export.`,
    capabilities: [
      { id: 'ill.shape', name: 'Create Shape', description: 'Draw a rectangle, ellipse, polygon, or star', category: 'create', examples: ['draw a red circle', 'create a 100x200 rectangle'] },
      { id: 'ill.path', name: 'Edit Path', description: 'Add/move/delete path nodes', category: 'write' },
      { id: 'ill.text', name: 'Add Text', description: 'Add text with font, size, and color', category: 'create', examples: ['add title text "Hello"', 'create a heading'] },
      { id: 'ill.style', name: 'Apply Style', description: 'Apply fill, stroke, gradient, or effect', category: 'write', examples: ['make it blue', 'add a drop shadow'] },
      { id: 'ill.export', name: 'Export', description: 'Export as SVG, PNG, or PDF', category: 'export' },
    ],
  },
  {
    id: 'image', name: 'Image Editor', icon: 'Image', category: 'creative',
    description: 'Raster image editor with layers, brushes, filters, selection tools, and adjustments.',
    systemPromptFragment: `You can edit images with brushes, selections, layers, filters, and adjustments. You know about color correction, retouching, and compositing.`,
    capabilities: [
      { id: 'img.filter', name: 'Apply Filter', description: 'Apply blur, sharpen, or artistic filter', category: 'transform', examples: ['blur the background', 'apply sepia'] },
      { id: 'img.adjust', name: 'Adjust Image', description: 'Adjust brightness, contrast, saturation', category: 'write', examples: ['increase brightness', 'fix the colors'] },
      { id: 'img.crop', name: 'Crop Image', description: 'Crop to selection or aspect ratio', category: 'write', examples: ['crop to 16:9', 'trim the edges'] },
      { id: 'img.layer', name: 'Manage Layers', description: 'Add, remove, reorder layers', category: 'write' },
      { id: 'img.export', name: 'Export', description: 'Export as PNG, JPEG, WebP', category: 'export' },
    ],
  },
  {
    id: 'audio', name: 'Audio Editor', icon: 'Music', category: 'creative',
    description: 'Audio editor with waveform view, effects chain, mixer, and transport controls.',
    systemPromptFragment: `You can edit audio tracks, apply effects (reverb, delay, EQ, compression), mix multiple tracks, and export. You understand waveforms, frequency, and mastering.`,
    capabilities: [
      { id: 'audio.effect', name: 'Apply Effect', description: 'Apply audio effect to track', category: 'transform', examples: ['add reverb', 'apply compression'] },
      { id: 'audio.trim', name: 'Trim Audio', description: 'Cut/trim audio segment', category: 'write', examples: ['trim the first 5 seconds', 'cut the silence'] },
      { id: 'audio.mix', name: 'Mix Tracks', description: 'Adjust volume, panning, effects per track', category: 'write' },
      { id: 'audio.analyze', name: 'Analyze Audio', description: 'Analyze frequency content, loudness', category: 'analyze' },
      { id: 'audio.export', name: 'Export Audio', description: 'Export as WAV, MP3, FLAC', category: 'export' },
    ],
  },
  {
    id: 'video', name: 'Video Editor', icon: 'Film', category: 'creative',
    description: 'Video editor with timeline, keyframes, preview canvas, and inspector.',
    systemPromptFragment: `You can edit video clips on a timeline, add keyframe animations, adjust properties, and export. You understand video codecs, frame rates, and transitions.`,
    capabilities: [
      { id: 'vid.cut', name: 'Cut Clip', description: 'Split or trim video clip', category: 'write', examples: ['cut at 00:30', 'trim the ending'] },
      { id: 'vid.keyframe', name: 'Add Keyframe', description: 'Add animation keyframe', category: 'create' },
      { id: 'vid.transition', name: 'Add Transition', description: 'Add transition between clips', category: 'create', examples: ['add a fade', 'crossfade between clips'] },
      { id: 'vid.export', name: 'Export Video', description: 'Export with codec and resolution settings', category: 'export' },
    ],
  },
  {
    id: 'studio3d', name: '3D Studio', icon: 'Box', category: 'creative',
    description: 'Full 3D scene editor with viewport, materials, physics, particles, animation, and rendering.',
    systemPromptFragment: `You can create/edit 3D objects, apply materials, set up lighting, configure physics, create particle effects, animate with keyframes, and render scenes. You understand PBR materials, scene graphs, and camera setup.`,
    capabilities: [
      { id: '3d.create', name: 'Create Object', description: 'Create 3D primitive or mesh', category: 'create', examples: ['add a cube', 'create a sphere with 64 segments'] },
      { id: '3d.material', name: 'Apply Material', description: 'Set material properties', category: 'write', examples: ['make it metallic red', 'apply glass material'] },
      { id: '3d.light', name: 'Add Light', description: 'Add point, spot, or directional light', category: 'create' },
      { id: '3d.animate', name: 'Animate', description: 'Create keyframe animation', category: 'create' },
      { id: '3d.render', name: 'Render', description: 'Render scene with current settings', category: 'export' },
    ],
  },
  {
    id: 'presentations', name: 'Presentations', icon: 'Presentation', category: 'creative',
    description: 'Slide deck builder with themes, transitions, and speaker notes.',
    systemPromptFragment: `You can create slides, add content (text, images, charts), apply themes and transitions, and manage speaker notes. You can generate entire presentations from outlines.`,
    capabilities: [
      { id: 'pres.create', name: 'Create Slide', description: 'Add a new slide', category: 'create', examples: ['add a title slide', 'create a bullet point slide'] },
      { id: 'pres.content', name: 'Add Content', description: 'Add text, image, or chart to slide', category: 'write' },
      { id: 'pres.theme', name: 'Apply Theme', description: 'Apply visual theme', category: 'write' },
      { id: 'pres.generate', name: 'Generate Deck', description: 'Generate full presentation from outline', category: 'create', examples: ['create a 10-slide presentation about AI'] },
      { id: 'pres.export', name: 'Export', description: 'Export as PDF or PPTX', category: 'export' },
    ],
  },

  // ─── Dev / Data ───────────────────────────────────────────
  {
    id: 'ide', name: 'Code Builder', icon: 'Code', category: 'dev',
    description: 'Full IDE with code editor, file tree, preview, terminal, and Git integration.',
    systemPromptFragment: `You can write/edit code, create files, run terminal commands, manage Git, and preview web apps. You understand TypeScript, React, CSS, and modern web development.`,
    capabilities: [
      { id: 'ide.write', name: 'Write Code', description: 'Create or edit code in a file', category: 'write', examples: ['create a React component', 'fix the bug in App.tsx'] },
      { id: 'ide.create_file', name: 'Create File', description: 'Create a new file', category: 'create', examples: ['create utils.ts', 'add a new component'] },
      { id: 'ide.terminal', name: 'Run Command', description: 'Execute a terminal command', category: 'automate', examples: ['run npm install', 'build the project'] },
      { id: 'ide.explain', name: 'Explain Code', description: 'Explain what code does', category: 'analyze', examples: ['explain this function', 'what does this hook do?'] },
      { id: 'ide.refactor', name: 'Refactor', description: 'Refactor code for better quality', category: 'transform', examples: ['refactor this to use hooks', 'optimize performance'] },
    ],
  },
  {
    id: 'terminal', name: 'Terminal', icon: 'Terminal', category: 'dev',
    description: 'Terminal emulator with command history and shell integration.',
    systemPromptFragment: `You can run shell commands, explain command output, suggest commands, and help with scripting.`,
    capabilities: [
      { id: 'term.run', name: 'Run Command', description: 'Execute a shell command', category: 'automate', examples: ['run ls -la', 'check disk space'] },
      { id: 'term.explain', name: 'Explain Output', description: 'Explain command output', category: 'analyze' },
      { id: 'term.suggest', name: 'Suggest Command', description: 'Suggest the right command', category: 'analyze', examples: ['how do I find large files?'] },
    ],
  },
  {
    id: 'apistudio', name: 'API Studio', icon: 'Globe', category: 'dev',
    description: 'API testing and documentation studio with request builder and response viewer.',
    systemPromptFragment: `You can build API requests, test endpoints, generate documentation, and analyze responses. You understand REST, GraphQL, and authentication schemes.`,
    capabilities: [
      { id: 'api.request', name: 'Build Request', description: 'Create an API request', category: 'create', examples: ['create a GET request to /users', 'test the auth endpoint'] },
      { id: 'api.test', name: 'Test Endpoint', description: 'Send request and analyze response', category: 'automate' },
      { id: 'api.doc', name: 'Generate Docs', description: 'Generate API documentation', category: 'create' },
      { id: 'api.mock', name: 'Create Mock', description: 'Create a mock endpoint', category: 'create' },
    ],
  },
  {
    id: 'database', name: 'Database Explorer', icon: 'Database', category: 'dev',
    description: 'Database browser with query editor, table viewer, and schema visualization.',
    systemPromptFragment: `You can write SQL queries, browse tables, inspect schemas, and optimize queries. You understand PostgreSQL, indexes, and RLS policies.`,
    capabilities: [
      { id: 'db.query', name: 'Run Query', description: 'Execute a SQL query', category: 'read', examples: ['show all users', 'count tasks by status'] },
      { id: 'db.schema', name: 'View Schema', description: 'Inspect table schema', category: 'read', examples: ['show the tasks table schema'] },
      { id: 'db.optimize', name: 'Optimize Query', description: 'Suggest query optimizations', category: 'analyze' },
      { id: 'db.explain', name: 'Explain Query', description: 'Explain what a query does', category: 'analyze' },
    ],
  },
  {
    id: 'dashboard', name: 'Dashboard Builder', icon: 'LayoutDashboard', category: 'dev',
    description: 'Drag-and-drop dashboard builder with widgets, charts, and data sources.',
    systemPromptFragment: `You can create dashboards with charts, metrics, tables, and custom widgets. You can connect data sources and configure layouts.`,
    capabilities: [
      { id: 'dash.widget', name: 'Add Widget', description: 'Add a widget to the dashboard', category: 'create', examples: ['add a line chart', 'create a KPI card'] },
      { id: 'dash.data', name: 'Connect Data', description: 'Connect a data source to a widget', category: 'write' },
      { id: 'dash.layout', name: 'Arrange Layout', description: 'Rearrange dashboard layout', category: 'write' },
    ],
  },

  // ─── Knowledge / System ───────────────────────────────────
  {
    id: 'browser', name: 'Browser', icon: 'Globe', category: 'knowledge',
    description: 'Built-in web browser for research and reference.',
    systemPromptFragment: `You can navigate to URLs, search the web, extract content from pages, and save bookmarks.`,
    capabilities: [
      { id: 'browse.navigate', name: 'Navigate', description: 'Go to a URL', category: 'navigate', examples: ['go to github.com', 'open the docs'] },
      { id: 'browse.search', name: 'Web Search', description: 'Search the web', category: 'read', examples: ['search for React hooks guide'] },
      { id: 'browse.extract', name: 'Extract Content', description: 'Extract text from current page', category: 'read' },
      { id: 'browse.bookmark', name: 'Save Bookmark', description: 'Bookmark current page', category: 'create' },
    ],
  },
  {
    id: 'notes', name: 'Notes', icon: 'StickyNote', category: 'knowledge',
    description: 'Note-taking with rich text, markdown, and organization.',
    systemPromptFragment: `You can create, edit, search, and organize notes. You can format with markdown, add tags, and link notes together. You can summarize and expand note content.`,
    capabilities: [
      { id: 'notes.create', name: 'Create Note', description: 'Create a new note', category: 'create', examples: ['create a note about the meeting', 'start a new journal entry'] },
      { id: 'notes.edit', name: 'Edit Note', description: 'Edit note content', category: 'write', examples: ['add a bullet point', 'rewrite the summary'] },
      { id: 'notes.search', name: 'Search Notes', description: 'Search across all notes', category: 'read', examples: ['find notes about architecture'] },
      { id: 'notes.summarize', name: 'Summarize', description: 'Summarize note contents', category: 'analyze' },
      { id: 'notes.expand', name: 'Expand', description: 'Expand on a topic in a note', category: 'transform' },
    ],
  },
  {
    id: 'documents', name: 'Documents', icon: 'FileText', category: 'knowledge',
    description: 'Document management with upload, indexing, AI analysis, and editing.',
    systemPromptFragment: `You can upload, browse, search, analyze, and edit documents. You understand document structure, can extract key information, and generate summaries.`,
    capabilities: [
      { id: 'doc.upload', name: 'Upload Document', description: 'Upload a document for processing', category: 'import' },
      { id: 'doc.search', name: 'Search Documents', description: 'Search across all documents', category: 'read', examples: ['find documents about quantum computing'] },
      { id: 'doc.summarize', name: 'Summarize Document', description: 'Generate document summary', category: 'analyze' },
      { id: 'doc.edit', name: 'Edit Document', description: 'Edit document content', category: 'write' },
      { id: 'doc.analyze', name: 'Analyze Document', description: 'Deep analysis of document structure and content', category: 'analyze' },
    ],
  },
  {
    id: 'files', name: 'File Manager', icon: 'FolderOpen', category: 'system',
    description: 'File system browser with upload, download, and organization.',
    systemPromptFragment: `You can browse, create, move, rename, and delete files and folders. You can search by name or content.`,
    capabilities: [
      { id: 'files.browse', name: 'Browse Files', description: 'List files in a directory', category: 'read', examples: ['show my files', 'what\'s in the uploads folder?'] },
      { id: 'files.create', name: 'Create Folder', description: 'Create a new folder', category: 'create' },
      { id: 'files.move', name: 'Move File', description: 'Move or rename a file', category: 'write' },
      { id: 'files.delete', name: 'Delete File', description: 'Delete a file', category: 'delete', requiresConfirmation: true },
    ],
  },
  {
    id: 'comms', name: 'Comms Hub', icon: 'Radio', category: 'system',
    description: 'Unified communications hub for messages and channels.',
    systemPromptFragment: `You can send messages, manage channels, and search communication history.`,
    capabilities: [
      { id: 'comms.send', name: 'Send Message', description: 'Send a message to a channel', category: 'create' },
      { id: 'comms.search', name: 'Search Messages', description: 'Search message history', category: 'read' },
    ],
  },
  {
    id: 'settings', name: 'Settings', icon: 'Settings', category: 'system',
    description: 'System settings for appearance, integrations, and preferences.',
    systemPromptFragment: `You can help configure system settings including theme, API keys, integrations, and preferences.`,
    capabilities: [
      { id: 'settings.read', name: 'View Settings', description: 'View current settings', category: 'read', examples: ['what theme am I using?', 'show my settings'] },
      { id: 'settings.update', name: 'Update Setting', description: 'Change a setting value', category: 'write', examples: ['switch to dark mode', 'change the font size'] },
    ],
  },
  {
    id: 'map', name: 'Map', icon: 'Map', category: 'knowledge',
    description: 'Interactive map with layers, markers, and geospatial data.',
    systemPromptFragment: `You can navigate maps, add markers and layers, search locations, and analyze geospatial data.`,
    capabilities: [
      { id: 'map.navigate', name: 'Go To Location', description: 'Navigate to a location', category: 'navigate', examples: ['show me Tokyo', 'zoom to San Francisco'] },
      { id: 'map.marker', name: 'Add Marker', description: 'Place a marker on the map', category: 'create' },
      { id: 'map.search', name: 'Search Location', description: 'Search for a place', category: 'read' },
    ],
  },

  // ─── AI / Special ─────────────────────────────────────────
  {
    id: 'chat', name: 'AI Chat', icon: 'MessageSquare', category: 'ai',
    description: 'Primary AI chat interface with reasoning, deep search, and multi-model support.',
    systemPromptFragment: `This is the main AI chat. You can have conversations, reason deeply, search the web, and orchestrate complex workflows.`,
    capabilities: [],
  },
  {
    id: 'orchestration', name: 'Orchestration Studio', icon: 'Workflow', category: 'ai',
    description: 'Visual prompt chain designer with DAG editor, test runner, and deployment.',
    systemPromptFragment: `You can design prompt chains, create orchestration flows, test with different inputs, and deploy to production. You understand DAGs, dependencies, and prompt engineering.`,
    capabilities: [
      { id: 'orch.create', name: 'Create Chain', description: 'Create a new prompt chain', category: 'create', examples: ['create a research chain', 'build a code review pipeline'] },
      { id: 'orch.test', name: 'Run Test', description: 'Test a prompt chain', category: 'automate' },
      { id: 'orch.deploy', name: 'Deploy', description: 'Deploy chain to production', category: 'automate' },
      { id: 'orch.analyze', name: 'Analyze Performance', description: 'Analyze chain execution metrics', category: 'analyze' },
    ],
  },
];

// Register all apps on import
export function registerAllApps() {
  definitions.forEach(def => appRegistry.register(def));
}

export { definitions };
