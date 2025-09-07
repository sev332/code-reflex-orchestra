import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { WisdomNETProvider } from "@/contexts/WisdomNETContext";
import { WisdomNETDashboard } from "@/components/WisdomNET/Dashboard";
import { ProductionDashboard } from "@/components/ProductionDashboard/ProductionDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeftToolbar } from "@/components/ui/left-toolbar";
import { RightToolbar } from "@/components/ui/right-toolbar";
import { Zap, Brain, Settings } from "lucide-react";

const Index = () => {
  const [dashboardMode, setDashboardMode] = useState<'legacy' | 'production'>('production');

  return (
    <WisdomNETProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Helmet>
          <title>WisdomNET - Production-Ready AGI Development System</title>
          <meta 
            name="description" 
            content="Production-ready AGI development system with advanced agents, vector memory, HIL controls, and real-time orchestration." 
          />
        </Helmet>

        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <Badge variant="outline" className="bg-white/10 text-white border-white/20">
            {dashboardMode === 'production' ? 'Production Mode' : 'Legacy Mode'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDashboardMode(dashboardMode === 'production' ? 'legacy' : 'production')}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            {dashboardMode === 'production' ? (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Switch to Legacy
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Switch to Production
              </>
            )}
          </Button>
        </div>

        {/* Left Toolbar */}
        <LeftToolbar />
        
        {/* Right Toolbar */}
        <RightToolbar />

        {/* Main Content with padding for toolbars */}
        <div className="pl-16 pr-16">
          {dashboardMode === 'production' ? (
            <ProductionDashboard />
          ) : (
            <WisdomNETDashboard />
          )}
        </div>
      </div>
    </WisdomNETProvider>
  );
};

export default Index;
