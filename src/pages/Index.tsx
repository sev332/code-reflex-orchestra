// Main application entry with page-based navigation layout
import { Helmet } from "react-helmet-async";
import { useState, lazy, Suspense, useCallback } from "react";
import { WisdomNETProvider } from "@/contexts/WisdomNETContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTopBar, PageId } from "@/components/layout/PageTopBar";
import { AppLauncher } from "@/components/layout/AppLauncher";
import { PersistentRightDrawer } from "@/components/layout/PersistentRightDrawer";
import { PageLeftDrawer } from "@/components/layout/PageLeftDrawer";
import { AdvancedPersistentChat } from "@/components/AIChat/AdvancedPersistentChat";
import { DocumentBuilderPage } from '@/components/Documents/DocumentBuilderPage';
import { FullDiscordView } from "@/components/AgentDiscord/FullDiscordView";
import { StarfieldNebulaBackground } from "@/components/ui/StarfieldNebulaBackground";
import { NeuralParticles } from "@/components/ui/NeuralParticles";
import { BackgroundSettingsPanel } from "@/components/ui/BackgroundSettingsPanel";
import { BottomDock } from "@/components/layout/BottomDock";
import { useAIMOSStreaming } from "@/hooks/useAIMOSStreaming";

// Lazy load all heavy pages
const OrchestrationWorkspace = lazy(() => import("@/components/Orchestration/OrchestrationWorkspace").then(m => ({ default: m.OrchestrationWorkspace })));
const CodeBuilderIDE = lazy(() => import("@/components/CodeBuilder/CodeBuilderIDE").then(m => ({ default: m.CodeBuilderIDE })));
const GlassMapPage = lazy(() => import("@/components/Map/GlassMapPage").then(m => ({ default: m.GlassMapPage })));
const ImageEditor = lazy(() => import("@/components/MediaEditors/ImageEditor").then(m => ({ default: m.ImageEditor })));
const IllustratorApp = lazy(() => import("@/components/Illustrator/IllustratorApp").then(m => ({ default: m.IllustratorApp })));
const AudioEditor = lazy(() => import("@/components/MediaEditors/AudioEditor").then(m => ({ default: m.AudioEditor })));
const VideoEditor = lazy(() => import("@/components/MediaEditors/VideoEditor").then(m => ({ default: m.VideoEditor })));
const Studio3DPage = lazy(() => import("@/components/Studio3D/Studio3DPage").then(m => ({ default: m.Studio3DPage })));
const PresentationsPage = lazy(() => import("@/components/Presentations/PresentationsPage").then(m => ({ default: m.PresentationsPage })));
const SpreadsheetPage = lazy(() => import("@/components/Productivity/SpreadsheetPage").then(m => ({ default: m.SpreadsheetPage })));
const CalendarPage = lazy(() => import("@/components/Productivity/CalendarPage").then(m => ({ default: m.CalendarPage })));
const EmailPage = lazy(() => import("@/components/Productivity/EmailPage").then(m => ({ default: m.EmailPage })));
const TasksPage = lazy(() => import("@/components/Productivity/TasksPage").then(m => ({ default: m.TasksPage })));

const TerminalPage = lazy(() => import("@/components/DevTools/TerminalPage").then(m => ({ default: m.TerminalPage })));
const APIStudioPage = lazy(() => import("@/components/DevTools/APIStudioPage").then(m => ({ default: m.APIStudioPage })));
const DatabaseExplorerPage = lazy(() => import("@/components/DevTools/DatabaseExplorerPage").then(m => ({ default: m.DatabaseExplorerPage })));
const DashboardBuilderPage = lazy(() => import("@/components/DevTools/DashboardBuilderPage").then(m => ({ default: m.DashboardBuilderPage })));
const BrowserPage = lazy(() => import("@/components/Knowledge/BrowserPage").then(m => ({ default: m.BrowserPage })));
const NotesPage = lazy(() => import("@/components/Knowledge/NotesPage").then(m => ({ default: m.NotesPage })));
const FileManagerPage = lazy(() => import("@/components/System/FileManagerPage").then(m => ({ default: m.FileManagerPage })));
const CommsHubPage = lazy(() => import("@/components/System/CommsHubPage").then(m => ({ default: m.CommsHubPage })));

const DEFAULT_PINNED: PageId[] = ['chat', 'orchestration', 'documents', 'spreadsheet', 'calendar', 'email', 'tasks', 'ide'];

