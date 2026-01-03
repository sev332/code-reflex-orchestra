// Dream Mode Workspace - Full wrapper with central panel and chat sidebar
import React, { useState } from 'react';
import { CentralWorkspaceOverlay } from '@/components/layout/CentralWorkspaceOverlay';
import { DreamModeCore } from './DreamModeCore';
import { DreamModeChat } from './DreamModeChat';

interface DreamModeWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DreamModeWorkspace: React.FC<DreamModeWorkspaceProps> = ({
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);

  const handleDocumentAction = (action: 'read' | 'edit', docId: string) => {
    setActiveDocument(docId);
    console.log(`Document action: ${action} on ${docId}`);
  };

  if (!isOpen) return null;

  return (
    <CentralWorkspaceOverlay
      workspaceType="dream-mode"
      onClose={onClose}
      title="Dream Mode - AI Self-Exploration"
      isFullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      chatComponent={
        <DreamModeChat
          onDocumentAction={handleDocumentAction}
          activeDocument={activeDocument}
        />
      }
    >
      <DreamModeCore />
    </CentralWorkspaceOverlay>
  );
};
