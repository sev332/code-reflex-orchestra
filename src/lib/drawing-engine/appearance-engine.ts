// Appearance Engine — Multi-fill/stroke per object, graphic styles
// Sprint 5: Appearance Panel system

import { FillAppearance, StrokeAppearance, DrawableEntity, generateId } from './types';

// ============================================
// APPEARANCE STACK
// ============================================

export interface AppearanceEntry {
  id: string;
  type: 'fill' | 'stroke';
  visible: boolean;
  opacity: number;
  fill?: FillAppearance;
  stroke?: StrokeAppearance;
}

export interface AppearanceStack {
  entries: AppearanceEntry[];
}

export const emptyAppearanceStack: AppearanceStack = { entries: [] };

export function createFillEntry(fill: Partial<FillAppearance> = {}): AppearanceEntry {
  return {
    id: generateId(),
    type: 'fill',
    visible: true,
    opacity: 1,
    fill: {
      type: fill.type ?? 'solid',
      color: fill.color ?? '#4a9eff',
      opacity: fill.opacity ?? 1,
      gradient: fill.gradient,
    },
  };
}

export function createStrokeEntry(stroke: Partial<StrokeAppearance> = {}): AppearanceEntry {
  return {
    id: generateId(),
    type: 'stroke',
    visible: true,
    opacity: 1,
    stroke: {
      color: stroke.color ?? '#ffffff',
      width: stroke.width ?? 2,
      opacity: stroke.opacity ?? 1,
      cap: stroke.cap ?? 'round',
      join: stroke.join ?? 'round',
      dashArray: stroke.dashArray,
      dashOffset: stroke.dashOffset,
    },
  };
}

export function addAppearanceEntry(stack: AppearanceStack, entry: AppearanceEntry): AppearanceStack {
  return { entries: [...stack.entries, entry] };
}

export function removeAppearanceEntry(stack: AppearanceStack, entryId: string): AppearanceStack {
  return { entries: stack.entries.filter(e => e.id !== entryId) };
}

export function updateAppearanceEntry(stack: AppearanceStack, entryId: string, updates: Partial<AppearanceEntry>): AppearanceStack {
  return {
    entries: stack.entries.map(e => e.id === entryId ? { ...e, ...updates } : e),
  };
}

export function toggleAppearanceEntry(stack: AppearanceStack, entryId: string): AppearanceStack {
  return {
    entries: stack.entries.map(e => e.id === entryId ? { ...e, visible: !e.visible } : e),
  };
}

export function reorderAppearanceEntry(stack: AppearanceStack, entryId: string, direction: 'up' | 'down'): AppearanceStack {
  const idx = stack.entries.findIndex(e => e.id === entryId);
  if (idx === -1) return stack;
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= stack.entries.length) return stack;
  const entries = [...stack.entries];
  [entries[idx], entries[newIdx]] = [entries[newIdx], entries[idx]];
  return { entries };
}

// Convert entity's single fill/stroke to appearance stack
export function entityToAppearanceStack(entity: DrawableEntity): AppearanceStack {
  const entries: AppearanceEntry[] = [];
  if (entity.fill && entity.fill.type !== 'none') {
    entries.push(createFillEntry(entity.fill));
  }
  if (entity.stroke && entity.stroke.width > 0) {
    entries.push(createStrokeEntry(entity.stroke));
  }
  return { entries };
}

// ============================================
// GRAPHIC STYLES (save & reuse appearances)
// ============================================

export interface SavedGraphicStyle {
  id: string;
  name: string;
  stack: AppearanceStack;
  preview: { fills: string[]; strokes: string[] };
}

export function createSavedStyle(name: string, stack: AppearanceStack): SavedGraphicStyle {
  return {
    id: generateId(),
    name,
    stack: { ...stack },
    preview: {
      fills: stack.entries.filter(e => e.type === 'fill' && e.fill).map(e => e.fill!.color),
      strokes: stack.entries.filter(e => e.type === 'stroke' && e.stroke).map(e => e.stroke!.color),
    },
  };
}

// ============================================
// BUILT-IN APPEARANCE PRESETS
// ============================================

export const APPEARANCE_PRESETS: { name: string; stack: AppearanceStack }[] = [
  {
    name: 'Double Stroke',
    stack: {
      entries: [
        createFillEntry({ color: '#3b82f6' }),
        createStrokeEntry({ color: '#ffffff', width: 4 }),
        createStrokeEntry({ color: '#1e40af', width: 1 }),
      ],
    },
  },
  {
    name: 'Neon Outline',
    stack: {
      entries: [
        createFillEntry({ type: 'none', color: 'transparent', opacity: 0 }),
        createStrokeEntry({ color: '#00ffcc', width: 2 }),
        createStrokeEntry({ color: '#00ffcc33', width: 8 }),
      ],
    },
  },
  {
    name: 'Glass Fill',
    stack: {
      entries: [
        createFillEntry({ color: '#ffffff22' }),
        createFillEntry({ color: '#3b82f6', opacity: 0.3 }),
        createStrokeEntry({ color: '#ffffff44', width: 1 }),
      ],
    },
  },
  {
    name: 'Duotone',
    stack: {
      entries: [
        createFillEntry({ color: '#ec4899' }),
        createFillEntry({ color: '#8b5cf6', opacity: 0.5 }),
        createStrokeEntry({ color: '#ffffff', width: 1.5 }),
      ],
    },
  },
];
