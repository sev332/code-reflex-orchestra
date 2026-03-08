// 3D Studio — Unreal-class scene editor built on React Three Fiber
// Phase 1+2: Post-Processing Pipeline + PBR + Animation Timeline
import React, { useState, useCallback, useRef, useMemo, Suspense, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls, TransformControls, Grid, GizmoHelper, GizmoViewport,
  Environment, ContactShadows, PerspectiveCamera, useHelper,
  Sky, Stars,
} from '@react-three/drei';
import {
  EffectComposer, Bloom, SSAO, DepthOfField, Vignette,
  ChromaticAberration, ToneMapping, BrightnessContrast,
  HueSaturation,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Box, Circle, Cylinder, Triangle, Diamond, Move, RotateCcw, Maximize2,
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, Plus, Minus, ChevronRight,
  ChevronDown, Layers, Sun, Moon, Palette, Wand2, Download, Upload,
  Settings, Play, Pause, SkipBack, Code2, Search, Grid3x3, Magnet,
  Maximize, Minimize, Lightbulb, Camera, Undo2, Redo2, MousePointer,
  Square, Hexagon, Cone, Sparkles, SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RenderSettingsPanel, defaultPostProcessing, type PostProcessingSettings } from './RenderSettings';
import { MaterialLibraryPanel, materialPresets, type PBRMaterialPreset } from './MaterialLibrary';
import { AnimationTimeline } from './AnimationTimeline';
import {
  createClip, evaluateClipAtTime, applyAnimatedValues, getObjectPropertyValue,
  type AnimationClip, type AnimatableProperty,
} from '@/lib/3d-engine/animation-engine';

// ─── Types ─────────────────────────────────────────

interface SceneObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'light-point' | 'light-directional' | 'light-spot' | 'group';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
  locked: boolean;
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  wireframe: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  children?: string[];
  parentId?: string;
  // Advanced PBR
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
  // Light-specific
  intensity?: number;
  lightColor?: string;
}

interface ShaderPreset {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, any>;
}

type TransformMode = 'translate' | 'rotate' | 'scale';

// ─── Shader Library ────────────────────────────────

