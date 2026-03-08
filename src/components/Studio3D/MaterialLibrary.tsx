import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Search, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── PBR Material Preset Definition ────────────────

export interface PBRMaterialPreset {
  id: string;
  name: string;
  category: string;
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  emissive: string;
  emissiveIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  ior: number;
  thickness: number;
  sheen: number;
  sheenRoughness: number;
  sheenColor: string;
  iridescence: number;
  iridescenceIOR: number;
  envMapIntensity: number;
  thumbnail: string;
}

export const materialPresets: PBRMaterialPreset[] = [
  // Metals
  { id: 'gold', name: 'Gold', category: 'Metal', color: '#FFD700', metalness: 1.0, roughness: 0.15, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.5, thumbnail: '🥇' },
  { id: 'silver', name: 'Silver', category: 'Metal', color: '#C0C0C0', metalness: 1.0, roughness: 0.1, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.5, thumbnail: '🪙' },
  { id: 'copper', name: 'Copper', category: 'Metal', color: '#B87333', metalness: 1.0, roughness: 0.25, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.2, thumbnail: '🔶' },
  { id: 'chrome', name: 'Chrome', category: 'Metal', color: '#E8E8E8', metalness: 1.0, roughness: 0.02, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 2.0, thumbnail: '⚙️' },
  { id: 'brushed-steel', name: 'Brushed Steel', category: 'Metal', color: '#8E8E8E', metalness: 0.9, roughness: 0.4, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.0, thumbnail: '🔩' },
  // Glass & Transparent
  { id: 'clear-glass', name: 'Clear Glass', category: 'Glass', color: '#ffffff', metalness: 0, roughness: 0.0, opacity: 0.1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 1, clearcoatRoughness: 0, transmission: 0.95, ior: 1.5, thickness: 0.5, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.5, thumbnail: '🔍' },
  { id: 'frosted-glass', name: 'Frosted Glass', category: 'Glass', color: '#e8f0ff', metalness: 0, roughness: 0.5, opacity: 0.3, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0.5, clearcoatRoughness: 0.3, transmission: 0.7, ior: 1.5, thickness: 0.5, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.0, thumbnail: '🧊' },
  { id: 'diamond', name: 'Diamond', category: 'Glass', color: '#ffffff', metalness: 0, roughness: 0.0, opacity: 0.05, emissive: '#000000', emissiveIntensity: 0, clearcoat: 1, clearcoatRoughness: 0, transmission: 0.98, ior: 2.42, thickness: 1, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 1, iridescenceIOR: 2.0, envMapIntensity: 2.5, thumbnail: '💎' },
  { id: 'colored-glass', name: 'Stained Glass', category: 'Glass', color: '#4488ff', metalness: 0, roughness: 0.05, opacity: 0.2, emissive: '#112244', emissiveIntensity: 0.1, clearcoat: 1, clearcoatRoughness: 0, transmission: 0.85, ior: 1.5, thickness: 0.3, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.5, thumbnail: '🏺' },
  // Wood
  { id: 'dark-wood', name: 'Dark Wood', category: 'Wood', color: '#3E2723', metalness: 0, roughness: 0.75, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0.2, clearcoatRoughness: 0.3, transmission: 0, ior: 1.5, thickness: 0, sheen: 0.1, sheenRoughness: 0.5, sheenColor: '#3E2723', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.5, thumbnail: '🪵' },
  { id: 'light-wood', name: 'Light Wood', category: 'Wood', color: '#DEB887', metalness: 0, roughness: 0.65, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0.1, clearcoatRoughness: 0.4, transmission: 0, ior: 1.5, thickness: 0, sheen: 0.05, sheenRoughness: 0.5, sheenColor: '#DEB887', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.3, thumbnail: '🟫' },
  // Stone & Concrete
  { id: 'concrete', name: 'Concrete', category: 'Stone', color: '#808080', metalness: 0, roughness: 0.95, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.2, thumbnail: '🧱' },
  { id: 'marble-white', name: 'White Marble', category: 'Stone', color: '#F0EDE5', metalness: 0, roughness: 0.15, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0.5, clearcoatRoughness: 0.1, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.8, thumbnail: '⬜' },
  { id: 'granite', name: 'Granite', category: 'Stone', color: '#6B6B6B', metalness: 0.05, roughness: 0.6, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0.3, clearcoatRoughness: 0.2, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.5, thumbnail: '🪨' },
  // Fabric
  { id: 'silk', name: 'Silk', category: 'Fabric', color: '#C41E3A', metalness: 0, roughness: 0.45, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 1.0, sheenRoughness: 0.3, sheenColor: '#FF6B6B', iridescence: 0.3, iridescenceIOR: 1.3, envMapIntensity: 0.5, thumbnail: '🎀' },
  { id: 'velvet', name: 'Velvet', category: 'Fabric', color: '#4A0E2E', metalness: 0, roughness: 0.85, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0.8, sheenRoughness: 0.8, sheenColor: '#8B2252', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.3, thumbnail: '🟣' },
  { id: 'denim', name: 'Denim', category: 'Fabric', color: '#1560BD', metalness: 0, roughness: 0.9, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0.3, sheenRoughness: 0.6, sheenColor: '#4488CC', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.2, thumbnail: '👖' },
  // Plastic & Rubber
  { id: 'glossy-plastic', name: 'Glossy Plastic', category: 'Plastic', color: '#FF4444', metalness: 0, roughness: 0.15, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 1, clearcoatRoughness: 0.05, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.0, thumbnail: '🔴' },
  { id: 'matte-plastic', name: 'Matte Plastic', category: 'Plastic', color: '#3388FF', metalness: 0, roughness: 0.8, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.3, thumbnail: '🔵' },
  { id: 'rubber', name: 'Rubber', category: 'Plastic', color: '#222222', metalness: 0, roughness: 0.95, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.1, thumbnail: '⚫' },
  // Special
  { id: 'neon', name: 'Neon Glow', category: 'Special', color: '#00FF88', metalness: 0, roughness: 0.3, opacity: 1, emissive: '#00FF88', emissiveIntensity: 2.0, clearcoat: 0.5, clearcoatRoughness: 0.1, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.5, thumbnail: '💚' },
  { id: 'holographic', name: 'Holographic', category: 'Special', color: '#8844FF', metalness: 0.5, roughness: 0.1, opacity: 0.8, emissive: '#4422AA', emissiveIntensity: 0.3, clearcoat: 1, clearcoatRoughness: 0, transmission: 0.3, ior: 1.8, thickness: 0.5, sheen: 0.5, sheenRoughness: 0.2, sheenColor: '#FF44FF', iridescence: 1.0, iridescenceIOR: 2.0, envMapIntensity: 2.0, thumbnail: '🔮' },
  { id: 'lava-emissive', name: 'Lava', category: 'Special', color: '#FF2200', metalness: 0, roughness: 0.7, opacity: 1, emissive: '#FF4400', emissiveIntensity: 3.0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0, ior: 1.5, thickness: 0, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.3, thumbnail: '🌋' },
  { id: 'water', name: 'Water', category: 'Special', color: '#006994', metalness: 0, roughness: 0.0, opacity: 0.3, emissive: '#001122', emissiveIntensity: 0.05, clearcoat: 1, clearcoatRoughness: 0, transmission: 0.9, ior: 1.33, thickness: 2, sheen: 0, sheenRoughness: 0, sheenColor: '#000000', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 1.5, thumbnail: '💧' },
  { id: 'skin', name: 'Skin', category: 'Special', color: '#E0A484', metalness: 0, roughness: 0.55, opacity: 1, emissive: '#000000', emissiveIntensity: 0, clearcoat: 0.2, clearcoatRoughness: 0.3, transmission: 0, ior: 1.5, thickness: 0, sheen: 0.4, sheenRoughness: 0.5, sheenColor: '#FFC0A0', iridescence: 0, iridescenceIOR: 1.3, envMapIntensity: 0.4, thumbnail: '🤝' },
];

