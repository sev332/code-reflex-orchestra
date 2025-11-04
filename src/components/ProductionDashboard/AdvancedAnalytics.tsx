import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Clock, AlertTriangle } from 'lucide-react';

export const AdvancedAnalytics = () => {
  // Mock data for charts
  const executionData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    executions: Math.floor(Math.random() * 100) + 50,
    errors: Math.floor(Math.random() * 5)
  }));

  const latencyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    avg: Math.random() * 200 + 300,
    p95: Math.random() * 300 + 500,
    p99: Math.random() * 400 + 700
  }));

  const modelUsageData = [
    { model: 'gemini-2.5-flash', count: 1250 },
    { model: 'gpt-5', count: 890 },
    { model: 'gemini-2.5-pro', count: 456 },
    { model: 'gpt-5-mini', count: 320 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Throughput</span>
          </div>
          <div className="text-2xl font-bold">1,847</div>
          <div className="text-xs text-green-500 mt-1">+23% vs last 24h</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">P95 Latency</span>
          </div>
          <div className="text-2xl font-bold">580ms</div>
          <div className="text-xs text-green-500 mt-1">-12% improvement</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-muted-foreground">Success Rate</span>
          </div>
          <div className="text-2xl font-bold">98.7%</div>
          <div className="text-xs text-green-500 mt-1">Above SLA</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Error Rate</span>
          </div>
          <div className="text-2xl font-bold">1.3%</div>
          <div className="text-xs text-yellow-500 mt-1">Within threshold</div>
        </Card>
      </div>

      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="latency">Latency</TabsTrigger>
          <TabsTrigger value="models">Model Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Execution Volume (24h)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={executionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="executions" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="errors" stroke="hsl(var(--destructive))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="latency" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Latency Percentiles (24h)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} name="Average" />
                <Line type="monotone" dataKey="p95" stroke="hsl(142 71% 45%)" strokeWidth={2} name="P95" />
                <Line type="monotone" dataKey="p99" stroke="hsl(38 92% 50%)" strokeWidth={2} name="P99" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Model Usage Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
