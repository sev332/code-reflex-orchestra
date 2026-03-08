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
  };
}
