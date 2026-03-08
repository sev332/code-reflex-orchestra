// Dashboard Builder — Drag-drop chart/widget builder with AI insights
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, LineChart, PieChart, AreaChart, Activity, TrendingUp,
  Plus, Trash2, Settings, Wand2, Download, RefreshCw, Maximize,
  Grid3x3, Type, Hash, Table2, Gauge, ArrowUpRight, ArrowDownRight,
  Clock, Users, Database, Zap, Eye, LayoutGrid, Move,
} from 'lucide-react';
import { BarChart, Bar, LineChart as ReLineChart, Line, PieChart as RePieChart, Pie, Cell,
  AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface Widget {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'stat' | 'table' | 'gauge';
  title: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  data: any[];
  config: Record<string, any>;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

const sampleTimeSeries = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  value: Math.floor(Math.random() * 80 + 20),
  prev: Math.floor(Math.random() * 60 + 10),
}));

const samplePieData = [
  { name: 'Chat', value: 35 }, { name: 'Orchestration', value: 25 },
  { name: 'Documents', value: 20 }, { name: 'Code IDE', value: 15 }, { name: 'Other', value: 5 },
];

const defaultWidgets: Widget[] = [
  { id: 'w1', type: 'stat', title: 'Total Users', col: 0, row: 0, colSpan: 1, rowSpan: 1, data: [{ value: 2847, change: 12.5 }], config: { icon: 'users', color: 'cyan' } },
  { id: 'w2', type: 'stat', title: 'Active Sessions', col: 1, row: 0, colSpan: 1, rowSpan: 1, data: [{ value: 184, change: -3.2 }], config: { icon: 'activity', color: 'purple' } },
  { id: 'w3', type: 'stat', title: 'Queries/min', col: 2, row: 0, colSpan: 1, rowSpan: 1, data: [{ value: 42, change: 8.1 }], config: { icon: 'zap', color: 'amber' } },
  { id: 'w4', type: 'stat', title: 'Avg Response', col: 3, row: 0, colSpan: 1, rowSpan: 1, data: [{ value: '1.2s', change: -15.0 }], config: { icon: 'clock', color: 'emerald' } },
  { id: 'w5', type: 'area', title: 'Usage Over Time', col: 0, row: 1, colSpan: 2, rowSpan: 2, data: sampleTimeSeries, config: { dataKey: 'value', color: '#06b6d4' } },
  { id: 'w6', type: 'bar', title: 'Feature Usage', col: 2, row: 1, colSpan: 2, rowSpan: 2, data: sampleTimeSeries, config: { dataKey: 'value', color: '#8b5cf6' } },
  { id: 'w7', type: 'pie', title: 'Distribution', col: 0, row: 3, colSpan: 2, rowSpan: 2, data: samplePieData, config: {} },
  { id: 'w8', type: 'line', title: 'Performance Trend', col: 2, row: 3, colSpan: 2, rowSpan: 2, data: sampleTimeSeries, config: { dataKey: 'value', secondaryKey: 'prev' } },
];

const statIcons: Record<string, React.ComponentType<any>> = {
  users: Users, activity: Activity, zap: Zap, clock: Clock, database: Database,
};

