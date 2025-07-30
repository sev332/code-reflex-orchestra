import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIRouter } from '@/lib/api-router';
import { apiRegistry } from '@/lib/api-registry';
import { Activity, AlertCircle, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';

interface APIStatus {
  id: string;
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  requests: number;
  errors: number;
  successRate: number;
}

export const APIMonitor: React.FC = () => {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds

  useEffect(() => {
    const updateStatuses = () => {
      const router = APIRouter.getInstance();
      const statuses = router.getAPIStatus();
      setApiStatuses(statuses);
    };

    updateStatuses();
    const interval = setInterval(updateStatuses, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const categories = ['all', ...new Set(apiStatuses.map(api => api.category))];
  const filteredAPIs = selectedCategory === 'all' 
    ? apiStatuses 
    : apiStatuses.filter(api => api.category === selectedCategory);

  const healthyCount = apiStatuses.filter(api => api.status === 'healthy').length;
  const degradedCount = apiStatuses.filter(api => api.status === 'degraded').length;
  const downCount = apiStatuses.filter(api => api.status === 'down').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total APIs</p>
                <p className="text-2xl font-bold">{apiStatuses.length}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold text-green-600">{healthyCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Degraded</p>
                <p className="text-2xl font-bold text-yellow-600">{degradedCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Down</p>
                <p className="text-2xl font-bold text-red-600">{downCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              API Status Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const router = APIRouter.getInstance();
                  router.clearCache();
                  window.location.reload();
                }}
              >
                Clear Cache
              </Button>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
                <option value={300000}>5m</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              {categories.slice(0, 6).map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid gap-4">
                {filteredAPIs.map(api => (
                  <Card key={api.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(api.status)}
                          <div>
                            <h3 className="font-semibold">{api.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {api.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {api.responseTime}ms
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg Response
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {api.requests}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requests
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {api.errors}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Errors
                            </p>
                          </div>

                          <div className="w-24">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">
                                Success
                              </span>
                              <span className="text-xs font-medium">
                                {api.successRate.toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={api.successRate} 
                              className="h-2"
                            />
                          </div>

                          <Badge 
                            variant="secondary" 
                            className={`${getStatusColor(api.status)} text-white border-0`}
                          >
                            {api.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};