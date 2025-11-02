import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import { ReasoningStep, ReasoningVerification } from "@/hooks/useReasoningChat";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ReasoningTraceProps {
  steps: ReasoningStep[];
  verification?: ReasoningVerification;
}

export const ReasoningTrace = ({ steps, verification }: ReasoningTraceProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "text-success";
    if (conf >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 0.8) return <CheckCircle className="w-4 h-4" />;
    if (conf >= 0.6) return <Zap className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-primary/5"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-medium">Reasoning Trace</span>
              <Badge variant="outline" className="text-xs">
                {steps.length} steps
              </Badge>
            </div>
            {verification && (
              <div className={`flex items-center gap-2 ${getConfidenceColor(verification.confidence)}`}>
                {getConfidenceIcon(verification.confidence)}
                <span className="text-sm font-medium">
                  {Math.round(verification.confidence * 100)}% confidence
                </span>
              </div>
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="px-4 pb-4 space-y-3">
          {/* Verification Metrics */}
          {verification && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="text-xs text-muted-foreground">Confidence</div>
                <div className={`text-lg font-bold ${getConfidenceColor(verification.confidence)}`}>
                  {Math.round(verification.confidence * 100)}%
                </div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="text-xs text-muted-foreground">Provenance (κ)</div>
                <div className="text-lg font-bold text-primary">
                  {verification.provenance_coverage.toFixed(2)}
                </div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded">
                <div className="text-xs text-muted-foreground">Entropy (H)</div>
                <div className="text-lg font-bold text-accent">
                  {verification.semantic_entropy.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Reasoning Steps */}
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 bg-background/30 rounded-lg border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-sm">{step.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {step.tokens} tokens
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  {step.output}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