function StatWidget({ widget }: { widget: Widget }) {
  const data = widget.data[0] || {};
  const Icon = statIcons[widget.config.icon] || Activity;
  const isPositive = (data.change || 0) >= 0;
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  };
  return (
    <div className={cn('h-full rounded-xl bg-gradient-to-br p-4 flex flex-col justify-between', colorMap[widget.config.color] || colorMap.cyan)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{widget.title}</p>
          <p className="text-2xl font-bold mt-1">{data.value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className={cn('flex items-center gap-1 text-xs', isPositive ? 'text-emerald-400' : 'text-red-400')}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        <span>{Math.abs(data.change)}%</span>
        <span className="text-muted-foreground ml-1">vs last period</span>
      </div>
    </div>
  );
}

function ChartWidget({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={widget.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <ReTooltip contentStyle={{ background: 'hsl(var(--background) / 0.95)', border: '1px solid hsl(var(--border) / 0.3)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey={widget.config.dataKey || 'value'} fill={widget.config.color || COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={widget.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <ReTooltip contentStyle={{ background: 'hsl(var(--background) / 0.95)', border: '1px solid hsl(var(--border) / 0.3)', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey={widget.config.dataKey || 'value'} stroke={COLORS[0]} strokeWidth={2} dot={false} />
            {widget.config.secondaryKey && <Line type="monotone" dataKey={widget.config.secondaryKey} stroke={COLORS[1]} strokeWidth={2} dot={false} strokeDasharray="4 4" />}
          </ReLineChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ReAreaChart data={widget.data}>
            <defs>
              <linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={widget.config.color || COLORS[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={widget.config.color || COLORS[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <ReTooltip contentStyle={{ background: 'hsl(var(--background) / 0.95)', border: '1px solid hsl(var(--border) / 0.3)', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey={widget.config.dataKey || 'value'} stroke={widget.config.color || COLORS[0]} fill={`url(#grad-${widget.id})`} strokeWidth={2} />
          </ReAreaChart>
        </ResponsiveContainer>
      );
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie data={widget.data} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {widget.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <ReTooltip contentStyle={{ background: 'hsl(var(--background) / 0.95)', border: '1px solid hsl(var(--border) / 0.3)', borderRadius: 8, fontSize: 12 }} />
          </RePieChart>
        </ResponsiveContainer>
      );
    default: return null;
  }
}

export function DashboardBuilderPage() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [dashboardName, setDashboardName] = useState('System Overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [gridCols] = useState(4);

  const addWidget = useCallback((type: Widget['type']) => {
    const w: Widget = {
      id: `w-${Date.now()}`, type, title: `New ${type} widget`,
      col: 0, row: Math.max(...widgets.map(w => w.row + w.rowSpan), 0),
      colSpan: type === 'stat' ? 1 : 2, rowSpan: type === 'stat' ? 1 : 2,
      data: type === 'pie' ? samplePieData : sampleTimeSeries,
      config: type === 'stat' ? { icon: 'activity', color: 'cyan', value: 0, change: 0 } : { dataKey: 'value', color: COLORS[widgets.length % COLORS.length] },
    };
    if (type === 'stat') w.data = [{ value: Math.floor(Math.random() * 1000), change: (Math.random() * 20 - 10).toFixed(1) }];
    setWidgets(prev => [...prev, w]);
  }, [widgets]);

  const deleteWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    if (selectedWidget === id) setSelectedWidget(null);
  }, [selectedWidget]);

  return (
    <div className="h-full flex flex-col bg-background/30">
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <Input value={dashboardName} onChange={e => setDashboardName(e.target.value)} className="h-7 w-48 text-xs font-semibold bg-transparent border-none" />
        <div className="flex-1" />

        {/* Add widget buttons */}
        <div className="flex items-center gap-0.5 border-r border-border/30 pr-2 mr-1">
          {([
            { type: 'stat' as const, icon: Hash, label: 'Stat' },
            { type: 'bar' as const, icon: BarChart3, label: 'Bar' },
            { type: 'line' as const, icon: LineChart, label: 'Line' },
            { type: 'area' as const, icon: AreaChart, label: 'Area' },
            { type: 'pie' as const, icon: PieChart, label: 'Pie' },
          ]).map(({ type, icon: Icon, label }) => (
            <Button key={type} variant="ghost" size="icon" onClick={() => addWidget(type)} className="w-8 h-8">
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={() => setAutoRefresh(v => !v)} className={cn('h-7 text-xs gap-1', autoRefresh && 'text-primary')}>
          <RefreshCw className={cn('w-3.5 h-3.5', autoRefresh && 'animate-spin')} />
          Auto
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gridAutoRows: '120px' }}>
            {widgets.map(widget => (
              <div
                key={widget.id}
                className={cn(
                  'relative rounded-xl border bg-background/40 backdrop-blur overflow-hidden transition-all group',
                  selectedWidget === widget.id ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border/30 hover:border-border/60'
                )}
                style={{
                  gridColumn: `span ${widget.colSpan}`,
                  gridRow: `span ${widget.rowSpan}`,
                }}
                onClick={() => setSelectedWidget(widget.id)}
              >
                {/* Widget header */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/10">
                  <span className="text-[11px] font-medium text-muted-foreground">{widget.title}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="w-5 h-5" onClick={(e) => { e.stopPropagation(); deleteWidget(widget.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Widget content */}
                <div className="p-2" style={{ height: 'calc(100% - 32px)' }}>
                  {widget.type === 'stat' ? (
                    <StatWidget widget={widget} />
                  ) : (
                    <ChartWidget widget={widget} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