const Index = () => {
  const [activePage, setActivePage] = useState<PageId>('chat');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true);
  const [showFullDiscord, setShowFullDiscord] = useState(false);
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const [showLauncher, setShowLauncher] = useState(false);
  const [pinnedApps, setPinnedApps] = useState<PageId[]>(DEFAULT_PINNED);

  const {
    isStreaming, orchestrationPlan, thinkingSteps,
    agents: streamingAgents, discordMessages, discordThreads, currentMode,
  } = useAIMOSStreaming();

  const handleOpenFullscreen = useCallback((type: string) => {
    if (type === 'discord') setShowFullDiscord(true);
  }, []);

  const handleTogglePin = useCallback((id: PageId) => {
    setPinnedApps(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }, []);

  const leftWidth = leftDrawerOpen ? 48 + 260 : 48;
  const rightWidth = rightDrawerOpen ? 48 + 380 : 48;

  const renderMainContent = () => {
    switch (activePage) {
      case 'chat': return <AdvancedPersistentChat onDocumentsClick={() => setActivePage('documents')} />;
      case 'orchestration': return <Suspense fallback={<LoadingFallback />}><OrchestrationWorkspace /></Suspense>;
      case 'documents': return <DocumentBuilderPage />;
      case 'ide': return <Suspense fallback={<LoadingFallback />}><CodeBuilderIDE onClose={() => setActivePage('chat')} /></Suspense>;
      case 'image': return <Suspense fallback={<LoadingFallback />}><ImageEditor /></Suspense>;
      case 'illustrator': return <Suspense fallback={<LoadingFallback />}><IllustratorApp /></Suspense>;
      case 'audio': return <Suspense fallback={<LoadingFallback />}><AudioEditor /></Suspense>;
      case 'video': return <Suspense fallback={<LoadingFallback />}><VideoEditor /></Suspense>;
      case 'map': return <Suspense fallback={<LoadingFallback />}><GlassMapPage /></Suspense>;
      case 'studio3d': return <Suspense fallback={<LoadingFallback />}><Studio3DPage /></Suspense>;
      case 'presentations': return <Suspense fallback={<LoadingFallback />}><PresentationsPage /></Suspense>;
      case 'spreadsheet': return <Suspense fallback={<LoadingFallback />}><SpreadsheetPage /></Suspense>;
      case 'calendar': return <Suspense fallback={<LoadingFallback />}><CalendarPage /></Suspense>;
      case 'email': return <Suspense fallback={<LoadingFallback />}><EmailPage /></Suspense>;
      case 'tasks': return <Suspense fallback={<LoadingFallback />}><TasksPage /></Suspense>;
      case 'terminal': return <Suspense fallback={<LoadingFallback />}><TerminalPage /></Suspense>;
      case 'apistudio': return <Suspense fallback={<LoadingFallback />}><APIStudioPage /></Suspense>;
      case 'database': return <Suspense fallback={<LoadingFallback />}><DatabaseExplorerPage /></Suspense>;
      case 'dashboard': return <Suspense fallback={<LoadingFallback />}><DashboardBuilderPage /></Suspense>;
      case 'browser': return <Suspense fallback={<LoadingFallback />}><BrowserPage /></Suspense>;
      case 'notes': return <Suspense fallback={<LoadingFallback />}><NotesPage /></Suspense>;
      case 'files': return <Suspense fallback={<LoadingFallback />}><FileManagerPage /></Suspense>;
      case 'comms': return <Suspense fallback={<LoadingFallback />}><CommsHubPage /></Suspense>;
      default: return <PlaceholderPage name={activePage} />;
    }
  };

  return (
    <WisdomNETProvider>
      <TooltipProvider>
        <div className="min-h-screen relative overflow-hidden">
          <Helmet>
            <title>LUCID - Browser OS</title>
            <meta name="description" content="LUCID Browser OS — a full operating system in your browser with AI-powered productivity, creative, and development tools." />
          </Helmet>

          <StarfieldNebulaBackground isProcessing={isStreaming} />
          <NeuralParticles isProcessing={isStreaming} particleCount={60} connectionDistance={100} />

          <BackgroundSettingsPanel isOpen={showBackgroundSettings} onClose={() => setShowBackgroundSettings(false)} />

          <PageTopBar
            activePage={activePage}
            onPageChange={setActivePage}
            systemStatus={isStreaming ? 'processing' : 'online'}
            activeAgents={streamingAgents?.length || 0}
            pinnedApps={pinnedApps}
            onOpenLauncher={() => setShowLauncher(true)}
          />

          <AppLauncher
            isOpen={showLauncher}
            onClose={() => setShowLauncher(false)}
            onAppSelect={setActivePage}
            pinnedApps={pinnedApps}
            onTogglePin={handleTogglePin}
          />

          <PageLeftDrawer
            activePage={activePage}
            isOpen={leftDrawerOpen}
            onToggle={() => setLeftDrawerOpen(v => !v)}
          />

          <PersistentRightDrawer
            isOpen={rightDrawerOpen}
            onToggle={() => setRightDrawerOpen(v => !v)}
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

          <main
            className="transition-all duration-300 pt-12 relative z-10 h-[calc(100vh-3rem-2rem)]"
            style={{ marginLeft: leftWidth, marginRight: rightWidth }}
          >
            {renderMainContent()}
          </main>

          <BottomDock
            activePage={activePage}
            leftWidth={leftWidth}
            rightWidth={rightWidth}
          />

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

function PlaceholderPage({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-lg font-semibold capitalize mb-1">{name}</p>
        <p className="text-sm text-muted-foreground">Coming soon — this workspace is under construction.</p>
      </div>
    </div>
  );
}

export default Index;
