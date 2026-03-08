// Pro-grade spreadsheet: extended formulas, conditional formatting, working toolbar, freeze panes, drag-select
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Plus, Wand2, BarChart3, PieChart, TrendingUp,
  Undo2, Redo2, PaintBucket, Type, Filter, SortAsc, Sigma,
  Snowflake, Grid3X3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────
const COLS = 26;
const ROWS = 200;
const DEFAULT_COL_WIDTH = 100;
const ROW_HEIGHT = 28;
const HEADER_HEIGHT = 28;
const ROW_HEADER_WIDTH = 50;

// ─── Types ──────────────────────────────────
type CellFormat = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  bg?: string;
  color?: string;
  conditionalRule?: ConditionalRule;
};

type CellData = {
  value: string;
  formula?: string;
  format?: CellFormat;
};

type SheetData = Record<string, CellData>;

type ConditionalRule = {
  type: 'greaterThan' | 'lessThan' | 'equals' | 'contains' | 'empty' | 'notEmpty';
  value?: string;
  bgColor: string;
  textColor: string;
};

type UndoEntry = { data: SheetData; desc: string };

// ─── Utility Functions ──────────────────────
function colLabel(i: number): string {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function colIndex(label: string): number {
  let n = 0;
  for (let i = 0; i < label.length; i++) {
    n = n * 26 + (label.charCodeAt(i) - 64);
  }
  return n - 1;
}

function cellKey(col: number, row: number) { return `${colLabel(col)}${row + 1}`; }

function parseCellRef(ref: string): { col: number; row: number } | null {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { col: colIndex(m[1]), row: parseInt(m[2]) - 1 };
}

function rangeIterator(sc: string, sr: string, ec: string, er: string) {
  const startCol = colIndex(sc), endCol = colIndex(ec);
  const startRow = parseInt(sr) - 1, endRow = parseInt(er) - 1;
  const cells: { col: number; row: number }[] = [];
  for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++)
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++)
      cells.push({ col: c, row: r });
  return cells;
}

