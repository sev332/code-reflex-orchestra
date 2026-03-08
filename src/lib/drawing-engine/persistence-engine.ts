/**
 * Persistence Engine — Sprint 6
 * Native .lucid format, IndexedDB auto-save, version history
 * Inspired by PRINCIPIA MORPHICA's "substrate-aligned" philosophy:
 * data is stored in structures optimized for the browser's native capabilities.
 */

import { EditorState, Scene, DrawableEntity, Layer, Artboard } from './types';

// ============================================
// LUCID FILE FORMAT (v1)
// ============================================

export interface LucidFile {
  format: 'lucid';
  version: 1;
  metadata: {
    name: string;
    created: string;
    modified: string;
    author: string;
    description: string;
  };
  scene: Scene;
  viewport: {
    panX: number;
    panY: number;
    zoom: number;
  };
  settings: {
    gridEnabled: boolean;
    gridSize: number;
    snapEnabled: boolean;
    rulerEnabled: boolean;
  };
}

export function serializeToLucid(state: EditorState, name: string = 'Untitled'): LucidFile {
  const now = new Date().toISOString();
  return {
    format: 'lucid',
    version: 1,
    metadata: {
      name,
      created: now,
      modified: now,
      author: 'LUCID Illustrator',
      description: '',
    },
    scene: {
      ...state.scene,
      // Strip non-serializable data
      entities: Object.fromEntries(
        Object.entries(state.scene.entities).map(([id, entity]) => [
          id,
          { ...entity },
        ])
      ),
    },
    viewport: {
      panX: state.viewport.panX,
      panY: state.viewport.panY,
      zoom: state.viewport.zoom,
    },
    settings: {
      gridEnabled: state.gridEnabled,
      gridSize: state.gridSize,
      snapEnabled: state.snapEnabled,
      rulerEnabled: state.rulerEnabled,
    },
  };
}

export function deserializeLucid(json: string): LucidFile | null {
  try {
    const data = JSON.parse(json);
    if (data.format !== 'lucid' || data.version !== 1) {
      console.warn('Unknown file format or version');
      return null;
    }
    return data as LucidFile;
  } catch (e) {
    console.error('Failed to parse .lucid file:', e);
    return null;
  }
}

// ============================================
// INDEXEDDB AUTO-SAVE
// ============================================

const DB_NAME = 'lucid-illustrator';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const VERSIONS_STORE = 'versions';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
        const store = db.createObjectStore(VERSIONS_STORE, { keyPath: 'id' });
        store.createIndex('documentId', 'documentId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface SavedDocument {
  id: string;
  name: string;
  data: LucidFile;
  thumbnail?: string;
  lastSaved: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  timestamp: string;
  data: LucidFile;
  label?: string;
}

export async function autoSave(docId: string, state: EditorState, name: string): Promise<void> {
  try {
    const db = await openDB();
    const lucidData = serializeToLucid(state, name);
    lucidData.metadata.modified = new Date().toISOString();

    const saved: SavedDocument = {
      id: docId,
      name,
      data: lucidData,
      lastSaved: new Date().toISOString(),
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(saved);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Auto-save failed:', e);
  }
}

export async function saveVersion(docId: string, state: EditorState, name: string, label?: string): Promise<void> {
  try {
    const db = await openDB();
    const version: DocumentVersion = {
      id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      documentId: docId,
      timestamp: new Date().toISOString(),
      data: serializeToLucid(state, name),
      label,
    };

    const tx = db.transaction(VERSIONS_STORE, 'readwrite');
    tx.objectStore(VERSIONS_STORE).put(version);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Save version failed:', e);
  }
}

export async function loadDocument(docId: string): Promise<SavedDocument | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(docId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

export async function listDocuments(): Promise<SavedDocument[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('List documents failed:', e);
    return [];
  }
}

export async function deleteDocument(docId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(docId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error('Delete failed:', e);
  }
}

export async function getVersionHistory(docId: string): Promise<DocumentVersion[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(VERSIONS_STORE, 'readonly');
    const index = tx.objectStore(VERSIONS_STORE).index('documentId');
    const request = index.getAll(docId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const versions = (request.result ?? []) as DocumentVersion[];
        versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(versions);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Get versions failed:', e);
    return [];
  }
}

// ============================================
// DOWNLOAD / UPLOAD FILE
// ============================================

export function downloadLucidFile(state: EditorState, name: string): void {
  const lucid = serializeToLucid(state, name);
  const json = JSON.stringify(lucid, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_')}.lucid`;
  a.click();
  URL.revokeObjectURL(url);
}

export function uploadLucidFile(): Promise<LucidFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.lucid,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const text = await file.text();
      resolve(deserializeLucid(text));
    };
    input.click();
  });
}
