// Dream Mode Analytics Dashboard - Exploration patterns, insights, and loop detection stats
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  GitBranch,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  RefreshCw,
  Target,
  Repeat,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface AnalyticsData {
  totalSessions: number;
  totalInsights: number;
  totalExplorations: number;
  totalLoops: number;
  avgConfidence: number;
  avgSessionDuration: number;
  insightsByType: Record<string, number>;
  insightsByStyle: Record<string, number>;
  explorationsByDay: Array<{ date: string; count: number; insights: number }>;
  loopsByNodeType: Record<string, number>;
  topInsights: Array<{ content: string; confidence: number; frequency: number }>;
  recentActivity: Array<{ type: string; description: string; timestamp: string }>;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const DreamAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = timeRange === '7d' 
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : timeRange === '30d'
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Fetch sessions
      let sessionsQuery = supabase.from('dream_sessions').select('*');
      if (startDate) sessionsQuery = sessionsQuery.gte('created_at', startDate);
      const { data: sessions } = await sessionsQuery;

      // Fetch insights
      let insightsQuery = supabase.from('dream_insights').select('*');
      if (startDate) insightsQuery = insightsQuery.gte('created_at', startDate);
      const { data: insights } = await insightsQuery;

      // Fetch loops
      let loopsQuery = supabase.from('dream_execution_history').select('*').eq('is_loop', true);
      if (startDate) loopsQuery = loopsQuery.gte('created_at', startDate);
      const { data: loops } = await loopsQuery;

      // Fetch journal entries for recent activity
      let journalQuery = supabase.from('dream_journal').select('*').order('created_at', { ascending: false }).limit(20);
      if (startDate) journalQuery = journalQuery.gte('created_at', startDate);
      const { data: journal } = await journalQuery;

      // Process data
      const insightsByType: Record<string, number> = {};
      const insightsByStyle: Record<string, number> = {};
      let totalConfidence = 0;

      (insights || []).forEach((insight: any) => {
        insightsByType[insight.insight_type || 'unknown'] = (insightsByType[insight.insight_type || 'unknown'] || 0) + 1;
        insightsByStyle[insight.reasoning_style || 'unknown'] = (insightsByStyle[insight.reasoning_style || 'unknown'] || 0) + 1;
        totalConfidence += insight.confidence || 0;
      });

      // Group explorations by day
      const explorationsByDay: Record<string, { count: number; insights: number }> = {};
      (sessions || []).forEach((session: any) => {
        const date = new Date(session.created_at).toLocaleDateString();
        if (!explorationsByDay[date]) {
          explorationsByDay[date] = { count: 0, insights: 0 };
        }
        explorationsByDay[date].count += session.total_explorations || 0;
        explorationsByDay[date].insights += session.total_insights || 0;
      });

      // Loops by node type
      const loopsByNodeType: Record<string, number> = {};
      (loops || []).forEach((loop: any) => {
        loopsByNodeType[loop.node_type] = (loopsByNodeType[loop.node_type] || 0) + 1;
      });

      // Calculate session duration
      let totalDuration = 0;
      (sessions || []).forEach((session: any) => {
        if (session.ended_at && session.started_at) {
          totalDuration += new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
        }
      });

      // Top insights
      const sortedInsights = (insights || [])
        .sort((a: any, b: any) => (b.confidence * b.frequency) - (a.confidence * a.frequency))
        .slice(0, 5)
        .map((i: any) => ({
          content: i.content,
          confidence: i.confidence,
          frequency: i.frequency
        }));

      // Recent activity
      const recentActivity = (journal || []).slice(0, 10).map((entry: any) => ({
        type: entry.entry_type,
        description: entry.title,
        timestamp: entry.created_at
      }));

      setAnalytics({
        totalSessions: (sessions || []).length,
        totalInsights: (insights || []).length,
        totalExplorations: (sessions || []).reduce((sum: number, s: any) => sum + (s.total_explorations || 0), 0),
        totalLoops: (loops || []).length,
        avgConfidence: (insights || []).length > 0 ? totalConfidence / (insights || []).length : 0,
        avgSessionDuration: (sessions || []).length > 0 ? totalDuration / (sessions || []).length / 60000 : 0, // in minutes
        insightsByType,
        insightsByStyle,
        explorationsByDay: Object.entries(explorationsByDay).map(([date, data]) => ({
          date,
          ...data
        })).slice(-14),
        loopsByNodeType,
        topInsights: sortedInsights,
        recentActivity
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Brain className="w-8 h-8 animate-pulse text-purple-400 mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const pieData = Object.entries(analytics.insightsByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const styleData = Object.entries(analytics.insightsByStyle).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-semibold">Dream Analytics</h2>
            <p className="text-xs text-muted-foreground">
              Exploration patterns & insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/50 rounded-lg p-0.5">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setTimeRange(range)}
              >
                {range === 'all' ? 'All' : range}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Sessions</span>
              </div>
              <p className="text-2xl font-bold text-purple-400 mt-1">{analytics.totalSessions}</p>
            </Card>
            
            <Card className="p-3 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/30">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">Insights</span>
              </div>
              <p className="text-2xl font-bold text-amber-400 mt-1">{analytics.totalInsights}</p>
            </Card>
            
            <Card className="p-3 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/30">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-muted-foreground">Explorations</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{analytics.totalExplorations}</p>
            </Card>
            
            <Card className="p-3 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Loops Detected</span>
              </div>
              <p className="text-2xl font-bold text-red-400 mt-1">{analytics.totalLoops}</p>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Confidence</span>
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-emerald-400">
                    {(analytics.avgConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={analytics.avgConfidence * 100} className="h-1 mt-2" />
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Session</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-blue-400">
                  {analytics.avgSessionDuration.toFixed(0)} min
                </span>
              </div>
            </Card>
          </div>

          {/* Exploration Trend Chart */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Exploration Trend
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.explorationsByDay}>
                  <defs>
                    <linearGradient id="colorExplorations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInsights" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Explorations"
                    stroke="#06b6d4" 
                    fillOpacity={1} 
                    fill="url(#colorExplorations)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="insights" 
                    name="Insights"
                    stroke="#f59e0b" 
                    fillOpacity={1} 
                    fill="url(#colorInsights)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Insight Types Pie Chart */}
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-400" />
                Insight Types
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Reasoning Styles Bar Chart */}
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Reasoning Styles
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={styleData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={80}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Loop Detection Stats */}
          {Object.keys(analytics.loopsByNodeType).length > 0 && (
            <Card className="p-4 border-red-500/30 bg-red-500/5">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Loop Detection by Node Type
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(analytics.loopsByNodeType).map(([nodeType, count]) => (
                  <div 
                    key={nodeType}
                    className="flex items-center justify-between p-2 bg-card/50 rounded-lg"
                  >
                    <span className="text-xs text-muted-foreground">{nodeType}</span>
                    <Badge variant="destructive" className="text-xs">{count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Top Insights */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Top Insights
            </h3>
            <div className="space-y-2">
              {analytics.topInsights.map((insight, i) => (
                <div 
                  key={i}
                  className="p-3 bg-card/50 rounded-lg border border-amber-500/20"
                >
                  <p className="text-sm line-clamp-2">{insight.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                      {(insight.confidence * 100).toFixed(0)}% confident
                    </Badge>
                    {insight.frequency > 1 && (
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                        ×{insight.frequency}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Recent Activity
            </h3>
            <div className="space-y-2">
              {analytics.recentActivity.map((activity, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-2 bg-card/30 rounded-lg"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    activity.type === 'discovery' && "bg-amber-400",
                    activity.type === 'experiment' && "bg-purple-400",
                    activity.type === 'reflection' && "bg-blue-400",
                    activity.type === 'improvement' && "bg-emerald-400",
                    activity.type === 'loop_break' && "bg-red-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{activity.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{activity.type}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};
