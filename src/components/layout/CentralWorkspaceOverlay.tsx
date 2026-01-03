// Central glass panel overlay system for large workspaces like Document IDE, Code Builder
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  PanelRightOpen,
  PanelRightClose,
  FileText,
  Code2,
  Brain,
  Sparkles
} from 'lucide-react';
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
  chatComponent,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [showChat, setShowChat] = useState(true);
  const [chatWidth, setChatWidth] = useState(380);

  if (!workspaceType) return null;

  const getWorkspaceIcon = () => {
    switch (workspaceType) {
      case 'document-ide': return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'code-builder': return <Code2 className="w-5 h-5 text-emerald-400" />;
      case 'dream-mode': return <Brain className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getWorkspaceTitle = () => {
    if (title) return title;
    switch (workspaceType) {
      case 'document-ide': return 'Document IDE';
      case 'code-builder': return 'Code Builder';
      case 'dream-mode': return 'Dream Mode';
      default: return 'Workspace';
    }
  };

  const getGradient = () => {
    switch (workspaceType) {
      case 'document-ide': return 'from-cyan-500/10 via-transparent to-blue-500/10';
      case 'code-builder': return 'from-emerald-500/10 via-transparent to-teal-500/10';
      case 'dream-mode': return 'from-purple-500/10 via-violet-500/5 to-pink-500/10';
      default: return 'from-primary/10 via-transparent to-accent/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Main Content Container */}
      <div className={cn(
        "relative flex w-full h-full pt-12 pb-4 px-16",
        isFullscreen && "px-4 pt-4"
      )}>
        
        {/* Workspace Panel (Main) */}
        <Card className={cn(
          "relative flex-1 flex flex-col overflow-hidden",
          "bg-gradient-to-br border-border/50",
          getGradient(),
          "backdrop-blur-2xl shadow-2xl",
          showChat && chatComponent ? "mr-4" : ""
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/40">
            <div className="flex items-center gap-3">
              {getWorkspaceIcon()}
              <h2 className="font-semibold text-lg">{getWorkspaceTitle()}</h2>
              <Badge variant="outline" className="text-xs border-border/50">
                {workspaceType}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {chatComponent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showChat ? (
                    <PanelRightClose className="w-4 h-4" />
                  ) : (
                    <PanelRightOpen className="w-4 h-4" />
                  )}
                </Button>
              )}
              
              {onToggleFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullscreen}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
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

          {/* Workspace Content */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </Card>

        {/* Chat Panel (Side) */}
        {showChat && chatComponent && (
          <Card 
            className={cn(
              "relative flex flex-col overflow-hidden",
              "bg-background/60 backdrop-blur-2xl border-border/50",
              "shadow-xl"
            )}
            style={{ width: chatWidth }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium">AI Assistant</span>
              </div>
              <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                Connected
              </Badge>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              {chatComponent}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
