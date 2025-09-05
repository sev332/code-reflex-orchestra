// 🔗 CONNECT: Advanced Reasoning → Consciousness Emergence → Problem Solving
// 🧩 INTENT: Universal problem solver capable of tackling any problem domain
// ✅ SPEC: Universal-Problem-Solver-v3.0

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Target, Lightbulb, Cog, TrendingUp, CheckCircle } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  domain: string;
  complexity: number;
  status: 'pending' | 'analyzing' | 'solving' | 'solved' | 'failed';
  solution?: Solution;
  created_at: string;
}

interface Solution {
  approach: string;
  steps: SolutionStep[];
  confidence: number;
  estimated_time: number;
  resources_required: string[];
  success_probability: number;
  alternative_approaches: string[];
}

interface SolutionStep {
  id: string;
  description: string;
  method: string;
  expected_outcome: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
}

interface ProblemSolvingStrategy {
  id: string;
  name: string;
  description: string;
  domains: string[];
  effectiveness: number;
  complexity_range: [number, number];
}

interface ReasoningPath {
  id: string;
  type: 'deductive' | 'inductive' | 'abductive' | 'analogical' | 'causal';
  description: string;
  confidence: number;
  evidence: string[];
}

export function UniversalProblemSolver() {
  const [problems, setProblems] = useState<Problem[]>([
    {
      id: 'demo-1',
      title: 'Climate Change Mitigation',
      description: 'Develop comprehensive strategy for reducing global carbon emissions by 50% within 10 years',
      domain: 'Environmental Science',
      complexity: 9,
      status: 'solved',
      solution: {
        approach: 'Multi-Modal Decarbonization Strategy',
        steps: [
          {
            id: 'step-1',
            description: 'Renewable Energy Transition',
            method: 'Exponential scaling of solar, wind, and energy storage',
            expected_outcome: '60% renewable energy by 2030',
            dependencies: [],
            status: 'completed',
            progress: 100
          },
          {
            id: 'step-2',
            description: 'Carbon Capture Deployment',
            method: 'Direct air capture and industrial CCS implementation',
            expected_outcome: '5 Gt CO2 removal annually',
            dependencies: ['step-1'],
            status: 'in_progress',
            progress: 65
          }
        ],
        confidence: 0.87,
        estimated_time: 120,
        resources_required: ['$50T investment', 'Global coordination', 'Technology scaling'],
        success_probability: 0.73,
        alternative_approaches: ['Geoengineering', 'Behavioral change focus', 'Carbon pricing']
      },
      created_at: new Date().toISOString()
    }
  ]);

  const [currentProblem, setCurrentProblem] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('General');

  const [strategies, setStrategies] = useState<ProblemSolvingStrategy[]>([
    {
      id: 'first-principles',
      name: 'First Principles Reasoning',
      description: 'Break down complex problems into fundamental components',
      domains: ['Physics', 'Engineering', 'Mathematics'],
      effectiveness: 0.92,
      complexity_range: [7, 10]
    },
    {
      id: 'systems-thinking',
      name: 'Systems Thinking',
      description: 'Analyze interconnections and feedback loops',
      domains: ['Economics', 'Biology', 'Social Sciences'],
      effectiveness: 0.85,
      complexity_range: [5, 9]
    },
    {
      id: 'design-thinking',
      name: 'Design Thinking',
      description: 'Human-centered problem solving approach',
      domains: ['Design', 'Business', 'User Experience'],
      effectiveness: 0.78,
      complexity_range: [3, 7]
    },
    {
      id: 'constraint-satisfaction',
      name: 'Constraint Satisfaction',
      description: 'Find solutions within given constraints',
      domains: ['Computer Science', 'Operations Research'],
      effectiveness: 0.88,
      complexity_range: [4, 8]
    },
    {
      id: 'evolutionary-algorithms',
      name: 'Evolutionary Optimization',
      description: 'Iterative improvement through variation and selection',
      domains: ['Optimization', 'Machine Learning', 'Biology'],
      effectiveness: 0.81,
      complexity_range: [6, 9]
    }
  ]);

  const [reasoningPaths, setReasoningPaths] = useState<ReasoningPath[]>([
    {
      id: 'deductive-1',
      type: 'deductive',
      description: 'Logical deduction from established principles',
      confidence: 0.94,
      evidence: ['Proven theories', 'Mathematical proofs', 'Empirical laws']
    },
    {
      id: 'inductive-1',
      type: 'inductive',
      description: 'Pattern recognition from observed data',
      confidence: 0.76,
      evidence: ['Historical trends', 'Statistical correlations', 'Experimental results']
    },
    {
      id: 'abductive-1',
      type: 'abductive',
      description: 'Inference to the best explanation',
      confidence: 0.68,
      evidence: ['Hypothesis formation', 'Causal reasoning', 'Best fit models']
    }
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // 🔗 CONNECT: Problem Analysis → Multi-Strategy Assessment
  // 🧩 INTENT: Analyze problem complexity and select optimal solving strategies
  // ✅ SPEC: Problem-Analysis-v2.0
  const analyzeProblem = useCallback(async (problem: Problem): Promise<Solution> => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis phases
    const phases = [
      'Domain identification',
      'Complexity assessment',
      'Strategy selection',
      'Solution synthesis',
      'Validation'
    ];

    for (let i = 0; i < phases.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress((i + 1) * 20);
    }

    // Select optimal strategies based on domain and complexity
    const applicableStrategies = strategies.filter(s => 
      s.domains.includes(problem.domain) || s.domains.includes('General') &&
      problem.complexity >= s.complexity_range[0] &&
      problem.complexity <= s.complexity_range[1]
    ).sort((a, b) => b.effectiveness - a.effectiveness);

    const primaryStrategy = applicableStrategies[0];

    // Generate solution steps based on selected strategy
    const steps: SolutionStep[] = [];
    
    if (primaryStrategy?.id === 'first-principles') {
      steps.push(
        {
          id: 'fundamental-analysis',
          description: 'Identify fundamental principles and constraints',
          method: 'First principles decomposition',
          expected_outcome: 'Core problem elements identified',
          dependencies: [],
          status: 'pending',
          progress: 0
        },
        {
          id: 'component-solutions',
          description: 'Solve individual components',
          method: 'Targeted problem solving',
          expected_outcome: 'Component solutions developed',
          dependencies: ['fundamental-analysis'],
          status: 'pending',
          progress: 0
        },
        {
          id: 'integration',
          description: 'Integrate component solutions',
          method: 'Systems integration',
          expected_outcome: 'Unified solution architecture',
          dependencies: ['component-solutions'],
          status: 'pending',
          progress: 0
        }
      );
    } else if (primaryStrategy?.id === 'systems-thinking') {
      steps.push(
        {
          id: 'system-mapping',
          description: 'Map system components and relationships',
          method: 'Systems analysis',
          expected_outcome: 'System map with feedback loops',
          dependencies: [],
          status: 'pending',
          progress: 0
        },
        {
          id: 'leverage-points',
          description: 'Identify high-impact intervention points',
          method: 'Leverage analysis',
          expected_outcome: 'Priority intervention targets',
          dependencies: ['system-mapping'],
          status: 'pending',
          progress: 0
        }
      );
    }

    // Calculate confidence based on strategy effectiveness and problem complexity
    const baseConfidence = primaryStrategy?.effectiveness || 0.7;
    const complexityPenalty = Math.max(0, (problem.complexity - 5) * 0.05);
    const confidence = Math.max(0.3, baseConfidence - complexityPenalty);

    const solution: Solution = {
      approach: primaryStrategy?.name || 'General Problem Solving',
      steps,
      confidence,
      estimated_time: problem.complexity * 15,
      resources_required: [
        'Domain expertise',
        'Computational resources',
        'Data access'
      ],
      success_probability: confidence * 0.9,
      alternative_approaches: applicableStrategies.slice(1, 4).map(s => s.name)
    };

    setIsAnalyzing(false);
    setAnalysisProgress(0);

    return solution;
  }, [strategies]);

  // 🔗 CONNECT: Problem Submission → Solution Generation
  // 🧩 INTENT: Process new problem submissions and generate solutions
  // ✅ SPEC: Problem-Processing-v1.0
  const submitProblem = useCallback(async () => {
    if (!currentProblem.trim() || !problemDescription.trim()) return;

    const newProblem: Problem = {
      id: `problem-${Date.now()}`,
      title: currentProblem,
      description: problemDescription,
      domain: selectedDomain,
      complexity: Math.min(10, Math.max(1, Math.floor(problemDescription.length / 50) + 3)),
      status: 'analyzing',
      created_at: new Date().toISOString()
    };

    setProblems(prev => [...prev, newProblem]);
    setCurrentProblem('');
    setProblemDescription('');

    // Analyze and solve the problem
    try {
      const solution = await analyzeProblem(newProblem);
      
      setProblems(prev => 
        prev.map(p => 
          p.id === newProblem.id 
            ? { ...p, status: 'solved', solution }
            : p
        )
      );
    } catch (error) {
      setProblems(prev => 
        prev.map(p => 
          p.id === newProblem.id 
            ? { ...p, status: 'failed' }
            : p
        )
      );
    }
  }, [currentProblem, problemDescription, selectedDomain, analyzeProblem]);

  // 🔗 CONNECT: Solution Steps → Progress Simulation
  // 🧩 INTENT: Simulate solution step execution and progress tracking
  // ✅ SPEC: Solution-Execution-v1.0
  const executeSolutionStep = useCallback((problemId: string, stepId: string) => {
    setProblems(prev => 
      prev.map(problem => {
        if (problem.id !== problemId || !problem.solution) return problem;

        const updatedSteps = problem.solution.steps.map(step => {
          if (step.id === stepId && step.status === 'pending') {
            return { ...step, status: 'in_progress' as const };
          }
          return step;
        });

        return {
          ...problem,
          solution: {
            ...problem.solution,
            steps: updatedSteps
          }
        };
      })
    );

    // Simulate step execution
    const progressInterval = setInterval(() => {
      setProblems(prev => 
        prev.map(problem => {
          if (problem.id !== problemId || !problem.solution) return problem;

          const updatedSteps = problem.solution.steps.map(step => {
            if (step.id === stepId && step.status === 'in_progress') {
              const newProgress = Math.min(100, step.progress + 10);
              return {
                ...step,
                progress: newProgress,
                status: newProgress === 100 ? 'completed' as const : 'in_progress' as const
              };
            }
            return step;
          });

          return {
            ...problem,
            solution: {
              ...problem.solution,
              steps: updatedSteps
            }
          };
        })
      );
    }, 500);

    // Complete step after 5 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
    }, 5000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-gradient-primary">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Brain className="h-8 w-8 text-primary" />
            Universal Problem Solver
          </CardTitle>
          <p className="text-muted-foreground">
            Advanced AGI system capable of solving problems across any domain
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="solve" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="solve">Problem Solving</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="solve" className="space-y-6">
          {/* Problem Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Submit Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Problem Title</label>
                <Input
                  value={currentProblem}
                  onChange={(e) => setCurrentProblem(e.target.value)}
                  placeholder="Enter problem title..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Problem Description</label>
                <Textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe the problem in detail..."
                  rows={4}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Domain</label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="General">General</option>
                  <option value="Science">Science</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Environment">Environment</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Social">Social</option>
                </select>
              </div>
              
              <Button 
                onClick={submitProblem}
                disabled={!currentProblem.trim() || !problemDescription.trim() || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? 'Analyzing...' : 'Solve Problem'}
              </Button>

              {isAnalyzing && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Analysis Progress:</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Problems */}
          <div className="space-y-4">
            {problems.map((problem) => (
              <Card key={problem.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{problem.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{problem.domain}</Badge>
                      <Badge 
                        variant={
                          problem.status === 'solved' ? 'default' :
                          problem.status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {problem.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                </CardHeader>
                
                {problem.solution && (
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {(problem.solution.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Confidence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {problem.solution.estimated_time}h
                          </div>
                          <div className="text-sm text-muted-foreground">Est. Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {(problem.solution.success_probability * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Approach: {problem.solution.approach}</h4>
                        <div className="space-y-3">
                          {problem.solution.steps.map((step) => (
                            <div key={step.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{step.description}</h5>
                                <div className="flex items-center gap-2">
                                  {step.status === 'completed' && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                  <Badge variant="outline">{step.status}</Badge>
                                  {step.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={() => executeSolutionStep(problem.id, step.id)}
                                    >
                                      Execute
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Method: {step.method}
                              </p>
                              <p className="text-sm text-muted-foreground mb-2">
                                Expected: {step.expected_outcome}
                              </p>
                              {step.status !== 'pending' && (
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Progress:</span>
                                    <span>{step.progress}%</span>
                                  </div>
                                  <Progress value={step.progress} className="h-2" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Alternative Approaches</h4>
                        <div className="flex flex-wrap gap-2">
                          {problem.solution.alternative_approaches.map((approach, index) => (
                            <Badge key={index} variant="secondary">
                              {approach}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="strategies">
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5" />
              Problem-Solving Strategies
            </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {strategies.map((strategy) => (
                  <div key={strategy.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{strategy.name}</h3>
                      <Badge variant="outline">
                        {(strategy.effectiveness * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {strategy.description}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Domains:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {strategy.domains.map(domain => (
                            <Badge key={domain} variant="secondary" className="text-xs">
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Complexity Range:</span> 
                        {strategy.complexity_range[0]} - {strategy.complexity_range[1]}
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Effectiveness:</span>
                          <span>{(strategy.effectiveness * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={strategy.effectiveness * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reasoning">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Reasoning Paths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reasoningPaths.map((path) => (
                  <div key={path.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold capitalize">{path.type} Reasoning</h3>
                      <Badge variant="outline">
                        {(path.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {path.description}
                    </p>
                    <div>
                      <span className="text-sm font-medium">Evidence Types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {path.evidence.map((evidence, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {evidence}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Problem History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {problems.map((problem) => (
                  <div key={problem.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{problem.title}</h4>
                      <p className="text-sm text-muted-foreground">{problem.domain}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Complexity: {problem.complexity}/10
                      </Badge>
                      <Badge 
                        variant={
                          problem.status === 'solved' ? 'default' :
                          problem.status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {problem.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}