// Central workspace overlay aligned to canonical drawer system (no embedded side drawers)
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Maximize2, Minimize2, FileText, Code2, Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkspaceType = 'document-ide' | 'code-builder' | 'dream-mode' | null;

interface CentralWorkspaceOverlayProps {
  workspaceType: WorkspaceType;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  chatComponent?: React.ReactNode;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const CentralWorkspaceOverlay: React.FC<CentralWorkspaceOverlayProps> = ({
  workspaceType,
  onClose,
  children,
  title,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  if (!workspaceType) return null;

  const workspaceIcon = useMemo(() => {
    switch (workspaceType) {
      case 'document-ide':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'code-builder':
        return <Code2 className="w-5 h-5 text-primary" />;
      case 'dream-mode':
        return <Brain className="w-5 h-5 text-primary" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary" />;
    }
  }, [workspaceType]);

  const workspaceTitle = title
    ?? (workspaceType === 'document-ide'
      ? 'Document IDE'
      : workspaceType === 'code-builder'
        ? 'Code Builder'
        : workspaceType === 'dream-mode'
          ? 'Dream Mode'
          : 'Workspace');

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={onClose} />

      <div className={cn('relative flex w-full h-full pt-12 pb-4 px-16', isFullscreen && 'px-4 pt-4')}>
        <Card className="relative flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-primary/10 via-background/80 to-accent/10 border-border/50 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/40">
            <div className="flex items-center gap-3">
              {workspaceIcon}
              <h2 className="font-semibold text-lg">{workspaceTitle}</h2>
              <Badge variant="outline" className="text-xs border-border/50">
                {workspaceType}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {onToggleFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullscreen}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
};
