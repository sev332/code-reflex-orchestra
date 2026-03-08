// History Manager — Undo/Redo with snapshot-based state management

export interface HistorySnapshot {
  id: string;
  label: string;
  timestamp: number;
  layerSnapshots: Map<string, ImageData>;
}

export class HistoryManager {
  private stack: HistorySnapshot[] = [];
  private pointer = -1;
  private maxSize = 50;

  push(label: string, layers: Array<{ id: string; canvas: HTMLCanvasElement }>): void {
    // Truncate future
    this.stack = this.stack.slice(0, this.pointer + 1);

    const snapshot: HistorySnapshot = {
      id: Math.random().toString(36).slice(2, 10),
      label,
      timestamp: Date.now(),
      layerSnapshots: new Map(),
    };

    for (const layer of layers) {
      const ctx = layer.canvas.getContext('2d')!;
      const data = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
      snapshot.layerSnapshots.set(layer.id, data);
    }

    this.stack.push(snapshot);
    if (this.stack.length > this.maxSize) this.stack.shift();
    else this.pointer++;
  }

  undo(): HistorySnapshot | null {
    if (this.pointer <= 0) return null;
    this.pointer--;
    return this.stack[this.pointer];
  }

  redo(): HistorySnapshot | null {
    if (this.pointer >= this.stack.length - 1) return null;
    this.pointer++;
    return this.stack[this.pointer];
  }

  restoreSnapshot(snapshot: HistorySnapshot, layers: Array<{ id: string; canvas: HTMLCanvasElement }>): void {
    for (const layer of layers) {
      const data = snapshot.layerSnapshots.get(layer.id);
      if (data) {
        const ctx = layer.canvas.getContext('2d')!;
        layer.canvas.width = data.width;
        layer.canvas.height = data.height;
        ctx.putImageData(data, 0, 0);
      }
    }
  }

  get canUndo() { return this.pointer > 0; }
  get canRedo() { return this.pointer < this.stack.length - 1; }
  get currentLabel() { return this.pointer >= 0 ? this.stack[this.pointer].label : null; }
  get historyList() { return this.stack.map((s, i) => ({ label: s.label, active: i === this.pointer })); }
}
