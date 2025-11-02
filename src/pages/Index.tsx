// 🔗 CONNECT: Landing Page → Advanced Persistent AI Chat
// 🧩 INTENT: Transform index into beautiful AI chat interface with dev tools access
// ✅ SPEC: SDF-CVF integrated, persistent conversation, neural aesthetics

import { Helmet } from "react-helmet-async";
import { useState, lazy, Suspense } from "react";
import { WisdomNETProvider } from "@/contexts/WisdomNETContext";
import { AdvancedPersistentChat } from "@/components/AIChat/AdvancedPersistentChat";
import { DocumentLibrary } from "@/components/Documents/DocumentLibrary";
import { RealMemoryDashboard } from "@/components/AIChat/RealMemoryDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeftToolbar } from "@/components/ui/left-toolbar";
import { RightToolbar } from "@/components/ui/right-toolbar";
import { Zap, Brain, Settings, MessageSquare, Code, Activity, FileText } from "lucide-react";
import { toast } from "sonner";

// Lazy load dev dashboards to prevent Three.js from loading in chat mode
const WisdomNETDashboard = lazy(() => import("@/components/WisdomNET/Dashboard").then(m => ({ default: m.WisdomNETDashboard })));
const ProductionDashboard = lazy(() => import("@/components/ProductionDashboard/ProductionDashboard").then(m => ({ default: m.ProductionDashboard })));

const Index = () => {
  const [viewMode, setViewMode] = useState<'chat' | 'dev-legacy' | 'dev-production' | 'documents' | 'memory'>('chat');

  const getViewModeConfig = () => {
    switch (viewMode) {
      case 'chat':
        return {
          label: 'AI Chat Interface',
          icon: MessageSquare,
          description: 'Persistent AI conversation with full context'
        };
      case 'memory':
        return {
          label: 'Memory Dashboard',
          icon: Brain,
          description: 'CMC hierarchical memory visualization'
        };
      case 'documents':
        return {
          label: 'Document Library',
          icon: FileText,
          description: 'AI-powered document analysis and editing'
        };
      case 'dev-legacy':
        return {
          label: 'Legacy Dev Tools',
          icon: Code,
          description: 'Original WisdomNET development interface'
        };
      case 'dev-production':
        return {
          label: 'Production Dev Tools',
          icon: Activity,
          description: 'Advanced production AGI development system'
        };
    }
  };

  const config = getViewModeConfig();

  const renderMainContent = () => {
    switch (viewMode) {
      case 'chat':
        return <AdvancedPersistentChat onDocumentsClick={() => setViewMode('documents')} />;
      case 'memory':
        return (
          <div className="pl-16 pr-16 pt-20">
            <RealMemoryDashboard />
          </div>
        );
      case 'documents':
        return (
          <div className="pl-16">
            <DocumentLibrary />
          </div>
        );
      case 'dev-legacy':
        return (
          <div className="pl-16 pr-16">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><p>Loading Dashboard...</p></div>}>
              <WisdomNETDashboard />
            </Suspense>
          </div>
        );
      case 'dev-production':
        return (
          <div className="pl-16 pr-16">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><p>Loading Dashboard...</p></div>}>
              <ProductionDashboard />
            </Suspense>
          </div>
        );
    }
  };

  return (
    <WisdomNETProvider>
      <div className="min-h-screen bg-gradient-mind">
        <Helmet>
          <title>WisdomNET - Advanced AGI with Persistent Memory</title>
          <meta 
            name="description" 
            content="Advanced AGI system with persistent memory, SDF-CVF reasoning traces, and beautiful neural interface. Experience continuous AI conversation with full context awareness." 
          />
        </Helmet>

        {/* Mode Selector - Only show when not in chat mode */}
        {viewMode !== 'chat' && viewMode !== 'documents' && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <Badge variant="outline" className="bg-card/50 text-foreground border-border/50 backdrop-neural">
              <config.icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (viewMode === 'dev-production') setViewMode('dev-legacy');
                else if (viewMode === 'dev-legacy') setViewMode('chat');
                else setViewMode('dev-production');
              }}
              className="bg-card/50 text-foreground border-border/50 hover:bg-accent/50 backdrop-neural"
            >
              {viewMode === 'dev-production' ? (
                <>
                  <Code className="w-4 h-4 mr-2" />
                  Legacy Dev
                </>
              ) : viewMode === 'dev-legacy' ? (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Chat
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Production Dev
                </>
              )}
            </Button>
          </div>
        )}

        {/* Chat Mode Toggle - Show in top-right when in chat mode */}
        {viewMode === 'chat' && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('memory')}
              className="bg-card/50 text-foreground border-border/50 hover:bg-accent/50 backdrop-neural neural-glow"
            >
              <Brain className="w-4 h-4 mr-2" />
              Memory
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('documents')}
              className="bg-card/50 text-foreground border-border/50 hover:bg-accent/50 backdrop-neural neural-glow"
            >
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('dev-production')}
              className="bg-card/50 text-foreground border-border/50 hover:bg-accent/50 backdrop-neural neural-glow"
            >
              <Code className="w-4 h-4 mr-2" />
              Dev Tools
            </Button>
          </div>
        )}

        {/* Document/Memory Mode Toggle - Show back to chat button */}
        {(viewMode === 'documents' || viewMode === 'memory') && (
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('chat')}
              className="bg-card/50 text-foreground border-border/50 hover:bg-accent/50 backdrop-neural neural-glow"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </div>
        )}

        {/* Toolbars - Show in all modes */}
        <LeftToolbar />
        {viewMode !== 'chat' && viewMode !== 'documents' && <RightToolbar />}

        {/* Main Content */}
        {renderMainContent()}
      </div>
    </WisdomNETProvider>
  );
};

export default Index;
