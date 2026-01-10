// Main application entry with new layout system
import { Helmet } from "react-helmet-async";
import { useState, lazy, Suspense, useCallback } from "react";
import { WisdomNETProvider } from "@/contexts/WisdomNETContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdvancedPersistentChat } from "@/components/AIChat/AdvancedPersistentChat";
import { DocumentLibrary } from "@/components/Documents/DocumentLibrary";
import { RealMemoryDashboard } from "@/components/AIChat/RealMemoryDashboard";
import { TopBar } from "@/components/layout/TopBar";
import { LeftIconBar, LeftDrawerType } from "@/components/layout/LeftIconBar";
import { RightIconBar, RightDrawerType } from "@/components/layout/RightIconBar";
import { LeftDrawerPanel } from "@/components/layout/LeftDrawerPanel";
import { EnhancedRightDrawerPanel } from "@/components/layout/EnhancedRightDrawerPanel";
import { FullDiscordView } from "@/components/AgentDiscord/FullDiscordView";
import { StarfieldNebulaBackground } from "@/components/ui/StarfieldNebulaBackground";
import { NeuralParticles } from "@/components/ui/NeuralParticles";
import { BackgroundSettingsPanel } from "@/components/ui/BackgroundSettingsPanel";
import { DocumentIDEWorkspace } from "@/components/Documents/DocumentIDEWorkspace";
import { DreamModeWorkspace } from "@/components/DreamMode/DreamModeWorkspace";
import { CodeBuilderWorkspace } from "@/components/CodeBuilder/CodeBuilderWorkspace";
import { useAIMOSStreaming } from "@/hooks/useAIMOSStreaming";
import { cn } from "@/lib/utils";

type ViewMode = 'chat' | 'documents' | 'memory' | 'orchestration' | 'dev-legacy' | 'dev-production';
type WorkspaceMode = 'document-ide' | 'code-builder' | 'dream-mode' | null;

// Lazy load heavy dashboards
const WisdomNETDashboard = lazy(() => import("@/components/WisdomNET/Dashboard").then(m => ({ default: m.WisdomNETDashboard })));
const ProductionDashboard = lazy(() => import("@/components/ProductionDashboard/ProductionDashboard").then(m => ({ default: m.ProductionDashboard })));
const OrchestrationStudio = lazy(() => import("@/components/Orchestration/OrchestrationStudio").then(m => ({ default: m.OrchestrationStudio })));