const shaderPresets: ShaderPreset[] = [
  {
    id: 'hologram', name: 'Hologram', category: 'Sci-Fi', thumbnail: '🔮',
    vertexShader: `varying vec2 vUv; varying vec3 vNormal; void main() { vUv = uv; vNormal = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 vUv; varying vec3 vNormal; void main() { float scanline = sin(vUv.y * 100.0 + time * 3.0) * 0.1 + 0.9; float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), 2.0); vec3 color = mix(vec3(0.0, 0.8, 1.0), vec3(0.0, 0.4, 1.0), fresnel); gl_FragColor = vec4(color * scanline, 0.5 + fresnel * 0.3); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'lava', name: 'Lava Flow', category: 'Nature', thumbnail: '🌋',
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 vUv; void main() { vec2 uv = vUv * 4.0; float n = sin(uv.x * 3.0 + time) * cos(uv.y * 3.0 + time * 0.7) * 0.5 + 0.5; vec3 col = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.8, 0.0), n); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'wave', name: 'Wave Distort', category: 'Abstract', thumbnail: '🌊',
    vertexShader: `uniform float time; varying vec2 vUv; void main() { vUv = uv; vec3 pos = position; pos.z += sin(pos.x * 3.0 + time) * 0.3 * cos(pos.y * 3.0 + time * 0.7); gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0); }`,
    fragmentShader: `varying vec2 vUv; void main() { vec3 col = mix(vec3(0.1, 0.3, 0.8), vec3(0.0, 0.7, 0.9), vUv.y); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'disco', name: 'Disco Ball', category: 'Abstract', thumbnail: '🪩',
    vertexShader: `varying vec3 vNormal; varying vec3 vPosition; void main() { vNormal = normal; vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec3 vNormal; varying vec3 vPosition; void main() { float angle = atan(vPosition.x, vPosition.z); float h = vPosition.y; float pattern = step(0.5, fract(angle * 5.0 + time)) * step(0.5, fract(h * 8.0)); vec3 col = pattern > 0.5 ? vec3(1.0, 0.2, 0.8) : vec3(0.2, 0.8, 1.0); col *= 0.8 + 0.2 * sin(time * 3.0 + angle * 2.0); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'grid-shader', name: 'Tron Grid', category: 'Sci-Fi', thumbnail: '📐',
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 vUv; void main() { vec2 grid = abs(fract(vUv * 10.0) - 0.5); float line = min(grid.x, grid.y); float g = smoothstep(0.0, 0.05, line); vec3 col = mix(vec3(0.0, 1.0, 0.8), vec3(0.0, 0.05, 0.1), g); col += 0.1 * sin(time + vUv.y * 20.0); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'marble', name: 'Marble', category: 'Nature', thumbnail: '🪨',
    vertexShader: `varying vec2 vUv; varying vec3 vPosition; void main() { vUv = uv; vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 vPosition; void main() { float n = sin(vPosition.x * 5.0 + sin(vPosition.y * 3.0 + vPosition.z * 4.0) * 2.0) * 0.5 + 0.5; vec3 col = mix(vec3(0.95, 0.93, 0.9), vec3(0.3, 0.3, 0.35), n * n); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: {},
  },
];

const shaderCategories = ['All', 'Sci-Fi', 'Nature', 'Abstract'];

// ─── Default PBR properties ───────────────────────

const defaultPBR = {
  emissive: '#000000',
  emissiveIntensity: 0,
  clearcoat: 0,
  clearcoatRoughness: 0,
  transmission: 0,
  ior: 1.5,
  thickness: 0,
  sheen: 0,
  sheenRoughness: 0,
  sheenColor: '#000000',
  iridescence: 0,
  iridescenceIOR: 1.3,
  envMapIntensity: 1.0,
};

// ─── Default Scene ─────────────────────────────────

const createDefaultScene = (): SceneObject[] => [
  {
    id: 'cube-1', name: 'Cube', type: 'cube',
    position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
    visible: true, locked: false, color: '#4488ff', metalness: 0.3, roughness: 0.4,
    opacity: 1, wireframe: false, castShadow: true, receiveShadow: true, ...defaultPBR,
  },
  {
    id: 'sphere-1', name: 'Sphere', type: 'sphere',
    position: [2.5, 0.8, 0], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8],
    visible: true, locked: false, color: '#ff4488', metalness: 0.6, roughness: 0.2,
    opacity: 1, wireframe: false, castShadow: true, receiveShadow: true, ...defaultPBR,
  },
  {
    id: 'cylinder-1', name: 'Cylinder', type: 'cylinder',
    position: [-2.5, 0.75, 0], rotation: [0, 0, 0], scale: [0.6, 1.5, 0.6],
    visible: true, locked: false, color: '#44ff88', metalness: 0.1, roughness: 0.7,
    opacity: 1, wireframe: false, castShadow: true, receiveShadow: true, ...defaultPBR,
  },
  {
    id: 'plane-1', name: 'Ground Plane', type: 'plane',
    position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], scale: [20, 20, 1],
    visible: true, locked: true, color: '#222233', metalness: 0.0, roughness: 0.8,
    opacity: 1, wireframe: false, castShadow: false, receiveShadow: true, ...defaultPBR,
  },
  {
    id: 'light-1', name: 'Key Light', type: 'light-directional',
    position: [5, 8, 5], rotation: [0, 0, 0], scale: [1, 1, 1],
    visible: true, locked: false, color: '#ffffff', metalness: 0, roughness: 0,
    opacity: 1, wireframe: false, castShadow: true, receiveShadow: false,
    intensity: 1.5, lightColor: '#ffffff', ...defaultPBR,
  },
];

// ─── Tone Mapping Map ──────────────────────────────

const toneMappingModes: Record<string, ToneMappingMode> = {
  aces: ToneMappingMode.ACES_FILMIC,
  reinhard: ToneMappingMode.REINHARD2,
  cineon: ToneMappingMode.OPTIMIZED_CINEON,
  agx: ToneMappingMode.AGX,
  linear: ToneMappingMode.LINEAR,
};

// ─── Post-Processing Stack Component ───────────────

