// Dashboard Builder — Grafana/Datadog-grade dashboard with drag-drop widgets, real-time data, chart customization
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  BarChart3, LineChart, PieChart, AreaChart, Activity, TrendingUp,
  Plus, Trash2, Settings, Wand2, Download, RefreshCw, Maximize,
  Grid3x3, Type, Hash, Table2, Gauge, ArrowUpRight, ArrowDownRight,
  Clock, Users, Database, Zap, Eye, LayoutGrid, Move, X,
  Palette, Save, Copy, Share2, ChevronDown, Filter, Calendar,
  Globe, Cpu, HardDrive, Wifi, Shield, AlertTriangle,
  CheckCircle2, XCircle, Timer, Layers,
} from 'lucide-react';
import { BarChart, Bar, LineChart as ReLineChart, Line, PieChart as RePieChart, Pie, Cell,
  AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend, RadialBarChart, RadialBar, Treemap,
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────
interface Widget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'stat' | 'table' | 'gauge' | 'sparkline' | 'heatmap' | 'radial';
  title: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  data: any[];
  config: Record<string, any>;
}

interface DashboardConfig {
  name: string;
  description: string;
  refreshInterval: number; // seconds, 0 = off
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  gridCols: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const ACCENT_COLORS = ['#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

// ─── Sample Data Generators ────────────────
const genTimeSeries = (points: number, base: number, variance: number) =>
  Array.from({ length: points }, (_, i) => ({
    label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i % 12],
    value: Math.floor(base + Math.random() * variance),
    prev: Math.floor(base * 0.8 + Math.random() * variance * 0.7),
    target: base + variance * 0.6,
  }));

const genPieData = () => [
  { name: 'API Calls', value: 42 }, { name: 'Auth', value: 18 },
  { name: 'Database', value: 25 }, { name: 'Cache', value: 10 }, { name: 'Other', value: 5 },
];

const genTableData = () => [
  { endpoint: '/api/posts', method: 'GET', calls: 12847, avgMs: 45, p99Ms: 180, errors: 12 },
  { endpoint: '/api/auth/login', method: 'POST', calls: 3241, avgMs: 120, p99Ms: 450, errors: 89 },
  { endpoint: '/api/users', method: 'GET', calls: 8932, avgMs: 32, p99Ms: 95, errors: 3 },
  { endpoint: '/api/search', method: 'POST', calls: 5678, avgMs: 250, p99Ms: 800, errors: 45 },
  { endpoint: '/api/upload', method: 'POST', calls: 1234, avgMs: 500, p99Ms: 2000, errors: 67 },
];

const genSparkline = () => Array.from({ length: 20 }, () => Math.random() * 100);

const genRadialData = () => [
  { name: 'CPU', value: 72, fill: '#06b6d4' },
  { name: 'Memory', value: 58, fill: '#8b5cf6' },
  { name: 'Disk', value: 34, fill: '#10b981' },
  { name: 'Network', value: 89, fill: '#f59e0b' },
];

// ─── Default Dashboard ─────────────────────
const defaultWidgets: Widget[] = [
  { id: 'w1', type: 'stat', title: 'Total Requests', col: 0, row: 0, colSpan: 1, rowSpan: 1, data: [{ value: '2.8M', change: 12.5, subtitle: 'Last 24h' }], config: { icon: 'globe', color: 'cyan', sparkline: genSparkline() } },
  { id: 'w2', type: 'stat', title: 'Active Users', col: 1, row: 0, colSpan: 1, rowSpan: 1, data: [{ value: '1,847', change: 8.3, subtitle: 'Online now' }], config: { icon: 'users', color: 'purple', sparkline: genSparkline() } },
  { id: 'w3', type: 'stat', title: 'Error Rate', col: 2, row: 0, colSpan: 1, rowSpan: 1, data: [{ value: '0.12%', change: -45.0, subtitle: 'Last hour' }], config: { icon: 'shield', color: 'emerald', sparkline: genSparkline() } },
  { id: 'w4', type: 'stat', title: 'Avg Latency', col: 3, row: 0, colSpan: 1, rowSpan: 1, data: [{ value: '42ms', change: -8.2, subtitle: 'p50 response' }], config: { icon: 'timer', color: 'amber', sparkline: genSparkline() } },
  { id: 'w5', type: 'area', title: 'Request Volume', col: 0, row: 1, colSpan: 2, rowSpan: 2, data: genTimeSeries(12, 50, 40), config: { dataKey: 'value', secondaryKey: 'prev', color: '#06b6d4' } },
  { id: 'w6', type: 'bar', title: 'Response Time Distribution', col: 2, row: 1, colSpan: 2, rowSpan: 2, data: genTimeSeries(12, 80, 50), config: { dataKey: 'value', color: '#8b5cf6', showTarget: true } },
  { id: 'w7', type: 'table', title: 'Top Endpoints', col: 0, row: 3, colSpan: 2, rowSpan: 2, data: genTableData(), config: {} },
  { id: 'w8', type: 'pie', title: 'Traffic Distribution', col: 2, row: 3, colSpan: 1, rowSpan: 2, data: genPieData(), config: {} },
  { id: 'w9', type: 'radial', title: 'System Resources', col: 3, row: 3, colSpan: 1, rowSpan: 2, data: genRadialData(), config: {} },
  { id: 'w10', type: 'line', title: 'Error Trend', col: 0, row: 5, colSpan: 2, rowSpan: 2, data: genTimeSeries(12, 10, 15), config: { dataKey: 'value', color: '#f43f5e', showDots: true } },
  { id: 'w11', type: 'sparkline', title: 'Memory Usage', col: 2, row: 5, colSpan: 1, rowSpan: 1, data: genSparkline().map((v, i) => ({ i, v })), config: { color: '#8b5cf6', current: '4.2 GB', max: '8 GB' } },
  { id: 'w12', type: 'sparkline', title: 'CPU Load', col: 3, row: 5, colSpan: 1, rowSpan: 1, data: genSparkline().map((v, i) => ({ i, v })), config: { color: '#06b6d4', current: '67%', max: '100%' } },
];

// ─── Stat Icons ────────────────────────────
const statIcons: Record<string, React.ComponentType<any>> = {
  users: Users, activity: Activity, zap: Zap, clock: Clock, database: Database,
  globe: Globe, cpu: Cpu, harddrive: HardDrive, wifi: Wifi, shield: Shield,
  alert: AlertTriangle, check: CheckCircle2, timer: Timer,
};

// ─── Widget Renderers ──────────────────────
function StatWidget({ widget }: { widget: Widget }) {
  const data = widget.data[0] || {};
  const Icon = statIcons[widget.config.icon] || Activity;
  const isPositive = (data.change || 0) >= 0;
  const sparkline = widget.config.sparkline || [];

  return (
    <div className="h-full p-4 flex flex-col justify-between relative overflow-hidden">
      {/* Sparkline background */}
      {sparkline.length > 0 && (
        <svg className="absolute bottom-0 left-0 right-0 h-12 opacity-10" viewBox={`0 0 ${sparkline.length} 100`} preserveAspectRatio="none">
          <polyline
            points={sparkline.map((v: number, i: number) => `${i},${100 - v}`).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn(widget.config.color === 'cyan' ? 'text-cyan-400' : widget.config.color === 'purple' ? 'text-purple-400' : widget.config.color === 'amber' ? 'text-amber-400' : 'text-emerald-400')}
          />
        </svg>
      )}

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{widget.title}</p>
          <p className="text-2xl font-bold mt-1 tracking-tight">{data.value}</p>
          {data.subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{data.subtitle}</p>}
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center',
          widget.config.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' :
          widget.config.color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
          widget.config.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
        )}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <div className={cn('flex items-center gap-1 text-xs relative z-10', isPositive ? 'text-emerald-400' : 'text-red-400')}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        <span className="font-medium">{Math.abs(data.change)}%</span>
        <span className="text-muted-foreground ml-1">vs prev period</span>
      </div>
    </div>
  );
}

