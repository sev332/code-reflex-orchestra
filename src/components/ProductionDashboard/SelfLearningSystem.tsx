import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  BookOpen, 
  GitBranch,
  Activity,
  Clock,
  BarChart3,
  RefreshCw,
  Lightbulb,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings
} from 'lucide-react';

interface LearningModule {
  id: string;
  name: string;
  type: 'pattern_recognition' | 'optimization' | 'prediction' | 'adaptation' | 'meta_learning';
  status: 'learning' | 'converged' | 'improving' | 'retraining';
  accuracy: number;
  confidence: number;
  training_iterations: number;
  last_improvement: Date;
  learning_rate: number;
  data_points: number;
  performance_trend: 'increasing' | 'decreasing' | 'stable';
}

interface AdaptationEvent {
  id: string;
  timestamp: Date;
  type: 'parameter_update' | 'model_evolution' | 'strategy_change' | 'knowledge_synthesis';
  description: string;
  impact_score: number;
  module_id: string;
  before_metric: number;
  after_metric: number;
}

interface SelfLearningMetrics {
  total_modules: number;
  active_learning: number;
  average_accuracy: number;
  adaptation_rate: number;
  knowledge_retention: number;
  self_improvement_score: number;
  meta_learning_efficiency: number;
  emergent_capabilities: number;
}

