// ─── Animation Engine Types & Core ─────────────────
// Phase 2: Unreal Sequencer-class keyframe animation system

export type EasingType = 
  | 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
  | 'cubicIn' | 'cubicOut' | 'cubicInOut'
  | 'bounceIn' | 'bounceOut' | 'bounceInOut'
  | 'elasticIn' | 'elasticOut' | 'elasticInOut'
  | 'backIn' | 'backOut' | 'backInOut';

export type AnimatableProperty =
  | 'position.x' | 'position.y' | 'position.z'
  | 'rotation.x' | 'rotation.y' | 'rotation.z'
  | 'scale.x' | 'scale.y' | 'scale.z'
  | 'opacity' | 'metalness' | 'roughness'
  | 'emissiveIntensity' | 'clearcoat' | 'transmission'
  | 'color.r' | 'color.g' | 'color.b'
  | 'intensity'; // for lights

export interface Keyframe {
  id: string;
  time: number; // seconds
  value: number;
  easing: EasingType;
}

export interface AnimationTrack {
  id: string;
  objectId: string;
  property: AnimatableProperty;
  keyframes: Keyframe[];
  muted: boolean;
  locked: boolean;
}

export interface AnimationClip {
  id: string;
  name: string;
  duration: number; // seconds
  tracks: AnimationTrack[];
  loop: boolean;
  speed: number;
}

export interface AnimationState {
  clip: AnimationClip;
  isPlaying: boolean;
  currentTime: number;
  selectedTrackId: string | null;
  selectedKeyframeIds: string[];
}

// ─── Easing Functions ──────────────────────────────

const bounce = (t: number): number => {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
  t -= 2.625 / 2.75;
  return 7.5625 * t * t + 0.984375;
};

export const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  cubicIn: t => t * t * t,
  cubicOut: t => 1 - Math.pow(1 - t, 3),
  cubicInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  bounceOut: t => bounce(t),
  bounceIn: t => 1 - bounce(1 - t),
  bounceInOut: t => t < 0.5 ? (1 - bounce(1 - 2 * t)) / 2 : (1 + bounce(2 * t - 1)) / 2,
  elasticIn: t => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3)),
  elasticOut: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
  elasticInOut: t => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5))) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI / 4.5))) / 2 + 1;
  },
  backIn: t => 2.70158 * t * t * t - 1.70158 * t * t,
  backOut: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  backInOut: t => {
    const c = 1.70158 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2;
  },
};

// ─── Animation Evaluation ──────────────────────────

export function evaluateTrack(track: AnimationTrack, time: number): number | null {
  const { keyframes } = track;
  if (keyframes.length === 0) return null;
  if (track.muted) return null;

  // Sort by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0].time) return sorted[0].value;
  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  // Find surrounding keyframes
  for (let i = 0; i < sorted.length - 1; i++) {
    const kf0 = sorted[i];
    const kf1 = sorted[i + 1];
    if (time >= kf0.time && time <= kf1.time) {
      const dt = kf1.time - kf0.time;
      if (dt === 0) return kf0.value;
      const t = (time - kf0.time) / dt;
      const easedT = easingFunctions[kf0.easing](t);
      return kf0.value + (kf1.value - kf0.value) * easedT;
    }
  }

  return sorted[sorted.length - 1].value;
}

export function evaluateClipAtTime(
  clip: AnimationClip,
  time: number
): Map<string, Map<AnimatableProperty, number>> {
  const results = new Map<string, Map<AnimatableProperty, number>>();
  
  let effectiveTime = time;
  if (clip.loop && clip.duration > 0) {
    effectiveTime = time % clip.duration;
  } else {
    effectiveTime = Math.min(time, clip.duration);
  }

  for (const track of clip.tracks) {
    const value = evaluateTrack(track, effectiveTime);
    if (value === null) continue;

    if (!results.has(track.objectId)) {
      results.set(track.objectId, new Map());
    }
    results.get(track.objectId)!.set(track.property, value);
  }

  return results;
}

// ─── Helpers ───────────────────────────────────────

export function createKeyframe(time: number, value: number, easing: EasingType = 'easeInOut'): Keyframe {
  return { id: `kf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, time, value, easing };
}

export function createTrack(objectId: string, property: AnimatableProperty): AnimationTrack {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    objectId,
    property,
    keyframes: [],
    muted: false,
    locked: false,
  };
}

export function createClip(name: string = 'Animation', duration: number = 5): AnimationClip {
  return {
    id: `clip-${Date.now()}`,
    name,
    duration,
    tracks: [],
    loop: true,
    speed: 1,
  };
}

export const propertyLabels: Record<AnimatableProperty, string> = {
  'position.x': 'Pos X',
  'position.y': 'Pos Y',
  'position.z': 'Pos Z',
  'rotation.x': 'Rot X',
  'rotation.y': 'Rot Y',
  'rotation.z': 'Rot Z',
  'scale.x': 'Scale X',
  'scale.y': 'Scale Y',
  'scale.z': 'Scale Z',
  'opacity': 'Opacity',
  'metalness': 'Metalness',
  'roughness': 'Roughness',
  'emissiveIntensity': 'Emissive',
  'clearcoat': 'Clearcoat',
  'transmission': 'Transmission',
  'color.r': 'Color R',
  'color.g': 'Color G',
  'color.b': 'Color B',
  'intensity': 'Intensity',
};

export const propertyGroups: Record<string, AnimatableProperty[]> = {
  'Transform': ['position.x', 'position.y', 'position.z', 'rotation.x', 'rotation.y', 'rotation.z', 'scale.x', 'scale.y', 'scale.z'],
  'Material': ['opacity', 'metalness', 'roughness', 'emissiveIntensity', 'clearcoat', 'transmission'],
  'Color': ['color.r', 'color.g', 'color.b'],
  'Light': ['intensity'],
};

// Get object property value for keyframe recording
export function getObjectPropertyValue(obj: any, property: AnimatableProperty): number {
  const parts = property.split('.');
  if (parts.length === 2) {
    const [group, axis] = parts;
    if (group === 'position' || group === 'rotation' || group === 'scale') {
      const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      return obj[group]?.[idx] ?? 0;
    }
    if (group === 'color') {
      // Parse hex color to RGB component
      const hex = obj.color || '#000000';
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return axis === 'r' ? r : axis === 'g' ? g : b;
    }
  }
  return obj[property] ?? 0;
}

// Apply animated values back to object
export function applyAnimatedValues(
  obj: any,
  values: Map<AnimatableProperty, number>
): any {
  const updated = { ...obj };
  
  for (const [prop, value] of values) {
    const parts = prop.split('.');
    if (parts.length === 2) {
      const [group, axis] = parts;
      if (group === 'position' || group === 'rotation' || group === 'scale') {
        const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        updated[group] = [...(updated[group] || [0, 0, 0])];
        updated[group][idx] = value;
      }
      if (group === 'color') {
        // Reconstruct hex from RGB
        const hex = updated.color || '#000000';
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;
        if (axis === 'r') r = value;
        if (axis === 'g') g = value;
        if (axis === 'b') b = value;
        const toHex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
        updated.color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      }
    } else {
      updated[prop] = value;
    }
  }
  
  return updated;
}
