// Effects Engine — Sprint 3: Drop Shadow, Glow, Blur, Feather
// Per-object effect stacking with live Canvas2D rendering

import { DrawableEntity, Vec2, generateId } from './types';

// ============================================
// EFFECT TYPES
// ============================================

export type EffectType = 'drop-shadow' | 'inner-shadow' | 'outer-glow' | 'inner-glow' | 'gaussian-blur' | 'feather';

export interface BaseEffect {
  id: string;
  type: EffectType;
  enabled: boolean;
  order: number;
}

export interface DropShadowEffect extends BaseEffect {
  type: 'drop-shadow';
  color: string;
  opacity: number;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
}

export interface InnerShadowEffect extends BaseEffect {
  type: 'inner-shadow';
  color: string;
  opacity: number;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export interface OuterGlowEffect extends BaseEffect {
  type: 'outer-glow';
  color: string;
  opacity: number;
  blur: number;
  spread: number;
}

export interface InnerGlowEffect extends BaseEffect {
  type: 'inner-glow';
  color: string;
  opacity: number;
  blur: number;
  choke: number;
}

export interface GaussianBlurEffect extends BaseEffect {
  type: 'gaussian-blur';
  radius: number;
}

export interface FeatherEffect extends BaseEffect {
  type: 'feather';
  radius: number;
}

export type Effect = 
  | DropShadowEffect 
  | InnerShadowEffect 
  | OuterGlowEffect 
  | InnerGlowEffect 
  | GaussianBlurEffect 
  | FeatherEffect;

// ============================================
// EFFECT FACTORIES
// ============================================

export function createDropShadow(overrides?: Partial<DropShadowEffect>): DropShadowEffect {
  return {
    id: generateId(),
    type: 'drop-shadow',
    enabled: true,
    order: 0,
    color: '#000000',
    opacity: 0.5,
    offsetX: 4,
    offsetY: 4,
    blur: 8,
    spread: 0,
    ...overrides,
  };
}

export function createInnerShadow(overrides?: Partial<InnerShadowEffect>): InnerShadowEffect {
  return {
    id: generateId(),
    type: 'inner-shadow',
    enabled: true,
    order: 0,
    color: '#000000',
    opacity: 0.35,
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    ...overrides,
  };
}

export function createOuterGlow(overrides?: Partial<OuterGlowEffect>): OuterGlowEffect {
  return {
    id: generateId(),
    type: 'outer-glow',
    enabled: true,
    order: 0,
    color: '#4a9eff',
    opacity: 0.6,
    blur: 12,
    spread: 0,
    ...overrides,
  };
}

export function createInnerGlow(overrides?: Partial<InnerGlowEffect>): InnerGlowEffect {
  return {
    id: generateId(),
    type: 'inner-glow',
    enabled: true,
    order: 0,
    color: '#ffffff',
    opacity: 0.4,
    blur: 8,
    choke: 0,
    ...overrides,
  };
}

export function createGaussianBlur(overrides?: Partial<GaussianBlurEffect>): GaussianBlurEffect {
  return {
    id: generateId(),
    type: 'gaussian-blur',
    enabled: true,
    order: 0,
    radius: 4,
    ...overrides,
  };
}

export function createFeather(overrides?: Partial<FeatherEffect>): FeatherEffect {
  return {
    id: generateId(),
    type: 'feather',
    enabled: true,
    order: 0,
    radius: 6,
    ...overrides,
  };
}

// ============================================
// EFFECT STACK MANAGEMENT
// ============================================

export interface EffectStack {
  effects: Effect[];
}

export const emptyEffectStack: EffectStack = { effects: [] };

export function addEffect(stack: EffectStack, effect: Effect): EffectStack {
  const effects = [...stack.effects, { ...effect, order: stack.effects.length }];
  return { effects };
}

export function removeEffect(stack: EffectStack, effectId: string): EffectStack {
  const effects = stack.effects
    .filter(e => e.id !== effectId)
    .map((e, i) => ({ ...e, order: i }));
  return { effects };
}

export function updateEffect(stack: EffectStack, effectId: string, updates: Partial<Effect>): EffectStack {
  const effects = stack.effects.map(e =>
    e.id === effectId ? { ...e, ...updates } as Effect : e
  );
  return { effects };
}

export function toggleEffect(stack: EffectStack, effectId: string): EffectStack {
  const effects = stack.effects.map(e =>
    e.id === effectId ? { ...e, enabled: !e.enabled } : e
  );
  return { effects };
}

export function reorderEffect(stack: EffectStack, effectId: string, newIndex: number): EffectStack {
  const effect = stack.effects.find(e => e.id === effectId);
  if (!effect) return stack;
  const filtered = stack.effects.filter(e => e.id !== effectId);
  filtered.splice(newIndex, 0, effect);
  return { effects: filtered.map((e, i) => ({ ...e, order: i })) };
}

// ============================================
// EFFECT RENDERING — Canvas2D
// ============================================

export function applyEffectsToContext(
  ctx: CanvasRenderingContext2D,
  effects: Effect[],
  zoom: number,
): void {
  const sorted = [...effects].filter(e => e.enabled).sort((a, b) => a.order - b.order);
  
  for (const effect of sorted) {
    switch (effect.type) {
      case 'drop-shadow': {
        ctx.shadowColor = hexToRgba(effect.color, effect.opacity);
        ctx.shadowOffsetX = effect.offsetX * zoom;
        ctx.shadowOffsetY = effect.offsetY * zoom;
        ctx.shadowBlur = effect.blur * zoom;
        break;
      }
      case 'outer-glow': {
        ctx.shadowColor = hexToRgba(effect.color, effect.opacity);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = effect.blur * zoom;
        break;
      }
      case 'gaussian-blur': {
        ctx.filter = `blur(${effect.radius * zoom}px)`;
        break;
      }
      case 'feather': {
        ctx.filter = `blur(${effect.radius * zoom * 0.5}px)`;
        break;
      }
    }
  }
}

export function clearEffectsFromContext(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.filter = 'none';
}

// Render inner effects post-fill (requires clipping)
export function renderInnerEffects(
  ctx: CanvasRenderingContext2D,
  effects: Effect[],
  shapePath: Path2D,
  zoom: number,
): void {
  const sorted = [...effects].filter(e => e.enabled).sort((a, b) => a.order - b.order);
  
  for (const effect of sorted) {
    if (effect.type === 'inner-shadow') {
      ctx.save();
      ctx.clip(shapePath);
      
      // Draw inverse shadow by expanding and offsetting
      ctx.shadowColor = hexToRgba(effect.color, effect.opacity);
      ctx.shadowOffsetX = effect.offsetX * zoom;
      ctx.shadowOffsetY = effect.offsetY * zoom;
      ctx.shadowBlur = effect.blur * zoom;
      
      // Draw a large rect around, clipped to shape — produces inner shadow
      ctx.fillStyle = effect.color;
      ctx.globalAlpha = 0;
      ctx.beginPath();
      ctx.rect(-10000, -10000, 20000, 20000);
      // Reverse winding to create inner shadow
      ctx.fill('evenodd');
      
      ctx.restore();
    } else if (effect.type === 'inner-glow') {
      ctx.save();
      ctx.clip(shapePath);
      
      ctx.shadowColor = hexToRgba(effect.color, effect.opacity);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = effect.blur * zoom;
      
      // Stroke inside the shape to create glow
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = effect.blur * zoom * 2;
      ctx.globalAlpha = effect.opacity;
      ctx.stroke(shapePath);
      
      ctx.restore();
    }
  }
}

// ============================================
// EFFECT PRESETS
// ============================================

export interface EffectPreset {
  name: string;
  category: 'shadow' | 'glow' | 'blur' | 'stylize';
  effects: Effect[];
}

export const EFFECT_PRESETS: EffectPreset[] = [
  {
    name: 'Soft Shadow',
    category: 'shadow',
    effects: [createDropShadow({ color: '#000000', opacity: 0.3, offsetX: 2, offsetY: 4, blur: 12 })],
  },
  {
    name: 'Hard Shadow',
    category: 'shadow',
    effects: [createDropShadow({ color: '#000000', opacity: 0.6, offsetX: 4, offsetY: 4, blur: 0 })],
  },
  {
    name: 'Long Shadow',
    category: 'shadow',
    effects: [createDropShadow({ color: '#000000', opacity: 0.2, offsetX: 12, offsetY: 12, blur: 24 })],
  },
  {
    name: 'Neon Glow',
    category: 'glow',
    effects: [createOuterGlow({ color: '#00ff88', opacity: 0.8, blur: 20 })],
  },
  {
    name: 'Soft Glow',
    category: 'glow',
    effects: [createOuterGlow({ color: '#ffffff', opacity: 0.4, blur: 16 })],
  },
  {
    name: 'Electric Blue',
    category: 'glow',
    effects: [createOuterGlow({ color: '#4a9eff', opacity: 0.7, blur: 18 })],
  },
  {
    name: 'Inset',
    category: 'shadow',
    effects: [createInnerShadow({ color: '#000000', opacity: 0.4, offsetX: 0, offsetY: 2, blur: 4 })],
  },
  {
    name: 'Frosted Glass',
    category: 'blur',
    effects: [createGaussianBlur({ radius: 8 }), createInnerGlow({ color: '#ffffff', opacity: 0.2, blur: 4, choke: 0 })],
  },
  {
    name: 'Soft Edge',
    category: 'stylize',
    effects: [createFeather({ radius: 8 })],
  },
  {
    name: 'Emboss',
    category: 'stylize',
    effects: [
      createInnerShadow({ color: '#ffffff', opacity: 0.5, offsetX: -1, offsetY: -1, blur: 2 }),
      createInnerShadow({ color: '#000000', opacity: 0.3, offsetX: 1, offsetY: 1, blur: 2 }),
    ],
  },
];

// ============================================
// GRAPHIC STYLES — saved appearance combos
// ============================================

export interface GraphicStyle {
  id: string;
  name: string;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  effects: Effect[];
}

export function createGraphicStyle(
  name: string,
  entity: DrawableEntity,
  effectStack: EffectStack,
): GraphicStyle {
  return {
    id: generateId(),
    name,
    fillColor: entity.fill.color,
    fillOpacity: entity.fill.opacity,
    strokeColor: entity.stroke.color,
    strokeWidth: entity.stroke.width,
    strokeOpacity: entity.stroke.opacity,
    effects: [...effectStack.effects],
  };
}

export function applyGraphicStyle(
  entity: DrawableEntity,
  style: GraphicStyle,
): { entity: DrawableEntity; effects: EffectStack } {
  const updated = {
    ...entity,
    fill: {
      ...entity.fill,
      ...(style.fillColor !== undefined ? { color: style.fillColor } : {}),
      ...(style.fillOpacity !== undefined ? { opacity: style.fillOpacity } : {}),
    },
    stroke: {
      ...entity.stroke,
      ...(style.strokeColor !== undefined ? { color: style.strokeColor } : {}),
      ...(style.strokeWidth !== undefined ? { width: style.strokeWidth } : {}),
      ...(style.strokeOpacity !== undefined ? { opacity: style.strokeOpacity } : {}),
    },
  };
  
  return { entity: updated, effects: { effects: [...style.effects] } };
}

// ============================================
// UTILITY
// ============================================

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
