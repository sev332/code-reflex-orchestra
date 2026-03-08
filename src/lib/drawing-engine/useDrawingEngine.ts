// React hook for Drawing Engine — wires BrushSession, stabilizers, live preview, node editing, transforms
// Sprint 1: Added pen handle dragging, text tool, undo/redo wiring, SVG export
// Sprint 2: Added gradient engine, proper booleans, scissors/knife, groups, isolation mode
// Sprint 3: Transform tools, effects engine, blend/clipping masks, reshape/warp tools
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
import { simplifyPath, reversePath, offsetPath } from './path-operations';
import { createPointTextEntity, createAreaTextEntity } from './text-engine';
import { exportSceneToSVG } from './svg-io';
import {
  GradientData, LinearGradient, RadialGradient,
  createLinearGradient, createRadialGradient, createFreeformGradient,
  applyGradientToEntity, GRADIENT_PRESETS,
} from './gradient-engine';
import {
  pathfinderUnite, pathfinderMinusFront, pathfinderMinusBack,
  pathfinderIntersect, pathfinderExclude, pathfinderDivide,
  scissorsAtPoint, knifeCut,
} from './boolean-engine';
import {
  createGroup, ungroup, deepUngroup,
  IsolationState, emptyIsolation, enterIsolation, exitIsolation,
  alignEntities, distributeEntities,
  bringToFront, sendToBack, bringForward, sendBackward,
} from './groups-engine';
// Sprint 3 imports
import {
  rotateEntity, reflectEntity, scaleEntity, shearEntity,
  transformEach, defaultTransformEachOptions, TransformEachOptions,
  getTransformPanelData, applyTransformPanelData, TransformPanelData,
  TransformOriginPreset, getOriginFromPreset,
} from './transform-engine';
import {
  Effect, EffectStack, emptyEffectStack,
  addEffect, removeEffect, updateEffect, toggleEffect,
  createDropShadow, createOuterGlow, createInnerShadow, createInnerGlow,
  createGaussianBlur, createFeather,
  EFFECT_PRESETS, EffectPreset,
  GraphicStyle, createGraphicStyle, applyGraphicStyle,
} from './effects-engine';
import {
  createBlend, BlendOptions, defaultBlendOptions,
  ClippingMask, createClippingMask, releaseClippingMask,
  OpacityMask, createOpacityMask,
} from './blend-engine';
import {
  WarpToolConfig, defaultWarpConfig, applyWarpAtPoint,
  WidthProfile, WIDTH_PRESETS, addWidthPoint, getWidthAtPosition,
  EnvelopeMesh, createEnvelopeMesh, applyEnvelopeDistort,
  PuppetWarpState, PuppetPin, createPuppetPin, movePuppetPin, applyPuppetWarp,
} from './reshape-engine';

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

  // Pen tool anchors + handle dragging state
  const [penAnchors, setPenAnchors] = useState<PenAnchorPreview[]>([]);
  const [isPenDragging, setIsPenDragging] = useState(false);

  // Node editing state (direct-select)
  const [nodeOverlay, setNodeOverlay] = useState<NodeEditOverlay>(emptyNodeOverlay);
  const [activeNodeHit, setActiveNodeHit] = useState<NodeHit | null>(null);
  const nodeDragRef = useRef<{ hit: NodeHit; lastWorld: Vec2 } | null>(null);

  // Transform state (select tool)
  const [transformState, setTransformState] = useState<TransformState>(emptyTransformState);

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Gradient editing state
  const [activeGradient, setActiveGradient] = useState<GradientData | null>(null);
  const [gradientEditTarget, setGradientEditTarget] = useState<string | null>(null);

  // Isolation mode state
  const [isolation, setIsolation] = useState<IsolationState>(emptyIsolation);

  // Scissors/Knife state
  const [knifePath, setKnifePath] = useState<Vec2[]>([]);
  const [isKnifeCutting, setIsKnifeCutting] = useState(false);

  const updateHistory = useCallback(() => {
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, []);

  // ── Command-wrapped state mutations ──

  const executeCommand = useCallback((label: string, doFn: () => void, undoFn: () => void) => {
    historyRef.current.execute({
      id: generateId(),
      label,
      timestamp: Date.now(),
      execute: doFn,
      undo: undoFn,
    });
    updateHistory();
  }, [updateHistory]);

  const setTool = useCallback((toolId: ToolId) => {
    setState(prev => ({ ...prev, tool: { ...prev.tool, activeToolId: toolId } }));
    if (toolId !== 'pen') setPenAnchors([]);
    setPreview(emptyPreview);
    setEditingTextId(null);
    setActiveGradient(null);
    setGradientEditTarget(null);
    setKnifePath([]);
    setIsKnifeCutting(false);
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

  const setFontSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, tool: { ...prev.tool, fontSize: size } }));
  }, []);

  const setFontFamily = useCallback((family: string) => {
    setState(prev => ({ ...prev, tool: { ...prev.tool, fontFamily: family } }));
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

  // ── UNDO-WRAPPED entity operations ──

  const addEntity = useCallback((entity: DrawableEntity) => {
    const entityId = entity.id;

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

    historyRef.current.execute({
      id: generateId(),
      label: `Add ${entity.name}`,
      timestamp: Date.now(),
      execute: () => {},
      undo: () => {
        setState(prev => {
          const entities = { ...prev.scene.entities };
          delete entities[entityId];
          const layers = prev.scene.layers.map(l => ({
            ...l,
            entities: l.entities.filter(eid => eid !== entityId),
          }));
          return {
            ...prev,
            scene: { ...prev.scene, entities, layers },
            selection: { selectedIds: [], hoveredId: null, selectionBounds: null },
          };
        });
      },
    });
    updateHistory();
  }, [updateHistory]);

  const deleteSelected = useCallback(() => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length === 0) return prev;

      const deletedEntities = ids.map(id => prev.scene.entities[id]).filter(Boolean);
      const deletedLayerMap = new Map<string, string[]>();
      prev.scene.layers.forEach(l => {
        const inLayer = l.entities.filter(eid => ids.includes(eid));
        if (inLayer.length > 0) deletedLayerMap.set(l.id, inLayer);
      });

      historyRef.current.execute({
        id: generateId(),
        label: `Delete ${ids.length} object(s)`,
        timestamp: Date.now(),
        execute: () => {},
        undo: () => {
          setState(p => {
            const entities = { ...p.scene.entities };
            deletedEntities.forEach(e => { entities[e.id] = e; });
            const layers = p.scene.layers.map(l => {
              const restore = deletedLayerMap.get(l.id);
              return restore ? { ...l, entities: [...l.entities, ...restore] } : l;
            });
            return { ...p, scene: { ...p.scene, entities, layers }, selection: { ...p.selection, selectedIds: ids } };
          });
        },
      });
      updateHistory();

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
  }, [updateHistory]);

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

  // ── Interaction: Pen tool — with Bézier handle creation ──

  const addPenAnchor = useCallback((anchor: PenAnchorPreview) => {
    setPenAnchors(prev => {
      if (prev.length >= 3) {
        const first = prev[0];
        const dist = Math.sqrt((anchor.x - first.x) ** 2 + (anchor.y - first.y) ** 2);
        if (dist < 8) {
          finishPenPathAsEntity(prev, true);
          return [];
        }
      }
      const next = [...prev, anchor];
      setPreview(p => ({ ...p, active: true, type: 'pen', penAnchors: next }));
      return next;
    });
  }, []);

  const beginPenHandleDrag = useCallback((anchor: PenAnchorPreview) => {
    setIsPenDragging(true);
    setPenAnchors(prev => {
      const next = [...prev, anchor];
      setPreview(p => ({ ...p, active: true, type: 'pen', penAnchors: next }));
      return next;
    });
  }, []);

  const updatePenHandleDrag = useCallback((world: Vec2) => {
    if (!isPenDragging) return;
    setPenAnchors(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      last.handleOut = { x: world.x, y: world.y };
      last.handleIn = {
        x: last.x - (world.x - last.x),
        y: last.y - (world.y - last.y),
      };
      updated[updated.length - 1] = last;
      setPreview(p => ({ ...p, penAnchors: updated }));
      return updated;
    });
  }, [isPenDragging]);

  const endPenHandleDrag = useCallback(() => {
    setIsPenDragging(false);
  }, []);

  const updatePenCursor = useCallback((world: Vec2) => {
    if (isPenDragging) {
      updatePenHandleDrag(world);
    } else {
      setPreview(prev => ({ ...prev, currentWorld: world }));
    }
  }, [isPenDragging, updatePenHandleDrag]);

  const finishPenPathAsEntity = useCallback((anchors: PenAnchorPreview[], closed: boolean = false) => {
    if (anchors.length < 2) return;
    const pathAnchors = anchors.map((a, i) => ({
      id: generateId(),
      position: { x: a.x, y: a.y },
      handleIn: a.handleIn ? { x: a.handleIn.x, y: a.handleIn.y } : null,
      handleOut: a.handleOut ? { x: a.handleOut.x, y: a.handleOut.y } : null,
    }));
    const segments = pathAnchors.slice(0, closed ? pathAnchors.length : -1).map((a, i) => ({
      type: (pathAnchors[i].handleOut || pathAnchors[(i + 1) % pathAnchors.length].handleIn) ? 'cubic' as const : 'line' as const,
      from: a.id,
      to: pathAnchors[(i + 1) % pathAnchors.length].id,
    }));

    const entity: DrawableEntity = {
      id: generateId(),
      type: 'path',
      name: closed ? 'Closed Path' : 'Path',
      visible: true,
      locked: false,
      topologyMode: 'isolated',
      transform: { translateX: 0, translateY: 0, rotation: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
      blend: { mode: 'normal', opacity: 1 },
      pathData: {
        contours: [{
          id: generateId(),
          anchors: pathAnchors,
          segments,
          closed,
        }],
      },
      fill: closed
        ? { type: 'solid', color: state.tool.fillColor, opacity: 1 }
        : { type: 'none', color: 'transparent', opacity: 0 },
      stroke: { color: state.tool.strokeColor, width: state.tool.strokeWidth, opacity: 1, cap: 'round', join: 'round' },
    };

    addEntity(entity);
    setPreview(emptyPreview);
  }, [addEntity, state.tool]);

  const finishPenPath = useCallback(() => {
    finishPenPathAsEntity(penAnchors, false);
    setPenAnchors([]);
    setPreview(emptyPreview);
    return penAnchors;
  }, [penAnchors, finishPenPathAsEntity]);

  // ── Text tool ──

  const addTextEntity = useCallback((x: number, y: number, text: string = 'Type here') => {
    const entity = createPointTextEntity(x, y, text, {
      fontSize: state.tool.fontSize,
      fontFamily: state.tool.fontFamily,
    }, state.tool.fillColor);
    addEntity(entity);
    setEditingTextId(entity.id);
  }, [addEntity, state.tool]);

  const updateTextContent = useCallback((entityId: string, text: string) => {
    setState(prev => {
      const entity = prev.scene.entities[entityId];
      if (!entity) return prev;
      return {
        ...prev,
        scene: {
          ...prev.scene,
          entities: {
            ...prev.scene.entities,
            [entityId]: { ...entity, textContent: text, name: text.substring(0, 20) || 'Text' },
          },
        },
      };
    });
  }, []);

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

  // ── Path operations (legacy wrappers) ──

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

  // ── SPRINT 2: Proper Pathfinder Boolean Operations ──

  const pathBoolean = useCallback((op: 'union' | 'subtract' | 'intersect' | 'exclude' | 'divide' | 'minus-back') => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length < 2) return prev;
      const a = ensurePathData(prev.scene.entities[ids[0]]);
      const b = ensurePathData(prev.scene.entities[ids[1]]);
      if (!a || !b) return prev;

      let results: DrawableEntity[];
      switch (op) {
        case 'union': results = [pathfinderUnite(a, b)]; break;
        case 'subtract': results = [pathfinderMinusFront(a, b)]; break;
        case 'minus-back': results = [pathfinderMinusBack(a, b)]; break;
        case 'intersect': results = [pathfinderIntersect(a, b)]; break;
        case 'exclude': results = [pathfinderExclude(a, b)]; break;
        case 'divide': results = pathfinderDivide(a, b); break;
        default: return prev;
      }

      const entities = { ...prev.scene.entities };
      delete entities[ids[0]];
      delete entities[ids[1]];
      results.forEach(r => { entities[r.id] = r; });

      const layers = prev.scene.layers.map(l => ({
        ...l,
        entities: l.entities.filter(eid => !ids.includes(eid)),
      }));
      const activeLayer = layers.find(l => l.id === prev.scene.activeLayerId);
      if (activeLayer) results.forEach(r => activeLayer.entities.push(r.id));

      return {
        ...prev,
        scene: { ...prev.scene, entities, layers },
        selection: { ...prev.selection, selectedIds: results.map(r => r.id) },
      };
    });
  }, []);

  // ── SPRINT 2: Scissors Tool ──

  const applyScissors = useCallback((worldPoint: Vec2) => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length !== 1) return prev;
      const entity = prev.scene.entities[ids[0]];
      if (!entity) return prev;

      const converted = ensurePathData(entity);
      const results = scissorsAtPoint(converted, worldPoint);
      if (results.length <= 1 && results[0]?.id === converted.id) return prev;

      const entities = { ...prev.scene.entities };
      delete entities[ids[0]];
      results.forEach(r => { entities[r.id] = r; });

      const layers = prev.scene.layers.map(l => ({
        ...l,
        entities: l.entities.filter(eid => eid !== ids[0]),
      }));
      const activeLayer = layers.find(l => l.id === prev.scene.activeLayerId);
      if (activeLayer) results.forEach(r => activeLayer.entities.push(r.id));

      return {
        ...prev,
        scene: { ...prev.scene, entities, layers },
        selection: { ...prev.selection, selectedIds: results.map(r => r.id) },
      };
    });
  }, []);

  // ── SPRINT 2: Knife Tool ──

  const beginKnifeCut = useCallback((world: Vec2) => {
    setKnifePath([world]);
    setIsKnifeCutting(true);
  }, []);

  const updateKnifeCut = useCallback((world: Vec2) => {
    if (!isKnifeCutting) return;
    setKnifePath(prev => [...prev, world]);
  }, [isKnifeCutting]);

  const endKnifeCut = useCallback(() => {
    setIsKnifeCutting(false);
    if (knifePath.length < 2) { setKnifePath([]); return; }

    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length !== 1) return prev;
      const entity = prev.scene.entities[ids[0]];
      if (!entity) return prev;

      const converted = ensurePathData(entity);
      const results = knifeCut(converted, knifePath);
      if (results.length <= 1) return prev;

      const entities = { ...prev.scene.entities };
      delete entities[ids[0]];
      results.forEach(r => { entities[r.id] = r; });

      const layers = prev.scene.layers.map(l => ({
        ...l,
        entities: l.entities.filter(eid => eid !== ids[0]),
      }));
      const activeLayer = layers.find(l => l.id === prev.scene.activeLayerId);
      if (activeLayer) results.forEach(r => activeLayer.entities.push(r.id));

      return {
        ...prev,
        scene: { ...prev.scene, entities, layers },
        selection: { ...prev.selection, selectedIds: results.map(r => r.id) },
      };
    });

    setKnifePath([]);
  }, [knifePath, isKnifeCutting]);

  // ── SPRINT 2: Groups ──

  const groupSelected = useCallback(() => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length < 2) return prev;

      const selectedEntities = ids.map(id => prev.scene.entities[id]).filter(Boolean);
      const { group, removedIds } = createGroup(selectedEntities);

      const entities = { ...prev.scene.entities };
      // Keep children in entities dict (they're referenced by group.children)
      selectedEntities.forEach(e => { entities[e.id] = { ...e, parentId: group.id }; });
      entities[group.id] = group;

      // Replace children in layer with group
      const layers = prev.scene.layers.map(l => {
        const filtered = l.entities.filter(eid => !removedIds.includes(eid));
        if (l.id === prev.scene.activeLayerId) {
          return { ...l, entities: [...filtered, group.id] };
        }
        return { ...l, entities: filtered };
      });

      return {
        ...prev,
        scene: { ...prev.scene, entities, layers },
        selection: { ...prev.selection, selectedIds: [group.id] },
      };
    });
  }, []);

  const ungroupSelected = useCallback(() => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length !== 1) return prev;
      const group = prev.scene.entities[ids[0]];
      if (!group || group.type !== 'group') return prev;

      const { restoredEntities, removedGroupId } = ungroup(group, prev.scene.entities);

      const entities = { ...prev.scene.entities };
      delete entities[removedGroupId];
      restoredEntities.forEach(e => { entities[e.id] = e; });

      const layers = prev.scene.layers.map(l => {
        const filtered = l.entities.filter(eid => eid !== removedGroupId);
        if (l.id === prev.scene.activeLayerId) {
          return { ...l, entities: [...filtered, ...restoredEntities.map(e => e.id)] };
        }
        return { ...l, entities: filtered };
      });

      return {
        ...prev,
        scene: { ...prev.scene, entities, layers },
        selection: { ...prev.selection, selectedIds: restoredEntities.map(e => e.id) },
      };
    });
  }, []);

  // ── SPRINT 2: Isolation Mode ──

  const enterIsolationMode = useCallback((groupId: string) => {
    const newIsolation = enterIsolation(groupId, state.scene.entities, state.scene.layers, isolation);
    setIsolation(newIsolation);
  }, [state.scene, isolation]);

  const exitIsolationMode = useCallback(() => {
    const newIsolation = exitIsolation(isolation, state.scene.entities, state.scene.layers);
    setIsolation(newIsolation);
  }, [isolation, state.scene]);

  // ── SPRINT 2: Gradient Tool ──

  const applyGradient = useCallback((entityId: string, gradient: GradientData) => {
    setState(prev => {
      const entity = prev.scene.entities[entityId];
      if (!entity) return prev;
      const updated = applyGradientToEntity(entity, gradient);
      return {
        ...prev,
        scene: { ...prev.scene, entities: { ...prev.scene.entities, [entityId]: updated } },
      };
    });
  }, []);

  // ── SPRINT 2: Alignment ──

  const alignSelected = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    setState(prev => {
      const entities = prev.selection.selectedIds.map(id => prev.scene.entities[id]).filter(Boolean);
      if (entities.length === 0) return prev;

      const ab = prev.scene.artboards[0];
      const moves = alignEntities(
        entities, alignment,
        entities.length === 1 && ab ? 'artboard' : 'selection',
        ab ? { x: ab.x, y: ab.y, width: ab.width, height: ab.height } : undefined
      );

      const updatedEntities = { ...prev.scene.entities };
      for (const [id, pos] of moves) {
        const e = updatedEntities[id];
        if (e) {
          updatedEntities[id] = {
            ...e,
            transform: { ...e.transform, translateX: pos.x, translateY: pos.y },
          };
        }
      }

      return { ...prev, scene: { ...prev.scene, entities: updatedEntities } };
    });
  }, []);

  const distributeSelected = useCallback((axis: 'horizontal' | 'vertical') => {
    setState(prev => {
      const entities = prev.selection.selectedIds.map(id => prev.scene.entities[id]).filter(Boolean);
      if (entities.length < 3) return prev;

      const moves = distributeEntities(entities, axis);
      const updatedEntities = { ...prev.scene.entities };
      for (const [id, pos] of moves) {
        const e = updatedEntities[id];
        if (e) {
          updatedEntities[id] = {
            ...e,
            transform: { ...e.transform, translateX: pos.x, translateY: pos.y },
          };
        }
      }

      return { ...prev, scene: { ...prev.scene, entities: updatedEntities } };
    });
  }, []);

  // ── SPRINT 2: Arrange ──

  const arrangeEntity = useCallback((action: 'front' | 'back' | 'forward' | 'backward') => {
    setState(prev => {
      const ids = prev.selection.selectedIds;
      if (ids.length !== 1) return prev;
      const entityId = ids[0];

      const layers = prev.scene.layers.map(l => {
        if (!l.entities.includes(entityId)) return l;
        let newEntities: string[];
        switch (action) {
          case 'front': newEntities = bringToFront(l.entities, entityId); break;
          case 'back': newEntities = sendToBack(l.entities, entityId); break;
          case 'forward': newEntities = bringForward(l.entities, entityId); break;
          case 'backward': newEntities = sendBackward(l.entities, entityId); break;
          default: newEntities = l.entities;
        }
        return { ...l, entities: newEntities };
      });

      return { ...prev, scene: { ...prev.scene, layers } };
    });
  }, []);

  // ── SVG Export ──

  const exportSVG = useCallback((): string => {
    return exportSceneToSVG(state.scene);
  }, [state.scene]);

  const downloadSVG = useCallback((filename: string = 'design.svg') => {
    const svg = exportSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSVG]);

  // ── Export PNG ──

  const downloadPNG = useCallback((scale: number = 2) => {
    const ab = state.scene.artboards[0];
    if (!ab) return;
    const canvas = document.createElement('canvas');
    canvas.width = ab.width * scale;
    canvas.height = ab.height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.fillStyle = ab.backgroundColor;
    ctx.fillRect(0, 0, ab.width, ab.height);
    const link = document.createElement('a');
    link.download = 'design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [state.scene]);

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
    setFontSize,
    setFontFamily,
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
    // Pen tool (with handle dragging)
    addPenAnchor,
    beginPenHandleDrag,
    updatePenHandleDrag,
    endPenHandleDrag,
    updatePenCursor,
    finishPenPath,
    penAnchors,
    isPenDragging,
    // Text tool
    addTextEntity,
    updateTextContent,
    editingTextId,
    setEditingTextId,
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
    // Sprint 2: Scissors/Knife
    applyScissors,
    beginKnifeCut,
    updateKnifeCut,
    endKnifeCut,
    knifePath,
    isKnifeCutting,
    // Sprint 2: Groups
    groupSelected,
    ungroupSelected,
    // Sprint 2: Isolation
    isolation,
    enterIsolationMode,
    exitIsolationMode,
    // Sprint 2: Gradient
    activeGradient,
    setActiveGradient,
    gradientEditTarget,
    setGradientEditTarget,
    applyGradient,
    gradientPresets: GRADIENT_PRESETS,
    // Sprint 2: Alignment
    alignSelected,
    distributeSelected,
    // Sprint 2: Arrange
    arrangeEntity,
    // Export
    exportSVG,
    downloadSVG,
    downloadPNG,
  };
}
