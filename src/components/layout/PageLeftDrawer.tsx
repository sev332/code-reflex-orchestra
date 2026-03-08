// Per-page left drawer: Side icon bar (always visible) + expandable drawer panel with sub-tabs
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Clock, Star, Settings, Search, FileText, FolderKanban, BookOpen,
  GitBranch, HardDrive, Folder, Cloud, Plus, Upload, ChevronRight,
  File, Database, Tag, Layers, Play, BarChart3, History, Image,
  Music, Video, Map, Sliders, Wand2, Scissors, Volume2, Film,
  Navigation, MapPin, MessageSquare, Zap, Code2, Palette, Globe,
  FolderTree, Workflow, Table2, CalendarDays, Mail, KanbanSquare,
  Box, Terminal, Beaker, LayoutDashboard, StickyNote, FolderOpen,
  MessageCircle, Presentation, Users, Inbox, Send, Filter,
  CheckCircle2, AlertTriangle, Download, ArrowUp, Sparkles,
  RefreshCw, Eye, Award, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { emitPageDrawerAction } from '@/lib/page-drawer-events';
import type { PageId } from './PageTopBar';

interface SideIcon {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  shortcut?: string;
}

interface SubTab {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
}

interface PageDrawerConfig {
  sideIcons: SideIcon[];
  subTabs: Record<string, SubTab[]>;
}