const Index = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [leftDrawer, setLeftDrawer] = useState<LeftDrawerType>(null);
  const [rightDrawer, setRightDrawer] = useState<RightDrawerType>(null);
  const [showFullDiscord, setShowFullDiscord] = useState(false);
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceMode>(null);

  // Get streaming data from AIMOS hook
  const {
    isStreaming,
    orchestrationPlan,
    thinkingSteps,
    agents: streamingAgents,
    discordMessages,
    discordThreads,
    currentMode
  } = useAIMOSStreaming();

  const handleLeftDrawerChange = useCallback((drawer: LeftDrawerType) => {
    // Handle special workspace modes that open as central overlays
    if (drawer === 'builder') {
      setActiveWorkspace('document-ide');
      setLeftDrawer(null);
      return;
    }
    if (drawer === 'dream') {
      setActiveWorkspace('dream-mode');
      setLeftDrawer(null);
      return;
    }
    if (drawer === 'code-builder') {
      setActiveWorkspace('code-builder');
      setLeftDrawer(null);
      return;
    }
    
    setLeftDrawer(drawer);
    // Navigate to specific views for some items
    if (drawer === 'documents') {
      setViewMode('documents');
      setLeftDrawer(null);
    } else if (drawer === 'orchestration') {
      setViewMode('orchestration');
      setLeftDrawer(null);
    } else if (drawer === null) {
      setViewMode('chat');
    }
  }, []);

  const handleNavigate = useCallback((view: string) => {
    setViewMode(view as ViewMode);
    setLeftDrawer(null);
  }, []);

  const handleOpenFullscreen = useCallback((type: string) => {
    if (type === 'discord') {
      setShowFullDiscord(true);
      setRightDrawer(null);
    }
  }, []);

  const closeWorkspace = useCallback(() => {
    setActiveWorkspace(null);
  }, []);

  // Calculate main content margin based on open drawers
  const mainContentClass = cn(
    "transition-all duration-300 pt-12 relative z-10",
    leftDrawer && leftDrawer !== 'documents' && leftDrawer !== 'orchestration' ? "ml-[21rem]" : "ml-12",
    rightDrawer ? "mr-[22rem]" : "mr-12"
  );

  const renderMainContent = () => {
    switch (viewMode) {
      case 'chat':
        return (
          <AdvancedPersistentChat 
            onDocumentsClick={() => setViewMode('documents')} 
          />
        );
      case 'documents':
        return (
          <div className="p-4">
            <DocumentLibrary />
          </div>
        );
      case 'memory':
        return (
          <div className="p-4">
            <RealMemoryDashboard />
          </div>
        );
      case 'orchestration':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <OrchestrationStudio />
          </Suspense>
        );
      case 'dev-legacy':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WisdomNETDashboard />
          </Suspense>
        );
      case 'dev-production':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ProductionDashboard />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <WisdomNETProvider>
      <TooltipProvider>
        <div className="min-h-screen relative overflow-hidden">
          <Helmet>
            <title>LUCID - Advanced AGI with Persistent Memory</title>
            <meta 
              name="description" 
              content="Advanced AGI system with persistent memory, SDF-CVF reasoning traces, and beautiful neural interface." 
            />
          </Helmet>

          {/* Animated Background Layers */}
          <StarfieldNebulaBackground isProcessing={isStreaming} />
          <NeuralParticles isProcessing={isStreaming} particleCount={60} connectionDistance={100} />
          
          {/* Background Settings Panel */}
          <BackgroundSettingsPanel 
            isOpen={showBackgroundSettings} 
            onClose={() => setShowBackgroundSettings(false)} 
          />

          {/* Top Bar */}
          <TopBar 
            systemStatus={isStreaming ? 'processing' : 'online'}
            activeAgents={streamingAgents?.length || 0}
            memoryUsage="67%"
          />

          {/* Left Icon Bar */}
          <LeftIconBar 
            activeDrawer={leftDrawer}
            onDrawerChange={handleLeftDrawerChange}
          />

          {/* Left Drawer Panel */}
          <LeftDrawerPanel 
            activeDrawer={leftDrawer}
            onClose={() => setLeftDrawer(null)}
            onNavigate={handleNavigate}
          />

          {/* Right Icon Bar */}
          <RightIconBar 
            activeDrawer={rightDrawer}
            onDrawerChange={setRightDrawer}
            isStreaming={isStreaming}
            newMessages={discordMessages?.length || 0}
            activeAgents={streamingAgents?.filter((a: any) => a.status === 'active').length || 0}
            onOpenBackgroundSettings={() => setShowBackgroundSettings(true)}
          />

          {/* Right Drawer Panel */}
          <EnhancedRightDrawerPanel 
            activeDrawer={rightDrawer}
            onClose={() => setRightDrawer(null)}
            onOpenFullscreen={handleOpenFullscreen}
            isStreaming={isStreaming}
            orchestrationPlan={orchestrationPlan}
            thinkingSteps={thinkingSteps}
            agents={streamingAgents}
            discordMessages={discordMessages}
            discordThreads={discordThreads}
            currentMode={currentMode}
          />

          {/* Main Content */}
          <main className={mainContentClass}>
            {renderMainContent()}
          </main>

          {/* Full Discord View Modal */}
          {showFullDiscord && (
            <FullDiscordView
              messages={discordMessages || []}
              threads={discordThreads || []}
              agents={streamingAgents || []}
              isStreaming={isStreaming}
              onClose={() => setShowFullDiscord(false)}
            />
          )}

          {/* Document IDE Workspace */}
          <DocumentIDEWorkspace
            isOpen={activeWorkspace === 'document-ide'}
            onClose={closeWorkspace}
          />

          {/* Dream Mode Workspace */}
          <DreamModeWorkspace
            isOpen={activeWorkspace === 'dream-mode'}
            onClose={closeWorkspace}
          />

          {/* Code Builder Workspace */}
          <CodeBuilderWorkspace
            isOpen={activeWorkspace === 'code-builder'}
            onClose={closeWorkspace}
          />
        </div>
      </TooltipProvider>
    </WisdomNETProvider>
  );
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default Index;
