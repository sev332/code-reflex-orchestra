// Live Preview Pane for Code Builder with hot-reload capabilities
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Code2,
  SplitSquareHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodePreviewPaneProps {
  code?: string;
  html?: string;
  previewUrl?: string;
  isBuilding?: boolean;
  onRefresh?: () => void;
  className?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'preview' | 'code' | 'split';

const deviceDimensions: Record<DeviceType, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

export function CodePreviewPane({
  code,
  html,
  previewUrl,
  isBuilding = false,
  onRefresh,
  className
}: CodePreviewPaneProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastBuildTime, setLastBuildTime] = useState<Date | null>(null);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Simulate hot-reload when code changes
  useEffect(() => {
    if (code || html) {
      setBuildStatus('building');
      setError(null);
      
      // Simulate build time
      const timer = setTimeout(() => {
        setBuildStatus('success');
        setLastBuildTime(new Date());
        
        // Update iframe content if we have HTML
        if (html && iframeRef.current) {
          const doc = iframeRef.current.contentDocument;
          if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [code, html]);

  const handleRefresh = () => {
    setBuildStatus('building');
    setTimeout(() => {
      setBuildStatus('success');
      setLastBuildTime(new Date());
      onRefresh?.();
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    }, 300);
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const dimensions = deviceDimensions[device];

  return (
    <div className={cn("flex flex-col h-full bg-background/50 rounded-lg border border-border/30 overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border/30 bg-background/80">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-muted/30 rounded-md p-0.5">
            <Button
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('preview')}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Preview
            </Button>
            <Button
              variant={viewMode === 'code' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('code')}
            >
              <Code2 className="w-3.5 h-3.5 mr-1" />
              Source
            </Button>
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('split')}
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Device selector */}
          <div className="flex items-center bg-muted/30 rounded-md p-0.5 ml-2">
            <Button
              variant={device === 'desktop' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setDevice('desktop')}
            >
              <Monitor className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={device === 'tablet' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setDevice('tablet')}
            >
              <Tablet className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={device === 'mobile' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setDevice('mobile')}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Build status */}
          {buildStatus === 'building' || isBuilding ? (
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Building...
            </Badge>
          ) : buildStatus === 'success' ? (
            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              Live
            </Badge>
          ) : buildStatus === 'error' ? (
            <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          ) : null}

          {lastBuildTime && (
            <span className="text-xs text-muted-foreground">
              {lastBuildTime.toLocaleTimeString()}
            </span>
          )}

          {/* Action buttons */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh}>
            <RefreshCw className={cn("w-3.5 h-3.5", buildStatus === 'building' && "animate-spin")} />
          </Button>
          
          {previewUrl && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenExternal}>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex overflow-hidden bg-muted/10">
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={cn(
            "flex-1 flex items-center justify-center p-4 overflow-auto",
            viewMode === 'split' && "w-1/2 border-r border-border/30"
          )}>
            <div
              className={cn(
                "bg-white rounded-lg shadow-2xl transition-all duration-300 overflow-hidden",
                device !== 'desktop' && "border-8 border-gray-800 rounded-3xl"
              )}
              style={{
                width: device === 'desktop' ? '100%' : Math.min(dimensions.width, 400),
                height: device === 'desktop' ? '100%' : Math.min(dimensions.height, 600),
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              {previewUrl ? (
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="App Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              ) : html ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={html}
                  className="w-full h-full border-0"
                  title="Code Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/30">
                  <div className="text-center text-muted-foreground">
                    <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No preview available</p>
                    <p className="text-xs mt-1">Write some code to see the preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(viewMode === 'code' || viewMode === 'split') && (
          <div className={cn(
            "flex-1 overflow-auto bg-gray-900",
            viewMode === 'split' && "w-1/2"
          )}>
            <pre className="p-4 text-sm text-gray-300 font-mono leading-relaxed">
              {code || html || '// No code to display'}
            </pre>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 border-t border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <div className="flex-1 text-sm text-red-400">
              <p className="font-medium">Build Error</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dimensions indicator */}
      <div className="px-3 py-1.5 border-t border-border/30 bg-background/80 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {device === 'desktop' ? 'Responsive' : `${dimensions.width} × ${dimensions.height}`}
        </span>
        <span>Hot Reload Enabled</span>
      </div>
    </div>
  );
}