const allCategories = ['All', ...Array.from(new Set(materialPresets.map(m => m.category)))];

interface MaterialLibraryProps {
  onApplyMaterial: (preset: PBRMaterialPreset) => void;
  selectedObjectId: string | null;
}

export function MaterialLibraryPanel({ onApplyMaterial, selectedObjectId }: MaterialLibraryProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    return materialPresets.filter(m => {
      if (activeCategory !== 'All' && m.category !== activeCategory) return false;
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeCategory, search]);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          Material Library
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="h-7 text-xs pl-7 bg-muted/30 border-border/30"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          {allCategories.map(cat => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              className={cn(
                'text-[9px] px-1.5 py-0 cursor-pointer transition-colors',
                activeCategory === cat ? 'bg-primary text-primary-foreground' : 'border-border/40 hover:bg-muted/50'
              )}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {!selectedObjectId && (
          <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2 text-center">
            Select an object to apply materials
          </div>
        )}

        {/* Material Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {filtered.map(mat => (
            <button
              key={mat.id}
              onClick={() => selectedObjectId && onApplyMaterial(mat)}
              disabled={!selectedObjectId}
              className={cn(
                'rounded-md border border-border/30 p-2 text-left transition-all hover:border-primary/50 hover:bg-muted/30',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'group relative overflow-hidden'
              )}
            >
              {/* Color swatch */}
              <div
                className="w-full aspect-square rounded-sm mb-1.5 relative overflow-hidden"
                style={{
                  background: mat.transmission > 0.5
                    ? `linear-gradient(135deg, ${mat.color}44, ${mat.color}88)`
                    : mat.emissiveIntensity > 0.5
                      ? `radial-gradient(circle, ${mat.emissive}, ${mat.color})`
                      : mat.metalness > 0.5
                        ? `linear-gradient(135deg, ${mat.color}, #ffffff44, ${mat.color})`
                        : mat.color,
                  boxShadow: mat.emissiveIntensity > 0.5 ? `0 0 12px ${mat.emissive}66` : undefined,
                }}
              >
                {mat.iridescence > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-cyan-500/30" />
                )}
                {mat.sheen > 0.3 && (
                  <div className="absolute inset-0 bg-gradient-to-tl from-white/20 via-transparent to-transparent" />
                )}
              </div>
              <div className="text-[10px] font-medium text-foreground truncate">{mat.name}</div>
              <div className="text-[8px] text-muted-foreground">{mat.category}</div>
            </button>
          ))}
        </div>

        <Separator className="bg-border/20" />

        {/* Advanced PBR Properties Legend */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium text-foreground/60 uppercase tracking-wider">Material Properties</div>
          {[
            { label: 'Clearcoat', desc: 'Extra glossy layer (car paint)' },
            { label: 'Transmission', desc: 'Light passes through (glass)' },
            { label: 'Sheen', desc: 'Soft edge glow (fabric)' },
            { label: 'Iridescence', desc: 'Color shift by angle (oil/soap)' },
            { label: 'IOR', desc: 'Index of refraction (1.0–2.42)' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start gap-1.5">
              <Badge variant="outline" className="text-[8px] px-1 py-0 border-border/30 shrink-0">{label}</Badge>
              <span className="text-[9px] text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
