// SAM Analysis Panel - AI-automated System Anatomy Mapping analysis
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Zap, Check, X, AlertTriangle, Info, 
  FileText, Tag, GitBranch, BarChart3, RefreshCw,
  ChevronRight, ChevronDown, Sparkles, Play, Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  useSAMAnalysis, 
  SAMAnalysisResult, 
  SAMSection, 
  SAMTag,
  SAMValidationResult,
  SAMQualityMetrics 
} from '@/hooks/useSAMAnalysis';

interface SAMAnalysisPanelProps {
  content: string;
  contentType: 'document' | 'code';
  onApplySAM?: (samContent: string) => void;
  fileName?: string;
  language?: string;
}

export function SAMAnalysisPanel({ 
  content, 
  contentType, 
  onApplySAM,
  fileName = 'untitled',
  language = 'markdown'
}: SAMAnalysisPanelProps) {
  const {
    isAnalyzing,
    isGenerating,
    analysisResult,
    analysisProgress,
    streamingContent,
    analyzeWithAI,
    generateSAMDocument,
    generateSAMForCode,
    improveSAMDocument,
  } = useSAMAnalysis();

  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'tags' | 'quality'>('overview');
  const [systemName, setSystemName] = useState(fileName.replace(/\.[^/.]+$/, ''));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error('No content to analyze');
      return;
    }
    
    try {
      await analyzeWithAI(content, contentType);
      toast.success('SAM analysis complete!');
    } catch (error) {
      toast.error('Analysis failed');
    }
  };

  const handleGenerateSAM = async () => {
    try {
      let samContent: string;
      
      if (contentType === 'code') {
        samContent = await generateSAMForCode(content, language, fileName);
      } else {
        samContent = await generateSAMDocument(content, {
          systemName,
          targetDimensions: ['structure', 'behavior', 'interfaces', 'constraints', 'evidence'],
          includeEvidence: true,
          strictMode: true,
        });
      }
      
      if (onApplySAM) {
        onApplySAM(samContent);
      }
      
      toast.success('SAM documentation generated!');
    } catch (error) {
      toast.error('Generation failed');
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderQualityMetrics = (metrics: SAMQualityMetrics) => {
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-yellow-400';
      return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
      if (score >= 80) return 'bg-green-500/20';
      if (score >= 60) return 'bg-yellow-500/20';
      return 'bg-red-500/20';
    };

    return (
      <div className="space-y-3">
        <div className={cn("p-4 rounded-lg", getScoreBg(metrics.perfectionScore))}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Perfection Score</span>
            <span className={cn("text-2xl font-bold", getScoreColor(metrics.perfectionScore))}>
              {metrics.perfectionScore.toFixed(0)}/100
            </span>
          </div>
          <Progress value={metrics.perfectionScore} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Completeness', value: metrics.completeness, weight: '25%' },
            { label: 'Consistency', value: metrics.consistency, weight: '25%' },
            { label: 'Evidence', value: metrics.evidence, weight: '20%' },
            { label: 'Readability', value: metrics.readability, weight: '15%' },
            { label: 'Maintenance', value: metrics.maintenance, weight: '15%' },
          ].map(metric => (
            <Card key={metric.label} className="p-2 border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{metric.label}</span>
                <Badge variant="outline" className="text-[9px]">{metric.weight}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={metric.value} className="h-1.5 flex-1" />
                <span className={cn("text-xs font-medium", getScoreColor(metric.value))}>
                  {metric.value.toFixed(0)}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderValidation = (validation: SAMValidationResult) => {
    return (
      <div className="space-y-3">
        <div className={cn(
          "p-3 rounded-lg flex items-center gap-2",
          validation.isValid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
        )}>
          {validation.isValid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {validation.isValid ? 'SAM Compliant' : 'Validation Errors Found'}
          </span>
        </div>

        {validation.errors.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-red-400">Errors ({validation.errors.length})</span>
            {validation.errors.map((error, idx) => (
              <div key={idx} className="p-2 rounded bg-red-500/10 text-xs flex items-start gap-2">
                <X className="w-3 h-3 mt-0.5 text-red-400" />
                <span>{error.message}</span>
              </div>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-yellow-400">Warnings ({validation.warnings.length})</span>
            {validation.warnings.map((warning, idx) => (
              <div key={idx} className="p-2 rounded bg-yellow-500/10 text-xs flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 text-yellow-400" />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}

        {validation.suggestions.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-blue-400">Suggestions ({validation.suggestions.length})</span>
            {validation.suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-2 rounded bg-blue-500/10 text-xs flex items-start gap-2">
                <Info className="w-3 h-3 mt-0.5 text-blue-400" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSections = (sections: SAMSection[]) => {
    const dimensionColors = {
      structure: 'bg-blue-500/20 text-blue-400',
      behavior: 'bg-purple-500/20 text-purple-400',
      interfaces: 'bg-green-500/20 text-green-400',
      constraints: 'bg-orange-500/20 text-orange-400',
      evidence: 'bg-cyan-500/20 text-cyan-400',
    };

    return (
      <div className="space-y-2">
        {sections.map(section => (
          <Card key={section.id} className="border-border/30 overflow-hidden">
            <div 
              className="p-2 flex items-center gap-2 cursor-pointer hover:bg-muted/30"
              onClick={() => toggleSection(section.id)}
            >
              {expandedSections.has(section.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{section.title}</span>
              <Badge className={cn("text-[9px]", dimensionColors[section.dimension])}>
                {section.dimension}
              </Badge>
            </div>
            {expandedSections.has(section.id) && (
              <div className="px-3 pb-3 border-t border-border/30">
                <div className="mt-2 flex flex-wrap gap-1">
                  {section.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[9px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Lines {section.startLine + 1} - {section.endLine + 1} | Hash: {section.hash.substring(0, 8)}...
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  const renderTags = (tags: SAMTag[]) => {
    return (
      <div className="space-y-2">
        {tags.map(tag => (
          <Card key={tag.name} className="p-2 border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm font-mono">{tag.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {tag.required && (
                  <Badge variant="destructive" className="text-[9px]">required</Badge>
                )}
                <Badge variant="outline" className="text-[9px]">×{tag.occurrences}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tag.description}</p>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Map className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">SAM Analysis</span>
          <Badge variant="outline" className="text-[9px]">v3.0.0</Badge>
        </div>
        
        <Input
          placeholder="System name..."
          value={systemName}
          onChange={(e) => setSystemName(e.target.value)}
          className="h-7 text-xs bg-muted/30 border-none mb-2"
        />
        
        <div className="flex gap-1">
          <Button
            size="sm"
            className="h-7 text-xs flex-1 gap-1"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-3 h-3" />
                Analyze
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex-1 gap-1"
            onClick={handleGenerateSAM}
            disabled={isGenerating || !content}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Generate SAM
              </>
            )}
          </Button>
        </div>
        
        {isAnalyzing && (
          <div className="mt-2">
            <Progress value={analysisProgress} className="h-1" />
            <span className="text-[10px] text-muted-foreground">
              {analysisProgress < 30 ? 'Extracting tags...' :
               analysisProgress < 60 ? 'Validating structure...' :
               analysisProgress < 80 ? 'Calculating metrics...' :
               'Finalizing analysis...'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {analysisResult ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
            <TabsList className="mx-2 mt-2 justify-start w-auto bg-muted/30 flex-shrink-0">
              <TabsTrigger value="overview" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="sections" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Sections
              </TabsTrigger>
              <TabsTrigger value="tags" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                Tags
              </TabsTrigger>
              <TabsTrigger value="quality" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Quality
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  {renderQualityMetrics(analysisResult.qualityMetrics)}
                  <div className="pt-2 border-t border-border/30">
                    {renderValidation(analysisResult.validation)}
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
                    <Card className="p-2 text-center border-border/30">
                      <div className="text-lg font-bold text-primary">{analysisResult.sections.length}</div>
                      <div className="text-[10px] text-muted-foreground">Sections</div>
                    </Card>
                    <Card className="p-2 text-center border-border/30">
                      <div className="text-lg font-bold text-primary">{analysisResult.tags.length}</div>
                      <div className="text-[10px] text-muted-foreground">Tags</div>
                    </Card>
                    <Card className="p-2 text-center border-border/30">
                      <div className="text-lg font-bold text-primary">{analysisResult.dependencies.length}</div>
                      <div className="text-[10px] text-muted-foreground">Dependencies</div>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sections" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3">
                  {renderSections(analysisResult.sections)}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tags" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3">
                  {renderTags(analysisResult.tags)}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="quality" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3">
                  {renderQualityMetrics(analysisResult.qualityMetrics)}
                  
                  {/* Manifest Info */}
                  <Card className="mt-3 p-3 border-border/30">
                    <h4 className="text-xs font-medium mb-2">Build Manifest</h4>
                    <div className="space-y-1 text-[10px] text-muted-foreground font-mono">
                      <div>Version: {analysisResult.manifest.version}</div>
                      <div>Build: {new Date(analysisResult.manifest.buildTimestamp).toLocaleString()}</div>
                      <div className="break-all">Integrity: {analysisResult.manifest.integrityRoot.substring(0, 32)}...</div>
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-4">
              <Map className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Click "Analyze" to run SAM analysis
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                System Anatomy Mapping v3.0.0
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
