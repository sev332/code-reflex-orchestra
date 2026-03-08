// React hook for Drawing Engine state management
import { useState, useCallback, useRef } from 'react';
import {
  EditorState, DrawableEntity, ToolId, Vec2, Command, generateId,
} from './types';
import {
  createDefaultEditorState, CommandHistory,
  createRectEntity, createEllipseEntity, createLineEntity, createBrushStrokeEntity,
  hitTest, getEntityBounds,
} from './engine';

export function useDrawingEngine() {
  const [state, setState] = useState<EditorState>(createDefaultEditorState);
  const historyRef = useRef(new CommandHistory());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistory = useCallback(() => {
    setCanUndo(historyRef.current.canUndo);
    setCanRedo(historyRef.current.canRedo);
  }, []);

  const executeCommand = useCallback((label: string, doFn: (s: EditorState) => EditorState, undoState: EditorState) => {
    const cmd: Command = {
      id: generateId(),
      label,
      timestamp: Date.now(),
      execute: () => setState(prev => doFn(prev)),
      undo: () => setState(undoState),
    };
    historyRef.current.execute(cmd);
    updateHistory();
  }, [updateHistory]);

  const undo = useCallback(() => {
    historyRef.current.undo();
    updateHistory();
  }, [updateHistory]);

  const redo = useCallback(() => {
    historyRef.current.redo();
    updateHistory();
  }, [updateHistory]);

  const setTool = useCallback((toolId: ToolId) => {
    setState(prev => ({ ...prev, tool: { ...prev.tool, activeToolId: toolId } }));
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

  const hitTestAtPoint = useCallback((screenPoint: Vec2): string | null => {
    const { viewport, scene } = state;
    const worldPoint: Vec2 = {
      x: screenPoint.x / viewport.zoom - viewport.panX,
      y: screenPoint.y / viewport.zoom - viewport.panY,
    };
    // Reverse layer order for top-first hit testing
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
    canUndo,
    canRedo,
    undo,
    redo,
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
    createRectEntity,
    createEllipseEntity,
    createLineEntity,
    createBrushStrokeEntity,
  };
}