// ─── Formula Engine ─────────────────────────
function evaluateFormula(formula: string, cells: SheetData, visited: Set<string> = new Set()): string {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1).toUpperCase().trim();

  // Prevent circular refs
  const selfKey = formula;
  if (visited.has(selfKey)) return '#CIRC';
  visited.add(selfKey);

  // Range functions
  const rangeFnMatch = expr.match(/^(SUM|AVERAGE|COUNT|COUNTIF|MAX|MIN|COUNTA)\(([A-Z]+)(\d+):([A-Z]+)(\d+)(?:,\s*"?([^"]*)"?)?\)$/);
  if (rangeFnMatch) {
    const [, fn, sc, sr, ec, er, criteria] = rangeFnMatch;
    const rangeCells = rangeIterator(sc, sr, ec, er);
    const values = rangeCells.map(({ col, row }) => {
      const k = cellKey(col, row);
      const c = cells[k];
      if (!c) return '';
      if (c.formula) return evaluateFormula(c.formula, cells, new Set(visited));
      return c.value || '';
    });

    switch (fn) {
      case 'SUM': return values.reduce((s, v) => s + (parseFloat(v) || 0), 0).toString();
      case 'AVERAGE': {
        const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
        return nums.length ? (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2) : '0';
      }
      case 'COUNT': return values.filter(v => !isNaN(parseFloat(v))).length.toString();
      case 'COUNTA': return values.filter(v => v !== '').length.toString();
      case 'MAX': {
        const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
        return nums.length ? Math.max(...nums).toString() : '0';
      }
      case 'MIN': {
        const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
        return nums.length ? Math.min(...nums).toString() : '0';
      }
      case 'COUNTIF': {
        if (!criteria) return '#ERR';
        const op = criteria.startsWith('>') ? '>' : criteria.startsWith('<') ? '<' : criteria.startsWith('=') ? '=' : 'eq';
        const cVal = op !== 'eq' ? parseFloat(criteria.slice(1)) : criteria;
        return values.filter(v => {
          const n = parseFloat(v);
          if (op === '>') return !isNaN(n) && n > (cVal as number);
          if (op === '<') return !isNaN(n) && n < (cVal as number);
          if (op === '=') return !isNaN(n) && n === (cVal as number);
          return v.toLowerCase() === (cVal as string).toLowerCase();
        }).length.toString();
      }
    }
  }

  // IF(condition, trueVal, falseVal)
  const ifMatch = expr.match(/^IF\((.+),(.+),(.+)\)$/);
  if (ifMatch) {
    let [, cond, trueVal, falseVal] = ifMatch;
    // Resolve condition
    const condOps = cond.match(/([A-Z]+\d+|[\d.]+)\s*([><=!]+)\s*([A-Z]+\d+|[\d.]+)/);
    if (condOps) {
      const resolveVal = (v: string) => {
        const ref = parseCellRef(v.trim());
        if (ref) {
          const c = cells[cellKey(ref.col, ref.row)];
          return parseFloat(c?.formula ? evaluateFormula(c.formula, cells, new Set(visited)) : c?.value || '0');
        }
        return parseFloat(v);
      };
      const left = resolveVal(condOps[1]);
      const right = resolveVal(condOps[3]);
      const op = condOps[2];
      let result = false;
      if (op === '>') result = left > right;
      else if (op === '<') result = left < right;
      else if (op === '>=' || op === '=>') result = left >= right;
      else if (op === '<=' || op === '=<') result = left <= right;
      else if (op === '=' || op === '==') result = left === right;
      else if (op === '!=' || op === '<>') result = left !== right;

      const resolveTerm = (t: string) => {
        t = t.trim().replace(/^"|"$/g, '');
        const ref = parseCellRef(t);
        if (ref) {
          const c = cells[cellKey(ref.col, ref.row)];
          return c?.formula ? evaluateFormula(c.formula, cells, new Set(visited)) : c?.value || '';
        }
        return t;
      };
      return resolveTerm(result ? trueVal : falseVal);
    }
  }

  // VLOOKUP(value, range, colIndex, [exactMatch])
  const vlookupMatch = expr.match(/^VLOOKUP\(([^,]+),([A-Z]+)(\d+):([A-Z]+)(\d+),(\d+)(?:,(TRUE|FALSE|0|1))?\)$/);
  if (vlookupMatch) {
    const [, lookupExpr, sc, sr, ec, er, colIdx] = vlookupMatch;
    const lookupRef = parseCellRef(lookupExpr.trim());
    const lookupVal = lookupRef
      ? (cells[cellKey(lookupRef.col, lookupRef.row)]?.value || '')
      : lookupExpr.trim().replace(/^"|"$/g, '');
    const startCol = colIndex(sc), endCol = colIndex(ec);
    const startRow = parseInt(sr) - 1, endRow = parseInt(er) - 1;
    const targetCol = startCol + parseInt(colIdx) - 1;

    for (let r = startRow; r <= endRow; r++) {
      const cellVal = cells[cellKey(startCol, r)]?.value || '';
      if (cellVal.toLowerCase() === lookupVal.toLowerCase()) {
        if (targetCol <= endCol) {
          return cells[cellKey(targetCol, r)]?.value || '';
        }
      }
    }
    return '#N/A';
  }

  // CONCATENATE / CONCAT
  const concatMatch = expr.match(/^CONCAT(?:ENATE)?\((.+)\)$/);
  if (concatMatch) {
    const args = concatMatch[1].split(',').map(a => {
      a = a.trim().replace(/^"|"$/g, '');
      const ref = parseCellRef(a);
      if (ref) return cells[cellKey(ref.col, ref.row)]?.value || '';
      return a;
    });
    return args.join('');
  }

  // ABS, ROUND, SQRT, POW
  const mathFnMatch = expr.match(/^(ABS|ROUND|SQRT|INT)\(([^)]+)\)$/);
  if (mathFnMatch) {
    const [, fn, arg] = mathFnMatch;
    const ref = parseCellRef(arg.trim());
    const val = ref ? parseFloat(cells[cellKey(ref.col, ref.row)]?.value || '0') : parseFloat(arg);
    if (isNaN(val)) return '#ERR';
    if (fn === 'ABS') return Math.abs(val).toString();
    if (fn === 'ROUND') return Math.round(val).toString();
    if (fn === 'SQRT') return val >= 0 ? Math.sqrt(val).toFixed(4) : '#ERR';
    if (fn === 'INT') return Math.floor(val).toString();
  }

  // Cell reference
  const refMatch = expr.match(/^([A-Z]+\d+)$/);
  if (refMatch) {
    const c = cells[expr];
    if (c?.formula) return evaluateFormula(c.formula, cells, new Set(visited));
    return c?.value || '0';
  }

  // Basic arithmetic with cell references
  try {
    const resolved = expr.replace(/([A-Z]+\d+)/g, (m) => {
      const c = cells[m];
      if (c?.formula) return evaluateFormula(c.formula, cells, new Set(visited));
      return c?.value || '0';
    });
    const result = Function(`"use strict"; return (${resolved})`)();
    return typeof result === 'number' ? (Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '')) : String(result);
  } catch { return '#ERR'; }
}