export function SelfLearningSystem() {
  const { toast } = useToast();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [adaptations, setAdaptations] = useState<AdaptationEvent[]>([]);
  const [metrics, setMetrics] = useState<SelfLearningMetrics>({
    total_modules: 0,
    active_learning: 0,
    average_accuracy: 0,
    adaptation_rate: 0,
    knowledge_retention: 0,
    self_improvement_score: 0,
    meta_learning_efficiency: 0,
    emergent_capabilities: 0
  });
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [learningMode, setLearningMode] = useState<'continuous' | 'episodic' | 'meta'>('continuous');

  useEffect(() => {
    initializeLearningSystem();
    
    const interval = setInterval(() => {
      updateLearningProgress();
      simulateAdaptations();
      updateMetrics();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const initializeLearningSystem = () => {
    const initialModules: LearningModule[] = [
      {
        id: 'pattern-rec-1',
        name: 'Multi-Modal Pattern Recognition',
        type: 'pattern_recognition',
        status: 'learning',
        accuracy: 0.87,
        confidence: 0.92,
        training_iterations: 15847,
        last_improvement: new Date(Date.now() - 2 * 60 * 1000),
        learning_rate: 0.001,
        data_points: 2847593,
        performance_trend: 'increasing'
      },
      {
        id: 'opt-engine-1',
        name: 'Resource Optimization Engine',
        type: 'optimization',
        status: 'improving',
        accuracy: 0.94,
        confidence: 0.89,
        training_iterations: 8934,
        last_improvement: new Date(Date.now() - 5 * 60 * 1000),
        learning_rate: 0.0005,
        data_points: 1934726,
        performance_trend: 'stable'
      },
      {
        id: 'predict-sys-1',
        name: 'Predictive Analysis System',
        type: 'prediction',
        status: 'converged',
        accuracy: 0.91,
        confidence: 0.95,
        training_iterations: 23847,
        last_improvement: new Date(Date.now() - 15 * 60 * 1000),
        learning_rate: 0.0001,
        data_points: 4582947,
        performance_trend: 'stable'
      },
      {
        id: 'adapt-ctrl-1',
        name: 'Adaptive Control System',
        type: 'adaptation',
        status: 'learning',
        accuracy: 0.82,
        confidence: 0.78,
        training_iterations: 7234,
        last_improvement: new Date(Date.now() - 1 * 60 * 1000),
        learning_rate: 0.002,
        data_points: 1247592,
        performance_trend: 'increasing'
      },
      {
        id: 'meta-learn-1',
        name: 'Meta-Learning Coordinator',
        type: 'meta_learning',
        status: 'improving',
        accuracy: 0.89,
        confidence: 0.84,
        training_iterations: 12847,
        last_improvement: new Date(Date.now() - 3 * 60 * 1000),
        learning_rate: 0.0003,
        data_points: 3847592,
        performance_trend: 'increasing'
      }
    ];

    setModules(initialModules);
  };

  const updateLearningProgress = () => {
    setModules(prev => prev.map(module => {
      const accuracyChange = (Math.random() - 0.5) * 0.01;
      const confidenceChange = (Math.random() - 0.5) * 0.005;
      const newAccuracy = Math.max(0.1, Math.min(1.0, module.accuracy + accuracyChange));
      const newConfidence = Math.max(0.1, Math.min(1.0, module.confidence + confidenceChange));
      
      // Determine performance trend
      let trend: LearningModule['performance_trend'] = 'stable';
      if (accuracyChange > 0.003) trend = 'increasing';
      else if (accuracyChange < -0.003) trend = 'decreasing';
      
      // Update status based on performance
      let newStatus = module.status;
      if (newAccuracy > 0.95 && trend === 'stable') newStatus = 'converged';
      else if (trend === 'increasing') newStatus = 'improving';
      else if (trend === 'decreasing' && newAccuracy < 0.7) newStatus = 'retraining';
      else newStatus = 'learning';

      return {
        ...module,
        accuracy: newAccuracy,
        confidence: newConfidence,
        training_iterations: module.training_iterations + Math.floor(Math.random() * 50) + 10,
        data_points: module.data_points + Math.floor(Math.random() * 1000) + 100,
        performance_trend: trend,
        status: newStatus,
        last_improvement: accuracyChange > 0.001 ? new Date() : module.last_improvement
      };
    }));
  };

  const simulateAdaptations = () => {
    if (Math.random() > 0.8) {
      const adaptationTypes = ['parameter_update', 'model_evolution', 'strategy_change', 'knowledge_synthesis'] as const;
      const randomModule = modules[Math.floor(Math.random() * modules.length)];
      
      if (randomModule) {
        const adaptation: AdaptationEvent = {
          id: `adapt-${Date.now()}`,
          timestamp: new Date(),
          type: adaptationTypes[Math.floor(Math.random() * adaptationTypes.length)],
          description: generateAdaptationDescription(adaptationTypes[Math.floor(Math.random() * adaptationTypes.length)]),
          impact_score: Math.random() * 0.1 + 0.01,
          module_id: randomModule.id,
          before_metric: randomModule.accuracy,
          after_metric: Math.min(1.0, randomModule.accuracy + Math.random() * 0.05)
        };

        setAdaptations(prev => [adaptation, ...prev.slice(0, 19)]);
      }
    }
  };

  const generateAdaptationDescription = (type: AdaptationEvent['type']): string => {
    const descriptions = {
      parameter_update: [
        'Learning rate adjusted based on convergence analysis',
        'Regularization parameters optimized for better generalization',
        'Batch size modified for improved training stability'
      ],
      model_evolution: [
        'Neural architecture expanded with attention mechanisms',
        'New layer added to improve feature extraction',
        'Model pruning applied to reduce computational overhead'
      ],
      strategy_change: [
        'Switched to curriculum learning approach',
        'Implemented active learning for data selection',
        'Adopted ensemble methods for improved robustness'
      ],
      knowledge_synthesis: [
        'Cross-domain knowledge transfer completed',
        'Integrated insights from pattern recognition module',
        'Synthesized learning from multiple data sources'
      ]
    };
    
    const options = descriptions[type];
    return options[Math.floor(Math.random() * options.length)];
  };

  const updateMetrics = () => {
    const activeLearning = modules.filter(m => m.status === 'learning' || m.status === 'improving').length;
    const avgAccuracy = modules.reduce((sum, m) => sum + m.accuracy, 0) / modules.length;
    const recentAdaptations = adaptations.filter(a => 
      Date.now() - a.timestamp.getTime() < 10 * 60 * 1000
    ).length;

    setMetrics({
      total_modules: modules.length,
      active_learning: activeLearning,
      average_accuracy: avgAccuracy * 100,
      adaptation_rate: recentAdaptations * 6, // per hour
      knowledge_retention: 85 + Math.random() * 10,
      self_improvement_score: 78 + Math.random() * 15,
      meta_learning_efficiency: 82 + Math.random() * 12,
      emergent_capabilities: Math.floor(adaptations.length / 10)
    });
  };

  const triggerRetraining = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, status: 'retraining', training_iterations: 0 }
        : module
    ));
    
    toast({
      title: "Retraining Initiated",
      description: `Module ${moduleId} is being retrained with updated parameters`,
    });
  };

  const optimizeLearningRate = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { 
            ...module, 
            learning_rate: module.learning_rate * (0.8 + Math.random() * 0.4),
            status: 'improving'
          }
        : module
    ));
    
    toast({
      title: "Learning Rate Optimized",
      description: `Adaptive learning rate adjustment applied to module`,
    });
  };

  const getModuleIcon = (type: LearningModule['type']) => {
    switch (type) {
      case 'pattern_recognition': return Eye;
      case 'optimization': return Target;
      case 'prediction': return TrendingUp;
      case 'adaptation': return RefreshCw;
      case 'meta_learning': return Brain;
      default: return Activity;
    }
  };

  const getStatusColor = (status: LearningModule['status']) => {
    switch (status) {
      case 'converged': return 'text-green-600';
      case 'improving': return 'text-blue-600';
      case 'learning': return 'text-yellow-600';
      case 'retraining': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: LearningModule['performance_trend']) => {
    switch (trend) {
      case 'increasing': return ArrowUp;
      case 'decreasing': return ArrowDown;
      default: return Activity;
    }
  };

  const getAdaptationIcon = (type: AdaptationEvent['type']) => {
    switch (type) {
      case 'parameter_update': return Settings;
      case 'model_evolution': return GitBranch;
      case 'strategy_change': return Lightbulb;
      case 'knowledge_synthesis': return BookOpen;
      default: return RefreshCw;
    }
  };

  return (
    <div className="space-y-6">
      {/* Learning System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Learning</p>
                <p className="text-2xl font-bold">{metrics.active_learning}</p>
                <p className="text-xs text-muted-foreground">of {metrics.total_modules} modules</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">{Math.round(metrics.average_accuracy)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Adaptation Rate</p>
                <p className="text-2xl font-bold">{Math.round(metrics.adaptation_rate)}</p>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
              <RefreshCw className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Self-Improvement</p>
                <p className="text-2xl font-bold">{Math.round(metrics.self_improvement_score)}%</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Mode Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Self-Learning Control</CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={learningMode === 'continuous' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setLearningMode('continuous')}
              >
                Continuous
              </Badge>
              <Badge 
                variant={learningMode === 'episodic' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setLearningMode('episodic')}
              >
                Episodic
              </Badge>
              <Badge 
                variant={learningMode === 'meta' ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setLearningMode('meta')}
              >
                Meta-Learning
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Knowledge Retention</h4>
              <Progress value={metrics.knowledge_retention} />
              <p className="text-xs text-muted-foreground">{Math.round(metrics.knowledge_retention)}% retention rate</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Meta-Learning Efficiency</h4>
              <Progress value={metrics.meta_learning_efficiency} />
              <p className="text-xs text-muted-foreground">{Math.round(metrics.meta_learning_efficiency)}% efficiency</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Emergent Capabilities</h4>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold">{metrics.emergent_capabilities}</span>
                <span className="text-sm text-muted-foreground">discovered</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Learning Interface */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Learning Modules</TabsTrigger>
          <TabsTrigger value="adaptations">Recent Adaptations</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="evolution">System Evolution</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {modules.map((module) => {
              const ModuleIcon = getModuleIcon(module.type);
              const TrendIcon = getTrendIcon(module.performance_trend);
              
              return (
                <Card 
                  key={module.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedModule === module.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedModule(module.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ModuleIcon className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium text-sm">{module.name}</h4>
                          <p className="text-xs text-muted-foreground">{module.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(module.status)}>
                          {module.status}
                        </Badge>
                        <TrendIcon className={`h-4 w-4 ${
                          module.performance_trend === 'increasing' ? 'text-green-600' :
                          module.performance_trend === 'decreasing' ? 'text-red-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Accuracy</span>
                          <span>{Math.round(module.accuracy * 100)}%</span>
                        </div>
                        <Progress value={module.accuracy * 100} className="h-1" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Confidence</span>
                          <span>{Math.round(module.confidence * 100)}%</span>
                        </div>
                        <Progress value={module.confidence * 100} className="h-1" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>{module.training_iterations.toLocaleString()} iterations</span>
                      <span>LR: {module.learning_rate.toFixed(4)}</span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-6 flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          optimizeLearningRate(module.id);
                        }}
                      >
                        Optimize
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-6 flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerRetraining(module.id);
                        }}
                      >
                        Retrain
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="adaptations" className="space-y-4">
          <div className="space-y-3">
            {adaptations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent adaptations</p>
                  <p className="text-sm text-muted-foreground">System adaptations will appear here</p>
                </CardContent>
              </Card>
            ) : (
              adaptations.map((adaptation) => {
                const AdaptIcon = getAdaptationIcon(adaptation.type);
                const relatedModule = modules.find(m => m.id === adaptation.module_id);
                
                return (
                  <Card key={adaptation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <AdaptIcon className="h-4 w-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{adaptation.type.replace('_', ' ')}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {adaptation.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Impact:</span>
                              <Badge variant="secondary">
                                +{Math.round(adaptation.impact_score * 100)}%
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm">{adaptation.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Module: {relatedModule?.name || 'Unknown'}</span>
                            <span>
                              Before: {Math.round(adaptation.before_metric * 100)}% → 
                              After: {Math.round(adaptation.after_metric * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Graph Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Knowledge Domains</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Pattern Recognition</span>
                      <Badge variant="secondary">Core Domain</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Optimization Theory</span>
                      <Badge variant="secondary">Specialized</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Predictive Modeling</span>
                      <Badge variant="secondary">Advanced</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">Meta-Learning</span>
                      <Badge variant="secondary">Emerging</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Cross-Domain Connections</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <GitBranch className="h-4 w-4" />
                      <span className="text-sm">Pattern → Optimization: 87% synergy</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <GitBranch className="h-4 w-4" />
                      <span className="text-sm">Prediction → Adaptation: 92% correlation</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <GitBranch className="h-4 w-4" />
                      <span className="text-sm">Meta-Learning → All: 78% integration</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Evolution Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Meta-Learning Integration</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Predictive Accuracy Breakthrough</p>
                      <p className="text-xs text-muted-foreground">6 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Cross-Module Knowledge Transfer</p>
                      <p className="text-xs text-muted-foreground">12 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Adaptive Learning Rate Discovery</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Evolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall System Intelligence</span>
                      <span>↑ 23% this week</span>
                    </div>
                    <Progress value={89} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Learning Efficiency</span>
                      <span>↑ 15% this week</span>
                    </div>
                    <Progress value={82} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Knowledge Integration</span>
                      <span>↑ 18% this week</span>
                    </div>
                    <Progress value={76} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Adaptation Speed</span>
                      <span>↑ 31% this week</span>
                    </div>
                    <Progress value={94} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}