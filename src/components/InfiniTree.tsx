import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line, Box, Sphere, Cylinder } from "@react-three/drei";
import * as THREE from "three";

// Node “model”
export interface TreeNode {
  id: string;
  title: string;
  content: string;
  position: [number, number, number]; // world coords
  connections: string[]; // target node ids
  type: "core" | "agent" | "service" | "interface" | "data" | "security" | "deployment";
  intensity: number; // 0..1 pulse strength
  emotionalValence: number; // aesthetic tint
  createdAt: number;
  lastAccessed: number;
  branchDepth: number; // used to scale size/pulse
  symbolContext: string; // e.g., Ω
  category: string; // matches a layer name
  priority: number; // 0..1
  dependencies: string[];
  status: "active" | "idle" | "critical" | "experimental";
}

// Layer “shells” the nodes sit on
export interface ArchitectureLayer {
  name: string; // e.g., 'Core Intelligence'
  nodes: string[]; // ids of nodes on this shell
  color: string; // used for glow/wireframes
  radius: number; // distance from origin (x,z)
  height: number; // y-level of the ring
}

export default function InfiniTree() {
  const [layers, setLayers] = useState<ArchitectureLayer[]>(() => seedLayers());
  const [nodes, setNodes] = useState<TreeNode[]>(() => seedNodes());

  // Optional: periodic growth
  useEffect(() => {
    const t = setInterval(() => setNodes((n) => addGrowth(n, layers, setLayers)), 4000);
    return () => clearInterval(t);
  }, [layers]);

  return (
    <div className="h-screen bg-background">
      <Canvas camera={{ position: [6, 6, 10], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <OrbitControls enableDamping />
        <NodeField nodes={nodes} layers={layers} />
        <LayerRings layers={layers} />
        <Labels layers={layers} />
      </Canvas>
    </div>
  );
}

// ----------------------
// Layer math (rings)
// ----------------------
function seedLayers(): ArchitectureLayer[] {
  return [
    { name: "Core Intelligence", nodes: [], color: "#FF6B6B", radius: 2, height: 0 },
    { name: "Agent Layer", nodes: [], color: "#4ECDC4", radius: 4, height: 0.6 },
    { name: "Services", nodes: [], color: "#FFD93D", radius: 6, height: 1.2 },
    { name: "Interfaces", nodes: [], color: "#A78BFA", radius: 8, height: 1.8 },
    { name: "Data", nodes: [], color: "#34D399", radius: 10, height: 2.4 },
    { name: "Security", nodes: [], color: "#F472B6", radius: 12, height: 3.0 },
    { name: "Deployment", nodes: [], color: "#FFB347", radius: 14, height: 3.6 },
  ];
}

function posOnRing(radius: number, height: number, i: number, total: number): [number, number, number] {
  const theta = (i / Math.max(1, total)) * Math.PI * 2;
  const jitter = () => (Math.random() - 0.5) * 0.4;
  return [radius * Math.cos(theta) + jitter(), height + jitter() * 0.2, radius * Math.sin(theta) + jitter()];
}

function layerOf(n: TreeNode, layers: ArchitectureLayer[]) {
  return layers.find((l) => l.name === n.category);
}

// ----------------------
// Nodes & connections
// ----------------------
function NodeField({ nodes, layers }: { nodes: TreeNode[]; layers: ArchitectureLayer[] }) {
  const index = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <>
      {nodes.map((n) => (
        <NeuralNode key={n.id} node={n} layer={layerOf(n, layers)} />
      ))}

      {/* faint subset of links for performance */}
      {nodes.flatMap((n, i) =>
        n.connections
          .filter((_, k) => k % 3 === 0)
          .map((toId, k) => {
            const to = index[toId];
            if (!to) return null;
            return (
              <Line
                key={`${n.id}-${k}`}
                points={[n.position, to.position]}
                lineWidth={0.5}
                color={layerOf(n, layers)?.color ?? "#7dd3fc"}
                opacity={0.2}
                transparent
              />
            );
          })
      )}
    </>
  );
}

// ----------------------
// Animated node
// ----------------------
function NeuralNode({ node, layer }: { node: TreeNode; layer?: ArchitectureLayer }) {
  const mesh = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const time = clock.getElapsedTime();
    const base = 1 + 0.2 * Math.sin(time * 2 + node.intensity * 5);
    const prio = 1 + node.priority * 0.1 * Math.sin(time * 3);
    const crit = node.status === "critical" ? 1 + 0.15 * Math.sin(time * 5) : 1;
    const scale = base * prio * crit;
    mesh.current.scale.setScalar(scale);
  });

  const color = layer?.color ?? "#A8E6CF";

  return (
    <group position={node.position}>
      <mesh ref={mesh}>
        {node.type === "core" ? (
          <Box args={[0.15, 0.15, 0.15]} />
        ) : node.type === "agent" ? (
          <Sphere args={[0.12, 16, 16]} />
        ) : node.type === "service" ? (
          <Cylinder args={[0.08, 0.08, 0.2, 8]} />
        ) : (
          <Sphere args={[0.1, 12, 12]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color as unknown as THREE.ColorRepresentation}
          emissiveIntensity={0.25}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

// ----------------------
// Rings & labels (nice to have)
// ----------------------
function LayerRings({ layers }: { layers: ArchitectureLayer[] }) {
  return (
    <group>
      {layers.map((l) => (
        <mesh key={l.name} position={[0, l.height, 0]}>
          {/* wireframe ring approximation */}
          <torusGeometry args={[l.radius, 0.01, 8, 64]} />
          <meshBasicMaterial color={l.color} wireframe transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Labels({ layers }: { layers: ArchitectureLayer[] }) {
  return (
    <group>
      {layers.map((l) => (
        <Text key={l.name} position={[0, l.height + 0.4, l.radius]} fontSize={0.35} color={l.color} anchorX="center" anchorY="middle">
          {l.name}
        </Text>
      ))}
    </group>
  );
}

// ----------------------
// Seeding & growth
// ----------------------
function seedNodes(): TreeNode[] {
  const L = seedLayers();
  const seed: TreeNode[] = [
    {
      id: "core-000",
      title: "Core",
      content: "Root cognition",
      position: [0, 0, 0],
      connections: [],
      type: "core",
      intensity: 1,
      emotionalValence: 0.8,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      branchDepth: 0,
      symbolContext: "Ω",
      category: "Core Intelligence",
      priority: 1,
      dependencies: [],
      status: "critical",
    },
  ];
  // add a few agents/services around
  for (let i = 0; i < 12; i++) {
    const cat = i % 2 === 0 ? "Agent Layer" : "Services";
    const layer = L.find((l) => l.name === cat)!;
    seed.push({
      id: `n-${i}`,
      title: `${cat}-${i}`,
      content: "",
      position: posOnRing(layer.radius, layer.height, i, 12),
      connections: i > 0 ? [`n-${i - 1}`] : [],
      type: i % 2 === 0 ? "agent" : "service",
      intensity: Math.random() * 0.8 + 0.2,
      emotionalValence: 0.5,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      branchDepth: 1,
      symbolContext: "",
      category: cat,
      priority: Math.random(),
      dependencies: [],
      status: "active",
    });
  }
  return seed;
}

function addGrowth(
  nodes: TreeNode[],
  layers: ArchitectureLayer[],
  setLayers: React.Dispatch<React.SetStateAction<ArchitectureLayer[]>>
) {
  const cats = layers.map((l) => l.name);
  const cat = cats[Math.floor(Math.random() * cats.length)];
  const layer = layers.find((l) => l.name === cat)!;
  const id = `node-${Date.now()}`;
  const newNode: TreeNode = {
    id,
    title: `${cat} Agent`,
    content: `Auto-grown ${cat.toLowerCase()} node`,
    position: posOnRing(layer.radius, layer.height, Math.floor(Math.random() * 64), 64),
    connections: nodes.length ? [nodes[Math.floor(Math.random() * nodes.length)].id] : [],
    type: cat.includes("Agent") ? "agent" : cat.includes("Service") ? "service" : "interface",
    intensity: Math.random(),
    emotionalValence: 0.5,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    branchDepth: 1 + Math.floor(Math.random() * 3),
    symbolContext: "",
    category: cat,
    priority: Math.random(),
    dependencies: [],
    status: Math.random() < 0.1 ? "critical" : "active",
  };

  // update layer membership (optional bookkeeping)
  const updated = layers.map((l) => (l.name === cat ? { ...l, nodes: [...l.nodes, id] } : l));
  setLayers(updated);
  return [...nodes, newNode];
}