// ─── Conditional Formatting Evaluator ───────
function evaluateConditional(value: string, rule: ConditionalRule): boolean {
  const num = parseFloat(value);
  switch (rule.type) {
    case 'greaterThan': return !isNaN(num) && num > parseFloat(rule.value || '0');
    case 'lessThan': return !isNaN(num) && num < parseFloat(rule.value || '0');
    case 'equals': return value === rule.value;
    case 'contains': return value.toLowerCase().includes((rule.value || '').toLowerCase());
    case 'empty': return value === '';
    case 'notEmpty': return value !== '';
  }
}

// ─── Color Picker Presets ───────────────────
const BG_COLORS = [
  'hsl(0 0% 100% / 0)', 'hsl(0 75% 55% / 0.2)', 'hsl(30 100% 55% / 0.2)',
  'hsl(50 100% 55% / 0.2)', 'hsl(120 70% 45% / 0.2)', 'hsl(193 100% 50% / 0.2)',
  'hsl(270 80% 60% / 0.2)', 'hsl(300 70% 55% / 0.2)',
];

const TEXT_COLORS = [
  'hsl(220 10% 80%)', 'hsl(0 90% 65%)', 'hsl(30 100% 65%)',
  'hsl(50 100% 65%)', 'hsl(120 80% 55%)', 'hsl(193 100% 65%)',
  'hsl(270 90% 75%)', 'hsl(300 80% 70%)',
];

