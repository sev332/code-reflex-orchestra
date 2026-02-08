// Main application entry with page-based navigation layout
import { Helmet } from "react-helmet-async";
import { useState, lazy, Suspense, useCallback } from "react";
import { WisdomNETProvider } from "@/contexts/WisdomNETContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTopBar, PageId } from "@/components/layout/PageTopBar";
import { PersistentRightDrawer } from "@/components/layout/PersistentRightDrawer";
import { PageLeftDrawer } from "@/components/layout/PageLeftDrawer";
import { AdvancedPersistentChat } from "@/components/AIChat/AdvancedPersistentChat";
import { DocumentBuilderPage } from '@/components/Documents/DocumentBuilderPage';
import { RealMemoryDashboard } from "@/components/AIChat/RealMemoryDashboard";
import { FullDiscordView } from "@/components/AgentDiscord/FullDiscordView";
import { StarfieldNebulaBackground } from "@/components/ui/StarfieldNebulaBackground";
import { NeuralParticles } from "@/components/ui/NeuralParticles";
import { BackgroundSettingsPanel } from "@/components/ui/BackgroundSettingsPanel";
import { PlaceholderPage } from "@/components/pages/PlaceholderPage";
import { useAIMOSStreaming } from "@/hooks/useAIMOSStreaming";
import { cn } from "@/lib/utils";

// Lazy load heavy pages
const OrchestrationWorkspace = lazy(() =>
  import("@/components/Orchestration/OrchestrationWorkspace").then((m) => ({ default: m.OrchestrationWorkspace }))
);
const CodeBuilderIDE = lazy(() =>
  import("@/components/CodeBuilder/CodeBuilderIDE").then((m) => ({ default: m.CodeBuilderIDE }))
);

const Index = () => {
  const [activePage, setActivePage] = useState<PageId>('chat');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true);
  const [showFullDiscord, setShowFullDiscord] = useState(false);
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);

  const {
    isStreaming,
    orchestrationPlan,
    thinkingSteps,
    agents: streamingAgents,
    discordMessages,
    discordThreads,
    currentMode,
  } = useAIMOSStreaming();

  const handleOpenFullscreen = useCallback((type: string) => {
    if (type === 'discord') setShowFullDiscord(true);
  }, []);

  // On chat page: chat is central, right drawer shows transparency only
  // On other pages: chat moves to right drawer
  const isChatPage = activePage === 'chat';

  // Side icon bars are always 48px (w-12). Drawer panels expand beside them.
  const leftWidth = leftDrawerOpen ? 48 + 260 : 48;
  const rightWidth = rightDrawerOpen ? 48 + 380 : 48;

  const renderMainContent = () => {
    switch (activePage) {
      case 'chat':
        return <AdvancedPersistentChat onDocumentsClick={() => setActivePage('documents')} />;
      case 'orchestration':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <OrchestrationWorkspace />
          </Suspense>
        );
      case 'documents':
        return <DocumentBuilderPage />;
      case 'ide':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CodeBuilderIDE onClose={() => setActivePage('chat')} />
          </Suspense>
        );
      case 'image':
      case 'audio':
      case 'video':
      case 'map':
        return <PlaceholderPage pageId={activePage} />;
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

          {/* Animated Background */}
          <StarfieldNebulaBackground isProcessing={isStreaming} />
          <NeuralParticles isProcessing={isStreaming} particleCount={60} connectionDistance={100} />

          {/* Background Settings */}
          <BackgroundSettingsPanel
            isOpen={showBackgroundSettings}
            onClose={() => setShowBackgroundSettings(false)}
          />

          {/* Top Bar with Page Tabs */}
          <PageTopBar
            activePage={activePage}
            onPageChange={setActivePage}
            systemStatus={isStreaming ? 'processing' : 'online'}
            activeAgents={streamingAgents?.length || 0}
          />

          {/* Left Drawer — page-specific */}
          <PageLeftDrawer
            activePage={activePage}
            isOpen={leftDrawerOpen}
            onToggle={() => setLeftDrawerOpen((v) => !v)}
          />

          {/* Right Drawer — persistent AI + transparency */}
          <PersistentRightDrawer
            isOpen={rightDrawerOpen}
            onToggle={() => setRightDrawerOpen((v) => !v)}
            isStreaming={isStreaming}
            orchestrationPlan={orchestrationPlan}
            thinkingSteps={thinkingSteps}
            agents={streamingAgents}
            discordMessages={discordMessages}
            discordThreads={discordThreads}
            currentMode={currentMode}
            onOpenFullscreen={handleOpenFullscreen}
            onOpenBackgroundSettings={() => setShowBackgroundSettings(true)}
          />

          {/* Main Content */}
          <main
            className="transition-all duration-300 pt-12 relative z-10 h-[calc(100vh-3rem)]"
            style={{
              marginLeft: leftWidth,
              marginRight: rightWidth,
            }}
          >
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
        </div>
      </TooltipProvider>
    </WisdomNETProvider>
  );
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default Index;
