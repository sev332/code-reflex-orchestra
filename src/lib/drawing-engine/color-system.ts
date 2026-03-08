/**
 * Color System — HSB/RGB/HEX conversion, color harmonies, global colors
 * Sprint 1: Full color model conversions and harmony generation
 */

// ============================================
// COLOR MODELS
// ============================================

export interface RGB { r: number; g: number; b: number; }  // 0-255
export interface HSB { h: number; s: number; b: number; }  // h: 0-360, s: 0-100, b: 0-100
export interface HSL { h: number; s: number; l: number; }  // h: 0-360, s: 0-100, l: 0-100
export interface CMYK { c: number; m: number; y: number; k: number; } // 0-100

export interface ColorValue {
  hex: string;
  rgb: RGB;
  hsb: HSB;
  hsl: HSL;
  opacity: number; // 0-1
}

// ============================================
// CONVERSIONS
// ============================================

export function hexToRGB(hex: string): RGB {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function rgbToHSB(rgb: RGB): HSB {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h), s: Math.round(s), b: Math.round(v) };
}

export function hsbToRGB(hsb: HSB): RGB {
  const h = hsb.h / 360, s = hsb.s / 100, v = hsb.b / 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function rgbToHSL(rgb: RGB): HSL {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRGB(hsl: HSL): RGB {
  const h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// ============================================
// UNIFIED COLOR FACTORY
// ============================================

export function colorFromHex(hex: string, opacity: number = 1): ColorValue {
  const rgb = hexToRGB(hex);
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsb: rgbToHSB(rgb),
    hsl: rgbToHSL(rgb),
    opacity,
  };
}

export function colorFromHSB(h: number, s: number, b: number, opacity: number = 1): ColorValue {
  const rgb = hsbToRGB({ h, s, b });
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsb: { h, s, b },
    hsl: rgbToHSL(rgb),
    opacity,
  };
}

export function colorFromRGB(r: number, g: number, b: number, opacity: number = 1): ColorValue {
  const rgb = { r, g, b };
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsb: rgbToHSB(rgb),
    hsl: rgbToHSL(rgb),
    opacity,
  };
}

// ============================================
// COLOR HARMONIES
// ============================================

export type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic' | 'monochromatic';

export function generateHarmony(baseColor: ColorValue, type: HarmonyType): ColorValue[] {
  const h = baseColor.hsb.h;
  const s = baseColor.hsb.s;
  const b = baseColor.hsb.b;

  switch (type) {
    case 'complementary':
      return [baseColor, colorFromHSB((h + 180) % 360, s, b)];
    case 'analogous':
      return [
        colorFromHSB((h - 30 + 360) % 360, s, b),
        baseColor,
        colorFromHSB((h + 30) % 360, s, b),
      ];
    case 'triadic':
      return [
        baseColor,
        colorFromHSB((h + 120) % 360, s, b),
        colorFromHSB((h + 240) % 360, s, b),
      ];
    case 'split-complementary':
      return [
        baseColor,
        colorFromHSB((h + 150) % 360, s, b),
        colorFromHSB((h + 210) % 360, s, b),
      ];
    case 'tetradic':
      return [
        baseColor,
        colorFromHSB((h + 90) % 360, s, b),
        colorFromHSB((h + 180) % 360, s, b),
        colorFromHSB((h + 270) % 360, s, b),
      ];
    case 'monochromatic':
      return [
        colorFromHSB(h, Math.max(0, s - 30), b),
        colorFromHSB(h, s, b),
        colorFromHSB(h, Math.min(100, s + 20), Math.max(0, b - 20)),
        colorFromHSB(h, Math.min(100, s + 10), Math.max(0, b - 40)),
      ];
  }
}
