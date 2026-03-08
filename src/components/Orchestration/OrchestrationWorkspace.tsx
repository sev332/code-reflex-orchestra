// Orchestration Workspace - Immersive Blueprint Canvas with APOE pipeline
import React, { lazy, Suspense } from 'react';

const BlueprintCanvas = lazy(() => import('./BlueprintCanvas'));

export const OrchestrationWorkspace: React.FC = () => {
  return (
    <div className="h-full w-full">
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading Blueprint Canvas...</p>
          </div>
        </div>
      }>
        <BlueprintCanvas />
      </Suspense>
    </div>
  );
};

export default OrchestrationWorkspace;
