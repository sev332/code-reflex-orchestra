// Document IDE Workspace - Full wrapper with central panel and chat sidebar
import React, { useState } from 'react';
import { CentralWorkspaceOverlay } from '@/components/layout/CentralWorkspaceOverlay';
import { DocumentIDE } from './DocumentIDE';
import { DocumentIDEChat } from './DocumentIDEChat';

interface DocumentIDEWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentIDEWorkspace: React.FC<DocumentIDEWorkspaceProps> = ({
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState('');

  const handleDocumentChange = (content: string) => {
    setDocumentContent(content);
  };

  const handleAIEdit = (editCommand: string) => {
    console.log('AI edit command:', editCommand);
    // Process AI edit command on the document
  };

  if (!isOpen) return null;

  return (
    <CentralWorkspaceOverlay
      workspaceType="document-ide"
      onClose={onClose}
      title="Document IDE"
      isFullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      chatComponent={
        <DocumentIDEChat
          activeDocument={activeDocument}
          documentContent={documentContent}
          onAIEdit={handleAIEdit}
        />
      }
    >
      <DocumentIDE 
        onClose={onClose}
        onDocumentChange={handleDocumentChange}
      />
    </CentralWorkspaceOverlay>
  );
};
