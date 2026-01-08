// Multi-path reasoning comparison view
import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GitBranch,
  Brain,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  BarChart3,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReasoningPath, ReasoningBranch } from '@/hooks/useDreamMode';

interface MultiPathComparisonProps {
  paths: ReasoningPath[];
  onSelectPath?: (path: ReasoningPath) => void;
  onSelectBranch?: (branch: ReasoningBranch) => void;
}

// Style configurations
const styleConfig = {
  analytical: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: Brain,
    description: 'Logical, methodical, data-driven'
  },
  creative: {
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    icon: Sparkles,
    description: 'Imaginative, novel, divergent'
  },
  systematic: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: Target,
    description: 'Structured, organized, step-by-step'
  },
  intuitive: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: Lightbulb,
    description: 'Pattern-based, instinctive, holistic'
  }
};

// Style performance chart
const StylePerformanceChart: React.FC<{ 
  paths: ReasoningPath[];
  style: keyof typeof styleConfig;
}> = ({ paths, style }) => {
  const scores = useMemo(() => {
    return paths.map(path => {
      const branch = path.branches.find(b => b.style === style);
      return branch?.score || 0;
    });
  }, [paths, style]);

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
  const maxScore = Math.max(...scores, 0);
  const minScore = Math.min(...scores.filter(s => s > 0), 1);

  const config = styleConfig[style];
  const Icon = config.icon;

  return (
    <Card className={cn("p-4", config.bg, config.border)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("w-5 h-5", config.color)} />
        <span className="font-medium capitalize">{style}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Avg Score</span>
          <span className={config.color}>{(avgScore * 100).toFixed(1)}%</span>
        </div>
        <Progress value={avgScore * 100} className="h-2" />
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div>
            <span className="text-muted-foreground">Best:</span>
            <span className={cn("ml-1", config.color)}>{(maxScore * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Worst:</span>
            <span className="ml-1">{(minScore * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-3">{config.description}</p>
    </Card>
  );
};

// Individual path comparison card
const PathComparisonCard: React.FC<{
  path: ReasoningPath;
  onSelect?: () => void;
}> = ({ path, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  
  const sortedBranches = useMemo(() => {
    return [...path.branches].sort((a, b) => b.score - a.score);
  }, [path.branches]);

  const winner = sortedBranches[0];
  const winnerConfig = winner ? styleConfig[winner.style as keyof typeof styleConfig] : null;

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-2">{path.prompt}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(path.created_at).toLocaleString()}
          </p>
        </div>
        
        {winner && winnerConfig && (
          <Badge className={cn("ml-2 flex-shrink-0", winnerConfig.bg, winnerConfig.border, winnerConfig.color)}>
            <winnerConfig.icon className="w-3 h-3 mr-1" />
            {winner.style}
          </Badge>
        )}
      </div>

      {/* Branch comparison bars */}
      <div className="space-y-2 mb-3">
        {sortedBranches.map((branch, index) => {
          const config = styleConfig[branch.style as keyof typeof styleConfig];
          const isWinner = index === 0;
          
          return (
            <div key={branch.id} className="flex items-center gap-2">
              <config.icon className={cn("w-4 h-4 flex-shrink-0", config.color)} />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={cn(isWinner && "font-medium")}>{branch.style}</span>
                  <span className={cn(isWinner ? config.color : "text-muted-foreground")}>
                    {(branch.score * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={branch.score * 100} 
                  className="h-1.5"
                />
              </div>
              {isWinner && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Insights preview */}
      {path.insights_extracted.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">Insights extracted:</p>
          <div className="flex flex-wrap gap-1">
            {path.insights_extracted.slice(0, 3).map((insight, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {insight.substring(0, 30)}...
              </Badge>
            ))}
            {path.insights_extracted.length > 3 && (
              <Badge variant="outline" className="text-[10px]">
                +{path.insights_extracted.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Expandable details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
          {sortedBranches.map(branch => {
            const config = styleConfig[branch.style as keyof typeof styleConfig];
            return (
              <div key={branch.id} className={cn("p-3 rounded-lg", config.bg)}>
                <div className="flex items-center gap-2 mb-2">
                  <config.icon className={cn("w-4 h-4", config.color)} />
                  <span className="font-medium text-sm capitalize">{branch.style} Path</span>
                </div>
                <p className="text-xs text-muted-foreground">{branch.output}</p>
                {branch.insights.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {branch.insights.map((insight, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        <Lightbulb className="w-2 h-2 mr-1" />
                        {insight}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          <Eye className="w-3 h-3 mr-1" />
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
        {onSelect && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
          >
            <ArrowRight className="w-3 h-3 mr-1" />
            Explore
          </Button>
        )}
      </div>
    </Card>
  );
};

export const MultiPathComparison: React.FC<MultiPathComparisonProps> = ({
  paths,
  onSelectPath,
  onSelectBranch
}) => {
  const [activeTab, setActiveTab] = useState('paths');

  // Calculate overall style performance
  const styleStats = useMemo(() => {
    const stats: Record<string, { wins: number; totalScore: number; count: number }> = {
      analytical: { wins: 0, totalScore: 0, count: 0 },
      creative: { wins: 0, totalScore: 0, count: 0 },
      systematic: { wins: 0, totalScore: 0, count: 0 },
      intuitive: { wins: 0, totalScore: 0, count: 0 }
    };

    paths.forEach(path => {
      path.branches.forEach(branch => {
        const style = branch.style;
        if (stats[style]) {
          stats[style].totalScore += branch.score;
          stats[style].count++;
          if (path.best_style === style) {
            stats[style].wins++;
          }
        }
      });
    });

    return Object.entries(stats).map(([style, data]) => ({
      style,
      wins: data.wins,
      avgScore: data.count > 0 ? data.totalScore / data.count : 0,
      winRate: paths.length > 0 ? data.wins / paths.length : 0
    })).sort((a, b) => b.wins - a.wins);
  }, [paths]);

  if (paths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <GitBranch className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No reasoning paths to compare yet.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Run explorations to generate multi-path comparisons.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2">
        {styleStats.map(stat => {
          const config = styleConfig[stat.style as keyof typeof styleConfig];
          const Icon = config.icon;
          
          return (
            <Card key={stat.style} className={cn("p-3 text-center", config.bg, config.border)}>
              <Icon className={cn("w-5 h-5 mx-auto mb-1", config.color)} />
              <p className="text-lg font-bold">{stat.wins}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{stat.style} wins</p>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-background/50">
          <TabsTrigger value="paths" className="flex-1 text-xs">
            <GitBranch className="w-3 h-3 mr-1" />
            All Paths ({paths.length})
          </TabsTrigger>
          <TabsTrigger value="styles" className="flex-1 text-xs">
            <BarChart3 className="w-3 h-3 mr-1" />
            Style Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex-1 text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paths" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {paths.map(path => (
                <PathComparisonCard
                  key={path.id}
                  path={path}
                  onSelect={() => onSelectPath?.(path)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="styles" className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(styleConfig) as Array<keyof typeof styleConfig>).map(style => (
              <StylePerformanceChart
                key={style}
                paths={paths}
                style={style}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card className="p-4 bg-card/50">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Performance Over Time
            </h4>
            
            <div className="space-y-4">
              {/* Recent 10 paths trend */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Last 10 explorations:</p>
                <div className="flex gap-1">
                  {paths.slice(0, 10).reverse().map((path, i) => {
                    const config = path.best_style 
                      ? styleConfig[path.best_style as keyof typeof styleConfig]
                      : styleConfig.analytical;
                    return (
                      <div
                        key={path.id}
                        className={cn(
                          "flex-1 h-8 rounded flex items-end justify-center",
                          config.bg
                        )}
                        style={{ height: `${(path.best_score || 0.5) * 60 + 20}px` }}
                        title={`${path.best_style}: ${((path.best_score || 0) * 100).toFixed(0)}%`}
                      >
                        <config.icon className={cn("w-3 h-3 mb-1", config.color)} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Style diversity indicator */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Style diversity:</p>
                <div className="flex gap-1">
                  {styleStats.map(stat => (
                    <div
                      key={stat.style}
                      className={cn(
                        "h-6 rounded flex items-center justify-center text-[10px]",
                        styleConfig[stat.style as keyof typeof styleConfig].bg,
                        styleConfig[stat.style as keyof typeof styleConfig].color
                      )}
                      style={{ flex: stat.wins || 1 }}
                    >
                      {stat.wins > 0 && stat.wins}
                    </div>
                  ))}
                </div>
              </div>

              {/* Best performing prompts */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Top performing prompts:</p>
                <div className="space-y-1">
                  {paths
                    .slice()
                    .sort((a, b) => (b.best_score || 0) - (a.best_score || 0))
                    .slice(0, 3)
                    .map(path => (
                      <div key={path.id} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="truncate flex-1">{path.prompt}</span>
                        <span className="text-emerald-400">
                          {((path.best_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiPathComparison;
