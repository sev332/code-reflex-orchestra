export { buildFieldCache, sampleField, sampleGradient, sampleTerrain, sampleCoherence, sampleOrientation } from './field-engine';
export type { FieldCache } from './field-engine';

export { stepMotion, initMotionState, DEFAULT_MOTION_CONFIG } from './motion-engine';
export type { Vec2, ForceWeights, MotionState, MotionConfig } from './motion-engine';

export { PathBody, rasterizeMask, featherMask } from './temporal-engine';
export type { PathVertex } from './temporal-engine';

export { LassoTool, DEFAULT_LASSO_CONFIG } from './lasso-tool';
export type { LassoMode, LassoConfig, LassoPhase, LassoSnapshot } from './lasso-tool';
