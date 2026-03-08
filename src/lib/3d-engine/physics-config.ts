// Phase 3 — Physics Engine Configuration (Simulated Rapier-class)

export type ColliderType = 'box' | 'sphere' | 'capsule' | 'mesh' | 'convexHull';
export type ConstraintType = 'fixed' | 'hinge' | 'ball' | 'prismatic' | 'spring';

export interface PhysicsBodyConfig {
  objectId: string;
  enabled: boolean;
  bodyType: 'dynamic' | 'kinematic' | 'static';
  mass: number;
  friction: number;
  restitution: number;
  linearDamping: number;
  angularDamping: number;
  colliderType: ColliderType;
  colliderOffset: [number, number, number];
  colliderScale: [number, number, number];
  gravityScale: number;
  continuousCollisionDetection: boolean;
  lockRotationX: boolean;
  lockRotationY: boolean;
  lockRotationZ: boolean;
  lockTranslationX: boolean;
  lockTranslationY: boolean;
  lockTranslationZ: boolean;
}

export interface PhysicsConstraint {
  id: string;
  type: ConstraintType;
  bodyA: string;
  bodyB: string;
  anchorA: [number, number, number];
  anchorB: [number, number, number];
  axisA?: [number, number, number];
  axisB?: [number, number, number];
  // Hinge/Prismatic limits
  limitsEnabled: boolean;
  limitMin: number;
  limitMax: number;
  // Spring
  stiffness: number;
  damping: number;
}

export interface PhysicsWorldConfig {
  gravity: [number, number, number];
  timeStep: number;
  substeps: number;
  debugWireframe: boolean;
  paused: boolean;
  slowMotion: number; // 0.1 to 2.0
}

export const defaultPhysicsWorld: PhysicsWorldConfig = {
  gravity: [0, -9.81, 0],
  timeStep: 1 / 60,
  substeps: 1,
  debugWireframe: false,
  paused: true,
  slowMotion: 1.0,
};

export const defaultPhysicsBody = (objectId: string): PhysicsBodyConfig => ({
  objectId,
  enabled: true,
  bodyType: 'dynamic',
  mass: 1.0,
  friction: 0.5,
  restitution: 0.3,
  linearDamping: 0.1,
  angularDamping: 0.1,
  colliderType: 'box',
  colliderOffset: [0, 0, 0],
  colliderScale: [1, 1, 1],
  gravityScale: 1.0,
  continuousCollisionDetection: false,
  lockRotationX: false,
  lockRotationY: false,
  lockRotationZ: false,
  lockTranslationX: false,
  lockTranslationY: false,
  lockTranslationZ: false,
});

export const defaultConstraint = (bodyA: string, bodyB: string): PhysicsConstraint => ({
  id: `constraint-${Date.now()}`,
  type: 'fixed',
  bodyA,
  bodyB,
  anchorA: [0, 0, 0],
  anchorB: [0, 0, 0],
  limitsEnabled: false,
  limitMin: -Math.PI,
  limitMax: Math.PI,
  stiffness: 100,
  damping: 10,
});

// Simple physics simulation (no external dependency needed)
export class SimplePhysicsEngine {
  private bodies: Map<string, {
    config: PhysicsBodyConfig;
    position: [number, number, number];
    velocity: [number, number, number];
    angularVelocity: [number, number, number];
    rotation: [number, number, number];
    force: [number, number, number];
  }> = new Map();

  private world: PhysicsWorldConfig;

  constructor(world: PhysicsWorldConfig) {
    this.world = world;
  }

  addBody(config: PhysicsBodyConfig, pos: [number, number, number], rot: [number, number, number]) {
    this.bodies.set(config.objectId, {
      config,
      position: [...pos],
      velocity: [0, 0, 0],
      angularVelocity: [0, 0, 0],
      rotation: [...rot],
      force: [0, 0, 0],
    });
  }

  removeBody(id: string) {
    this.bodies.delete(id);
  }

  step(): Map<string, { position: [number, number, number]; rotation: [number, number, number] }> {
    const dt = this.world.timeStep * this.world.slowMotion;
    const results = new Map<string, { position: [number, number, number]; rotation: [number, number, number] }>();

    this.bodies.forEach((body, id) => {
      if (body.config.bodyType === 'static' || !body.config.enabled) {
        results.set(id, { position: [...body.position], rotation: [...body.rotation] });
        return;
      }

      const g = this.world.gravity;
      const gs = body.config.gravityScale;

      // Apply gravity
      body.velocity[0] += g[0] * gs * dt;
      body.velocity[1] += g[1] * gs * dt;
      body.velocity[2] += g[2] * gs * dt;

      // Apply damping
      const ld = 1 - body.config.linearDamping * dt;
      body.velocity[0] *= ld;
      body.velocity[1] *= ld;
      body.velocity[2] *= ld;

      // Update position
      body.position[0] += body.velocity[0] * dt;
      body.position[1] += body.velocity[1] * dt;
      body.position[2] += body.velocity[2] * dt;

      // Ground collision (simple plane at y=0)
      if (body.position[1] < 0) {
        body.position[1] = 0;
        body.velocity[1] = -body.velocity[1] * body.config.restitution;
        // Friction on ground
        body.velocity[0] *= (1 - body.config.friction * dt * 10);
        body.velocity[2] *= (1 - body.config.friction * dt * 10);
      }

      // Lock axes
      if (body.config.lockTranslationX) { body.velocity[0] = 0; }
      if (body.config.lockTranslationY) { body.velocity[1] = 0; }
      if (body.config.lockTranslationZ) { body.velocity[2] = 0; }

      results.set(id, { position: [...body.position], rotation: [...body.rotation] });
    });

    return results;
  }

  reset() {
    this.bodies.clear();
  }
}

export const physicsPresets: Record<string, Partial<PhysicsBodyConfig>> = {
  'Heavy Metal': { mass: 10, friction: 0.8, restitution: 0.1, linearDamping: 0.05 },
  'Bouncy Ball': { mass: 0.5, friction: 0.3, restitution: 0.9, linearDamping: 0.01 },
  'Ice Block': { mass: 2, friction: 0.02, restitution: 0.1, linearDamping: 0.01 },
  'Feather': { mass: 0.01, friction: 0.5, restitution: 0.05, linearDamping: 0.95, gravityScale: 0.1 },
  'Ragdoll': { mass: 5, friction: 0.7, restitution: 0.05, linearDamping: 0.3, angularDamping: 0.3 },
  'Explosive': { mass: 1, friction: 0.5, restitution: 0.7, linearDamping: 0.01, gravityScale: 0.5 },
};
