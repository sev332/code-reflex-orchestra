// Main application entry with page-based navigation layout
import { Helmet } from "react-helmet-async";
import { useState, useEffect, lazy, Suspense, useCallback } from "react";
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
import { OSBottomBar } from "@/components/layout/OSBottomBar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { useAIMOSStreaming } from "@/hooks/useAIMOSStreaming";
import { AIIntegrationProvider } from "@/contexts/AIIntegrationContext";
import type { RightSystemDrawerTab } from "@/components/layout/right-drawer-system";

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
const SettingsPage = lazy(() => import("@/components/System/SettingsPage").then(m => ({ default: m.SettingsPage })));

const DEFAULT_PINNED: PageId[] = ['chat', 'orchestration', 'documents', 'spreadsheet', 'calendar', 'email', 'tasks', 'ide'];

const Index = () => {
  const [activePage, setActivePage] = useState<PageId>('chat');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(true);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(true);
  const [showFullDiscord, setShowFullDiscord] = useState(false);
  const [showBackgroundSettings, setShowBackgroundSettings] = useState(false);
  const [showLauncher, setShowLauncher] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [uiTransparency, setUITransparency] = useState(50);

  const {
    isStreaming, orchestrationPlan, thinkingSteps,
    agents: streamingAgents, discordMessages, discordThreads, currentMode,
  } = useAIMOSStreaming();

  // Global ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Set CSS variable for UI transparency
  useEffect(() => {
    document.documentElement.style.setProperty('--ui-transparency', String(uiTransparency / 100));
  }, [uiTransparency]);

  const handleOpenFullscreen = useCallback((type: string) => {
    if (type === 'discord') setShowFullDiscord(true);
  }, []);

  const handleTogglePin = useCallback((id: PageId) => {}, []);

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
      case 'settings': return <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>;
      default: return <PlaceholderPage name={activePage} />;
    }
  };

  return (
    <WisdomNETProvider>
      <AIIntegrationProvider activePage={activePage} onPageChange={setActivePage}>
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
            onOpenCommandPalette={() => setShowCommandPalette(true)}
            onOpenNotifications={() => setShowNotifications(prev => !prev)}
            unreadNotifications={3}
          />

          <CommandPalette
            isOpen={showCommandPalette}
            onClose={() => setShowCommandPalette(false)}
            onNavigate={(page) => setActivePage(page)}
            activePage={activePage}
          />

          <NotificationCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />

          <AppLauncher
            isOpen={showLauncher}
            onClose={() => setShowLauncher(false)}
            onAppSelect={setActivePage}
            pinnedApps={DEFAULT_PINNED}
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
            activePage={activePage}
            onPageChange={setActivePage}
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
            className="transition-all duration-300 pt-11 relative z-10 overflow-y-auto overflow-x-hidden"
            style={{ 
              marginLeft: leftWidth, 
              marginRight: rightWidth,
              height: 'calc(100vh - 2.75rem - 2.25rem)',
            }}
          >
            {renderMainContent()}
          </main>

          <OSBottomBar
            activePage={activePage}
            leftWidth={leftWidth}
            rightWidth={rightWidth}
            isStreaming={isStreaming}
            agents={streamingAgents}
            discordMessages={discordMessages}
            uiTransparency={uiTransparency}
            onTransparencyChange={setUITransparency}
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
      </AIIntegrationProvider>
    </WisdomNETProvider>
  );
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
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