function TableWidget({ widget }: { widget: Widget }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background/95">
            <tr className="border-b border-border/20">
              <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">Endpoint</th>
              <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Method</th>
              <th className="px-2 py-1.5 text-right text-muted-foreground font-medium">Calls</th>
              <th className="px-2 py-1.5 text-right text-muted-foreground font-medium">Avg</th>
              <th className="px-2 py-1.5 text-right text-muted-foreground font-medium">p99</th>
              <th className="px-2 py-1.5 text-right text-muted-foreground font-medium">Errors</th>
            </tr>
          </thead>
          <tbody>
            {widget.data.map((row: any, i: number) => (
              <tr key={i} className="border-b border-border/5 hover:bg-muted/10 transition-colors">
                <td className="px-3 py-1.5 font-mono text-foreground/80">{row.endpoint}</td>
                <td className="px-2 py-1.5">
                  <Badge variant="outline" className={cn('text-[8px] h-4 px-1',
                    row.method === 'GET' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'
                  )}>{row.method}</Badge>
                </td>
                <td className="px-2 py-1.5 text-right font-mono">{row.calls.toLocaleString()}</td>
                <td className="px-2 py-1.5 text-right font-mono">{row.avgMs}ms</td>
                <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{row.p99Ms}ms</td>
                <td className="px-2 py-1.5 text-right">
                  <span className={cn('font-mono', row.errors > 50 ? 'text-red-400' : row.errors > 10 ? 'text-amber-400' : 'text-foreground/60')}>
                    {row.errors}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SparklineWidget({ widget }: { widget: Widget }) {
  return (
    <div className="h-full p-3 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase">{widget.title}</span>
        <span className="text-sm font-bold">{widget.config.current}</span>
      </div>
      <div className="flex-1 flex items-end px-1">
        <ResponsiveContainer width="100%" height="80%">
          <ReAreaChart data={widget.data}>
            <defs>
              <linearGradient id={`spark-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={widget.config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={widget.config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={widget.config.color} fill={`url(#spark-${widget.id})`} strokeWidth={1.5} dot={false} />
          </ReAreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[9px] text-muted-foreground text-right">of {widget.config.max}</div>
    </div>
  );
}

function ChartWidget({ widget }: { widget: Widget }) {
  const tooltipStyle = { background: 'hsl(var(--background) / 0.95)', border: '1px solid hsl(var(--border) / 0.3)', borderRadius: 8, fontSize: 11 };
  const axisStyle = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' };

  switch (widget.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={widget.data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.15)" />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <ReTooltip contentStyle={tooltipStyle} />
            <Bar dataKey={widget.config.dataKey || 'value'} fill={widget.config.color || ACCENT_COLORS[0]} radius={[4, 4, 0, 0]} />
            {widget.config.showTarget && <Bar dataKey="target" fill="hsl(var(--muted) / 0.3)" radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={widget.data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.15)" />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <ReTooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey={widget.config.dataKey || 'value'} stroke={widget.config.color || ACCENT_COLORS[0]} strokeWidth={2} dot={widget.config.showDots || false} activeDot={{ r: 4 }} />
            {widget.config.secondaryKey && <Line type="monotone" dataKey={widget.config.secondaryKey} stroke={ACCENT_COLORS[1]} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />}
          </ReLineChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ReAreaChart data={widget.data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id={`agrad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={widget.config.color || ACCENT_COLORS[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={widget.config.color || ACCENT_COLORS[0]} stopOpacity={0} />
              </linearGradient>
              {widget.config.secondaryKey && (
                <linearGradient id={`agrad2-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT_COLORS[1]} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={ACCENT_COLORS[1]} stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.15)" />
            <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <ReTooltip contentStyle={tooltipStyle} />
            {widget.config.secondaryKey && <Area type="monotone" dataKey={widget.config.secondaryKey} stroke={ACCENT_COLORS[1]} fill={`url(#agrad2-${widget.id})`} strokeWidth={1.5} strokeDasharray="4 4" />}
            <Area type="monotone" dataKey={widget.config.dataKey || 'value'} stroke={widget.config.color || ACCENT_COLORS[0]} fill={`url(#agrad-${widget.id})`} strokeWidth={2} />
          </ReAreaChart>
        </ResponsiveContainer>
      );
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie data={widget.data} cx="50%" cy="50%" innerRadius="40%" outerRadius="75%" paddingAngle={3} dataKey="value"
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {widget.data.map((_: any, i: number) => <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} />)}
            </Pie>
            <ReTooltip contentStyle={tooltipStyle} />
          </RePieChart>
        </ResponsiveContainer>
      );
    case 'radial':
      return (
        <div className="h-full flex flex-col items-center justify-center gap-2">
          {widget.data.map((item: any, i: number) => (
            <div key={i} className="w-full flex items-center gap-2 px-3">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0">{item.name}</span>
              <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.fill }} />
              </div>
              <span className="text-[10px] font-mono w-8 text-right">{item.value}%</span>
            </div>
          ))}
        </div>
      );
    default: return null;
  }
}

// ─── Widget Palette ────────────────────────
const widgetTypes: { type: Widget['type']; icon: React.ComponentType<any>; label: string }[] = [
  { type: 'stat', icon: Hash, label: 'Stat Card' },
  { type: 'line', icon: LineChart, label: 'Line Chart' },
  { type: 'area', icon: AreaChart, label: 'Area Chart' },
  { type: 'bar', icon: BarChart3, label: 'Bar Chart' },
  { type: 'pie', icon: PieChart, label: 'Pie Chart' },
  { type: 'table', icon: Table2, label: 'Table' },
  { type: 'sparkline', icon: Activity, label: 'Sparkline' },
  { type: 'radial', icon: Gauge, label: 'Radial' },
];

// ─── Main Component ────────────────────────
export function DashboardBuilderPage() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [config, setConfig] = useState<DashboardConfig>({
    name: 'System Overview', description: 'Real-time system metrics and analytics',
    refreshInterval: 30, timeRange: '24h', gridCols: 4,
  });
  const [showWidgetPalette, setShowWidgetPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  const selectedWidgetData = widgets.find(w => w.id === selectedWidget);

  const addWidget = useCallback((type: Widget['type']) => {
    const maxRow = Math.max(...widgets.map(w => w.row + w.rowSpan), 0);
    const w: Widget = {
      id: `w-${Date.now()}`, type, title: `New ${type} Widget`,
      col: 0, row: maxRow,
      colSpan: type === 'stat' || type === 'sparkline' ? 1 : 2,
      rowSpan: type === 'stat' || type === 'sparkline' ? 1 : 2,
      data: type === 'pie' ? genPieData() : type === 'table' ? genTableData() : type === 'sparkline' ? genSparkline().map((v, i) => ({ i, v })) : type === 'radial' ? genRadialData() : type === 'stat' ? [{ value: Math.floor(Math.random() * 10000), change: +(Math.random() * 30 - 15).toFixed(1), subtitle: 'Latest' }] : genTimeSeries(12, 50, 40),
      config: type === 'stat' ? { icon: 'activity', color: ['cyan', 'purple', 'amber', 'emerald'][widgets.length % 4], sparkline: genSparkline() } : type === 'sparkline' ? { color: ACCENT_COLORS[widgets.length % ACCENT_COLORS.length], current: '—', max: '—' } : { dataKey: 'value', color: ACCENT_COLORS[widgets.length % ACCENT_COLORS.length] },
    };
    setWidgets(prev => [...prev, w]);
    setSelectedWidget(w.id);
    setShowWidgetPalette(false);
  }, [widgets]);

  const deleteWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (selectedWidget === id) setSelectedWidget(null);
  }, [selectedWidget]);

  const updateWidget = useCallback((id: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* ─── Top Bar ─── */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <Input value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))} className="h-7 w-48 text-xs font-semibold bg-transparent border-none focus-visible:ring-0" />
        <Badge variant="outline" className="text-[9px] h-5 px-1.5 border-border/30">{widgets.length} widgets</Badge>
        <div className="flex-1" />

        {/* Time range */}
        <Select value={config.timeRange} onValueChange={v => setConfig(c => ({ ...c, timeRange: v as any }))}>
          <SelectTrigger className="w-20 h-7 text-xs bg-muted/30 border-border/30">
            <Calendar className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['1h', '6h', '24h', '7d', '30d'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="w-px h-5 bg-border/30" />

        <Button variant="ghost" size="sm" onClick={() => setShowWidgetPalette(!showWidgetPalette)}
          className={cn('h-7 text-xs gap-1', showWidgetPalette && 'text-primary bg-primary/10')}>
          <Plus className="w-3.5 h-3.5" /> Add Widget
        </Button>

        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}
          className={cn('h-7 text-xs gap-1', isEditing && 'text-primary bg-primary/10')}>
          {isEditing ? <Move className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {isEditing ? 'Editing' : 'Viewing'}
        </Button>

        <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="h-7 text-xs gap-1">
          <Settings className="w-3.5 h-3.5" />
        </Button>

        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Download className="w-3.5 h-3.5" /> Export</Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Widget Palette ─── */}
        {showWidgetPalette && (
          <div className="w-52 bg-background/50 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
              <span className="text-xs font-semibold">Add Widget</span>
              <Button variant="ghost" size="icon" onClick={() => setShowWidgetPalette(false)} className="w-5 h-5"><X className="w-3 h-3" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 grid grid-cols-2 gap-1.5">
                {widgetTypes.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => addWidget(type)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-foreground/70">{label}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ─── Dashboard Grid ─── */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${config.gridCols}, 1fr)`, gridAutoRows: '120px' }}>
              {widgets.map(widget => (
                <div
                  key={widget.id}
                  className={cn(
                    'relative rounded-xl border bg-background/40 backdrop-blur overflow-hidden transition-all group',
                    selectedWidget === widget.id && isEditing ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border/20 hover:border-border/40',
                    isEditing && 'cursor-pointer'
                  )}
                  style={{ gridColumn: `span ${widget.colSpan}`, gridRow: `span ${widget.rowSpan}` }}
                  onClick={() => isEditing && setSelectedWidget(widget.id)}
                >
                  {/* Widget header */}
                  {widget.type !== 'stat' && widget.type !== 'sparkline' && (
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/10">
                      <span className="text-[11px] font-medium text-muted-foreground">{widget.title}</span>
                      {isEditing && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="w-5 h-5" onClick={e => { e.stopPropagation(); deleteWidget(widget.id); }}>
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Widget content */}
                  <div className={cn('px-1', widget.type === 'stat' || widget.type === 'sparkline' ? 'h-full' : 'py-1')} style={{ height: widget.type === 'stat' || widget.type === 'sparkline' ? '100%' : 'calc(100% - 32px)' }}>
                    {widget.type === 'stat' ? <StatWidget widget={widget} /> :
                     widget.type === 'table' ? <TableWidget widget={widget} /> :
                     widget.type === 'sparkline' ? <SparklineWidget widget={widget} /> :
                     <ChartWidget widget={widget} />}
                  </div>

                  {/* Edit indicator */}
                  {isEditing && selectedWidget === widget.id && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* ─── Settings / Widget Config Panel ─── */}
        {(showSettings || (selectedWidget && isEditing)) && (
          <div className="w-64 bg-background/50 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
              <span className="text-xs font-semibold">{showSettings ? 'Dashboard Settings' : 'Widget Config'}</span>
              <Button variant="ghost" size="icon" onClick={() => { setShowSettings(false); setSelectedWidget(null); }} className="w-5 h-5"><X className="w-3 h-3" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {showSettings ? (
                  <>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Dashboard Name</label>
                      <Input value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))} className="h-7 text-xs mt-1 bg-muted/20 border-border/20" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Description</label>
                      <Input value={config.description} onChange={e => setConfig(c => ({ ...c, description: e.target.value }))} className="h-7 text-xs mt-1 bg-muted/20 border-border/20" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Grid Columns</label>
                      <Select value={String(config.gridCols)} onValueChange={v => setConfig(c => ({ ...c, gridCols: parseInt(v) }))}>
                        <SelectTrigger className="h-7 text-xs mt-1 bg-muted/20 border-border/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 5, 6].map(n => <SelectItem key={n} value={String(n)}>{n} columns</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Auto Refresh</label>
                      <Select value={String(config.refreshInterval)} onValueChange={v => setConfig(c => ({ ...c, refreshInterval: parseInt(v) }))}>
                        <SelectTrigger className="h-7 text-xs mt-1 bg-muted/20 border-border/20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Off</SelectItem>
                          <SelectItem value="10">10s</SelectItem>
                          <SelectItem value="30">30s</SelectItem>
                          <SelectItem value="60">1m</SelectItem>
                          <SelectItem value="300">5m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : selectedWidgetData ? (
                  <>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Title</label>
                      <Input value={selectedWidgetData.title} onChange={e => updateWidget(selectedWidgetData.id, { title: e.target.value })} className="h-7 text-xs mt-1 bg-muted/20 border-border/20" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-semibold">Type</label>
                      <Badge variant="outline" className="mt-1 text-[10px] capitalize">{selectedWidgetData.type}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Width</label>
                        <Select value={String(selectedWidgetData.colSpan)} onValueChange={v => updateWidget(selectedWidgetData.id, { colSpan: parseInt(v) })}>
                          <SelectTrigger className="h-7 text-xs mt-1 bg-muted/20 border-border/20"><SelectValue /></SelectTrigger>
                          <SelectContent>{[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n} col{n > 1 ? 's' : ''}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Height</label>
                        <Select value={String(selectedWidgetData.rowSpan)} onValueChange={v => updateWidget(selectedWidgetData.id, { rowSpan: parseInt(v) })}>
                          <SelectTrigger className="h-7 text-xs mt-1 bg-muted/20 border-border/20"><SelectValue /></SelectTrigger>
                          <SelectContent>{[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n} row{n > 1 ? 's' : ''}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => deleteWidget(selectedWidgetData.id)} className="w-full h-7 text-xs text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3 mr-1" /> Delete Widget
                    </Button>
                  </>
                ) : null}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
