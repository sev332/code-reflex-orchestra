// 🔗 CONNECT: Landing Page → Advanced Persistent AI Chat
// 🧩 INTENT: Transform index into beautiful AI chat interface with dev tools access
// ✅ SPEC: SDF-CVF integrated, persistent conversation, neural aesthetics

import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { WisdomNETProvider } from "@/contexts/WisdomNETContext";
import { WisdomNETDashboard } from "@/components/WisdomNET/Dashboard";
import { ProductionDashboard } from "@/components/ProductionDashboard/ProductionDashboard";
import { AdvancedPersistentChat } from "@/components/AIChat/AdvancedPersistentChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeftToolbar } from "@/components/ui/left-toolbar";
import { RightToolbar } from "@/components/ui/right-toolbar";
import { Zap, Brain, Settings, MessageSquare, Code, Activity } from "lucide-react";

const Index = () => {
  const [viewMode, setViewMode] = useState<'chat' | 'dev-legacy' | 'dev-production'>('chat');

  const getViewModeConfig = () => {
    switch (viewMode) {
      case 'chat':
        return {
          label: 'AI Chat Interface',
          icon: MessageSquare,
          description: 'Persistent AI conversation with full context'
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
        return <AdvancedPersistentChat />;
      case 'dev-legacy':
        return (
          <div className="pl-16 pr-16">
            <WisdomNETDashboard />
          </div>
        );
      case 'dev-production':
        return (
          <div className="pl-16 pr-16">
            <ProductionDashboard />
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
        {viewMode !== 'chat' && (
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
          <div className="absolute top-4 right-4 z-50">
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

        {/* Toolbars - Only show in dev modes */}
        {viewMode !== 'chat' && (
          <>
            <LeftToolbar />
            <RightToolbar />
          </>
        )}

        {/* Main Content */}
        {renderMainContent()}
      </div>
    </WisdomNETProvider>
  );
};

export default Index;
