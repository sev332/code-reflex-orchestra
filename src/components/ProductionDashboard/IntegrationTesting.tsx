import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Code,
  Brain,
  Database
} from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  duration: number;
  output: string;
  timestamp: Date;
}

export function IntegrationTesting() {
  const [tests, setTests] = useState<TestResult[]>([
    { id: '1', name: 'Agent Communication Test', status: 'passed', duration: 1200, output: 'All agents responding correctly', timestamp: new Date() },
    { id: '2', name: 'Memory Vector Search', status: 'passed', duration: 850, output: 'Vector similarity search working', timestamp: new Date() },
    { id: '3', name: 'AI Model Integration', status: 'failed', duration: 2100, output: 'Timeout in GPT-5 response', timestamp: new Date() },
    { id: '4', name: 'Database Operations', status: 'running', duration: 0, output: 'Testing CRUD operations...', timestamp: new Date() }
  ]);

  const [customTest, setCustomTest] = useState({
    name: '',
    description: '',
    code: `// Example test
async function testAgentResponse() {
  const agent = await getAgent('researcher');
  const response = await agent.process('Test query');
  return response.length > 0;
}`
  });

  const [isRunningAll, setIsRunningAll] = useState(false);

  const testSuites = [
    {
      name: 'Core Systems',
      tests: ['Agent Lifecycle', 'Memory Operations', 'Task Routing', 'Error Recovery'],
      status: 'passed'
    },
    {
      name: 'AI Integration',
      tests: ['Model Selection', 'Response Quality', 'Fallback Systems', 'Rate Limiting'],
      status: 'failed'
    },
    {
      name: 'Performance',
      tests: ['Load Testing', 'Stress Testing', 'Memory Usage', 'Response Time'],
      status: 'running'
    },
    {
      name: 'Security',
      tests: ['Authentication', 'Authorization', 'Data Encryption', 'Input Validation'],
      status: 'pending'
    }
  ];

  useEffect(() => {
    // Simulate test updates
    const interval = setInterval(() => {
      setTests(prev => prev.map(test => {
        if (test.status === 'running') {
          const shouldComplete = Math.random() > 0.7;
          if (shouldComplete) {
            return {
              ...test,
              status: Math.random() > 0.3 ? 'passed' : 'failed',
              duration: Math.floor(Math.random() * 3000) + 500,
              output: Math.random() > 0.3 ? 'Test completed successfully' : 'Test failed with error'
            };
          }
        }
        return test;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const runTest = (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'running', duration: 0, output: 'Starting test...' }
        : test
    ));
    toast.info('Test started');
  };

  const runAllTests = () => {
    setIsRunningAll(true);
    setTests(prev => prev.map(test => ({
      ...test,
      status: 'running',
      duration: 0,
      output: 'Starting test...'
    })));
    
    setTimeout(() => {
      setIsRunningAll(false);
      toast.success('All tests completed');
    }, 5000);
  };

  const createCustomTest = () => {
    if (!customTest.name.trim()) {
      toast.error('Please provide a test name');
      return;
    }

    const newTest: TestResult = {
      id: Date.now().toString(),
      name: customTest.name,
      status: 'pending',
      duration: 0,
      output: 'Test created, ready to run',
      timestamp: new Date()
    };

    setTests(prev => [newTest, ...prev]);
    setCustomTest({ name: '', description: '', code: customTest.code });
    toast.success('Custom test created');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSuiteStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            Integration Testing Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button onClick={runAllTests} disabled={isRunningAll}>
                <Play className="w-4 h-4 mr-2" />
                {isRunningAll ? 'Running All...' : 'Run All Tests'}
              </Button>
              <Button variant="outline">
                <Square className="w-4 h-4 mr-2" />
                Stop All
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {tests.filter(t => t.status === 'passed').length} passed, 
              {tests.filter(t => t.status === 'failed').length} failed, 
              {tests.filter(t => t.status === 'running').length} running
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {testSuites.map((suite, index) => (
              <Card key={index} className="p-3">
                <div className="text-center">
                  <Badge className={getSuiteStatusColor(suite.status)} variant="secondary">
                    {suite.status}
                  </Badge>
                  <h3 className="font-semibold mt-2">{suite.name}</h3>
                  <p className="text-sm text-muted-foreground">{suite.tests.length} tests</p>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="custom">Custom Tests</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h4 className="font-medium">{test.name}</h4>
                      <p className="text-sm text-muted-foreground">{test.output}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {test.duration > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runTest(test.id)}
                      disabled={test.status === 'running'}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Test name"
                value={customTest.name}
                onChange={(e) => setCustomTest(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <Input
                placeholder="Test description"
                value={customTest.description}
                onChange={(e) => setCustomTest(prev => ({ ...prev, description: e.target.value }))}
              />
              
              <Textarea
                placeholder="Test code"
                value={customTest.code}
                onChange={(e) => setCustomTest(prev => ({ ...prev, code: e.target.value }))}
                rows={8}
                className="font-mono text-sm"
              />
              
              <Button onClick={createCustomTest}>
                <Code className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Live System Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">System Health Checks</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Database Connection</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">AI Model Endpoints</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Memory System</span>
                      <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Agent Network</span>
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span className="font-mono">127ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Throughput</span>
                      <span className="font-mono">45.2 req/s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Error Rate</span>
                      <span className="font-mono">0.02%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span className="font-mono">67.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}