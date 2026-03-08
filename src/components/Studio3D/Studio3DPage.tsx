// 3D Studio — hybrid CAD + scene editor built on React Three Fiber
import React, { useState, useCallback, useRef, useMemo, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls, TransformControls, Grid, GizmoHelper, GizmoViewport,
  Environment, ContactShadows, PerspectiveCamera, Html, useHelper,
  MeshReflectorMaterial, Sky, Stars,
} from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Box, Circle, Cylinder, Triangle, Diamond, Move, RotateCcw, Maximize2,
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, Plus, Minus, ChevronRight,
  ChevronDown, Layers, Sun, Moon, Palette, Wand2, Download, Upload,
  Settings, Play, Pause, SkipBack, Code2, Search, Grid3x3, Magnet,
  Maximize, Minimize, Lightbulb, Camera, Undo2, Redo2, MousePointer,
  Square, Hexagon, Cone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
type ViewMode = 'perspective' | 'top' | 'front' | 'right';

// ─── Shader Library ────────────────────────────────

const shaderPresets: ShaderPreset[] = [
  {
    id: 'hologram', name: 'Hologram', category: 'Sci-Fi',
    thumbnail: '🔮',
    vertexShader: `varying vec2 vUv; varying vec3 vNormal; void main() { vUv = uv; vNormal = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 vUv; varying vec3 vNormal; void main() { float scanline = sin(vUv.y * 100.0 + time * 3.0) * 0.1 + 0.9; float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0,0,1))), 2.0); vec3 color = mix(vec3(0.0, 0.8, 1.0), vec3(0.0, 0.4, 1.0), fresnel); gl_FragColor = vec4(color * scanline, 0.5 + fresnel * 0.3); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'lava', name: 'Lava Flow', category: 'Nature',
    thumbnail: '🌋',
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 vUv; void main() { vec2 uv = vUv * 4.0; float n = sin(uv.x * 3.0 + time) * cos(uv.y * 3.0 + time * 0.7) * 0.5 + 0.5; vec3 col = mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.8, 0.0), n); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'wave', name: 'Wave Distort', category: 'Abstract',
    thumbnail: '🌊',
    vertexShader: `uniform float time; varying vec2 vUv; void main() { vUv = uv; vec3 pos = position; pos.z += sin(pos.x * 3.0 + time) * 0.3 * cos(pos.y * 3.0 + time * 0.7); gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0); }`,
    fragmentShader: `varying vec2 vUv; void main() { vec3 col = mix(vec3(0.1, 0.3, 0.8), vec3(0.0, 0.7, 0.9), vUv.y); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'disco', name: 'Disco Ball', category: 'Abstract',
    thumbnail: '🪩',
    vertexShader: `varying vec3 vNormal; varying vec3 vPosition; void main() { vNormal = normal; vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec3 vNormal; varying vec3 vPosition; void main() { float angle = atan(vPosition.x, vPosition.z); float h = vPosition.y; float pattern = step(0.5, fract(angle * 5.0 + time)) * step(0.5, fract(h * 8.0)); vec3 col = pattern > 0.5 ? vec3(1.0, 0.2, 0.8) : vec3(0.2, 0.8, 1.0); col *= 0.8 + 0.2 * sin(time * 3.0 + angle * 2.0); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'grid-shader', name: 'Tron Grid', category: 'Sci-Fi',
    thumbnail: '📐',
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float time; varying vec2 vUv; void main() { vec2 grid = abs(fract(vUv * 10.0) - 0.5); float line = min(grid.x, grid.y); float g = smoothstep(0.0, 0.05, line); vec3 col = mix(vec3(0.0, 1.0, 0.8), vec3(0.0, 0.05, 0.1), g); col += 0.1 * sin(time + vUv.y * 20.0); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: { time: { value: 0 } },
  },
  {
    id: 'marble', name: 'Marble', category: 'Nature',
    thumbnail: '🪨',
    vertexShader: `varying vec2 vUv; varying vec3 vPosition; void main() { vUv = uv; vPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 vPosition; void main() { float n = sin(vPosition.x * 5.0 + sin(vPosition.y * 3.0 + vPosition.z * 4.0) * 2.0) * 0.5 + 0.5; vec3 col = mix(vec3(0.95, 0.93, 0.9), vec3(0.3, 0.3, 0.35), n * n); gl_FragColor = vec4(col, 1.0); }`,
    uniforms: {},
  },
];

const shaderCategories = ['All', 'Sci-Fi', 'Nature', 'Abstract'];

// ─── Default Scene ─────────────────────────────────

const createDefaultScene = (): SceneObject[] => [
  {
    id: 'cube-1', name: 'Cube', type: 'cube',
    position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
    visible: true, locked: false, color: '#4488ff', metalness: 0.3, roughness: 0.4,
    opacity: 1, wireframe: false, castShadow: true, receiveShadow: true,
  },
  {
    id: 'sphere-1', name: 'Sphere', type: 'sphere',
    position: [2.5, 0.8, 0], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8],
    visible: true, locked: false, color: '#ff4488', metalness: 0.6, roughness: 0.2,
    opacity: 1, wireframe: false, castShadow: true, receiveShadow: true,
  },
  {
    id: 'cylinder-1', name: 'Cylinder', type: 'cylinder',
    position: [-2.5, 0.75, 0], rotation: [0, 0, 0], scale: [0.6, 1.5, 0.6],
    visible: true, locked: false, color: '#44ff88', metalness: 0.1, roughness: 0.7,
    opacity: 1, wireframe: false, castShadow: true, receiveShadow: true,
  },
  {
    id: 'plane-1', name: 'Ground Plane', type: 'plane',
    position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], scale: [20, 20, 1],
    visible: true, locked: true, color: '#222233', metalness: 0.0, roughness: 0.8,
    opacity: 1, wireframe: false, castShadow: false, receiveShadow: true,
  },
  {
    id: 'light-1', name: 'Key Light', type: 'light-directional',
    position: [5, 8, 5], rotation: [0, 0, 0], scale: [1, 1, 1],
    visible: true, locked: false, color: '#ffffff', metalness: 0, roughness: 0,
    opacity: 1, wireframe: false, castShadow: true, receiveShadow: false,
    intensity: 1.5, lightColor: '#ffffff',
  },
];

// ─── Scene Object Component ────────────────────────

function SceneObjectMesh({ obj, isSelected, onClick }: { obj: SceneObject; isSelected: boolean; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    switch (obj.type) {
      case 'cube': return <boxGeometry args={[1, 1, 1]} />;
      case 'sphere': return <sphereGeometry args={[1, 32, 32]} />;
      case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'cone': return <coneGeometry args={[0.5, 1, 32]} />;
      case 'torus': return <torusGeometry args={[0.7, 0.3, 16, 48]} />;
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
      <meshStandardMaterial
        color={obj.color}
        metalness={obj.metalness}
        roughness={obj.roughness}
        transparent={obj.opacity < 1}
        opacity={obj.opacity}
        wireframe={obj.wireframe}
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

// ─── Main 3D Studio Component ──────────────────────

export function Studio3DPage() {
  const [objects, setObjects] = useState<SceneObject[]>(createDefaultScene);
  const [selectedId, setSelectedId] = useState<string | null>('cube-1');
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [showWireframes, setShowWireframes] = useState(false);
  const [environment, setEnvironment] = useState<string>('studio');
  const [rightPanel, setRightPanel] = useState<'inspector' | 'materials' | 'shaders'>('inspector');
  const [shaderCategory, setShaderCategory] = useState('All');
  const [shaderSearch, setShaderSearch] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [undoStack, setUndoStack] = useState<SceneObject[][]>([]);

  const selectedObj = objects.find(o => o.id === selectedId) || null;

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

  const filteredShaders = useMemo(() => {
    return shaderPresets.filter(s => {
      if (shaderCategory !== 'All' && s.category !== shaderCategory) return false;
      if (shaderSearch && !s.name.toLowerCase().includes(shaderSearch.toLowerCase())) return false;
      return true;
    });
  }, [shaderCategory, shaderSearch]);

  const meshObjects = objects.filter(o => !o.type.startsWith('light-'));
  const lightObjects = objects.filter(o => o.type.startsWith('light-'));

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
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setTransformMode(mode)}
                  className={cn('w-8 h-8', transformMode === mode && 'bg-primary/20 text-primary')}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                onClick={() => setSelectedId(null)}
                className={cn('w-8 h-8', !selectedId && 'bg-primary/20 text-primary')}
              >
                <MousePointer className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Select (Q)</TooltipContent>
          </Tooltip>
        </div>

        {/* Add primitives */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          {([
            { type: 'cube' as const, icon: Box, label: 'Add Cube' },
            { type: 'sphere' as const, icon: Circle, label: 'Add Sphere' },
            { type: 'cylinder' as const, icon: Cylinder, label: 'Add Cylinder' },
            { type: 'cone' as const, icon: Cone, label: 'Add Cone' },
            { type: 'torus' as const, icon: Diamond, label: 'Add Torus' },
            { type: 'plane' as const, icon: Square, label: 'Add Plane' },
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
            <TooltipContent side="bottom">Directional Light</TooltipContent>
          </Tooltip>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                onClick={() => setShowGrid(v => !v)}
                className={cn('w-8 h-8', showGrid && 'text-primary')}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Grid</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" size="icon"
                onClick={() => setSnapEnabled(v => !v)}
                className={cn('w-8 h-8', snapEnabled && 'text-primary')}
              >
                <Magnet className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Snap</TooltipContent>
          </Tooltip>
        </div>

        {/* Undo/Redo */}
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

        {/* Play/Preview */}
        <Button variant="ghost" size="icon" onClick={() => setIsPlaying(v => !v)} className="w-8 h-8">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        {/* Export */}
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scene Graph Panel */}
        <div className="w-56 bg-background/60 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scene Graph</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1">{objects.length}</Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1">
              {/* Meshes */}
              <div className="px-2 py-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Objects</span>
              </div>
              {meshObjects.map(obj => (
                <button
                  key={obj.id}
                  onClick={() => !obj.locked && setSelectedId(obj.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all',
                    selectedId === obj.id ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:bg-muted/50',
                    obj.locked && 'opacity-50'
                  )}
                >
                  {obj.type === 'cube' && <Box className="w-3.5 h-3.5 shrink-0" />}
                  {obj.type === 'sphere' && <Circle className="w-3.5 h-3.5 shrink-0" />}
                  {obj.type === 'cylinder' && <Cylinder className="w-3.5 h-3.5 shrink-0" />}
                  {obj.type === 'cone' && <Cone className="w-3.5 h-3.5 shrink-0" />}
                  {obj.type === 'torus' && <Diamond className="w-3.5 h-3.5 shrink-0" />}
                  {obj.type === 'plane' && <Square className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate flex-1 text-left">{obj.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { visible: !obj.visible }); }}
                    className="opacity-50 hover:opacity-100"
                  >
                    {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { locked: !obj.locked }); }}
                    className="opacity-50 hover:opacity-100"
                  >
                    {obj.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </button>
              ))}

              {/* Lights */}
              <div className="px-2 py-1 mt-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Lights</span>
              </div>
              {lightObjects.map(obj => (
                <button
                  key={obj.id}
                  onClick={() => setSelectedId(obj.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all',
                    selectedId === obj.id ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:bg-muted/50'
                  )}
                >
                  {obj.type === 'light-directional' && <Sun className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
                  {obj.type === 'light-point' && <Lightbulb className="w-3.5 h-3.5 shrink-0 text-yellow-400" />}
                  {obj.type === 'light-spot' && <Lightbulb className="w-3.5 h-3.5 shrink-0 text-orange-400" />}
                  <span className="truncate flex-1 text-left">{obj.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { visible: !obj.visible }); }}
                    className="opacity-50 hover:opacity-100"
                  >
                    {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 3D Viewport */}
        <div className="flex-1 relative">
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
            onPointerMissed={() => setSelectedId(null)}
          >
            <PerspectiveCamera makeDefault position={[5, 4, 8]} fov={50} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.1} />

            {/* Environment */}
            <ambientLight intensity={0.3} />
            <Suspense fallback={null}>
              <Environment preset={environment as any} background={environment !== 'studio'} />
            </Suspense>

            {environment === 'studio' && (
              <>
                <Stars radius={100} depth={50} count={2000} factor={2} saturation={0} fade speed={1} />
                <fog attach="fog" args={['#0a0a1a', 20, 60]} />
              </>
            )}

            {/* Grid */}
            {showGrid && (
              <Grid
                infiniteGrid
                cellSize={1}
                cellThickness={0.5}
                sectionSize={5}
                sectionThickness={1}
                cellColor="#444466"
                sectionColor="#6666aa"
                fadeDistance={30}
              />
            )}

            {/* Contact Shadows */}
            <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={20} blur={2} />

            {/* Scene Objects */}
            {objects.map(obj => (
              <SceneObjectMesh
                key={obj.id}
                obj={obj}
                isSelected={selectedId === obj.id}
                onClick={() => !obj.locked && setSelectedId(obj.id)}
              />
            ))}

            {/* Transform Gizmo for selected */}
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

            {/* Gizmo Helper */}
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport labelColor="white" axisHeadScale={1} />
            </GizmoHelper>
          </Canvas>

          {/* Viewport overlay info */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge variant="outline" className="bg-background/60 backdrop-blur text-[10px] border-border/30">
              Objects: {objects.length}
            </Badge>
            {selectedObj && (
              <Badge variant="outline" className="bg-primary/10 text-primary text-[10px] border-primary/30">
                {selectedObj.name}
              </Badge>
            )}
          </div>

          {/* Viewport controls */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            <Badge variant="outline" className="bg-background/60 backdrop-blur text-[10px] border-border/30 cursor-pointer hover:bg-background/80">
              Perspective
            </Badge>
          </div>
        </div>

        {/* Right Inspector Panel */}
        <div className="w-72 bg-background/60 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
          <Tabs value={rightPanel} onValueChange={v => setRightPanel(v as any)} className="flex flex-col h-full">
            <TabsList className="w-full bg-transparent border-b border-border/30 rounded-none h-9 p-0">
              <TabsTrigger value="inspector" className="flex-1 text-xs h-full rounded-none data-[state=active]:bg-primary/10">
                Inspector
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex-1 text-xs h-full rounded-none data-[state=active]:bg-primary/10">
                Material
              </TabsTrigger>
              <TabsTrigger value="shaders" className="flex-1 text-xs h-full rounded-none data-[state=active]:bg-primary/10">
                Shaders
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="inspector" className="m-0 p-3 space-y-4">
                {selectedObj ? (
                  <>
                    {/* Name */}
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Name</label>
                      <Input
                        value={selectedObj.name}
                        onChange={e => updateObject(selectedObj.id, { name: e.target.value })}
                        className="h-7 text-xs mt-1 bg-muted/30 border-border/30"
                      />
                    </div>

                    {/* Transform */}
                    {(['position', 'rotation', 'scale'] as const).map(prop => (
                      <div key={prop}>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">{prop}</label>
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          {['X', 'Y', 'Z'].map((axis, i) => (
                            <div key={axis} className="flex flex-col">
                              <span className={cn(
                                'text-[9px] font-bold mb-0.5',
                                i === 0 && 'text-red-400', i === 1 && 'text-green-400', i === 2 && 'text-blue-400'
                              )}>{axis}</span>
                              <Input
                                type="number"
                                step={prop === 'rotation' ? 0.1 : 0.25}
                                value={Number(selectedObj[prop][i]).toFixed(2)}
                                onChange={e => {
                                  const newVal = [...selectedObj[prop]] as [number, number, number];
                                  newVal[i] = parseFloat(e.target.value) || 0;
                                  updateObject(selectedObj.id, { [prop]: newVal });
                                }}
                                className="h-6 text-[11px] bg-muted/30 border-border/30 px-1.5"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Flags */}
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => updateObject(selectedObj.id, { visible: !selectedObj.visible })}
                        className={cn('h-6 text-[10px] px-2', selectedObj.visible && 'border-primary/30 text-primary')}
                      >
                        {selectedObj.visible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        Visible
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => updateObject(selectedObj.id, { wireframe: !selectedObj.wireframe })}
                        className={cn('h-6 text-[10px] px-2', selectedObj.wireframe && 'border-primary/30 text-primary')}
                      >
                        Wire
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => updateObject(selectedObj.id, { castShadow: !selectedObj.castShadow })}
                        className={cn('h-6 text-[10px] px-2', selectedObj.castShadow && 'border-primary/30 text-primary')}
                      >
                        Shadow
                      </Button>
                    </div>

                    {/* Light properties */}
                    {selectedObj.type.startsWith('light-') && (
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Intensity</label>
                        <Slider
                          value={[selectedObj.intensity || 1]}
                          onValueChange={([v]) => updateObject(selectedObj.id, { intensity: v })}
                          min={0} max={10} step={0.1}
                          className="mt-1"
                        />
                        <span className="text-[10px] text-muted-foreground">{(selectedObj.intensity || 1).toFixed(1)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MousePointer className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Select an object to inspect</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="materials" className="m-0 p-3 space-y-4">
                {selectedObj && !selectedObj.type.startsWith('light-') ? (
                  <>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={selectedObj.color}
                          onChange={e => updateObject(selectedObj.id, { color: e.target.value })}
                          className="w-8 h-8 rounded border-0 cursor-pointer"
                        />
                        <Input
                          value={selectedObj.color}
                          onChange={e => updateObject(selectedObj.id, { color: e.target.value })}
                          className="h-7 text-xs bg-muted/30 border-border/30 flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Metalness: {selectedObj.metalness.toFixed(2)}
                      </label>
                      <Slider
                        value={[selectedObj.metalness]}
                        onValueChange={([v]) => updateObject(selectedObj.id, { metalness: v })}
                        min={0} max={1} step={0.01} className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Roughness: {selectedObj.roughness.toFixed(2)}
                      </label>
                      <Slider
                        value={[selectedObj.roughness]}
                        onValueChange={([v]) => updateObject(selectedObj.id, { roughness: v })}
                        min={0} max={1} step={0.01} className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Opacity: {selectedObj.opacity.toFixed(2)}
                      </label>
                      <Slider
                        value={[selectedObj.opacity]}
                        onValueChange={([v]) => updateObject(selectedObj.id, { opacity: v })}
                        min={0} max={1} step={0.01} className="mt-1"
                      />
                    </div>

                    {/* Quick presets */}
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Quick Presets</label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        {[
                          { name: 'Chrome', m: 1, r: 0.05, c: '#cccccc' },
                          { name: 'Gold', m: 1, r: 0.1, c: '#ffd700' },
                          { name: 'Rubber', m: 0, r: 0.9, c: '#222222' },
                          { name: 'Glass', m: 0.1, r: 0.05, c: '#88ccff' },
                          { name: 'Wood', m: 0, r: 0.8, c: '#8B4513' },
                          { name: 'Plastic', m: 0, r: 0.4, c: '#ff4444' },
                        ].map(p => (
                          <Button
                            key={p.name}
                            variant="outline" size="sm"
                            onClick={() => updateObject(selectedObj.id, { metalness: p.m, roughness: p.r, color: p.c })}
                            className="h-6 text-[10px]"
                          >
                            {p.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Palette className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Select a mesh to edit materials</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shaders" className="m-0 p-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search shaders..."
                    value={shaderSearch}
                    onChange={e => setShaderSearch(e.target.value)}
                    className="pl-8 h-7 text-xs bg-muted/30 border-border/30"
                  />
                </div>

                <div className="flex gap-1 flex-wrap">
                  {shaderCategories.map(cat => (
                    <Button
                      key={cat}
                      variant="outline" size="sm"
                      onClick={() => setShaderCategory(cat)}
                      className={cn('h-6 text-[10px] px-2', shaderCategory === cat && 'bg-primary/15 text-primary border-primary/30')}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredShaders.map(shader => (
                    <button
                      key={shader.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg">
                        {shader.thumbnail}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{shader.name}</p>
                        <p className="text-[10px] text-muted-foreground">{shader.category}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">GLSL</Badge>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-border/20">
                  <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    Open Shader Editor
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
