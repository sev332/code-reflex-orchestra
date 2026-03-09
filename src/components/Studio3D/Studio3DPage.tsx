// 3D Studio — Unreal-class scene editor built on React Three Fiber
// Phases 1-8: Full Unreal-class engine
import React, { useState, useCallback, useRef, useMemo, Suspense, useEffect } from 'react';
import { useAIAppIntegration } from '@/hooks/useAIAppIntegration';
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
  Square, Hexagon, Cone, Sparkles, SlidersHorizontal, Zap, Mountain, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RenderSettingsPanel, defaultPostProcessing, type PostProcessingSettings } from './RenderSettings';
import { MaterialLibraryPanel, materialPresets, type PBRMaterialPreset } from './MaterialLibrary';
import { AnimationTimeline } from './AnimationTimeline';
import {
  createClip, evaluateClipAtTime, applyAnimatedValues, getObjectPropertyValue,
  type AnimationClip, type AnimatableProperty,
} from '@/lib/3d-engine/animation-engine';
import { ParticleEditorPanel } from './ParticleEditor';
import type { ParticleEmitterConfig } from '@/lib/3d-engine/particle-system';
import { interpolateColorOverLife } from '@/lib/3d-engine/particle-system';
import { ProceduralToolsPanel } from './ProceduralTools';
import { generateTerrainGeometry, generateProceduralGeometry, type TerrainConfig, type ProceduralConfig } from '@/lib/3d-engine/terrain-generator';
import { PhysicsPanel } from './PhysicsPanel';
import { type PhysicsBodyConfig, type PhysicsWorldConfig, type PhysicsConstraint, defaultPhysicsWorld, SimplePhysicsEngine } from '@/lib/3d-engine/physics-config';
import { ViewportManagerPanel, type ViewportMode, type ViewportLayout, type CameraBookmark, type CinematicSettings, type ScreenshotConfig, defaultCinematic } from './ViewportManager';
import { SceneManagerPanel, type SceneLayer, type Prefab, type FogConfig, type SkyConfig, defaultFog, defaultSky } from './SceneManager';
import { BlueprintEditor } from './BlueprintEditor';
import { AuroraEffect } from './AuroraEffect';

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

// ─── GPU Particle Emitter (Instanced) ──────────────

