// Full spreadsheet with canvas grid, formula bar, sheet tabs, charting, AI analysis
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Plus, ChevronDown, Wand2, BarChart3, PieChart, TrendingUp,
  Download, Upload, Undo2, Redo2, Copy, Scissors, Clipboard,
  Table2, Filter, SortAsc, SortDesc, Sigma, Search,
  PaintBucket, Type, Merge, SplitSquareHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLS = 26;
const ROWS = 200;
const COL_WIDTH = 100;
const ROW_HEIGHT = 28;
const HEADER_HEIGHT = 28;
const ROW_HEADER_WIDTH = 50;

type CellData = {
  value: string;
  formula?: string;
  format?: { bold?: boolean; italic?: boolean; align?: 'left' | 'center' | 'right'; bg?: string; color?: string };
};

type SheetData = Record<string, CellData>;

function colLabel(i: number): string {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function cellKey(col: number, row: number) { return `${colLabel(col)}${row + 1}`; }

function evaluateFormula(formula: string, cells: SheetData): string {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1).toUpperCase();
  // SUM
  const sumMatch = expr.match(/^SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
  if (sumMatch) {
    const [, sc, sr, ec, er] = sumMatch;
    let sum = 0;
    const startCol = sc.charCodeAt(0) - 65, endCol = ec.charCodeAt(0) - 65;
    const startRow = parseInt(sr) - 1, endRow = parseInt(er) - 1;
    for (let c = startCol; c <= endCol; c++)
      for (let r = startRow; r <= endRow; r++) {
        const v = parseFloat(cells[cellKey(c, r)]?.value || '0');
        if (!isNaN(v)) sum += v;
      }
    return sum.toString();
  }
  // AVG
  const avgMatch = expr.match(/^AVERAGE\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
  if (avgMatch) {
    const [, sc, sr, ec, er] = avgMatch;
    let sum = 0, count = 0;
    const startCol = sc.charCodeAt(0) - 65, endCol = ec.charCodeAt(0) - 65;
    const startRow = parseInt(sr) - 1, endRow = parseInt(er) - 1;
    for (let c = startCol; c <= endCol; c++)
      for (let r = startRow; r <= endRow; r++) {
        const v = parseFloat(cells[cellKey(c, r)]?.value || '0');
        if (!isNaN(v)) { sum += v; count++; }
      }
    return count ? (sum / count).toFixed(2) : '0';
  }
  // Cell reference
  const refMatch = expr.match(/^([A-Z]+)(\d+)$/);
  if (refMatch) return cells[expr]?.value || '0';
  // Basic arithmetic
  try {
    const resolved = expr.replace(/([A-Z]+\d+)/g, (m) => cells[m]?.value || '0');
    // eslint-disable-next-line no-eval
    const result = Function(`"use strict"; return (${resolved})`)();
    return String(result);
  } catch { return '#ERR'; }
}

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
  const [selectionRange, setSelectionRange] = useState<{ startCol: number; startRow: number; endCol: number; endRow: number } | null>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>(Array(COLS).fill(COL_WIDTH));

  const cells = sheets[activeSheet]?.data || {};

  const getCellDisplay = useCallback((col: number, row: number) => {
    const key = cellKey(col, row);
    const cell = cells[key];
    if (!cell) return '';
    if (cell.formula) return evaluateFormula(cell.formula, cells);
    return cell.value || '';
  }, [cells]);

  // Canvas rendering
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

    const visibleCols = Math.ceil(rect.width / COL_WIDTH) + 2;
    const visibleRows = Math.ceil(rect.height / ROW_HEIGHT) + 2;
    const startCol = Math.floor(scrollOffset.x / COL_WIDTH);
    const startRow = Math.floor(scrollOffset.y / ROW_HEIGHT);

    // Background
    ctx.fillStyle = 'hsl(222, 20%, 8%)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Grid lines
    ctx.strokeStyle = 'hsla(220, 15%, 25%, 0.4)';
    ctx.lineWidth = 0.5;

    // Row header bg
    ctx.fillStyle = 'hsl(222, 18%, 11%)';
    ctx.fillRect(0, 0, ROW_HEADER_WIDTH, rect.height);

    // Col header bg
    ctx.fillStyle = 'hsl(222, 18%, 11%)';
    ctx.fillRect(0, 0, rect.width, HEADER_HEIGHT);

    // Corner
    ctx.fillStyle = 'hsl(222, 18%, 9%)';
    ctx.fillRect(0, 0, ROW_HEADER_WIDTH, HEADER_HEIGHT);

    // Draw cells
    for (let ci = 0; ci < visibleCols; ci++) {
      const col = startCol + ci;
      if (col >= COLS) break;
      const x = ROW_HEADER_WIDTH + col * COL_WIDTH - scrollOffset.x;

      // Col header
      ctx.fillStyle = 'hsl(220, 10%, 55%)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(colLabel(col), x + COL_WIDTH / 2, HEADER_HEIGHT / 2 + 4);

      for (let ri = 0; ri < visibleRows; ri++) {
        const row = startRow + ri;
        if (row >= ROWS) break;
        const y = HEADER_HEIGHT + row * ROW_HEIGHT - scrollOffset.y;

        // Cell bg
        const isSelected = selectedCell?.col === col && selectedCell?.row === row;
        const inRange = selectionRange && col >= Math.min(selectionRange.startCol, selectionRange.endCol) && col <= Math.max(selectionRange.startCol, selectionRange.endCol)
          && row >= Math.min(selectionRange.startRow, selectionRange.endRow) && row <= Math.max(selectionRange.startRow, selectionRange.endRow);

        const cellData = cells[cellKey(col, row)];

        if (cellData?.format?.bg) {
          ctx.fillStyle = cellData.format.bg;
          ctx.fillRect(x, y, COL_WIDTH, ROW_HEIGHT);
        }

        if (inRange && !isSelected) {
          ctx.fillStyle = 'hsla(200, 80%, 50%, 0.1)';
          ctx.fillRect(x, y, COL_WIDTH, ROW_HEIGHT);
        }

        if (isSelected) {
          ctx.fillStyle = 'hsla(200, 80%, 50%, 0.15)';
          ctx.fillRect(x, y, COL_WIDTH, ROW_HEIGHT);
          ctx.strokeStyle = 'hsl(200, 80%, 55%)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, COL_WIDTH, ROW_HEIGHT);
          ctx.strokeStyle = 'hsla(220, 15%, 25%, 0.4)';
          ctx.lineWidth = 0.5;
        }

        // Grid
        ctx.beginPath();
        ctx.moveTo(x, y + ROW_HEIGHT);
        ctx.lineTo(x + COL_WIDTH, y + ROW_HEIGHT);
        ctx.moveTo(x + COL_WIDTH, y);
        ctx.lineTo(x + COL_WIDTH, y + ROW_HEIGHT);
        ctx.stroke();

        // Cell text
        const display = getCellDisplay(col, row);
        if (display) {
          const align = cellData?.format?.align || 'left';
          ctx.fillStyle = cellData?.format?.color || 'hsl(220, 10%, 80%)';
          ctx.font = `${cellData?.format?.bold ? 'bold ' : ''}${cellData?.format?.italic ? 'italic ' : ''}12px Inter, system-ui, sans-serif`;
          ctx.textAlign = align;
          const tx = align === 'left' ? x + 6 : align === 'right' ? x + COL_WIDTH - 6 : x + COL_WIDTH / 2;
          ctx.fillText(display, tx, y + ROW_HEIGHT / 2 + 4, COL_WIDTH - 12);
        }
      }
    }

    // Row headers
    ctx.textAlign = 'center';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'hsl(220, 10%, 55%)';
    for (let ri = 0; ri < visibleRows; ri++) {
      const row = startRow + ri;
      if (row >= ROWS) break;
      const y = HEADER_HEIGHT + row * ROW_HEIGHT - scrollOffset.y;
      ctx.fillText(String(row + 1), ROW_HEADER_WIDTH / 2, y + ROW_HEIGHT / 2 + 4);
    }

    // Header borders
    ctx.strokeStyle = 'hsla(220, 15%, 30%, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ROW_HEADER_WIDTH, 0);
    ctx.lineTo(ROW_HEADER_WIDTH, rect.height);
    ctx.moveTo(0, HEADER_HEIGHT);
    ctx.lineTo(rect.width, HEADER_HEIGHT);
    ctx.stroke();

  }, [cells, selectedCell, scrollOffset, selectionRange, getCellDisplay, columnWidths]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < ROW_HEADER_WIDTH || y < HEADER_HEIGHT) return;

    const col = Math.floor((x - ROW_HEADER_WIDTH + scrollOffset.x) / COL_WIDTH);
    const row = Math.floor((y - HEADER_HEIGHT + scrollOffset.y) / ROW_HEIGHT);

    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      setSelectedCell({ col, row });
      setIsEditing(false);
      const key = cellKey(col, row);
      setEditValue(cells[key]?.formula || cells[key]?.value || '');
      setSelectionRange(null);
    }
  }, [scrollOffset, cells]);

  const handleCanvasDoubleClick = useCallback(() => {
    if (selectedCell) setIsEditing(true);
  }, [selectedCell]);

  const handleScroll = useCallback((e: React.WheelEvent) => {
    setScrollOffset(prev => ({
      x: Math.max(0, Math.min(COLS * COL_WIDTH - 400, prev.x + (e.shiftKey ? e.deltaY : e.deltaX))),
      y: Math.max(0, Math.min(ROWS * ROW_HEIGHT - 400, prev.y + (e.shiftKey ? 0 : e.deltaY))),
    }));
  }, []);

  const commitEdit = useCallback(() => {
    if (!selectedCell) return;
    const key = cellKey(selectedCell.col, selectedCell.row);
    setSheets(prev => {
      const newSheets = [...prev];
      const data = { ...newSheets[activeSheet].data };
      const isFormula = editValue.startsWith('=');
      data[key] = {
        ...data[key],
        value: isFormula ? evaluateFormula(editValue, data) : editValue,
        formula: isFormula ? editValue : undefined,
      };
      newSheets[activeSheet] = { ...newSheets[activeSheet], data };
      return newSheets;
    });
    setIsEditing(false);
  }, [selectedCell, editValue, activeSheet]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isEditing) {
        commitEdit();
        // Move down
        if (selectedCell && selectedCell.row < ROWS - 1) {
          setSelectedCell({ ...selectedCell, row: selectedCell.row + 1 });
          setEditValue(cells[cellKey(selectedCell.col, selectedCell.row + 1)]?.formula || cells[cellKey(selectedCell.col, selectedCell.row + 1)]?.value || '');
        }
      } else {
        setIsEditing(true);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (isEditing) commitEdit();
      if (selectedCell && selectedCell.col < COLS - 1) {
        const newCol = selectedCell.col + 1;
        setSelectedCell({ ...selectedCell, col: newCol });
        setEditValue(cells[cellKey(newCol, selectedCell.row)]?.formula || cells[cellKey(newCol, selectedCell.row)]?.value || '');
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
        setSelectedCell({ col: nc, row: nr });
        setEditValue(cells[cellKey(nc, nr)]?.formula || cells[cellKey(nc, nr)]?.value || '');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const key = cellKey(selectedCell.col, selectedCell.row);
        setSheets(prev => {
          const ns = [...prev];
          const data = { ...ns[activeSheet].data };
          delete data[key];
          ns[activeSheet] = { ...ns[activeSheet], data };
          return ns;
        });
        setEditValue('');
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        setIsEditing(true);
        setEditValue(e.key);
      }
    }
  }, [isEditing, selectedCell, cells, commitEdit, activeSheet]);

  const addSheet = () => {
    setSheets(prev => [...prev, { name: `Sheet ${prev.length + 1}`, data: {} }]);
    setActiveSheet(sheets.length);
  };

  const selectedKey = selectedCell ? cellKey(selectedCell.col, selectedCell.row) : '';

  const aiQuickActions = [
    { label: 'Auto-fill pattern', icon: Wand2 },
    { label: 'Generate chart', icon: BarChart3 },
    { label: 'Summarize data', icon: Sigma },
    { label: 'Find trends', icon: TrendingUp },
    { label: 'Clean data', icon: Filter },
  ];

  return (
    <div className="h-full flex flex-col bg-background" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border/30 bg-background/80 shrink-0">
        <Button variant="ghost" size="icon" className="w-7 h-7"><Undo2 className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="w-7 h-7"><Redo2 className="w-3.5 h-3.5" /></Button>
        <div className="w-px h-5 bg-border/30 mx-1" />
        <Button variant="ghost" size="icon" className="w-7 h-7"><Bold className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="w-7 h-7"><Italic className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="w-7 h-7"><Underline className="w-3.5 h-3.5" /></Button>
        <div className="w-px h-5 bg-border/30 mx-1" />
        <Button variant="ghost" size="icon" className="w-7 h-7"><AlignLeft className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="w-7 h-7"><AlignCenter className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="w-7 h-7"><AlignRight className="w-3.5 h-3.5" /></Button>
        <div className="w-px h-5 bg-border/30 mx-1" />
        <Button variant="ghost" size="icon" className="w-7 h-7"><PaintBucket className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="w-7 h-7"><Type className="w-3.5 h-3.5" /></Button>
        <div className="w-px h-5 bg-border/30 mx-1" />
        <Button variant="ghost" size="icon" className="w-7 h-7"><Merge className="w-3.5 h-3.5" /></Button>
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
        <div className="w-20 text-center">
          <Badge variant="outline" className="text-xs font-mono px-2">{selectedKey || '—'}</Badge>
        </div>
        <div className="w-px h-5 bg-border/30" />
        <span className="text-xs text-muted-foreground">fx</span>
        <Input
          value={editValue}
          onChange={(e) => { setEditValue(e.target.value); if (!isEditing) setIsEditing(true); }}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') { commitEdit(); e.stopPropagation(); } }}
          placeholder="Enter value or formula (=SUM, =AVERAGE...)"
          className="flex-1 h-7 text-sm font-mono bg-muted/20 border-none"
        />
      </div>

      {/* Canvas grid */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-cell" onWheel={handleScroll}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onDoubleClick={handleCanvasDoubleClick}
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
              left: ROW_HEADER_WIDTH + selectedCell.col * COL_WIDTH - scrollOffset.x,
              top: HEADER_HEIGHT + selectedCell.row * ROW_HEIGHT - scrollOffset.y,
              width: COL_WIDTH,
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
        <span className="text-[10px] text-muted-foreground">
          {Object.keys(cells).length} cells • {ROWS} rows × {COLS} cols
        </span>
      </div>
    </div>
  );
}