const defaultConfig: PageDrawerConfig = {
  sideIcons: [
    { id: 'browse', icon: Search, label: 'Browse' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ],
  subTabs: {},
};

const pageConfigs: Record<PageId, PageDrawerConfig> = {
  chat: {
    sideIcons: [
      { id: 'chat', icon: MessageSquare, label: 'Chat', shortcut: '⌘1' },
      { id: 'history', icon: Clock, label: 'History', shortcut: '⌘H' },
      { id: 'library', icon: BookOpen, label: 'Library', shortcut: '⌘L' },
      { id: 'search', icon: Search, label: 'Search', shortcut: '⌘K' },
      { id: 'favorites', icon: Star, label: 'Favorites' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      chat: [{ id: 'recent', icon: Clock, label: 'Recent' }, { id: 'pinned', icon: Star, label: 'Pinned' }],
      history: [{ id: 'conversations', icon: MessageSquare, label: 'Conversations' }, { id: 'timeline', icon: History, label: 'Timeline' }],
      library: [{ id: 'docs', icon: FileText, label: 'Docs' }, { id: 'knowledge', icon: Database, label: 'Knowledge' }, { id: 'tags', icon: Tag, label: 'Tags' }],
      settings: [{ id: 'general', icon: Settings, label: 'General' }, { id: 'appearance', icon: Palette, label: 'Appearance' }, { id: 'ai', icon: Wand2, label: 'AI Prefs' }],
    },
  },
  orchestration: {
    sideIcons: [
      { id: 'tasks', icon: Layers, label: 'Tasks' },
      { id: 'runs', icon: Play, label: 'Runs' },
      { id: 'workflows', icon: Workflow, label: 'Workflows' },
      { id: 'analytics', icon: BarChart3, label: 'Analytics' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
    subTabs: {
      tasks: [{ id: 'active', icon: Play, label: 'Active' }, { id: 'queue', icon: Layers, label: 'Queue' }, { id: 'completed', icon: Star, label: 'Done' }],
      runs: [{ id: 'live', icon: Play, label: 'Live' }, { id: 'past', icon: History, label: 'Past' }],
    },
  },
  documents: {
    sideIcons: [
      { id: 'storage', icon: HardDrive, label: 'Storage' },
      { id: 'projects', icon: FolderKanban, label: 'Projects' },
      { id: 'structure', icon: FolderTree, label: 'Structure' },
      { id: 'tags', icon: Tag, label: 'Tags' },
      { id: 'search', icon: Search, label: 'Search' },
      { id: 'upload', icon: Upload, label: 'Upload' },
    ],
    subTabs: {
      storage: [{ id: 'local', icon: Folder, label: 'Local' }, { id: 'cloud', icon: Cloud, label: 'Cloud' }, { id: 'recent', icon: Clock, label: 'Recent' }],
      structure: [{ id: 'index', icon: Layers, label: 'Index' }, { id: 'map', icon: Map, label: 'Map' }],
    },
  },
  ide: {
    sideIcons: [
      { id: 'files', icon: File, label: 'Files' },
      { id: 'git', icon: GitBranch, label: 'Git' },
      { id: 'search', icon: Search, label: 'Search' },
      { id: 'extensions', icon: Layers, label: 'Extensions' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      files: [{ id: 'explorer', icon: FolderTree, label: 'Explorer' }, { id: 'open', icon: FileText, label: 'Open Files' }],
      git: [{ id: 'branches', icon: GitBranch, label: 'Branches' }, { id: 'history', icon: History, label: 'History' }, { id: 'changes', icon: FileText, label: 'Changes' }],
    },
  },
  image: {
    sideIcons: [
      { id: 'gallery', icon: Image, label: 'Gallery' },
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'adjustments', icon: Sliders, label: 'Adjust' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
    subTabs: {},
  },
  audio: {
    sideIcons: [
      { id: 'tracks', icon: Music, label: 'Tracks' },
      { id: 'effects', icon: Volume2, label: 'Effects' },
      { id: 'library', icon: BookOpen, label: 'Library' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
    subTabs: {},
  },
  video: {
    sideIcons: [
      { id: 'timeline', icon: Film, label: 'Timeline' },
      { id: 'clips', icon: Scissors, label: 'Clips' },
      { id: 'effects', icon: Palette, label: 'Effects' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
    ],
    subTabs: {},
  },
  map: {
    sideIcons: [
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'places', icon: MapPin, label: 'Places' },
      { id: 'navigate', icon: Navigation, label: 'Navigate' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
    subTabs: {},
  },
  // ─── New pages ─────────────────
  spreadsheet: {
    sideIcons: [
      { id: 'sheets', icon: Table2, label: 'Sheets' },
      { id: 'formulas', icon: Code2, label: 'Formulas' },
      { id: 'charts', icon: BarChart3, label: 'Charts' },
      { id: 'data', icon: Database, label: 'Data' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Analysis' },
    ],
    subTabs: {
      sheets: [{ id: 'all', icon: Table2, label: 'All' }, { id: 'recent', icon: Clock, label: 'Recent' }],
    },
  },
  calendar: {
    sideIcons: [
      { id: 'calendars', icon: CalendarDays, label: 'Calendars' },
      { id: 'events', icon: Clock, label: 'Upcoming' },
      { id: 'people', icon: Users, label: 'People' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      calendars: [{ id: 'mine', icon: Star, label: 'Mine' }, { id: 'shared', icon: Users, label: 'Shared' }],
    },
  },
  email: {
    sideIcons: [
      { id: 'inbox', icon: Inbox, label: 'Inbox' },
      { id: 'compose', icon: Plus, label: 'Compose' },
      { id: 'sent', icon: Send, label: 'Sent' },
      { id: 'labels', icon: Tag, label: 'Labels' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
    subTabs: {},
  },
  tasks: {
    sideIcons: [
      { id: 'board', icon: KanbanSquare, label: 'Board' },
      { id: 'projects', icon: FolderKanban, label: 'Projects' },
      { id: 'filters', icon: Filter, label: 'Filters' },
      { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    ],
    subTabs: {
      projects: [{ id: 'active', icon: Play, label: 'Active' }, { id: 'archived', icon: History, label: 'Archived' }],
    },
  },
  presentations: {
    sideIcons: [
      { id: 'slides', icon: Presentation, label: 'Slides' },
      { id: 'templates', icon: LayoutDashboard, label: 'Templates' },
      { id: 'elements', icon: Layers, label: 'Elements' },
      { id: 'ai-tools', icon: Wand2, label: 'AI Tools' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      slides: [{ id: 'all', icon: Presentation, label: 'All' }, { id: 'recent', icon: Clock, label: 'Recent' }],
    },
  },
  studio3d: {
    sideIcons: [
      { id: 'scene', icon: Box, label: 'Scene Graph' },
      { id: 'assets', icon: Folder, label: 'Assets' },
      { id: 'shaders', icon: Palette, label: 'Shaders' },
      { id: 'materials', icon: Layers, label: 'Materials' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {
      assets: [{ id: 'models', icon: Box, label: 'Models' }, { id: 'textures', icon: Image, label: 'Textures' }],
    },
  },
  terminal: {
    sideIcons: [
      { id: 'sessions', icon: Terminal, label: 'Sessions' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {},
  },
  apistudio: {
    sideIcons: [
      { id: 'collections', icon: Folder, label: 'Collections' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'environments', icon: Settings, label: 'Envs' },
    ],
    subTabs: {},
  },
  database: {
    sideIcons: [
      { id: 'tables', icon: Database, label: 'Tables' },
      { id: 'queries', icon: Code2, label: 'Queries' },
      { id: 'schema', icon: GitBranch, label: 'Schema' },
    ],
    subTabs: {},
  },
  dashboard: {
    sideIcons: [
      { id: 'dashboards', icon: LayoutDashboard, label: 'Dashboards' },
      { id: 'widgets', icon: Layers, label: 'Widgets' },
      { id: 'data', icon: Database, label: 'Data Sources' },
    ],
    subTabs: {},
  },
  browser: {
    sideIcons: [
      { id: 'bookmarks', icon: Star, label: 'Bookmarks' },
      { id: 'history', icon: History, label: 'History' },
      { id: 'reading', icon: BookOpen, label: 'Reading List' },
    ],
    subTabs: {},
  },
  notes: {
    sideIcons: [
      { id: 'notes', icon: StickyNote, label: 'Notes' },
      { id: 'graph', icon: GitBranch, label: 'Graph' },
      { id: 'tags', icon: Tag, label: 'Tags' },
      { id: 'search', icon: Search, label: 'Search' },
    ],
    subTabs: {},
  },
  files: {
    sideIcons: [
      { id: 'browse', icon: FolderOpen, label: 'Browse' },
      { id: 'recent', icon: Clock, label: 'Recent' },
      { id: 'starred', icon: Star, label: 'Starred' },
      { id: 'cloud', icon: Cloud, label: 'Cloud' },
    ],
    subTabs: {},
  },
  comms: {
    sideIcons: [
      { id: 'channels', icon: MessageCircle, label: 'Channels' },
      { id: 'dms', icon: MessageSquare, label: 'DMs' },
      { id: 'threads', icon: GitBranch, label: 'Threads' },
    ],
    subTabs: {},
  },
  illustrator: {
    sideIcons: [
      { id: 'layers', icon: Layers, label: 'Layers' },
      { id: 'assets', icon: FolderOpen, label: 'Assets' },
      { id: 'settings', icon: Settings, label: 'Settings' },
    ],
    subTabs: {},
  },
  settings: {
    sideIcons: [
      { id: 'general', icon: Settings, label: 'General' },
    ],
    subTabs: {},
  },
};

interface DrawerBlueprintItem {
  label: string;
  meta: string;
  icon: React.ComponentType<any>;
}

interface DrawerBlueprint {
  title: string;
  hint: string;
  items: DrawerBlueprintItem[];
}

const drawerBlueprints: Record<string, DrawerBlueprint> = {
  'orchestration:tasks': { title: 'Task Queue', hint: 'Monitor active, queued, and completed nodes.', items: [{ label: 'Active Runs', meta: '4 running', icon: Play }, { label: 'Queued Jobs', meta: '11 pending', icon: Layers }, { label: 'Completed Today', meta: '27 success', icon: CheckCircle2 }] },
  'orchestration:runs': { title: 'Execution Runs', hint: 'Replay and inspect execution traces.', items: [{ label: 'Live Run Stream', meta: '2 pipelines', icon: Zap }, { label: 'Past Runs', meta: 'last 24h', icon: History }, { label: 'Failure Alerts', meta: '1 unresolved', icon: AlertTriangle }] },
  'orchestration:workflows': { title: 'Workflow Library', hint: 'Reusable orchestration recipes and templates.', items: [{ label: 'Research Chain', meta: '8 nodes', icon: Workflow }, { label: 'Verification Chain', meta: '6 nodes', icon: GitBranch }, { label: 'Publish Chain', meta: '5 nodes', icon: Upload }] },
  'orchestration:analytics': { title: 'Run Analytics', hint: 'Performance and success diagnostics.', items: [{ label: 'Success Rate', meta: '96.2%', icon: BarChart3 }, { label: 'Avg Latency', meta: '1.8s', icon: Clock }, { label: 'Token Usage', meta: '132k/day', icon: Database }] },
  'orchestration:history': { title: 'Audit History', hint: 'Chronological orchestration activity.', items: [{ label: 'Recent Deploy', meta: '18m ago', icon: Upload }, { label: 'Chain Edit', meta: '42m ago', icon: FileText }, { label: 'Validation Pass', meta: '1h ago', icon: CheckCircle2 }] },

  'documents:structure': { title: 'Document Structure', hint: 'Navigate chapters, chunks, and hierarchy.', items: [{ label: 'Master Outline', meta: '12 sections', icon: FolderTree }, { label: 'Chunk Index', meta: '244 chunks', icon: Layers }, { label: 'Cross-links', meta: '89 links', icon: GitBranch }] },
  'documents:tags': { title: 'Document Tags', hint: 'Filter by semantic and workflow labels.', items: [{ label: 'Architecture', meta: '32 docs', icon: Tag }, { label: 'Research', meta: '21 docs', icon: BookOpen }, { label: 'Draft', meta: '8 docs', icon: FileText }] },

  'ide:extensions': { title: 'IDE Extensions', hint: 'Language and tooling modules.', items: [{ label: 'TypeScript Tools', meta: 'enabled', icon: Code2 }, { label: 'Git Lens', meta: 'enabled', icon: GitBranch }, { label: 'Schema Helper', meta: 'update ready', icon: Database }] },

  'image:gallery': { title: 'Asset Gallery', hint: 'Recent edits and imported media.', items: [{ label: 'Recent Edits', meta: '18 assets', icon: Image }, { label: 'Reference Set', meta: '6 pinned', icon: Star }, { label: 'Exports', meta: '12 files', icon: Download }] },
  'image:layers': { title: 'Layer Stack', hint: 'Compositing and visibility control.', items: [{ label: 'Foreground', meta: 'visible', icon: Layers }, { label: 'Adjustment', meta: 'curve + mask', icon: Sliders }, { label: 'Background', meta: 'locked', icon: Image }] },
  'image:adjustments': { title: 'Adjustment Presets', hint: 'Fast tonal and color pipelines.', items: [{ label: 'Exposure Curve', meta: 'neutral', icon: Sliders }, { label: 'Color Balance', meta: 'warm +4', icon: Palette }, { label: 'Sharpen', meta: '0.35', icon: Zap }] },
  'image:ai-tools': { title: 'AI Image Ops', hint: 'Assistive generation and cleanup.', items: [{ label: 'Magic Erase', meta: 'ready', icon: Wand2 }, { label: 'Upscale x2', meta: 'queued', icon: ArrowUp }, { label: 'Style Transfer', meta: '5 presets', icon: Sparkles }] },

  'audio:tracks': { title: 'Track Rack', hint: 'Session channels and stems.', items: [{ label: 'Lead Vocals', meta: 'armed', icon: Music }, { label: 'Drum Bus', meta: '-3.1 dB', icon: Volume2 }, { label: 'FX Return', meta: 'enabled', icon: Sliders }] },
  'audio:effects': { title: 'Effects Chain', hint: 'Insert, send, and mastering effects.', items: [{ label: 'EQ Eight', meta: 'active', icon: Sliders }, { label: 'Compressor', meta: '3:1', icon: Zap }, { label: 'Limiter', meta: 'ceiling -1dB', icon: Volume2 }] },
  'audio:library': { title: 'Sound Library', hint: 'Samples and instrument presets.', items: [{ label: 'Drum One-shots', meta: '540 files', icon: FolderOpen }, { label: 'Synth Presets', meta: '88 banks', icon: Music }, { label: 'Foley', meta: '126 clips', icon: File }] },
  'audio:ai-tools': { title: 'AI Audio Tools', hint: 'Cleanup and enhancement utilities.', items: [{ label: 'Noise Removal', meta: 'ready', icon: Wand2 }, { label: 'Stem Split', meta: '4 stems', icon: Layers }, { label: 'Auto Master', meta: 'preview', icon: Sparkles }] },

  'video:timeline': { title: 'Timeline Ops', hint: 'Scene layout and track controls.', items: [{ label: 'Main Sequence', meta: '02:31', icon: Film }, { label: 'Cut Markers', meta: '14 markers', icon: Scissors }, { label: 'Audio Beds', meta: '3 tracks', icon: Music }] },
  'video:clips': { title: 'Clip Bin', hint: 'Source clips and b-roll.', items: [{ label: 'Interview A', meta: '11 clips', icon: Video }, { label: 'B-roll', meta: '42 clips', icon: Folder }, { label: 'Exports', meta: '6 renders', icon: Download }] },
  'video:effects': { title: 'Video Effects', hint: 'Transitions and grading tools.', items: [{ label: 'Color LUTs', meta: '12 presets', icon: Palette }, { label: 'Transitions', meta: '8 applied', icon: ChevronRight }, { label: 'Stabilizer', meta: '2 shots', icon: Zap }] },
  'video:ai-tools': { title: 'AI Video Tools', hint: 'Automated edits and captions.', items: [{ label: 'Auto Captions', meta: 'ready', icon: Wand2 }, { label: 'Scene Detect', meta: '34 cuts', icon: Search }, { label: 'Smart Reframe', meta: '9:16 preset', icon: Sparkles }] },

  'map:layers': { title: 'Map Layers', hint: 'Control thematic overlays.', items: [{ label: 'Terrain', meta: 'enabled', icon: Layers }, { label: 'Traffic', meta: 'live', icon: Navigation }, { label: 'Heatmap', meta: 'off', icon: Map }] },
  'map:places': { title: 'Saved Places', hint: 'Pinned destinations and routes.', items: [{ label: 'HQ', meta: 'San Francisco', icon: MapPin }, { label: 'Data Center', meta: 'Frankfurt', icon: MapPin }, { label: 'Client Site', meta: 'Tokyo', icon: MapPin }] },
  'map:navigate': { title: 'Navigation Tools', hint: 'Routing and waypoint planning.', items: [{ label: 'Active Route', meta: '12.4 km', icon: Navigation }, { label: 'Waypoints', meta: '5 points', icon: GitBranch }, { label: 'ETA Model', meta: 'traffic aware', icon: Clock }] },

  'spreadsheet:sheets': { title: 'Workbook Sheets', hint: 'Navigate and organize sheets.', items: [{ label: 'Q1 Metrics', meta: '2.4k rows', icon: Table2 }, { label: 'Forecast', meta: '1.1k rows', icon: BarChart3 }, { label: 'Backlog', meta: '612 rows', icon: KanbanSquare }] },
  'spreadsheet:formulas': { title: 'Formula Manager', hint: 'Reusable formulas and checks.', items: [{ label: 'Financial Pack', meta: '42 formulas', icon: Code2 }, { label: 'Lookup Set', meta: '18 formulas', icon: Search }, { label: 'Error Watch', meta: '3 flagged', icon: AlertTriangle }] },
  'spreadsheet:charts': { title: 'Chart Builder', hint: 'Visualization presets and datasets.', items: [{ label: 'Revenue Trend', meta: 'line chart', icon: BarChart3 }, { label: 'Funnel', meta: 'stacked bar', icon: Layers }, { label: 'Cohort View', meta: 'heatmap', icon: Table2 }] },
  'spreadsheet:data': { title: 'Data Sources', hint: 'Connected imports and sync state.', items: [{ label: 'CSV Imports', meta: '7 sources', icon: Upload }, { label: 'Supabase Feed', meta: 'connected', icon: Database }, { label: 'Refresh Queue', meta: '2 jobs', icon: RefreshCw }] },
  'spreadsheet:ai-tools': { title: 'AI Analysis', hint: 'Forecasting and anomaly detection.', items: [{ label: 'Trend Forecast', meta: '90-day', icon: Wand2 }, { label: 'Anomaly Scan', meta: '5 alerts', icon: AlertTriangle }, { label: 'Insight Draft', meta: 'ready', icon: Sparkles }] },

  'tasks:board': { title: 'Task Board', hint: 'Kanban columns and priorities.', items: [{ label: 'In Progress', meta: '14 tasks', icon: KanbanSquare }, { label: 'Review', meta: '5 tasks', icon: Eye }, { label: 'Blocked', meta: '2 tasks', icon: AlertTriangle }] },
  'tasks:projects': { title: 'Projects', hint: 'Project-level task breakdown.', items: [{ label: 'Browser OS', meta: '62 tasks', icon: FolderKanban }, { label: 'Media Suite', meta: '29 tasks', icon: Video }, { label: 'DevTools', meta: '17 tasks', icon: Code2 }] },
  'tasks:filters': { title: 'Saved Filters', hint: 'Quick slices for execution.', items: [{ label: 'My Tasks', meta: '8 items', icon: Users }, { label: 'Due This Week', meta: '12 items', icon: CalendarDays }, { label: 'Critical', meta: '3 items', icon: Star }] },
  'tasks:analytics': { title: 'Task Analytics', hint: 'Cycle time and throughput.', items: [{ label: 'Velocity', meta: '41/wk', icon: BarChart3 }, { label: 'Avg Cycle', meta: '1.9 days', icon: Clock }, { label: 'Completion', meta: '94%', icon: CheckCircle2 }] },

  'presentations:slides': { title: 'Slide Deck', hint: 'Slide navigation and ordering.', items: [{ label: 'Intro', meta: 'Slide 1', icon: Presentation }, { label: 'Architecture', meta: 'Slide 7', icon: Layers }, { label: 'Roadmap', meta: 'Slide 12', icon: ChevronRight }] },
  'presentations:templates': { title: 'Templates', hint: 'Deck themes and layouts.', items: [{ label: 'Editorial', meta: '12 layouts', icon: LayoutDashboard }, { label: 'Product Demo', meta: '8 layouts', icon: Box }, { label: 'Metrics', meta: '6 layouts', icon: BarChart3 }] },
  'presentations:elements': { title: 'Slide Elements', hint: 'Reusable visual components.', items: [{ label: 'Charts', meta: '22 components', icon: BarChart3 }, { label: 'Diagrams', meta: '14 components', icon: GitBranch }, { label: 'Icons', meta: '120 glyphs', icon: Star }] },
  'presentations:ai-tools': { title: 'AI Slide Tools', hint: 'Auto-summarize and structure.', items: [{ label: 'Outline Draft', meta: 'ready', icon: Wand2 }, { label: 'Speaker Notes', meta: 'generated', icon: FileText }, { label: 'Design Balance', meta: 'pass', icon: Sparkles }] },

  'studio3d:scene': { title: 'Scene Graph', hint: 'Objects and hierarchy.', items: [{ label: 'Root Scene', meta: '18 nodes', icon: Box }, { label: 'Camera Rig', meta: '2 cameras', icon: Eye }, { label: 'Lights', meta: '5 active', icon: Zap }] },
  'studio3d:assets': { title: '3D Assets', hint: 'Models, textures, and imports.', items: [{ label: 'Models', meta: '43 files', icon: Box }, { label: 'Textures', meta: '128 maps', icon: Image }, { label: 'HDRIs', meta: '9 env maps', icon: Globe }] },
  'studio3d:shaders': { title: 'Shader Library', hint: 'PBR and custom shader presets.', items: [{ label: 'PBR Base', meta: 'active', icon: Palette }, { label: 'Glass Shader', meta: 'tuned', icon: Sliders }, { label: 'Neon FX', meta: 'preview', icon: Sparkles }] },
  'studio3d:materials': { title: 'Material Presets', hint: 'Reusable material instances.', items: [{ label: 'Anodized Metal', meta: 'roughness 0.2', icon: Layers }, { label: 'Matte Plastic', meta: 'roughness 0.7', icon: Layers }, { label: 'Clear Glass', meta: 'IOR 1.52', icon: Layers }] },

  'terminal:sessions': { title: 'Terminal Sessions', hint: 'Open shells and contexts.', items: [{ label: 'Main Shell', meta: 'active', icon: Terminal }, { label: 'Build Session', meta: 'running', icon: Play }, { label: 'Logs Session', meta: 'tailed', icon: FileText }] },
  'terminal:history': { title: 'Command History', hint: 'Recent commands and snippets.', items: [{ label: 'npm run build', meta: '2m ago', icon: History }, { label: 'supabase db pull', meta: '8m ago', icon: Database }, { label: 'git status', meta: '12m ago', icon: GitBranch }] },

  'dashboard:dashboards': { title: 'Dashboards', hint: 'Saved dashboard surfaces.', items: [{ label: 'Ops Dashboard', meta: '12 widgets', icon: LayoutDashboard }, { label: 'Revenue', meta: '8 widgets', icon: BarChart3 }, { label: 'System Health', meta: '10 widgets', icon: Zap }] },
  'dashboard:widgets': { title: 'Widget Library', hint: 'Composable data widgets.', items: [{ label: 'Line Chart', meta: 'ready', icon: BarChart3 }, { label: 'Table Grid', meta: 'ready', icon: Table2 }, { label: 'Status KPI', meta: 'ready', icon: Award }] },
  'dashboard:data': { title: 'Data Connectors', hint: 'Sources powering dashboard metrics.', items: [{ label: 'Supabase', meta: 'connected', icon: Database }, { label: 'Webhook Feed', meta: 'active', icon: Zap }, { label: 'CSV Loader', meta: 'manual', icon: Upload }] },

  'browser:bookmarks': { title: 'Bookmarks', hint: 'Saved research and references.', items: [{ label: 'Lovable Docs', meta: 'docs', icon: BookOpen }, { label: 'Supabase Logs', meta: 'ops', icon: Database }, { label: 'Design References', meta: 'creative', icon: Star }] },
  'browser:history': { title: 'Browsing History', hint: 'Recent visited research pages.', items: [{ label: 'Edge Function guide', meta: '8m ago', icon: History }, { label: 'RLS policy docs', meta: '22m ago', icon: History }, { label: 'Canvas optimization', meta: '1h ago', icon: History }] },
  'browser:reading': { title: 'Reading List', hint: 'Queued long-form resources.', items: [{ label: 'AIMOS protocol', meta: '17 min', icon: FileText }, { label: 'UI Canon', meta: '9 min', icon: BookOpen }, { label: 'Security checklist', meta: '6 min', icon: Shield }] },

  'illustrator:layers': { title: 'Vector Layers', hint: 'Artboard layers and groups.', items: [{ label: 'Header Group', meta: 'visible', icon: Layers }, { label: 'Icon Set', meta: 'locked', icon: Star }, { label: 'Background Mesh', meta: 'active', icon: Palette }] },
  'illustrator:assets': { title: 'Vector Assets', hint: 'Symbols, brushes, and swatches.', items: [{ label: 'Symbol Library', meta: '84 symbols', icon: FolderOpen }, { label: 'Brush Pack', meta: '31 brushes', icon: Wand2 }, { label: 'Color Swatches', meta: '48 swatches', icon: Palette }] },

  'settings:general': { title: 'Workspace Settings', hint: 'System-wide workspace preferences.', items: [{ label: 'Interface Density', meta: 'compact', icon: LayoutDashboard }, { label: 'Keyboard Shortcuts', meta: 'custom', icon: Code2 }, { label: 'Sync Status', meta: 'online', icon: Cloud }] },
};

interface PageLeftDrawerProps {
  activePage: PageId;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: (view: string) => void;
}

export function PageLeftDrawer({ activePage, isOpen, onToggle, onNavigate }: PageLeftDrawerProps) {
  const config = pageConfigs[activePage] || defaultConfig;
  const [activeIcon, setActiveIcon] = useState<string | null>(config.sideIcons[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [drawerWidth, setDrawerWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const newConfig = pageConfigs[activePage] || defaultConfig;
    const firstIcon = newConfig.sideIcons[0]?.id || null;
    setActiveIcon(firstIcon);
    if (firstIcon && newConfig.subTabs[firstIcon]) {
      setActiveSubTab(newConfig.subTabs[firstIcon][0]?.id || '');
    } else {
      setActiveSubTab('');
    }
  }, [activePage]);

  useEffect(() => {
    if (activeIcon && config.subTabs[activeIcon]) {
      setActiveSubTab(config.subTabs[activeIcon][0]?.id || '');
    } else {
      setActiveSubTab('');
    }
  }, [activeIcon, config.subTabs]);

  const handleIconClick = (iconId: string) => {
    if (activeIcon === iconId && isOpen) {
      onToggle();
    } else {
      setActiveIcon(iconId);
      if (!isOpen) onToggle();
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const move = (e: MouseEvent) => {
      const newW = e.clientX - 48;
      setDrawerWidth(Math.max(200, Math.min(450, newW)));
    };
    const up = () => setIsResizing(false);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const subTabs = activeIcon ? config.subTabs[activeIcon] || [] : [];

  return (
    <>
      <div className="fixed left-0 top-12 bottom-0 w-12 bg-background/80 backdrop-blur-xl border-r border-border/50 z-40 flex flex-col items-center py-3 gap-1">
        {config.sideIcons.map((item) => {
          const Icon = item.icon;
          const isActive = activeIcon === item.id && isOpen;
          return (
            <Tooltip key={item.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleIconClick(item.id)}
                  className={cn('w-10 h-10 rounded-xl transition-all duration-200', isActive && 'bg-primary/10 text-primary shadow-sm')}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{item.label}</span>
                {item.shortcut && <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded">{item.shortcut}</kbd>}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <div className="flex-1" />
        {!config.sideIcons.find(s => s.id === 'settings') && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                onClick={() => handleIconClick('settings')}
                className={cn('w-10 h-10 rounded-xl transition-all duration-200', activeIcon === 'settings' && isOpen && 'bg-primary/10 text-primary')}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        )}
      </div>

      {isOpen && activeIcon && (
        <div
          className="fixed top-12 bottom-0 z-30 flex flex-col bg-background/95 backdrop-blur-xl border-r border-border/30"
          style={{ left: 48, width: drawerWidth }}
        >
          {subTabs.length > 0 && (
            <div className="flex items-center border-b border-border/30 px-2 py-1 gap-0.5 shrink-0">
              {subTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <Tooltip key={tab.id} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => setActiveSubTab(tab.id)}
                        className={cn('h-7 px-2 gap-1 rounded-md text-xs transition-all shrink-0', isActive && 'bg-primary/15 text-primary shadow-sm')}
                      >
                        <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                        <span>{tab.label}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">{tab.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}

          <div className="px-3 py-2 border-b border-border/20 shrink-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {config.sideIcons.find(s => s.id === activeIcon)?.label || activeIcon}
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <LeftDrawerContent page={activePage} sideTab={activeIcon} subTab={activeSubTab} onNavigate={onNavigate} />
          </div>

          <div
            onMouseDown={handleMouseDown}
            className={cn('absolute top-0 bottom-0 right-0 w-1 cursor-col-resize transition-colors hover:bg-primary/50', isResizing && 'bg-primary/50')}
          />
        </div>
      )}
    </>
  );
}

function LeftDrawerContent({ page, sideTab, subTab, onNavigate }: { page: PageId; sideTab: string; subTab: string; onNavigate?: (v: string) => void }) {
  if (sideTab === 'search') return <SearchSubPanel />;
  if (sideTab === 'settings') return <SettingsSubPanel />;

  switch (page) {
    case 'chat':
      if (sideTab === 'chat') return <ChatRecentPanel />;
      if (sideTab === 'history') return <ChatHistoryPanel />;
      if (sideTab === 'favorites') return <FavoritesPanel />;
      if (sideTab === 'library') return <LibraryPanel />;
      break;
    case 'documents':
      if (sideTab === 'storage') return <DocumentStoragePanel onNavigate={onNavigate} />;
      if (sideTab === 'projects') return <ProjectsPanel />;
      if (sideTab === 'upload') return <UploadPanel />;
      break;
    case 'ide':
      if (sideTab === 'files') return <FilesPanel />;
      if (sideTab === 'git') return <GitSubPanel />;
      break;
    case 'calendar':
      if (sideTab === 'calendars') return <CalendarListPanel />;
      if (sideTab === 'events') return <UpcomingEventsPanel />;
      if (sideTab === 'people') return <PeoplePanel />;
      break;
    case 'email':
      if (sideTab === 'inbox') return <EmailFoldersPanel />;
      if (sideTab === 'compose') return <ComposePanel />;
      if (sideTab === 'sent') return <EmailSentPanel />;
      if (sideTab === 'labels') return <EmailLabelsPanel />;
      break;
    case 'apistudio':
      if (sideTab === 'collections') return <APICollectionsPanel />;
      if (sideTab === 'history') return <APIHistoryPanel />;
      if (sideTab === 'environments') return <APIEnvironmentsPanel />;
      break;
    case 'database':
      if (sideTab === 'tables') return <DBTablesPanel />;
      if (sideTab === 'queries') return <DBQueriesPanel />;
      if (sideTab === 'schema') return <DBSchemaPanel />;
      break;
    case 'notes':
      if (sideTab === 'notes') return <NotesListPanel />;
      if (sideTab === 'graph') return <NotesGraphPanel />;
      if (sideTab === 'tags') return <NotesTagsPanel />;
      break;
    case 'files':
      if (sideTab === 'browse') return <FilesBrowsePanel />;
      if (sideTab === 'recent') return <FilesRecentPanel />;
      if (sideTab === 'starred') return <FilesStarredPanel />;
      if (sideTab === 'cloud') return <FilesCloudPanel />;
      break;
    case 'comms':
      if (sideTab === 'channels') return <CommsChannelsPanel />;
      if (sideTab === 'dms') return <CommsDMsPanel />;
      if (sideTab === 'threads') return <CommsThreadsPanel />;
      break;
  }

  // Use blueprint data for any tab that doesn't have a dedicated panel
  const blueprintKey = `${page}:${sideTab}`;
  const blueprint = drawerBlueprints[blueprintKey];
  if (blueprint) {
    return <BlueprintSubPanel blueprint={blueprint} page={page} sideTab={sideTab} />;
  }

  return <BlueprintFallbackPanel page={page} sideTab={sideTab} />;

// ─── Sub-panels (same as before, abbreviated) ──────────

function SearchSubPanel() {
  return (
    <div className="p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search everything..." className="pl-9 bg-muted/30 border-none" autoFocus />
      </div>
      <p className="text-xs text-muted-foreground mt-3">Search across documents, conversations, memory, and code.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Documents', 'Messages', 'Memory', 'Code'].map(t => (
          <Badge key={t} variant="outline" className="cursor-pointer hover:bg-accent/50 text-xs">{t}</Badge>
        ))}
      </div>
    </div>
  );
}

function SettingsSubPanel() {
  const sections = [
    { name: 'General', desc: 'App preferences and defaults' },
    { name: 'Appearance', desc: 'Theme and visual settings' },
    { name: 'AI Preferences', desc: 'Model selection and behavior' },
    { name: 'Keyboard Shortcuts', desc: 'Customize key bindings' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {sections.map((s, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-3 px-2">
            <div className="text-left">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function ChatRecentPanel() {
  const chats = [
    { title: 'Document Builder Architecture', time: '2m ago', messages: 12 },
    { title: 'APOE Orchestration', time: '1h ago', messages: 45 },
    { title: 'Memory System Design', time: '3h ago', messages: 23 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Chat</Button>
        {chats.map((c, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.time} • {c.messages} msgs</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function ChatHistoryPanel() {
  const history = [
    { query: 'APOE orchestration architecture', time: '10m ago' },
    { query: 'Document analysis chain', time: '1h ago' },
    { query: 'Memory systems overview', time: '3h ago' },
    { query: 'SAM protocol validation', time: '1d ago' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {history.map((item, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <Clock className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{item.query}</p>
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function FavoritesPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">No favorites yet</p>
      <p className="text-xs">Star items to access them quickly</p>
    </div>
  );
}

function LibraryPanel() {
  const categories = [
    { name: 'System Documentation', count: 42, icon: Database },
    { name: 'Research Papers', count: 18, icon: FileText },
    { name: 'Code References', count: 156, icon: File },
    { name: 'Tagged Content', count: 89, icon: Tag },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <Card key={i} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} items</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function DocumentStoragePanel({ onNavigate }: { onNavigate?: (v: string) => void }) {
  const folders = [
    { name: 'My Documents', count: 12, icon: Folder },
    { name: 'Shared', count: 5, icon: Cloud },
    { name: 'Recent', count: 8, icon: Clock },
    { name: 'Starred', count: 3, icon: Star },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search docs..." className="pl-8 h-8 text-sm bg-muted/30 border-none" />
        </div>
        <div className="space-y-1">
          {folders.map((f, i) => {
            const Icon = f.icon;
            return (
              <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
                <Icon className="w-4 h-4 mr-2 text-primary" />
                <span className="flex-1 text-left text-sm">{f.name}</span>
                <Badge variant="secondary" className="text-[10px]">{f.count}</Badge>
              </Button>
            );
          })}
        </div>
        <div className="mt-4 space-y-2">
          <Button variant="outline" className="w-full text-sm"><Upload className="w-4 h-4 mr-2" />Upload</Button>
        </div>
      </div>
    </ScrollArea>
  );
}

function ProjectsPanel() {
  const projects = [
    { name: 'AIMOS Development', status: 'active', progress: 67 },
    { name: 'Research Pipeline', status: 'active', progress: 45 },
    { name: 'Documentation', status: 'paused', progress: 80 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {projects.map((p, i) => (
          <Card key={i} className="p-3 cursor-pointer hover:bg-accent/50 border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">{p.name}</span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full mb-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
            </div>
            <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{p.status}</Badge>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function UploadPanel() {
  return (
    <div className="p-4 flex flex-col items-center gap-3">
      <div className="w-full border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOCX, TXT, MD and more</p>
      </div>
    </div>
  );
}

function FilesPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">File Explorer</p>
      <p className="text-xs">Browse project files</p>
    </div>
  );
}

function GitSubPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">Git Panel</p>
      <p className="text-xs">Branches, commits, history</p>
    </div>
  );
}

// ─── Calendar panels ──────────
function CalendarListPanel() {
  const calendars = [
    { name: 'Personal', color: 'bg-blue-500', count: 12 },
    { name: 'Work', color: 'bg-green-500', count: 8 },
    { name: 'Holidays', color: 'bg-red-500', count: 24 },
    { name: 'Birthdays', color: 'bg-purple-500', count: 6 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Calendar</Button>
        {calendars.map((c, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
            <div className={cn('w-3 h-3 rounded-full mr-2', c.color)} />
            <span className="flex-1 text-left text-sm">{c.name}</span>
            <Badge variant="secondary" className="text-[10px]">{c.count}</Badge>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function UpcomingEventsPanel() {
  const events = [
    { title: 'Team Standup', time: '9:00 AM', calendar: 'Work' },
    { title: 'Design Review', time: '11:30 AM', calendar: 'Work' },
    { title: 'Lunch with Alex', time: '1:00 PM', calendar: 'Personal' },
    { title: 'Sprint Planning', time: '3:00 PM', calendar: 'Work' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground mb-2">Today</p>
        {events.map((e, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.time} • {e.calendar}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function PeoplePanel() {
  const people = [
    { name: 'Alex Chen', email: 'alex@example.com' },
    { name: 'Sarah Kim', email: 'sarah@example.com' },
    { name: 'Jordan Lee', email: 'jordan@example.com' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {people.map((p, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <Users className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Email panels ──────────
function EmailFoldersPanel() {
  const folders = [
    { name: 'Inbox', count: 24, icon: Inbox },
    { name: 'Starred', count: 5, icon: Star },
    { name: 'Drafts', count: 2, icon: FileText },
    { name: 'Sent', count: 0, icon: Send },
    { name: 'Archive', count: 0, icon: FolderOpen },
    { name: 'Spam', count: 3, icon: Filter },
    { name: 'Trash', count: 1, icon: Folder },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> Compose</Button>
        {folders.map((f, i) => {
          const Icon = f.icon;
          return (
            <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
              <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="flex-1 text-left text-sm">{f.name}</span>
              {f.count > 0 && <Badge variant="secondary" className="text-[10px]">{f.count}</Badge>}
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function ComposePanel() {
  return (
    <div className="p-3 space-y-3">
      <Input placeholder="To..." className="bg-muted/30 border-none h-8 text-sm" />
      <Input placeholder="Subject..." className="bg-muted/30 border-none h-8 text-sm" />
      <p className="text-xs text-muted-foreground">Compose your email in the main area.</p>
    </div>
  );
}

function EmailSentPanel() {
  const sent = [
    { to: 'alex@example.com', subject: 'Project Update', time: '2h ago' },
    { to: 'team@example.com', subject: 'Meeting Notes', time: '1d ago' },
    { to: 'sarah@example.com', subject: 'Re: Design Review', time: '2d ago' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {sent.map((s, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{s.subject}</p>
              <p className="text-xs text-muted-foreground">To: {s.to} • {s.time}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function EmailLabelsPanel() {
  const labels = [
    { name: 'Important', color: 'bg-red-500' },
    { name: 'Work', color: 'bg-blue-500' },
    { name: 'Personal', color: 'bg-green-500' },
    { name: 'Finance', color: 'bg-yellow-500' },
    { name: 'Newsletter', color: 'bg-purple-500' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Label</Button>
        {labels.map((l, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
            <div className={cn('w-3 h-3 rounded-full mr-2', l.color)} />
            <span className="flex-1 text-left text-sm">{l.name}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── API Studio panels ──────────
function APICollectionsPanel() {
  const collections = [
    { name: 'User API', count: 8, method: 'REST' },
    { name: 'Auth Service', count: 5, method: 'REST' },
    { name: 'GraphQL Queries', count: 12, method: 'GQL' },
    { name: 'WebSocket Events', count: 3, method: 'WS' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Collection</Button>
        {collections.map((c, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <Folder className="w-4 h-4 mr-2 text-primary shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.count} requests • {c.method}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function APIHistoryPanel() {
  const history = [
    { method: 'GET', url: '/api/users', status: 200, time: '2m ago' },
    { method: 'POST', url: '/api/auth/login', status: 200, time: '5m ago' },
    { method: 'PUT', url: '/api/users/1', status: 404, time: '10m ago' },
    { method: 'DELETE', url: '/api/sessions', status: 204, time: '1h ago' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {history.map((h, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <Badge variant={h.status < 300 ? 'default' : 'destructive'} className="text-[10px] mr-2 shrink-0">{h.method}</Badge>
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate font-mono">{h.url}</p>
              <p className="text-xs text-muted-foreground">{h.status} • {h.time}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function APIEnvironmentsPanel() {
  const envs = [
    { name: 'Development', url: 'http://localhost:3000', active: true },
    { name: 'Staging', url: 'https://staging.api.com', active: false },
    { name: 'Production', url: 'https://api.example.com', active: false },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Environment</Button>
        {envs.map((e, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <div className={cn('w-2 h-2 rounded-full mr-2', e.active ? 'bg-green-500' : 'bg-muted-foreground/30')} />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{e.name}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{e.url}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Database Explorer panels ──────────
function DBTablesPanel() {
  const tables = [
    { name: 'users', rows: '2.4k', icon: Database },
    { name: 'agents', rows: '156', icon: Database },
    { name: 'tasks', rows: '892', icon: Database },
    { name: 'messages', rows: '12.3k', icon: Database },
    { name: 'documents', rows: '234', icon: Database },
    { name: 'dream_sessions', rows: '67', icon: Database },
    { name: 'memory_entries', rows: '5.1k', icon: Database },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tables..." className="pl-8 h-8 text-sm bg-muted/30 border-none" />
        </div>
        <div className="space-y-0.5">
          {tables.map((t, i) => (
            <Button key={i} variant="ghost" className="w-full justify-start h-8 px-2 font-mono text-xs">
              <Database className="w-3.5 h-3.5 mr-2 text-primary shrink-0" />
              <span className="flex-1 text-left truncate">{t.name}</span>
              <span className="text-muted-foreground text-[10px]">{t.rows}</span>
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

function DBQueriesPanel() {
  const queries = [
    { name: 'All users', sql: 'SELECT * FROM users', time: '5m ago' },
    { name: 'Active agents', sql: 'SELECT * FROM agents WHERE status...', time: '12m ago' },
    { name: 'Recent tasks', sql: 'SELECT * FROM tasks ORDER BY...', time: '1h ago' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Query</Button>
        {queries.map((q, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <Code2 className="w-4 h-4 mr-2 text-primary shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{q.name}</p>
              <p className="text-xs text-muted-foreground font-mono truncate">{q.sql}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function DBSchemaPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground mb-2">Schema: public</p>
        {['Tables', 'Views', 'Functions', 'Enums', 'Extensions'].map((s, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
            <GitBranch className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{s}</span>
            <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Notes panels ──────────
function NotesListPanel() {
  const notes = [
    { title: 'Architecture Decisions', date: 'Today', tags: ['dev', 'arch'] },
    { title: 'Meeting Notes - Sprint 4', date: 'Yesterday', tags: ['meeting'] },
    { title: 'Research: Vector DBs', date: '3 days ago', tags: ['research'] },
    { title: 'UI Canon Spec', date: '1 week ago', tags: ['design'] },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Note</Button>
        {notes.map((n, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <StickyNote className="w-4 h-4 mr-2 text-primary shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{n.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">{n.date}</span>
                {n.tags.map(t => <Badge key={t} variant="outline" className="text-[9px] px-1 h-4">{t}</Badge>)}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function NotesGraphPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">Knowledge Graph</p>
      <p className="text-xs">Visualize note connections</p>
    </div>
  );
}

function NotesTagsPanel() {
  const tags = [
    { name: 'dev', count: 24 },
    { name: 'research', count: 12 },
    { name: 'design', count: 8 },
    { name: 'meeting', count: 15 },
    { name: 'arch', count: 6 },
    { name: 'ideas', count: 19 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {tags.map((t, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-8 px-2">
            <Tag className="w-3.5 h-3.5 mr-2 text-primary" />
            <span className="flex-1 text-left text-sm">{t.name}</span>
            <Badge variant="secondary" className="text-[10px]">{t.count}</Badge>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Files panels ──────────
function FilesBrowsePanel() {
  const items = [
    { name: 'Documents', type: 'folder', size: '24 items' },
    { name: 'Downloads', type: 'folder', size: '12 items' },
    { name: 'Projects', type: 'folder', size: '8 items' },
    { name: 'Images', type: 'folder', size: '156 items' },
    { name: 'readme.md', type: 'file', size: '4.2 KB' },
    { name: 'config.json', type: 'file', size: '1.1 KB' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-8 h-8 text-sm bg-muted/30 border-none" />
        </div>
        <div className="space-y-0.5">
          {items.map((f, i) => (
            <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
              {f.type === 'folder' ? <Folder className="w-4 h-4 mr-2 text-primary" /> : <File className="w-4 h-4 mr-2 text-muted-foreground" />}
              <span className="flex-1 text-left text-sm truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground">{f.size}</span>
            </Button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

function FilesRecentPanel() {
  const recent = [
    { name: 'report.pdf', time: '2m ago', size: '2.4 MB' },
    { name: 'screenshot.png', time: '1h ago', size: '890 KB' },
    { name: 'notes.md', time: '3h ago', size: '12 KB' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {recent.map((f, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <Clock className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{f.name}</p>
              <p className="text-xs text-muted-foreground">{f.time} • {f.size}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function FilesStarredPanel() {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">No starred files</p>
      <p className="text-xs">Star files for quick access</p>
    </div>
  );
}

function FilesCloudPanel() {
  return (
    <div className="p-3 space-y-2">
      <Card className="p-3 border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Cloud Storage</span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full mb-1">
          <div className="h-full bg-primary rounded-full" style={{ width: '34%' }} />
        </div>
        <p className="text-xs text-muted-foreground">3.4 GB of 10 GB used</p>
      </Card>
    </div>
  );
}

// ─── Comms panels ──────────
function CommsChannelsPanel() {
  const channels = [
    { name: 'general', unread: 5 },
    { name: 'engineering', unread: 12 },
    { name: 'design', unread: 0 },
    { name: 'random', unread: 3 },
    { name: 'announcements', unread: 1 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <Button variant="outline" size="sm" className="w-full mb-2 gap-1"><Plus className="w-3.5 h-3.5" /> New Channel</Button>
        {channels.map((c, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
            <MessageCircle className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="flex-1 text-left text-sm">#{c.name}</span>
            {c.unread > 0 && <Badge variant="destructive" className="text-[10px] h-5 min-w-5 justify-center">{c.unread}</Badge>}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function CommsDMsPanel() {
  const dms = [
    { name: 'Alex Chen', status: 'online', unread: 2 },
    { name: 'Sarah Kim', status: 'away', unread: 0 },
    { name: 'Jordan Lee', status: 'offline', unread: 0 },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {dms.map((d, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
            <div className={cn('w-2 h-2 rounded-full mr-2', d.status === 'online' ? 'bg-green-500' : d.status === 'away' ? 'bg-yellow-500' : 'bg-muted-foreground/30')} />
            <span className="flex-1 text-left text-sm">{d.name}</span>
            {d.unread > 0 && <Badge variant="destructive" className="text-[10px] h-5 min-w-5 justify-center">{d.unread}</Badge>}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function CommsThreadsPanel() {
  const threads = [
    { title: 'API v2 discussion', replies: 8, channel: '#engineering' },
    { title: 'New logo options', replies: 14, channel: '#design' },
    { title: 'Sprint retrospective', replies: 6, channel: '#general' },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {threads.map((t, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2 px-2">
            <GitBranch className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.replies} replies • {t.channel}</p>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function BlueprintSubPanel({ blueprint, page, sideTab }: { blueprint: DrawerBlueprint; page: string; sideTab: string }) {
  const handleClick = (item: DrawerBlueprintItem) => {
    emitPageDrawerAction({ page, action: sideTab, value: item.label });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Header hint */}
        <p className="text-xs text-muted-foreground leading-relaxed">{blueprint.hint}</p>

        {/* Items */}
        <div className="space-y-0.5">
          {blueprint.items.map((item, i) => {
            const Icon = item.icon;
            return (
              <Button
                key={i}
                variant="ghost"
                className="w-full justify-start h-auto py-2.5 px-2 group"
                onClick={() => handleClick(item)}
              >
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center mr-2.5 shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.meta}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

function BlueprintFallbackPanel({ page, sideTab }: { page: string; sideTab: string }) {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm capitalize font-medium">{sideTab.replace(/-/g, ' ')}</p>
      <p className="text-xs mt-1 opacity-70">{page} • {sideTab}</p>
    </div>
  );
}