function PostProcessingStack({ settings }: { settings: PostProcessingSettings }) {
  const chromaticOffset = useMemo(
    () => new THREE.Vector2(settings.chromaticOffset, settings.chromaticOffset),
    [settings.chromaticOffset]
  );

  return (
    <EffectComposer multisampling={4}>
      {settings.ssaoEnabled && (
        <SSAO
          intensity={settings.ssaoIntensity}
          radius={settings.ssaoRadius}
          bias={settings.ssaoBias}
          luminanceInfluence={0.5}
          samples={21}
          rings={4}
          worldDistanceThreshold={1}
          worldDistanceFalloff={0.1}
          worldProximityThreshold={0.5}
          worldProximityFalloff={0.1}
        />
      )}
      {settings.bloomEnabled && (
        <Bloom
          intensity={settings.bloomIntensity}
          luminanceThreshold={settings.bloomThreshold}
          luminanceSmoothing={settings.bloomRadius}
          mipmapBlur
        />
      )}
      {settings.dofEnabled && (
        <DepthOfField
          focusDistance={settings.dofFocusDistance / 30}
          focalLength={settings.dofFocalLength}
          bokehScale={settings.dofBokehScale}
        />
      )}
      {settings.chromaticEnabled && (
        <ChromaticAberration
          offset={chromaticOffset}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      )}
      <BrightnessContrast
        brightness={settings.brightness - 1}
        contrast={settings.contrast - 1}
      />
      <HueSaturation saturation={settings.saturation - 1} />
      {settings.vignetteEnabled && (
        <Vignette
          offset={settings.vignetteOffset}
          darkness={settings.vignetteIntensity}
        />
      )}
      <ToneMapping mode={toneMappingModes[settings.toneMapping] ?? ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

// ─── Scene Object Component (Advanced PBR) ─────────

function SceneObjectMesh({ obj, isSelected, onClick }: { obj: SceneObject; isSelected: boolean; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    switch (obj.type) {
      case 'cube': return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere': return <sphereGeometry args={[1, 64, 64]} />;
      case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'cone': return <coneGeometry args={[0.5, 1, 32]} />;
      case 'torus': return <torusGeometry args={[0.7, 0.3, 32, 64]} />;
      case 'plane': return <planeGeometry args={[1, 1]} />;
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  }, [obj.type]);

  if (!obj.visible) return null;

  if (obj.type.startsWith('light-')) {
    if (obj.type === 'light-directional') {
      return (
        <directionalLight
          position={obj.position}
          intensity={obj.intensity || 1}
          color={obj.lightColor || '#ffffff'}
          castShadow={obj.castShadow}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      );
    }
    if (obj.type === 'light-point') {
      return (
        <pointLight
          position={obj.position}
          intensity={obj.intensity || 1}
          color={obj.lightColor || '#ffffff'}
          castShadow={obj.castShadow}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      );
    }
    if (obj.type === 'light-spot') {
      return (
        <spotLight
          position={obj.position}
          intensity={obj.intensity || 1}
          color={obj.lightColor || '#ffffff'}
          castShadow={obj.castShadow}
          angle={0.5}
          penumbra={0.5}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      );
    }
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      castShadow={obj.castShadow}
      receiveShadow={obj.receiveShadow}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {geometry}
      <meshPhysicalMaterial
        color={obj.color}
        metalness={obj.metalness}
        roughness={obj.roughness}
        transparent={obj.opacity < 1 || obj.transmission > 0}
        opacity={obj.opacity}
        wireframe={obj.wireframe}
        emissive={obj.emissive}
        emissiveIntensity={obj.emissiveIntensity}
        clearcoat={obj.clearcoat}
        clearcoatRoughness={obj.clearcoatRoughness}
        transmission={obj.transmission}
        ior={obj.ior}
        thickness={obj.thickness}
        sheen={obj.sheen}
        sheenRoughness={obj.sheenRoughness}
        sheenColor={obj.sheenColor}
        iridescence={obj.iridescence}
        iridescenceIOR={obj.iridescenceIOR}
        envMapIntensity={obj.envMapIntensity}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[meshRef.current?.geometry]} />
          <lineBasicMaterial color="#00ffff" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

// ─── Advanced Material Inspector ───────────────────

function MaterialInspector({ obj, onUpdate }: { obj: SceneObject; onUpdate: (updates: Partial<SceneObject>) => void }) {
  if (obj.type.startsWith('light-')) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Light Properties</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Color</span>
            <input
              type="color" value={obj.lightColor || '#ffffff'}
              onChange={e => onUpdate({ lightColor: e.target.value })}
              className="w-8 h-6 rounded border border-border/30 cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">Intensity</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{(obj.intensity ?? 1).toFixed(1)}</span>
            </div>
            <Slider value={[obj.intensity ?? 1]} onValueChange={([v]) => onUpdate({ intensity: v })} min={0} max={10} step={0.1} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Cast Shadow</span>
            <Switch checked={obj.castShadow} onCheckedChange={v => onUpdate({ castShadow: v })} className="scale-75" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100%-2rem)]">
      <div className="space-y-3 pr-1">
        <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">PBR Material</div>

        {/* Base Properties */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Color</span>
            <input type="color" value={obj.color} onChange={e => onUpdate({ color: e.target.value })} className="w-8 h-6 rounded border border-border/30 cursor-pointer" />
          </div>
          {[
            { label: 'Metalness', key: 'metalness' as const, max: 1 },
            { label: 'Roughness', key: 'roughness' as const, max: 1 },
            { label: 'Opacity', key: 'opacity' as const, max: 1 },
          ].map(({ label, key, max }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{(obj[key] as number).toFixed(2)}</span>
              </div>
              <Slider value={[obj[key] as number]} onValueChange={([v]) => onUpdate({ [key]: v })} min={0} max={max} step={0.01} />
            </div>
          ))}
        </div>

        <Separator className="bg-border/20" />

        {/* Emissive */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">EMISSIVE</Label>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Emissive Color</span>
            <input type="color" value={obj.emissive} onChange={e => onUpdate({ emissive: e.target.value })} className="w-8 h-6 rounded border border-border/30 cursor-pointer" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">Intensity</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{obj.emissiveIntensity.toFixed(1)}</span>
            </div>
            <Slider value={[obj.emissiveIntensity]} onValueChange={([v]) => onUpdate({ emissiveIntensity: v })} min={0} max={5} step={0.1} />
          </div>
        </div>

        <Separator className="bg-border/20" />

        {/* Clearcoat */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">CLEARCOAT</Label>
          {[
            { label: 'Clearcoat', key: 'clearcoat' as const },
            { label: 'Clearcoat Roughness', key: 'clearcoatRoughness' as const },
          ].map(({ label, key }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{(obj[key] as number).toFixed(2)}</span>
              </div>
              <Slider value={[obj[key] as number]} onValueChange={([v]) => onUpdate({ [key]: v })} min={0} max={1} step={0.01} />
            </div>
          ))}
        </div>

        <Separator className="bg-border/20" />

        {/* Transmission (Glass) */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">TRANSMISSION (GLASS)</Label>
          {[
            { label: 'Transmission', key: 'transmission' as const, max: 1 },
            { label: 'IOR', key: 'ior' as const, min: 1.0, max: 2.5, step: 0.01 },
            { label: 'Thickness', key: 'thickness' as const, max: 5, step: 0.1 },
          ].map(({ label, key, min, max, step }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{(obj[key] as number).toFixed(2)}</span>
              </div>
              <Slider value={[obj[key] as number]} onValueChange={([v]) => onUpdate({ [key]: v })} min={min ?? 0} max={max ?? 1} step={step ?? 0.01} />
            </div>
          ))}
        </div>

        <Separator className="bg-border/20" />

        {/* Sheen (Fabric) */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">SHEEN (FABRIC)</Label>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Sheen Color</span>
            <input type="color" value={obj.sheenColor} onChange={e => onUpdate({ sheenColor: e.target.value })} className="w-8 h-6 rounded border border-border/30 cursor-pointer" />
          </div>
          {[
            { label: 'Sheen', key: 'sheen' as const },
            { label: 'Sheen Roughness', key: 'sheenRoughness' as const },
          ].map(({ label, key }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{(obj[key] as number).toFixed(2)}</span>
              </div>
              <Slider value={[obj[key] as number]} onValueChange={([v]) => onUpdate({ [key]: v })} min={0} max={1} step={0.01} />
            </div>
          ))}
        </div>

        <Separator className="bg-border/20" />

        {/* Iridescence */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">IRIDESCENCE</Label>
          {[
            { label: 'Iridescence', key: 'iridescence' as const, max: 1 },
            { label: 'Iridescence IOR', key: 'iridescenceIOR' as const, min: 1.0, max: 2.5, step: 0.01 },
          ].map(({ label, key, min, max, step }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{(obj[key] as number).toFixed(2)}</span>
              </div>
              <Slider value={[obj[key] as number]} onValueChange={([v]) => onUpdate({ [key]: v })} min={min ?? 0} max={max ?? 1} step={step ?? 0.01} />
            </div>
          ))}
        </div>

        <Separator className="bg-border/20" />

        {/* Environment */}
        <div className="space-y-2">
          <Label className="text-[10px] font-medium text-foreground/60">ENVIRONMENT</Label>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">Env Map Intensity</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{obj.envMapIntensity.toFixed(1)}</span>
            </div>
            <Slider value={[obj.envMapIntensity]} onValueChange={([v]) => onUpdate({ envMapIntensity: v })} min={0} max={3} step={0.1} />
          </div>
        </div>

        <Separator className="bg-border/20" />

        {/* Toggles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Wireframe</span>
            <Switch checked={obj.wireframe} onCheckedChange={v => onUpdate({ wireframe: v })} className="scale-75" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Cast Shadow</span>
            <Switch checked={obj.castShadow} onCheckedChange={v => onUpdate({ castShadow: v })} className="scale-75" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Receive Shadow</span>
            <Switch checked={obj.receiveShadow} onCheckedChange={v => onUpdate({ receiveShadow: v })} className="scale-75" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Main 3D Studio Component ──────────────────────

export function Studio3DPage() {
  const [objects, setObjects] = useState<SceneObject[]>(createDefaultScene);
  const [selectedId, setSelectedId] = useState<string | null>('cube-1');
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [environment, setEnvironment] = useState<string>('studio');
  const [rightPanel, setRightPanel] = useState<'inspector' | 'materials' | 'shaders' | 'render'>('inspector');
  const [shaderCategory, setShaderCategory] = useState('All');
  const [shaderSearch, setShaderSearch] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [undoStack, setUndoStack] = useState<SceneObject[][]>([]);
  const [postProcessing, setPostProcessing] = useState<PostProcessingSettings>(defaultPostProcessing);
  const [showTimeline, setShowTimeline] = useState(true);
  const [animClip, setAnimClip] = useState<AnimationClip>(() => createClip('Animation', 5));
  const [animTime, setAnimTime] = useState(0);
  const [animPlaying, setAnimPlaying] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [baseObjects, setBaseObjects] = useState<SceneObject[] | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const selectedObj = objects.find(o => o.id === selectedId) || null;

  // Animation playback loop
  useEffect(() => {
    if (!animPlaying) {
      lastFrameTimeRef.current = 0;
      return;
    }
    // Store base state when starting playback
    if (!baseObjects) {
      setBaseObjects(objects.map(o => ({ ...o })));
    }
    const tick = (timestamp: number) => {
      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = timestamp;
      const delta = (timestamp - lastFrameTimeRef.current) / 1000 * animClip.speed;
      lastFrameTimeRef.current = timestamp;
      setAnimTime(prev => {
        let next = prev + delta;
        if (next >= animClip.duration) {
          if (animClip.loop) {
            next = next % animClip.duration;
          } else {
            setAnimPlaying(false);
            return animClip.duration;
          }
        }
        return next;
      });
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animPlaying, animClip.duration, animClip.loop, animClip.speed]);

  // Apply animation values to objects
  useEffect(() => {
    if (animClip.tracks.length === 0) return;
    const animated = evaluateClipAtTime(animClip, animTime);
    if (animated.size === 0) return;
    const base = baseObjects || objects;
    setObjects(prev => prev.map(o => {
      const values = animated.get(o.id);
      if (!values) return o;
      return applyAnimatedValues(baseObjects ? base.find(b => b.id === o.id) || o : o, values);
    }));
  }, [animTime, animClip]);

  const handleAnimPlayToggle = useCallback(() => {
    if (!animPlaying) {
      setBaseObjects(objects.map(o => ({ ...o })));
    } else {
      // Restore base state when stopping
      if (baseObjects) {
        setObjects(baseObjects);
        setBaseObjects(null);
      }
    }
    setAnimPlaying(v => !v);
  }, [animPlaying, objects, baseObjects]);

  const sceneObjectRefs = useMemo(() =>
    objects.filter(o => !o.type.startsWith('light-') || o.type === 'light-directional' || o.type === 'light-point' || o.type === 'light-spot')
      .map(o => ({ id: o.id, name: o.name, type: o.type })),
    [objects]
  );

  const getObjPropValue = useCallback((objectId: string, property: AnimatableProperty) => {
    const obj = objects.find(o => o.id === objectId);
    if (!obj) return 0;
    return getObjectPropertyValue(obj, property);
  }, [objects]);

  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-20), objects.map(o => ({ ...o }))]);
  }, [objects]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setObjects(prev);
  }, [undoStack]);

  const updateObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    pushUndo();
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, [pushUndo]);

  const addObject = useCallback((type: SceneObject['type']) => {
    pushUndo();
    const id = `${type}-${Date.now()}`;
    const names: Record<string, string> = {
      cube: 'Cube', sphere: 'Sphere', cylinder: 'Cylinder', cone: 'Cone',
      torus: 'Torus', plane: 'Plane', 'light-point': 'Point Light',
      'light-directional': 'Dir Light', 'light-spot': 'Spot Light', group: 'Group',
    };
    const newObj: SceneObject = {
      id, name: names[type] || type, type,
      position: [0, type.startsWith('light') ? 3 : 0.5, 0],
      rotation: type === 'plane' ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
      scale: [1, 1, 1],
      visible: true, locked: false, color: '#8888ff',
      metalness: 0.3, roughness: 0.5, opacity: 1, wireframe: false,
      castShadow: !type.startsWith('light'), receiveShadow: !type.startsWith('light'),
      ...(type.startsWith('light') ? { intensity: 1, lightColor: '#ffffff' } : {}),
      ...defaultPBR,
    };
    setObjects(prev => [...prev, newObj]);
    setSelectedId(id);
  }, [pushUndo]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const obj = objects.find(o => o.id === selectedId);
    if (obj?.locked) return;
    pushUndo();
    setObjects(prev => prev.filter(o => o.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, objects, pushUndo]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const obj = objects.find(o => o.id === selectedId);
    if (!obj) return;
    pushUndo();
    const newObj: SceneObject = {
      ...obj,
      id: `${obj.type}-${Date.now()}`,
      name: `${obj.name} Copy`,
      position: [obj.position[0] + 1, obj.position[1], obj.position[2]],
    };
    setObjects(prev => [...prev, newObj]);
    setSelectedId(newObj.id);
  }, [selectedId, objects, pushUndo]);

  const applyMaterialPreset = useCallback((preset: PBRMaterialPreset) => {
    if (!selectedId) return;
    pushUndo();
    setObjects(prev => prev.map(o => o.id === selectedId ? {
      ...o,
      color: preset.color,
      metalness: preset.metalness,
      roughness: preset.roughness,
      opacity: preset.opacity,
      emissive: preset.emissive,
      emissiveIntensity: preset.emissiveIntensity,
      clearcoat: preset.clearcoat,
      clearcoatRoughness: preset.clearcoatRoughness,
      transmission: preset.transmission,
      ior: preset.ior,
      thickness: preset.thickness,
      sheen: preset.sheen,
      sheenRoughness: preset.sheenRoughness,
      sheenColor: preset.sheenColor,
      iridescence: preset.iridescence,
      iridescenceIOR: preset.iridescenceIOR,
      envMapIntensity: preset.envMapIntensity,
    } : o));
  }, [selectedId, pushUndo]);

  const filteredShaders = useMemo(() => {
    return shaderPresets.filter(s => {
      if (shaderCategory !== 'All' && s.category !== shaderCategory) return false;
      if (shaderSearch && !s.name.toLowerCase().includes(shaderSearch.toLowerCase())) return false;
      return true;
    });
  }, [shaderCategory, shaderSearch]);

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* ─── Top Toolbar ─── */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-2 gap-1 shrink-0">
        {/* Transform tools */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          {([
            { mode: 'translate' as const, icon: Move, label: 'Move (W)' },
            { mode: 'rotate' as const, icon: RotateCcw, label: 'Rotate (E)' },
            { mode: 'scale' as const, icon: Maximize2, label: 'Scale (R)' },
          ]).map(({ mode, icon: Icon, label }) => (
            <Tooltip key={mode} delayDuration={200}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setTransformMode(mode)}
                  className={cn('w-8 h-8', transformMode === mode && 'bg-primary/20 text-primary')}>
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}
                className={cn('w-8 h-8', !selectedId && 'bg-primary/20 text-primary')}>
                <MousePointer className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Select (Q)</TooltipContent>
          </Tooltip>
        </div>

        {/* Add primitives */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          {([
            { type: 'cube' as const, icon: Box, label: 'Cube' },
            { type: 'sphere' as const, icon: Circle, label: 'Sphere' },
            { type: 'cylinder' as const, icon: Cylinder, label: 'Cylinder' },
            { type: 'cone' as const, icon: Cone, label: 'Cone' },
            { type: 'torus' as const, icon: Diamond, label: 'Torus' },
            { type: 'plane' as const, icon: Square, label: 'Plane' },
          ]).map(({ type, icon: Icon, label }) => (
            <Tooltip key={type} delayDuration={200}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => addObject(type)} className="w-8 h-8">
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Lights */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => addObject('light-point')} className="w-8 h-8">
                <Lightbulb className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Point Light</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => addObject('light-directional')} className="w-8 h-8">
                <Sun className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Dir Light</TooltipContent>
          </Tooltip>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setShowGrid(v => !v)}
                className={cn('w-8 h-8', showGrid && 'text-primary')}>
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Grid</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setSnapEnabled(v => !v)}
                className={cn('w-8 h-8', snapEnabled && 'text-primary')}>
                <Magnet className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Snap</TooltipContent>
          </Tooltip>
        </div>

        {/* Undo */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          <Button variant="ghost" size="icon" onClick={undo} className="w-8 h-8" disabled={undoStack.length === 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Object actions */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={duplicateSelected} className="w-8 h-8" disabled={!selectedId}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={deleteSelected} className="w-8 h-8 hover:text-destructive" disabled={!selectedId}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1" />

        {/* Environment */}
        <Select value={environment} onValueChange={setEnvironment}>
          <SelectTrigger className="w-28 h-7 text-xs bg-muted/30 border-border/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="sunset">Sunset</SelectItem>
            <SelectItem value="dawn">Dawn</SelectItem>
            <SelectItem value="night">Night</SelectItem>
            <SelectItem value="forest">Forest</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" onClick={() => setIsPlaying(v => !v)} className="w-8 h-8">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewport */}
        <div className="flex-1 relative">
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
            onPointerMissed={() => setSelectedId(null)}
          >
            <PerspectiveCamera makeDefault position={[5, 4, 8]} fov={50} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.1} />

            {/* Ambient */}
            <ambientLight intensity={postProcessing.ambientIntensity} />
            <Suspense fallback={null}>
              <Environment preset={environment as any} background={environment !== 'studio'} />
            </Suspense>

            {environment === 'studio' && (
              <>
                <Stars radius={100} depth={50} count={2000} factor={2} saturation={0} fade speed={1} />
                <fog attach="fog" args={['#0a0a1a', 20, 60]} />
              </>
            )}

            {showGrid && (
              <Grid
                infiniteGrid cellSize={1} cellThickness={0.5}
                sectionSize={5} sectionThickness={1}
                cellColor="#444466" sectionColor="#6666aa" fadeDistance={30}
              />
            )}

            <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={20} blur={2} />

            {objects.map(obj => (
              <SceneObjectMesh
                key={obj.id} obj={obj}
                isSelected={selectedId === obj.id}
                onClick={() => !obj.locked && setSelectedId(obj.id)}
              />
            ))}

            {selectedObj && !selectedObj.locked && !selectedObj.type.startsWith('light-') && (
              <TransformControls
                mode={transformMode}
                position={selectedObj.position}
                rotation={selectedObj.rotation}
                scale={selectedObj.scale}
                translationSnap={snapEnabled ? 0.5 : undefined}
                rotationSnap={snapEnabled ? Math.PI / 12 : undefined}
                scaleSnap={snapEnabled ? 0.25 : undefined}
              />
            )}

            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport labelColor="white" axisHeadScale={1} />
            </GizmoHelper>

            {/* Post-Processing Pipeline */}
            <PostProcessingStack settings={postProcessing} />
          </Canvas>

          {/* Viewport overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge variant="outline" className="bg-background/60 backdrop-blur text-[10px] border-border/30">
              Objects: {objects.length}
            </Badge>
            {selectedObj && (
              <Badge variant="outline" className="bg-primary/10 text-primary text-[10px] border-primary/30">
                {selectedObj.name}
              </Badge>
            )}
            <Badge variant="outline" className="bg-background/60 backdrop-blur text-[10px] border-border/30">
              <Sparkles className="w-3 h-3 mr-1" />
              {[
                postProcessing.bloomEnabled && 'Bloom',
                postProcessing.ssaoEnabled && 'SSAO',
                postProcessing.dofEnabled && 'DOF',
                postProcessing.vignetteEnabled && 'Vign',
                postProcessing.chromaticEnabled && 'CA',
              ].filter(Boolean).join(' · ') || 'No FX'}
            </Badge>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <Badge variant="outline" className="bg-background/60 backdrop-blur text-[10px] border-border/30 cursor-pointer hover:bg-background/80">
              Perspective
            </Badge>
          </div>
        </div>

        {/* ─── Right Panel ─── */}
        <div className="w-64 bg-background/80 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
          {/* Panel tabs */}
          <div className="flex items-center gap-0.5 p-1 border-b border-border/20">
            {([
              { id: 'inspector' as const, icon: SlidersHorizontal, label: 'Inspector' },
              { id: 'materials' as const, icon: Palette, label: 'Materials' },
              { id: 'shaders' as const, icon: Code2, label: 'Shaders' },
              { id: 'render' as const, icon: Sparkles, label: 'Render' },
            ]).map(({ id, icon: Icon, label }) => (
              <Tooltip key={id} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    onClick={() => setRightPanel(id)}
                    className={cn('w-8 h-8', rightPanel === id && 'bg-primary/20 text-primary')}>
                    <Icon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'inspector' && (
              <div className="p-3 h-full">
                {selectedObj ? (
                  <div className="space-y-3 h-full">
                    {/* Object name & transform */}
                    <div className="space-y-2">
                      <Input value={selectedObj.name} onChange={e => updateObject(selectedObj.id, { name: e.target.value })}
                        className="h-7 text-xs bg-muted/30 border-border/30 font-medium" />
                      <div className="grid grid-cols-3 gap-1">
                        {['X', 'Y', 'Z'].map((axis, i) => (
                          <div key={axis} className="space-y-0.5">
                            <span className="text-[9px] text-muted-foreground">{axis}</span>
                            <Input value={selectedObj.position[i].toFixed(2)}
                              onChange={e => {
                                const newPos: [number, number, number] = [...selectedObj.position];
                                newPos[i] = parseFloat(e.target.value) || 0;
                                updateObject(selectedObj.id, { position: newPos });
                              }}
                              className="h-6 text-[10px] bg-muted/20 border-border/20 px-1 tabular-nums" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-border/20" />

                    <MaterialInspector obj={selectedObj} onUpdate={updates => updateObject(selectedObj.id, updates)} />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center pt-8">Select an object to inspect</div>
                )}
              </div>
            )}

            {rightPanel === 'materials' && (
              <MaterialLibraryPanel onApplyMaterial={applyMaterialPreset} selectedObjectId={selectedId} />
            )}

            {rightPanel === 'shaders' && (
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  <div className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Shader Library</div>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input value={shaderSearch} onChange={e => setShaderSearch(e.target.value)}
                      placeholder="Search shaders..." className="h-7 text-xs pl-7 bg-muted/30 border-border/30" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {shaderCategories.map(cat => (
                      <Badge key={cat} variant={shaderCategory === cat ? 'default' : 'outline'}
                        className={cn('text-[9px] px-1.5 py-0 cursor-pointer', shaderCategory === cat ? 'bg-primary text-primary-foreground' : 'border-border/40')}
                        onClick={() => setShaderCategory(cat)}>
                        {cat}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {filteredShaders.map(shader => (
                      <div key={shader.id}
                        className="rounded-md border border-border/30 p-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
                        <div className="text-2xl text-center mb-1">{shader.thumbnail}</div>
                        <div className="text-[10px] font-medium text-foreground text-center">{shader.name}</div>
                        <div className="text-[8px] text-muted-foreground text-center">{shader.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}

            {rightPanel === 'render' && (
              <RenderSettingsPanel settings={postProcessing} onChange={setPostProcessing} />
            )}
          </div>
        </div>
      </div>

      {/* ─── Animation Timeline ─── */}
      {showTimeline && (
        <AnimationTimeline
          clip={animClip}
          onClipChange={setAnimClip}
          currentTime={animTime}
          onTimeChange={setAnimTime}
          isPlaying={animPlaying}
          onPlayToggle={handleAnimPlayToggle}
          sceneObjects={sceneObjectRefs}
          getObjectProperty={getObjPropValue}
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
        />
      )}
    </div>
  );
}
