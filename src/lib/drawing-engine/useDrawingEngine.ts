// React hook for Drawing Engine — wires BrushSession, stabilizers, live preview, node editing, transforms
import { useState, useCallback, useRef, useMemo } from 'react';
import {
  EditorState, DrawableEntity, ToolId, Vec2, Command, generateId,
} from './types';
import {
  createDefaultEditorState, CommandHistory,
  createRectEntity, createEllipseEntity, createLineEntity, createBrushStrokeEntity,
  hitTest, getEntityBounds,
} from './engine';
import { LivePreviewState, emptyPreview, PenAnchorPreview, NodeEditOverlay, emptyNodeOverlay } from './renderer';
import { BrushSession, BrushSessionConfig, defaultBrushSessionConfig, BUILT_IN_PRESETS, BrushPresetFull, RawInputSample } from './brush-core';
import {
  NodeHit, TransformHandle, TransformState, emptyTransformState,
  hitTestNodes, moveAnchor, addAnchorOnSegment, deleteAnchor, ensurePathData,
  getTransformHandles, hitTestTransformHandle, applyScaleTransform, applyRotateTransform,
} from './node-editing';
import { simplifyPath, reversePath, offsetPath, booleanUnion, booleanSubtract, booleanIntersect } from './path-operations';

export function useDrawingEngine() {
  const [state, setState] = useState<EditorState>(createDefaultEditorState);
  const historyRef = useRef(new CommandHistory());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Live preview state — updated every frame during interaction
  const [preview, setPreview] = useState<LivePreviewState>(emptyPreview);

  // Active brush session
  const brushSessionRef = useRef<BrushSession | null>(null);
  const [activeBrushPreset, setActiveBrushPreset] = useState<BrushPresetFull>(BUILT_IN_PRESETS[0]);

  // Pen tool anchors
  const [penAnchors, setPenAnchors] = useState<PenAnchorPreview[]>([]);

  // Node editing state (direct-select)
  const [nodeOverlay, setNodeOverlay] = useState<NodeEditOverlay>(emptyNodeOverlay);
  const [activeNodeHit, setActiveNodeHit] = useState<NodeHit | null>(null);
  const nodeDragRef = useRef<{ hit: NodeHit; lastWorld: Vec2 } | null>(null);

  // Transform state (select tool)
  const [transformState, setTransformState] = useState<TransformState>(emptyTransformState);

  const updateHistory = useCallback(() => {
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, []);

  // ── State mutations ──

  const setTool = useCallback((toolId: ToolId) => {
    setState(prev => ({ ...prev, tool: { ...prev.tool, activeToolId: toolId } }));
    // Reset pen anchors when switching away from pen
    if (toolId !== 'pen') setPenAnchors([]);
    setPreview(emptyPreview);
  }, []);

  const setFillColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, tool: { ...prev.tool, fillColor: color } }));
  }, []);

  const setStrokeColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, tool: { ...prev.tool, strokeColor: color } }));
  }, []);

  const setStrokeWidth = useCallback((width: number) => {
    setState(prev => ({ ...prev, tool: { ...prev.tool, strokeWidth: width } }));
  }, []);

  const setViewport = useCallback((update: Partial<EditorState['viewport']>) => {
    setState(prev => ({ ...prev, viewport: { ...prev.viewport, ...update } }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, viewport: { ...prev.viewport, zoom: Math.max(0.1, Math.min(10, zoom)) } }));
  }, []);

  const pan = useCallback((dx: number, dy: number) => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, panX: prev.viewport.panX + dx, panY: prev.viewport.panY + dy },
    }));
  }, []);

  const select = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, selection: { ...prev.selection, selectedIds: ids } }));
  }, []);

  const setHovered = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selection: { ...prev.selection, hoveredId: id } }));
  }, []);

  const addEntity = useCallback((entity: DrawableEntity) => {
    setState(prev => {
      const scene = { ...prev.scene };
      scene.entities = { ...scene.entities, [entity.id]: entity };
      const activeLayer = scene.layers.find(l => l.id === scene.activeLayerId);
      if (activeLayer) {
        scene.layers = scene.layers.map(l =>
          l.id === scene.activeLayerId ? { ...l, entities: [...l.entities, entity.id] } : l
        );
      }
      return { ...prev, scene, selection: { ...prev.selection, selectedIds: [entity.id] } };
    });
  }, []);

  const deleteSelected = useCallback(() => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length === 0) return prev;
      const entities = { ...prev.scene.entities };
      ids.forEach(id => delete entities[id]);
      const layers = prev.scene.layers.map(l => ({
        ...l,
        entities: l.entities.filter(eid => !ids.includes(eid)),
      }));
      return {
        ...prev,
        scene: { ...prev.scene, entities, layers },
        selection: { selectedIds: [], hoveredId: null, selectionBounds: null },
      };
    });
  }, []);

  const moveSelected = useCallback((dx: number, dy: number) => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length === 0) return prev;
      const entities = { ...prev.scene.entities };
      ids.forEach(id => {
        const e = entities[id];
        if (e) {
          entities[id] = {
            ...e,
            transform: {
              ...e.transform,
              translateX: e.transform.translateX + dx,
              translateY: e.transform.translateY + dy,
            },
          };
        }
      });
      return { ...prev, scene: { ...prev.scene, entities } };
    });
  }, []);

  const toggleGrid = useCallback(() => {
    setState(prev => ({ ...prev, gridEnabled: !prev.gridEnabled }));
  }, []);

  const toggleSnap = useCallback(() => {
    setState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled }));
  }, []);

  const addLayer = useCallback(() => {
    setState(prev => {
      const newLayer = {
        id: generateId(),
        name: `Layer ${prev.scene.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        entities: [] as string[],
        collapsed: false,
      };
      return {
        ...prev,
        scene: {
          ...prev.scene,
          layers: [...prev.scene.layers, newLayer],
          activeLayerId: newLayer.id,
        },
      };
    });
  }, []);

  const setActiveLayer = useCallback((id: string) => {
    setState(prev => ({ ...prev, scene: { ...prev.scene, activeLayerId: id } }));
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      scene: {
        ...prev.scene,
        layers: prev.scene.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l),
      },
    }));
  }, []);

  const toggleLayerLock = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      scene: {
        ...prev.scene,
        layers: prev.scene.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l),
      },
    }));
  }, []);

  // ── Interaction: Brush Session ──

  const beginBrushStroke = useCallback((sample: RawInputSample) => {
    const session = new BrushSession(activeBrushPreset.session);
    session.begin(sample);
    brushSessionRef.current = session;
    setPreview({
      active: true,
      type: 'brush',
      brushPoints: [{ x: sample.x, y: sample.y, pressure: sample.pressure }],
      strokeColor: activeBrushPreset.color,
      strokeWidth: activeBrushPreset.baseSize,
    });
  }, [activeBrushPreset]);

  const updateBrushStroke = useCallback((sample: RawInputSample) => {
    const session = brushSessionRef.current;
    if (!session) return;
    const pt = session.update(sample);
    if (pt) {
      // Update preview with all session points
      setPreview(prev => ({
        ...prev,
        brushPoints: session.points.map((p, i) => ({
          x: p.x, y: p.y, pressure: session.pressures[i] ?? 0.5,
        })),
      }));
    }
  }, []);

  const endBrushStroke = useCallback((sample: RawInputSample, strokeColor: string, brushSize: number) => {
    const session = brushSessionRef.current;
    if (!session) return;
    const result = session.end(sample);
    brushSessionRef.current = null;
    setPreview(emptyPreview);

    if (result.points.length > 2) {
      const brushPoints = result.points.map((p, i) => ({
        x: p.x, y: p.y, pressure: result.pressures[i] ?? 0.5,
      }));
      addEntity(createBrushStrokeEntity(brushPoints, strokeColor, brushSize));
    }
  }, [addEntity]);

  // ── Interaction: Shape preview ──

  const beginShapePreview = useCallback((world: Vec2, shapeKind: string, fillColor: string, strokeColor: string, strokeWidth: number) => {
    setPreview({
      active: true,
      type: 'shape',
      shapeKind,
      startWorld: world,
      currentWorld: world,
      fillColor,
      strokeColor,
      strokeWidth,
    });
  }, []);

  const updateShapePreview = useCallback((world: Vec2) => {
    setPreview(prev => ({ ...prev, currentWorld: world }));
  }, []);

  const endShapePreview = useCallback(() => {
    setPreview(emptyPreview);
  }, []);

  // ── Interaction: Line preview ──

  const beginLinePreview = useCallback((world: Vec2, strokeColor: string, strokeWidth: number) => {
    setPreview({
      active: true,
      type: 'line',
      startWorld: world,
      currentWorld: world,
      strokeColor,
      strokeWidth,
    });
  }, []);

  const updateLinePreview = useCallback((world: Vec2) => {
    setPreview(prev => ({ ...prev, currentWorld: world }));
  }, []);

  const endLinePreview = useCallback(() => {
    setPreview(emptyPreview);
  }, []);

  // ── Interaction: Pen tool ──

  const addPenAnchor = useCallback((anchor: PenAnchorPreview) => {
    setPenAnchors(prev => {
      const next = [...prev, anchor];
      setPreview(p => ({ ...p, active: true, type: 'pen', penAnchors: next }));
      return next;
    });
  }, []);

  const updatePenCursor = useCallback((world: Vec2) => {
    setPreview(prev => ({ ...prev, currentWorld: world }));
  }, []);

  const finishPenPath = useCallback(() => {
    setPreview(emptyPreview);
    const anchors = penAnchors;
    setPenAnchors([]);
    return anchors;
  }, [penAnchors]);

  // ── Hit test ──

  const hitTestAtPoint = useCallback((screenPoint: Vec2): string | null => {
    const { viewport, scene } = state;
    const worldPoint: Vec2 = {
      x: screenPoint.x / viewport.zoom - viewport.panX,
      y: screenPoint.y / viewport.zoom - viewport.panY,
    };
    for (let li = scene.layers.length - 1; li >= 0; li--) {
      const layer = scene.layers[li];
      if (!layer.visible || layer.locked) continue;
      for (let ei = layer.entities.length - 1; ei >= 0; ei--) {
        const entity = scene.entities[layer.entities[ei]];
        if (entity && entity.visible && !entity.locked && hitTest(entity, worldPoint)) {
          return entity.id;
        }
      }
    }
    return null;
  }, [state]);

  // ── Node editing (Direct Select) ──

  const enterNodeEdit = useCallback((entityId: string) => {
    setState(prev => {
      const entity = prev.scene.entities[entityId];
      if (!entity) return prev;
      const converted = ensurePathData(entity);
      if (converted === entity && !entity.pathData) return prev;
      const entities = { ...prev.scene.entities, [entityId]: converted };
      return { ...prev, scene: { ...prev.scene, entities } };
    });
    setNodeOverlay({ enabled: true, entityId, activeNodeHit: null });
  }, []);

  const exitNodeEdit = useCallback(() => {
    setNodeOverlay(emptyNodeOverlay);
    setActiveNodeHit(null);
    nodeDragRef.current = null;
  }, []);

  const beginNodeDrag = useCallback((worldPoint: Vec2): boolean => {
    if (!nodeOverlay.enabled || !nodeOverlay.entityId) return false;
    const entity = state.scene.entities[nodeOverlay.entityId];
    if (!entity) return false;
    const hit = hitTestNodes(entity, worldPoint, state.viewport.zoom);
    if (!hit) return false;
    setActiveNodeHit(hit);
    setNodeOverlay(prev => ({ ...prev, activeNodeHit: hit }));
    nodeDragRef.current = { hit, lastWorld: worldPoint };
    return true;
  }, [nodeOverlay, state.scene.entities, state.viewport.zoom]);

  const updateNodeDrag = useCallback((worldPoint: Vec2) => {
    const drag = nodeDragRef.current;
    if (!drag) return;
    const dx = worldPoint.x - drag.lastWorld.x;
    const dy = worldPoint.y - drag.lastWorld.y;
    setState(prev => {
      const entity = prev.scene.entities[drag.hit.entityId];
      if (!entity) return prev;
      const updated = moveAnchor(entity, drag.hit, dx, dy);
      return { ...prev, scene: { ...prev.scene, entities: { ...prev.scene.entities, [entity.id]: updated } } };
    });
    nodeDragRef.current = { ...drag, lastWorld: worldPoint };
  }, []);

  const endNodeDrag = useCallback(() => {
    nodeDragRef.current = null;
  }, []);

  const addPointOnPath = useCallback((entityId: string, contourIndex: number, segIndex: number) => {
    setState(prev => {
      const entity = prev.scene.entities[entityId];
      if (!entity) return prev;
      const updated = addAnchorOnSegment(entity, contourIndex, segIndex);
      return { ...prev, scene: { ...prev.scene, entities: { ...prev.scene.entities, [entityId]: updated } } };
    });
  }, []);

  const deletePoint = useCallback((entityId: string, contourIndex: number, anchorIndex: number) => {
    setState(prev => {
      const entity = prev.scene.entities[entityId];
      if (!entity) return prev;
      const updated = deleteAnchor(entity, contourIndex, anchorIndex);
      return { ...prev, scene: { ...prev.scene, entities: { ...prev.scene.entities, [entityId]: updated } } };
    });
  }, []);

  // ── Transform handles (Select tool) ──

  const computedTransformHandles = useMemo(() => {
    if (state.tool.activeToolId !== 'select' || state.selection.selectedIds.length === 0) return [];
    const entities = state.selection.selectedIds
      .map(id => state.scene.entities[id])
      .filter(Boolean);
    return getTransformHandles(entities, state.viewport.zoom);
  }, [state.tool.activeToolId, state.selection.selectedIds, state.scene.entities, state.viewport.zoom]);

  const beginTransform = useCallback((worldPoint: Vec2): boolean => {
    if (computedTransformHandles.length === 0) return false;
    const hit = hitTestTransformHandle(computedTransformHandles, worldPoint, state.viewport.zoom);
    if (!hit) return false;

    const entities = state.selection.selectedIds.map(id => state.scene.entities[id]).filter(Boolean);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const startTransforms: TransformState['startTransforms'] = {};
    for (const e of entities) {
      const b = getEntityBounds(e);
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
      startTransforms[e.id] = {
        tx: e.transform.translateX, ty: e.transform.translateY,
        sx: e.transform.scaleX, sy: e.transform.scaleY,
        r: e.transform.rotation,
        w: e.shapeProps?.width, h: e.shapeProps?.height,
      };
    }

    setTransformState({
      active: true,
      type: hit.type === 'rotate' ? 'rotate' : 'scale',
      handle: hit.type,
      origin: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      startMouse: worldPoint,
      startBounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
      startTransforms,
    });
    return true;
  }, [computedTransformHandles, state]);

  const updateTransform = useCallback((worldPoint: Vec2) => {
    if (!transformState.active) return;
    const dx = worldPoint.x - transformState.startMouse.x;
    const dy = worldPoint.y - transformState.startMouse.y;

    setState(prev => {
      const entities = { ...prev.scene.entities };
      for (const id of prev.selection.selectedIds) {
        const e = entities[id];
        if (!e) continue;
        const startData = transformState.startTransforms[id];
        if (!startData) continue;

        if (transformState.type === 'scale' && transformState.handle) {
          entities[id] = applyScaleTransform(e, transformState.handle, dx, dy, transformState.startBounds, startData);
        } else if (transformState.type === 'rotate') {
          const angle1 = Math.atan2(transformState.startMouse.y - transformState.origin.y, transformState.startMouse.x - transformState.origin.x);
          const angle2 = Math.atan2(worldPoint.y - transformState.origin.y, worldPoint.x - transformState.origin.x);
          entities[id] = applyRotateTransform(e, transformState.origin, angle1, angle2, startData.r);
        }
      }
      return { ...prev, scene: { ...prev.scene, entities } };
    });
  }, [transformState]);

  const endTransform = useCallback(() => {
    setTransformState(emptyTransformState);
  }, []);

  // ── Path operations ──

  const pathSimplify = useCallback((tolerance?: number) => {
    setState(prev => {
      const entities = { ...prev.scene.entities };
      for (const id of prev.selection.selectedIds) {
        const e = entities[id];
        if (e) entities[id] = simplifyPath(ensurePathData(e), tolerance);
      }
      return { ...prev, scene: { ...prev.scene, entities } };
    });
  }, []);

  const pathReverse = useCallback(() => {
    setState(prev => {
      const entities = { ...prev.scene.entities };
      for (const id of prev.selection.selectedIds) {
        const e = entities[id];
        if (e) entities[id] = reversePath(ensurePathData(e));
      }
      return { ...prev, scene: { ...prev.scene, entities } };
    });
  }, []);

  const pathOffset = useCallback((distance: number) => {
    setState(prev => {
      const entities = { ...prev.scene.entities };
      for (const id of prev.selection.selectedIds) {
        const e = entities[id];
        if (e) entities[id] = offsetPath(ensurePathData(e), distance);
      }
      return { ...prev, scene: { ...prev.scene, entities } };
    });
  }, []);

  const pathBoolean = useCallback((op: 'union' | 'subtract' | 'intersect') => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length < 2) return prev;
      let a = ensurePathData(prev.scene.entities[ids[0]]);
      let b = ensurePathData(prev.scene.entities[ids[1]]);
      if (!a || !b) return prev;

      let result: DrawableEntity;
      switch (op) {
        case 'union': result = booleanUnion(a, b); break;
        case 'subtract': result = booleanSubtract(a, b); break;
        case 'intersect': result = booleanIntersect(a, b); break;
      }

      const entities = { ...prev.scene.entities };
      delete entities[ids[0]];
      delete entities[ids[1]];
      entities[result.id] = result;

      const layers = prev.scene.layers.map(l => ({
        ...l,
        entities: l.entities.filter(eid => !ids.includes(eid)),
      }));
      // Add result to active layer
      const activeLayer = layers.find(l => l.id === prev.scene.activeLayerId);
      if (activeLayer) activeLayer.entities.push(result.id);

      return {
        ...prev,
        scene: { ...prev.scene, entities, layers },
        selection: { ...prev.selection, selectedIds: [result.id] },
      };
    });
  }, []);

  return {
    state,
    setState,
    preview,
    setPreview,
    canUndo,
    canRedo,
    undo: useCallback(() => { historyRef.current.undo(); updateHistory(); }, [updateHistory]),
    redo: useCallback(() => { historyRef.current.redo(); updateHistory(); }, [updateHistory]),
    setTool,
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setViewport,
    setZoom,
    pan,
    select,
    setHovered,
    addEntity,
    deleteSelected,
    moveSelected,
    toggleGrid,
    toggleSnap,
    addLayer,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    hitTestAtPoint,
    // Factories
    createRectEntity,
    createEllipseEntity,
    createLineEntity,
    createBrushStrokeEntity,
    // Brush session
    beginBrushStroke,
    updateBrushStroke,
    endBrushStroke,
    activeBrushPreset,
    setActiveBrushPreset,
    brushPresets: BUILT_IN_PRESETS,
    // Shape preview
    beginShapePreview,
    updateShapePreview,
    endShapePreview,
    // Line preview
    beginLinePreview,
    updateLinePreview,
    endLinePreview,
    // Pen tool
    addPenAnchor,
    updatePenCursor,
    finishPenPath,
    penAnchors,
    // Node editing (direct-select)
    nodeOverlay,
    enterNodeEdit,
    exitNodeEdit,
    beginNodeDrag,
    updateNodeDrag,
    endNodeDrag,
    addPointOnPath,
    deletePoint,
    activeNodeHit,
    // Transform handles
    computedTransformHandles,
    beginTransform,
    updateTransform,
    endTransform,
    transformState,
    // Path operations
    pathSimplify,
    pathReverse,
    pathOffset,
    pathBoolean,
  };
}