function ParticleEmitterMesh({ config }: { config: ParticleEmitterConfig }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Array<{
    position: THREE.Vector3; velocity: THREE.Vector3;
    age: number; lifetime: number; startSize: number; endSize: number;
  }>>([]);
  const emitAccum = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArray = useMemo(() => new Float32Array(config.maxParticles * 3), [config.maxParticles]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const particles = particlesRef.current;
    const dt = Math.min(delta, 0.05);

    // Emit new particles
    if (config.emissionRate > 0) {
      emitAccum.current += config.emissionRate * dt;
      while (emitAccum.current >= 1 && particles.length < config.maxParticles) {
        emitAccum.current -= 1;
        const lt = config.lifetime[0] + Math.random() * (config.lifetime[1] - config.lifetime[0]);
        const speed = config.speed[0] + Math.random() * (config.speed[1] - config.speed[0]);
        const dir = new THREE.Vector3(...config.direction).normalize();
        if (config.spread > 0) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * config.spread;
          const up = new THREE.Vector3(0, 1, 0);
          const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
          dir.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)).applyQuaternion(quat);
        }
        const pos = new THREE.Vector3(...config.position);
        if (config.emitterShape === 'sphere') {
          const r = Math.cbrt(Math.random()) * config.shapeRadius;
          const t2 = Math.random() * Math.PI * 2;
          const p2 = Math.acos(2 * Math.random() - 1);
          pos.add(new THREE.Vector3(r * Math.sin(p2) * Math.cos(t2), r * Math.sin(p2) * Math.sin(t2), r * Math.cos(p2)));
        } else if (config.emitterShape === 'box') {
          pos.add(new THREE.Vector3(
            (Math.random() - 0.5) * config.shapeSize[0],
            (Math.random() - 0.5) * config.shapeSize[1],
            (Math.random() - 0.5) * config.shapeSize[2],
          ));
        }
        particles.push({
          position: pos,
          velocity: dir.multiplyScalar(speed),
          age: 0, lifetime: lt,
          startSize: config.startSize[0] + Math.random() * (config.startSize[1] - config.startSize[0]),
          endSize: config.endSize[0] + Math.random() * (config.endSize[1] - config.endSize[0]),
        });
      }
    }

    // Update particles
    const gravity = new THREE.Vector3(...config.gravity);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.lifetime) { particles.splice(i, 1); continue; }
      p.velocity.addScaledVector(gravity, dt);
      p.velocity.multiplyScalar(1 - config.drag * dt);
      if (config.turbulence > 0) {
        p.velocity.add(new THREE.Vector3(
          (Math.random() - 0.5) * config.turbulence * dt,
          (Math.random() - 0.5) * config.turbulence * dt,
          (Math.random() - 0.5) * config.turbulence * dt,
        ));
      }
      p.position.addScaledVector(p.velocity, dt);
    }

    // Update instances
    const mesh = meshRef.current;
    for (let i = 0; i < config.maxParticles; i++) {
      if (i < particles.length) {
        const p = particles[i];
        const t = p.age / p.lifetime;
        const size = p.startSize + (p.endSize - p.startSize) * t;
        dummy.position.copy(p.position);
        dummy.scale.setScalar(size);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        const col = interpolateColorOverLife(config.colorOverLife, t);
        colorArray[i * 3] = col[0];
        colorArray[i * 3 + 1] = col[1];
        colorArray[i * 3 + 2] = col[2];
      } else {
        dummy.position.set(0, -1000, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    else {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, config.maxParticles]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        transparent
        opacity={config.opacity}
        depthWrite={false}
        blending={config.blendMode === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </instancedMesh>
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
  const [lightingMode, setLightingMode] = useState<'night' | 'day'>('night');
  const [rightPanel, setRightPanel] = useState<'inspector' | 'materials' | 'shaders' | 'render' | 'particles' | 'procedural' | 'physics' | 'viewport' | 'scene'>('inspector');
  const [particleEmitters, setParticleEmitters] = useState<ParticleEmitterConfig[]>([]);
  const [selectedEmitterId, setSelectedEmitterId] = useState<string | null>(null);
  const [shaderCategory, setShaderCategory] = useState('All');
  const [shaderSearch, setShaderSearch] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [undoStack, setUndoStack] = useState<SceneObject[][]>([]);
  const [postProcessing, setPostProcessing] = useState<PostProcessingSettings>(defaultPostProcessing);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [animClip, setAnimClip] = useState<AnimationClip>(() => createClip('Animation', 5));
  const [animTime, setAnimTime] = useState(0);
  const [animPlaying, setAnimPlaying] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [baseObjects, setBaseObjects] = useState<SceneObject[] | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  // Phase 3: Physics
  const [physicsBodies, setPhysicsBodies] = useState<PhysicsBodyConfig[]>([]);
  const [physicsWorld, setPhysicsWorld] = useState<PhysicsWorldConfig>(defaultPhysicsWorld);
  const [physicsConstraints, setPhysicsConstraints] = useState<PhysicsConstraint[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const physicsEngineRef = useRef<SimplePhysicsEngine | null>(null);
  const physicsBaseRef = useRef<SceneObject[] | null>(null);
  // Phase 6: Viewport & Camera
  const [viewportMode, setViewportMode] = useState<ViewportMode>('solid');
  const [viewportLayout, setViewportLayout] = useState<ViewportLayout>('single');
  const [cameraBookmarks, setCameraBookmarks] = useState<CameraBookmark[]>([]);
  const [cinematic, setCinematic] = useState<CinematicSettings>(defaultCinematic);
  // Phase 7: Scene Manager
  const [sceneLayers, setSceneLayers] = useState<SceneLayer[]>([]);
  const [prefabs, setPrefabs] = useState<Prefab[]>([]);
  const [fogConfig, setFogConfig] = useState<FogConfig>(defaultFog);
  const [skyConfig, setSkyConfig] = useState<SkyConfig>(defaultSky);

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

  // Terrain & Procedural handlers
  const handleAddTerrain = useCallback((config: TerrainConfig) => {
    pushUndo();
    const id = `terrain-${Date.now()}`;
    const newObj: SceneObject = {
      id, name: 'Terrain', type: 'plane',
      position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
      visible: true, locked: false, color: '#44aa44', metalness: 0, roughness: 0.9,
      opacity: 1, wireframe: false, castShadow: true, receiveShadow: true,
      ...defaultPBR,
    };
    setObjects(prev => [...prev, newObj]);
    setSelectedId(id);
  }, [pushUndo]);

  const handleAddProcedural = useCallback((config: ProceduralConfig) => {
    pushUndo();
    const id = `proc-${config.type}-${Date.now()}`;
    const newObj: SceneObject = {
      id, name: config.type.charAt(0).toUpperCase() + config.type.slice(1), type: 'cube',
      position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
      visible: true, locked: false, color: '#8888aa', metalness: 0.2, roughness: 0.6,
      opacity: 1, wireframe: false, castShadow: true, receiveShadow: true,
      ...defaultPBR,
    };
    setObjects(prev => [...prev, newObj]);
    setSelectedId(id);
  }, [pushUndo]);

  // Phase 3: Physics simulation
  const startPhysics = useCallback(() => {
    physicsBaseRef.current = objects.map(o => ({ ...o }));
    const engine = new SimplePhysicsEngine(physicsWorld);
    physicsBodies.forEach(body => {
      const obj = objects.find(o => o.id === body.objectId);
      if (obj) engine.addBody(body, obj.position, obj.rotation);
    });
    physicsEngineRef.current = engine;
    setIsSimulating(true);
  }, [objects, physicsBodies, physicsWorld]);

  const pausePhysics = useCallback(() => setIsSimulating(false), []);

  const resetPhysics = useCallback(() => {
    setIsSimulating(false);
    physicsEngineRef.current = null;
    if (physicsBaseRef.current) {
      setObjects(physicsBaseRef.current);
      physicsBaseRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isSimulating || !physicsEngineRef.current) return;
    let raf: number;
    const tick = () => {
      const results = physicsEngineRef.current!.step();
      setObjects(prev => prev.map(o => {
        const r = results.get(o.id);
        if (!r) return o;
        return { ...o, position: r.position, rotation: r.rotation };
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isSimulating]);

  // Phase 6: Screenshot handler
  const handleScreenshot = useCallback((config: ScreenshotConfig) => {
    // Canvas screenshot via toDataURL
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `render-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const handleRestoreBookmark = useCallback((bm: CameraBookmark) => {
    setCinematic(prev => ({ ...prev, fov: bm.fov }));
  }, []);

  // Phase 7: Save as prefab
  const handleSaveAsPrefab = useCallback(() => {
    if (!selectedId) return;
    const obj = objects.find(o => o.id === selectedId);
    if (!obj) return;
    const prefab: Prefab = {
      id: `prefab-${Date.now()}`,
      name: obj.name,
      category: 'Custom',
      objectData: [obj],
      thumbnail: obj.type === 'sphere' ? '🔵' : obj.type === 'cube' ? '🟦' : '📦',
      createdAt: Date.now(),
    };
    setPrefabs(prev => [...prev, prefab]);
  }, [selectedId, objects]);

  const handleInstantiatePrefab = useCallback((prefab: Prefab) => {
    pushUndo();
    const newObjs = prefab.objectData.map((data: any) => ({
      ...data,
      id: `${data.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      position: [data.position[0] + 2, data.position[1], data.position[2]] as [number, number, number],
    }));
    setObjects(prev => [...prev, ...newObjs]);
    if (newObjs.length > 0) setSelectedId(newObjs[0].id);
  }, [pushUndo]);

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

        {/* Day/Night Toggle */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLightingMode(m => m === 'night' ? 'day' : 'night')}
              className={cn('w-8 h-8', lightingMode === 'night' ? 'text-indigo-400' : 'text-amber-400')}
            >
              {lightingMode === 'night' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{lightingMode === 'night' ? 'Night Mode' : 'Day Mode'}</TooltipContent>
        </Tooltip>

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

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setShowTimeline(v => !v)}
              className={cn('w-8 h-8', showTimeline && 'text-primary')}>
              <Layers className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Timeline</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setShowBlueprint(v => !v)}
              className={cn('w-8 h-8', showBlueprint && 'text-primary')}>
              <Zap className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Blueprint</TooltipContent>
        </Tooltip>

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
            <PerspectiveCamera makeDefault position={[5, 4, 8]} fov={cinematic.fov} near={cinematic.near} far={cinematic.far} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.1} />

            {/* Ambient + Environment based on lighting mode */}
            <ambientLight intensity={lightingMode === 'night' ? postProcessing.ambientIntensity * 0.3 : postProcessing.ambientIntensity * 1.2} />
            {lightingMode === 'day' && (
              <directionalLight position={[10, 15, 8]} intensity={2.0} color="#fff5e0" castShadow
                shadow-mapSize-width={2048} shadow-mapSize-height={2048}
                shadow-camera-near={0.5} shadow-camera-far={50}
                shadow-camera-left={-15} shadow-camera-right={15}
                shadow-camera-top={15} shadow-camera-bottom={-15}
              />
            )}
            {lightingMode === 'day' && (
              <hemisphereLight args={['#87ceeb', '#3d6b35', 0.6]} />
            )}
            {lightingMode === 'night' && (
              <directionalLight position={[5, 10, 3]} intensity={0.15} color="#8090c0" />
            )}
            {lightingMode === 'night' && (
              <pointLight position={[0, 20, -30]} intensity={0.4} color="#4488ff" distance={80} />
            )}
            <Suspense fallback={null}>
              <Environment preset={environment as any} background={lightingMode === 'day' && environment !== 'studio'} />
            </Suspense>

            {/* Sky system */}
            {lightingMode === 'day' && (
              <Sky
                distance={450000}
                sunPosition={[
                  Math.cos((skyConfig.enabled ? skyConfig.elevation : 45) * Math.PI / 180) * Math.sin((skyConfig.enabled ? skyConfig.azimuth : 180) * Math.PI / 180) * 100,
                  Math.sin((skyConfig.enabled ? skyConfig.elevation : 45) * Math.PI / 180) * 100,
                  Math.cos((skyConfig.enabled ? skyConfig.elevation : 45) * Math.PI / 180) * Math.cos((skyConfig.enabled ? skyConfig.azimuth : 180) * Math.PI / 180) * 100,
                ]}
                turbidity={skyConfig.enabled ? skyConfig.turbidity : 8}
                rayleigh={skyConfig.enabled ? skyConfig.rayleigh : 2}
                mieCoefficient={skyConfig.enabled ? skyConfig.mieCoefficient : 0.005}
                mieDirectionalG={skyConfig.enabled ? skyConfig.mieDirectionalG : 0.8}
              />
            )}

            {/* Night mode: stars + aurora */}
            {lightingMode === 'night' && (
              <>
                <Stars radius={100} depth={50} count={3000} factor={3} saturation={0.2} fade speed={0.5} />
                <AuroraEffect intensity={1.0} />
                <color attach="background" args={['#050510']} />
              </>
            )}

            {/* Fog */}
            {fogConfig.enabled && fogConfig.type === 'linear' && (
              <fog attach="fog" args={[fogConfig.color, fogConfig.near, fogConfig.far]} />
            )}
            {fogConfig.enabled && fogConfig.type === 'exponential' && (
              <fogExp2 attach="fog" args={[fogConfig.color, fogConfig.density]} />
            )}
            {!fogConfig.enabled && lightingMode === 'night' && (
              <fog attach="fog" args={['#050510', 30, 80]} />
            )}
            {!fogConfig.enabled && lightingMode === 'day' && (
              <fog attach="fog" args={['#c8d8e8', 40, 120]} />
            )}

            {showGrid && (
              <Grid
                infiniteGrid cellSize={1} cellThickness={0.5}
                sectionSize={5} sectionThickness={1}
                cellColor={lightingMode === 'night' ? '#222244' : '#888888'}
                sectionColor={lightingMode === 'night' ? '#4444aa' : '#aaaacc'}
                fadeDistance={30}
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

            {/* Particle Emitters */}
            {particleEmitters.filter(e => e.enabled).map(emitter => (
              <ParticleEmitterMesh key={emitter.id} config={emitter} />
            ))}

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
              { id: 'particles' as const, icon: Wand2, label: 'Particles' },
              { id: 'procedural' as const, icon: Hexagon, label: 'Procedural' },
              { id: 'physics' as const, icon: Zap, label: 'Physics' },
              { id: 'viewport' as const, icon: Camera, label: 'Viewport' },
              { id: 'scene' as const, icon: Globe, label: 'Scene' },
            ] as const).map(({ id, icon: Icon, label }) => (
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

            {rightPanel === 'particles' && (
              <ParticleEditorPanel
                emitters={particleEmitters}
                onEmittersChange={setParticleEmitters}
                selectedEmitterId={selectedEmitterId}
                onSelectEmitter={setSelectedEmitterId}
              />
            )}

            {rightPanel === 'procedural' && (
              <ProceduralToolsPanel
                onAddTerrain={handleAddTerrain}
                onAddProcedural={handleAddProcedural}
              />
            )}

            {rightPanel === 'physics' && (
              <PhysicsPanel
                worldConfig={physicsWorld}
                onWorldChange={setPhysicsWorld}
                bodies={physicsBodies}
                onBodiesChange={setPhysicsBodies}
                constraints={physicsConstraints}
                onConstraintsChange={setPhysicsConstraints}
                selectedObjectId={selectedId}
                sceneObjects={sceneObjectRefs}
                onSimulate={startPhysics}
                onPause={pausePhysics}
                onReset={resetPhysics}
                isSimulating={isSimulating}
              />
            )}

            {rightPanel === 'viewport' && (
              <ViewportManagerPanel
                viewportMode={viewportMode}
                onViewportModeChange={setViewportMode}
                layout={viewportLayout}
                onLayoutChange={setViewportLayout}
                bookmarks={cameraBookmarks}
                onBookmarksChange={setCameraBookmarks}
                onRestoreBookmark={handleRestoreBookmark}
                cinematic={cinematic}
                onCinematicChange={setCinematic}
                onScreenshot={handleScreenshot}
              />
            )}

            {rightPanel === 'scene' && (
              <SceneManagerPanel
                layers={sceneLayers}
                onLayersChange={setSceneLayers}
                prefabs={prefabs}
                onPrefabsChange={setPrefabs}
                onInstantiatePrefab={handleInstantiatePrefab}
                fog={fogConfig}
                onFogChange={setFogConfig}
                sky={skyConfig}
                onSkyChange={setSkyConfig}
                selectedObjectId={selectedId}
                onSaveAsPrefab={handleSaveAsPrefab}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── Blueprint Editor ─── */}
      {showBlueprint && (
        <BlueprintEditor className="h-64 border-t border-border/30" />
      )}

      {/* ─── Animation Timeline ─── */}
      {showTimeline && !showBlueprint && (
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
