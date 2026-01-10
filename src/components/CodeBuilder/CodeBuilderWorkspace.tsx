// Code Builder Workspace - Full wrapper with central panel and chat sidebar
import React, { useState } from 'react';
import { CentralWorkspaceOverlay } from '@/components/layout/CentralWorkspaceOverlay';
import { CodeBuilderIDE } from './CodeBuilderIDE';
import { CodeBuilderChat } from './CodeBuilderChat';

interface CodeBuilderWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeBuilderWorkspace: React.FC<CodeBuilderWorkspaceProps> = ({
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');

  const handleCodeChange = (content: string) => {
    setFileContent(content);
  };

  const handleAIEdit = (editCommand: string) => {
    console.log('AI edit command:', editCommand);
  };

  if (!isOpen) return null;

  return (
    <CentralWorkspaceOverlay
      workspaceType="code-builder"
      onClose={onClose}
      title="Code Builder IDE"
      isFullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      chatComponent={
        <CodeBuilderChat
          activeFile={activeFile}
          fileContent={fileContent}
          onAIEdit={handleAIEdit}
        />
      }
    >
      <CodeBuilderIDE onClose={onClose} />
    </CentralWorkspaceOverlay>
  );
};