// ─── Main Component ─────────────────────────
export function SpreadsheetPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sheets, setSheets] = useState<{ name: string; data: SheetData }[]>([
    { name: 'Sheet 1', data: {} },
  ]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [selectionRange, setSelectionRange] = useState<{
    startCol: number; startRow: number; endCol: number; endRow: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [freezeRow, setFreezeRow] = useState(0);
  const [freezeCol, setFreezeCol] = useState(0);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);

  const cells = sheets[activeSheet]?.data || {};

  const pushUndo = useCallback((desc: string) => {
    setUndoStack(prev => [...prev.slice(-30), { data: { ...cells }, desc }]);
    setRedoStack([]);
  }, [cells]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { data: { ...cells }, desc: 'redo' }]);
    setSheets(prev => {
      const ns = [...prev];
      ns[activeSheet] = { ...ns[activeSheet], data: last.data };
      return ns;
    });
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, cells, activeSheet]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { data: { ...cells }, desc: 'undo' }]);
    setSheets(prev => {
      const ns = [...prev];
      ns[activeSheet] = { ...ns[activeSheet], data: last.data };
      return ns;
    });
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, cells, activeSheet]);

  const getCellDisplay = useCallback((col: number, row: number) => {
    const key = cellKey(col, row);
    const cell = cells[key];
    if (!cell) return '';
    if (cell.formula) return evaluateFormula(cell.formula, cells);
    return cell.value || '';
  }, [cells]);

  // ─── Apply formatting to selected cells ───
  const applyFormat = useCallback((update: Partial<CellFormat>) => {
    pushUndo('format');
    const targets: string[] = [];
    if (selectionRange) {
      const { startCol: sc, startRow: sr, endCol: ec, endRow: er } = selectionRange;
      for (let c = Math.min(sc, ec); c <= Math.max(sc, ec); c++)
        for (let r = Math.min(sr, er); r <= Math.max(sr, er); r++)
          targets.push(cellKey(c, r));
    } else if (selectedCell) {
      targets.push(cellKey(selectedCell.col, selectedCell.row));
    }
    if (targets.length === 0) return;

    setSheets(prev => {
      const ns = [...prev];
      const data = { ...ns[activeSheet].data };
      targets.forEach(key => {
        data[key] = { ...data[key], value: data[key]?.value || '', format: { ...data[key]?.format, ...update } };
      });
      ns[activeSheet] = { ...ns[activeSheet], data };
      return ns;
    });
  }, [selectedCell, selectionRange, activeSheet, pushUndo]);

  // ─── Canvas Rendering ─────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const visibleCols = Math.ceil(rect.width / DEFAULT_COL_WIDTH) + 2;
    const visibleRows = Math.ceil(rect.height / ROW_HEIGHT) + 2;
    const startCol = Math.max(freezeCol, Math.floor(scrollOffset.x / DEFAULT_COL_WIDTH));
    const startRow = Math.max(freezeRow, Math.floor(scrollOffset.y / ROW_HEIGHT));

    // Background
    ctx.fillStyle = 'hsl(220, 27%, 6%)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Row header bg
    ctx.fillStyle = 'hsl(220, 25%, 9%)';
    ctx.fillRect(0, 0, ROW_HEADER_WIDTH, rect.height);

    // Col header bg
    ctx.fillStyle = 'hsl(220, 25%, 9%)';
    ctx.fillRect(0, 0, rect.width, HEADER_HEIGHT);

    // Corner
    ctx.fillStyle = 'hsl(220, 25%, 7%)';
    ctx.fillRect(0, 0, ROW_HEADER_WIDTH, HEADER_HEIGHT);

    // Freeze indicator lines
    if (freezeRow > 0) {
      const fy = HEADER_HEIGHT + freezeRow * ROW_HEIGHT - scrollOffset.y;
      ctx.strokeStyle = 'hsl(193, 100%, 50%)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(rect.width, fy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (freezeCol > 0) {
      const fx = ROW_HEADER_WIDTH + freezeCol * DEFAULT_COL_WIDTH - scrollOffset.x;
      ctx.strokeStyle = 'hsl(193, 100%, 50%)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(fx, 0);
      ctx.lineTo(fx, rect.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Grid + cells
    ctx.strokeStyle = 'hsla(220, 15%, 22%, 0.35)';
    ctx.lineWidth = 0.5;

    // Draw frozen rows first
    const drawCell = (col: number, row: number) => {
      const x = ROW_HEADER_WIDTH + col * DEFAULT_COL_WIDTH - scrollOffset.x;
      const y = HEADER_HEIGHT + row * ROW_HEIGHT - scrollOffset.y;
      if (x + DEFAULT_COL_WIDTH < ROW_HEADER_WIDTH || y + ROW_HEIGHT < HEADER_HEIGHT) return;

      const key = cellKey(col, row);
      const cellData = cells[key];
      const isSelected = selectedCell?.col === col && selectedCell?.row === row;
      const inRange = selectionRange &&
        col >= Math.min(selectionRange.startCol, selectionRange.endCol) &&
        col <= Math.max(selectionRange.startCol, selectionRange.endCol) &&
        row >= Math.min(selectionRange.startRow, selectionRange.endRow) &&
        row <= Math.max(selectionRange.startRow, selectionRange.endRow);

      // Cell background
      const display = getCellDisplay(col, row);
      let appliedBg: string | null = null;
      let appliedColor: string | null = null;

      // Conditional formatting
      if (cellData?.format?.conditionalRule && display) {
        const rule = cellData.format.conditionalRule;
        if (evaluateConditional(display, rule)) {
          appliedBg = rule.bgColor;
          appliedColor = rule.textColor;
        }
      }

      if (cellData?.format?.bg) {
        ctx.fillStyle = cellData.format.bg;
        ctx.fillRect(x, y, DEFAULT_COL_WIDTH, ROW_HEIGHT);
      }
      if (appliedBg) {
        ctx.fillStyle = appliedBg;
        ctx.fillRect(x, y, DEFAULT_COL_WIDTH, ROW_HEIGHT);
      }

      if (inRange && !isSelected) {
        ctx.fillStyle = 'hsla(193, 80%, 50%, 0.08)';
        ctx.fillRect(x, y, DEFAULT_COL_WIDTH, ROW_HEIGHT);
      }

      if (isSelected) {
        ctx.fillStyle = 'hsla(193, 80%, 50%, 0.12)';
        ctx.fillRect(x, y, DEFAULT_COL_WIDTH, ROW_HEIGHT);
        ctx.strokeStyle = 'hsl(193, 100%, 50%)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 0.5, y + 0.5, DEFAULT_COL_WIDTH - 1, ROW_HEIGHT - 1);
        ctx.strokeStyle = 'hsla(220, 15%, 22%, 0.35)';
        ctx.lineWidth = 0.5;
      }

      // Grid lines
      ctx.beginPath();
      ctx.moveTo(x, y + ROW_HEIGHT);
      ctx.lineTo(x + DEFAULT_COL_WIDTH, y + ROW_HEIGHT);
      ctx.moveTo(x + DEFAULT_COL_WIDTH, y);
      ctx.lineTo(x + DEFAULT_COL_WIDTH, y + ROW_HEIGHT);
      ctx.stroke();

      // Text
      if (display) {
        const align = cellData?.format?.align || (isNaN(parseFloat(display)) ? 'left' : 'right');
        ctx.fillStyle = appliedColor || cellData?.format?.color || 'hsl(220, 10%, 80%)';
        const fontParts = [
          cellData?.format?.bold ? 'bold' : '',
          cellData?.format?.italic ? 'italic' : '',
          '12px',
          'Inter, system-ui, sans-serif',
        ].filter(Boolean).join(' ');
        ctx.font = fontParts;
        ctx.textAlign = align;
        const tx = align === 'left' ? x + 6 : align === 'right' ? x + DEFAULT_COL_WIDTH - 6 : x + DEFAULT_COL_WIDTH / 2;
        ctx.fillText(display, tx, y + ROW_HEIGHT / 2 + 4, DEFAULT_COL_WIDTH - 12);

        // Underline
        if (cellData?.format?.underline) {
          const metrics = ctx.measureText(display);
          const ux = align === 'left' ? x + 6 : align === 'right' ? x + DEFAULT_COL_WIDTH - 6 - metrics.width : x + DEFAULT_COL_WIDTH / 2 - metrics.width / 2;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ux, y + ROW_HEIGHT / 2 + 6);
          ctx.lineTo(ux + metrics.width, y + ROW_HEIGHT / 2 + 6);
          ctx.stroke();
          ctx.strokeStyle = 'hsla(220, 15%, 22%, 0.35)';
          ctx.lineWidth = 0.5;
        }
      }

      // Formula indicator
      if (cellData?.formula) {
        ctx.fillStyle = 'hsl(193, 100%, 50%)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 5, y);
        ctx.lineTo(x, y + 5);
        ctx.fill();
      }
    };

    for (let ci = 0; ci < visibleCols; ci++) {
      const col = startCol + ci;
      if (col >= COLS) break;
      const x = ROW_HEADER_WIDTH + col * DEFAULT_COL_WIDTH - scrollOffset.x;

      // Col header
      ctx.fillStyle = selectedCell?.col === col ? 'hsl(193, 80%, 65%)' : 'hsl(220, 10%, 55%)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(colLabel(col), x + DEFAULT_COL_WIDTH / 2, HEADER_HEIGHT / 2 + 4);

      for (let ri = 0; ri < visibleRows; ri++) {
        const row = startRow + ri;
        if (row >= ROWS) break;
        drawCell(col, row);
      }
    }

    // Row headers
    ctx.textAlign = 'center';
    ctx.font = '11px Inter, system-ui, sans-serif';
    for (let ri = 0; ri < visibleRows; ri++) {
      const row = startRow + ri;
      if (row >= ROWS) break;
      const y = HEADER_HEIGHT + row * ROW_HEIGHT - scrollOffset.y;
      ctx.fillStyle = selectedCell?.row === row ? 'hsl(193, 80%, 65%)' : 'hsl(220, 10%, 55%)';
      ctx.fillText(String(row + 1), ROW_HEADER_WIDTH / 2, y + ROW_HEIGHT / 2 + 4);
    }

    // Selection range border (marching ants style)
    if (selectionRange) {
      const { startCol: sc, startRow: sr, endCol: ec, endRow: er } = selectionRange;
      const rx = ROW_HEADER_WIDTH + Math.min(sc, ec) * DEFAULT_COL_WIDTH - scrollOffset.x;
      const ry = HEADER_HEIGHT + Math.min(sr, er) * ROW_HEIGHT - scrollOffset.y;
      const rw = (Math.abs(ec - sc) + 1) * DEFAULT_COL_WIDTH;
      const rh = (Math.abs(er - sr) + 1) * ROW_HEIGHT;
      ctx.strokeStyle = 'hsl(193, 100%, 50%)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);
    }

    // Header borders
    ctx.strokeStyle = 'hsla(220, 15%, 28%, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ROW_HEADER_WIDTH, 0);
    ctx.lineTo(ROW_HEADER_WIDTH, rect.height);
    ctx.moveTo(0, HEADER_HEIGHT);
    ctx.lineTo(rect.width, HEADER_HEIGHT);
    ctx.stroke();

  }, [cells, selectedCell, scrollOffset, selectionRange, getCellDisplay, freezeRow, freezeCol]);

  // ─── Mouse Handlers ───────────────────────
  const getCellFromMouse = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < ROW_HEADER_WIDTH || y < HEADER_HEIGHT) return null;
    const col = Math.floor((x - ROW_HEADER_WIDTH + scrollOffset.x) / DEFAULT_COL_WIDTH);
    const row = Math.floor((y - HEADER_HEIGHT + scrollOffset.y) / ROW_HEIGHT);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) return { col, row };
    return null;
  }, [scrollOffset]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromMouse(e);
    if (!cell) return;
    setSelectedCell(cell);
    setIsEditing(false);
    const key = cellKey(cell.col, cell.row);
    setEditValue(cells[key]?.formula || cells[key]?.value || '');
    setSelectionRange({ startCol: cell.col, startRow: cell.row, endCol: cell.col, endRow: cell.row });
    setIsDragging(true);
  }, [getCellFromMouse, cells]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectionRange) return;
    const cell = getCellFromMouse(e);
    if (!cell) return;
    setSelectionRange(prev => prev ? { ...prev, endCol: cell.col, endRow: cell.row } : null);
  }, [isDragging, selectionRange, getCellFromMouse]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Collapse to single cell if no actual range
    if (selectionRange && selectionRange.startCol === selectionRange.endCol && selectionRange.startRow === selectionRange.endRow) {
      setSelectionRange(null);
    }
  }, [selectionRange]);

  const handleDoubleClick = useCallback(() => {
    if (selectedCell) setIsEditing(true);
  }, [selectedCell]);

  const handleScroll = useCallback((e: React.WheelEvent) => {
    setScrollOffset(prev => ({
      x: Math.max(0, Math.min(COLS * DEFAULT_COL_WIDTH - 400, prev.x + (e.shiftKey ? e.deltaY : e.deltaX))),
      y: Math.max(0, Math.min(ROWS * ROW_HEIGHT - 400, prev.y + (e.shiftKey ? 0 : e.deltaY))),
    }));
  }, []);

  const commitEdit = useCallback(() => {
    if (!selectedCell) return;
    pushUndo('edit');
    const key = cellKey(selectedCell.col, selectedCell.row);
    setSheets(prev => {
      const ns = [...prev];
      const data = { ...ns[activeSheet].data };
      const isFormula = editValue.startsWith('=');
      data[key] = {
        ...data[key],
        value: isFormula ? evaluateFormula(editValue, data) : editValue,
        formula: isFormula ? editValue : undefined,
      };
      ns[activeSheet] = { ...ns[activeSheet], data };
      return ns;
    });
    setIsEditing(false);
  }, [selectedCell, editValue, activeSheet, pushUndo]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Undo/Redo shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      applyFormat({ bold: !(cells[selectedCell ? cellKey(selectedCell.col, selectedCell.row) : '']?.format?.bold) });
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      applyFormat({ italic: !(cells[selectedCell ? cellKey(selectedCell.col, selectedCell.row) : '']?.format?.italic) });
      return;
    }

    if (e.key === 'Enter') {
      if (isEditing) {
        commitEdit();
        if (selectedCell && selectedCell.row < ROWS - 1) {
          const nr = selectedCell.row + 1;
          setSelectedCell({ ...selectedCell, row: nr });
          setEditValue(cells[cellKey(selectedCell.col, nr)]?.formula || cells[cellKey(selectedCell.col, nr)]?.value || '');
        }
      } else {
        setIsEditing(true);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (isEditing) commitEdit();
      if (selectedCell && selectedCell.col < COLS - 1) {
        const nc = selectedCell.col + (e.shiftKey ? -1 : 1);
        if (nc >= 0 && nc < COLS) {
          setSelectedCell({ ...selectedCell, col: nc });
          setEditValue(cells[cellKey(nc, selectedCell.row)]?.formula || cells[cellKey(nc, selectedCell.row)]?.value || '');
        }
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      if (selectedCell) {
        const key = cellKey(selectedCell.col, selectedCell.row);
        setEditValue(cells[key]?.formula || cells[key]?.value || '');
      }
    } else if (!isEditing && selectedCell) {
      const nav: Record<string, [number, number]> = {
        ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      };
      if (nav[e.key]) {
        e.preventDefault();
        const [dc, dr] = nav[e.key];
        const nc = Math.max(0, Math.min(COLS - 1, selectedCell.col + dc));
        const nr = Math.max(0, Math.min(ROWS - 1, selectedCell.row + dr));

        if (e.shiftKey) {
          // Extend selection
          setSelectionRange(prev => prev
            ? { ...prev, endCol: nc, endRow: nr }
            : { startCol: selectedCell.col, startRow: selectedCell.row, endCol: nc, endRow: nr }
          );
        } else {
          setSelectionRange(null);
        }
        setSelectedCell({ col: nc, row: nr });
        setEditValue(cells[cellKey(nc, nr)]?.formula || cells[cellKey(nc, nr)]?.value || '');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        pushUndo('delete');
        if (selectionRange) {
          setSheets(prev => {
            const ns = [...prev];
            const data = { ...ns[activeSheet].data };
            const { startCol: sc, startRow: sr, endCol: ec, endRow: er } = selectionRange;
            for (let c = Math.min(sc, ec); c <= Math.max(sc, ec); c++)
              for (let r = Math.min(sr, er); r <= Math.max(sr, er); r++)
                delete data[cellKey(c, r)];
            ns[activeSheet] = { ...ns[activeSheet], data };
            return ns;
          });
        } else {
          const key = cellKey(selectedCell.col, selectedCell.row);
          setSheets(prev => {
            const ns = [...prev];
            const data = { ...ns[activeSheet].data };
            delete data[key];
            ns[activeSheet] = { ...ns[activeSheet], data };
            return ns;
          });
        }
        setEditValue('');
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        setIsEditing(true);
        setEditValue(e.key);
      }
    }
  }, [isEditing, selectedCell, cells, commitEdit, activeSheet, undo, redo, applyFormat, pushUndo, selectionRange]);

  const addSheet = () => {
    setSheets(prev => [...prev, { name: `Sheet ${prev.length + 1}`, data: {} }]);
    setActiveSheet(sheets.length);
  };

  const selectedKey = selectedCell ? cellKey(selectedCell.col, selectedCell.row) : '';
  const selectedFormat = selectedCell ? cells[selectedKey]?.format : undefined;

  const aiQuickActions = [
    { label: 'Auto-fill pattern', icon: Wand2 },
    { label: 'Generate chart', icon: BarChart3 },
    { label: 'Summarize data', icon: Sigma },
    { label: 'Find trends', icon: TrendingUp },
    { label: 'Clean data', icon: Filter },
  ];

  const rangeLabel = selectionRange
    ? `${cellKey(Math.min(selectionRange.startCol, selectionRange.endCol), Math.min(selectionRange.startRow, selectionRange.endRow))}:${cellKey(Math.max(selectionRange.startCol, selectionRange.endCol), Math.max(selectionRange.startRow, selectionRange.endRow))}`
    : selectedKey;

  return (
    <div className="h-full flex flex-col bg-background" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border/30 bg-background/80 shrink-0">
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={undo} disabled={undoStack.length === 0}>
          <Undo2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={redo} disabled={redoStack.length === 0}>
          <Redo2 className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-border/30 mx-1" />

        <Button variant={selectedFormat?.bold ? 'secondary' : 'ghost'} size="icon" className="w-7 h-7"
          onClick={() => applyFormat({ bold: !selectedFormat?.bold })}>
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button variant={selectedFormat?.italic ? 'secondary' : 'ghost'} size="icon" className="w-7 h-7"
          onClick={() => applyFormat({ italic: !selectedFormat?.italic })}>
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button variant={selectedFormat?.underline ? 'secondary' : 'ghost'} size="icon" className="w-7 h-7"
          onClick={() => applyFormat({ underline: !selectedFormat?.underline })}>
          <Underline className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-border/30 mx-1" />

        <Button variant={selectedFormat?.align === 'left' ? 'secondary' : 'ghost'} size="icon" className="w-7 h-7"
          onClick={() => applyFormat({ align: 'left' })}>
          <AlignLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant={selectedFormat?.align === 'center' ? 'secondary' : 'ghost'} size="icon" className="w-7 h-7"
          onClick={() => applyFormat({ align: 'center' })}>
          <AlignCenter className="w-3.5 h-3.5" />
        </Button>
        <Button variant={selectedFormat?.align === 'right' ? 'secondary' : 'ghost'} size="icon" className="w-7 h-7"
          onClick={() => applyFormat({ align: 'right' })}>
          <AlignRight className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Background color picker */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setShowBgPicker(!showBgPicker); setShowTextPicker(false); }}>
            <PaintBucket className="w-3.5 h-3.5" />
          </Button>
          {showBgPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 grid grid-cols-4 gap-1">
              {BG_COLORS.map((c, i) => (
                <button key={i} className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c === 'hsl(0 0% 100% / 0)' ? 'transparent' : c }}
                  onClick={() => { applyFormat({ bg: c }); setShowBgPicker(false); }} />
              ))}
            </div>
          )}
        </div>

        {/* Text color picker */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setShowTextPicker(!showTextPicker); setShowBgPicker(false); }}>
            <Type className="w-3.5 h-3.5" />
          </Button>
          {showTextPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 grid grid-cols-4 gap-1">
              {TEXT_COLORS.map((c, i) => (
                <button key={i} className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform flex items-center justify-center"
                  onClick={() => { applyFormat({ color: c }); setShowTextPicker(false); }}>
                  <span className="font-bold text-xs" style={{ color: c }}>A</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-border/30 mx-1" />

        {/* Freeze panes */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={freezeRow > 0 || freezeCol > 0 ? 'secondary' : 'ghost'} size="icon" className="w-7 h-7">
              <Snowflake className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => { setFreezeRow(selectedCell?.row ? selectedCell.row : 0); }}>
              Freeze rows above
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setFreezeCol(selectedCell?.col ? selectedCell.col : 0); }}>
              Freeze columns left
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setFreezeRow(1); setFreezeCol(0); }}>Freeze top row</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setFreezeRow(0); setFreezeCol(1); }}>Freeze first column</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setFreezeRow(0); setFreezeCol(0); }}>Unfreeze all</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="w-7 h-7"><Filter className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="w-7 h-7"><SortAsc className="w-3.5 h-3.5" /></Button>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              <Wand2 className="w-3.5 h-3.5 text-primary" /> AI
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {aiQuickActions.map((a, i) => {
              const Icon = a.icon;
              return <DropdownMenuItem key={i}><Icon className="w-4 h-4 mr-2" />{a.label}</DropdownMenuItem>;
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Chart
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem><BarChart3 className="w-4 h-4 mr-2" />Bar Chart</DropdownMenuItem>
            <DropdownMenuItem><TrendingUp className="w-4 h-4 mr-2" />Line Chart</DropdownMenuItem>
            <DropdownMenuItem><PieChart className="w-4 h-4 mr-2" />Pie Chart</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-border/30 bg-background/60 shrink-0">
        <div className="w-24 text-center">
          <Badge variant="outline" className="text-xs font-mono px-2">{rangeLabel || '—'}</Badge>
        </div>
        <div className="w-px h-5 bg-border/30" />
        <span className="text-xs text-muted-foreground font-mono">fx</span>
        <Input
          value={editValue}
          onChange={(e) => { setEditValue(e.target.value); if (!isEditing) setIsEditing(true); }}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') { commitEdit(); e.stopPropagation(); } }}
          placeholder="Value or formula: =SUM, =AVERAGE, =IF, =VLOOKUP, =COUNTIF..."
          className="flex-1 h-7 text-sm font-mono bg-muted/20 border-none"
        />
      </div>

      {/* Canvas grid */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-cell" onWheel={handleScroll}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className="absolute inset-0"
        />
        {/* Inline editor overlay */}
        {isEditing && selectedCell && (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { commitEdit(); e.stopPropagation(); }
              if (e.key === 'Escape') { setIsEditing(false); e.stopPropagation(); }
              e.stopPropagation();
            }}
            className="absolute bg-background border-2 border-primary px-1 text-sm font-mono z-10 outline-none"
            style={{
              left: ROW_HEADER_WIDTH + selectedCell.col * DEFAULT_COL_WIDTH - scrollOffset.x,
              top: HEADER_HEIGHT + selectedCell.row * ROW_HEIGHT - scrollOffset.y,
              width: DEFAULT_COL_WIDTH,
              height: ROW_HEIGHT,
            }}
          />
        )}
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center border-t border-border/30 bg-background/80 px-2 py-1 shrink-0 gap-1">
        {sheets.map((s, i) => (
          <Button
            key={i}
            variant={activeSheet === i ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveSheet(i)}
            className={cn('h-6 px-3 text-xs rounded-md', activeSheet === i && 'bg-primary/15 text-primary')}
          >
            {s.name}
          </Button>
        ))}
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={addSheet}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground font-mono">
          {Object.keys(cells).length} cells • {ROWS}×{COLS}
          {freezeRow > 0 || freezeCol > 0 ? ` • ❄ ${freezeRow > 0 ? `R${freezeRow}` : ''} ${freezeCol > 0 ? `C${freezeCol}` : ''}` : ''}
          {undoStack.length > 0 ? ` • ${undoStack.length} undo` : ''}
        </span>
      </div>
    </div>
  );
}
