import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Image, Video, FileText, Search, Sparkles } from 'lucide-react';

export type AIActionType = 'image' | 'video' | 'document' | 'deep_search' | 'edit_document';

interface AIAction {
  type: AIActionType;
  description: string;
  prompt?: string;
  documentTitle?: string;
  metadata?: Record<string, any>;
}

interface AIActionConfirmationProps {
  action: AIAction | null;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const actionIcons: Record<AIActionType, React.ReactNode> = {
  image: <Image className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  deep_search: <Search className="h-5 w-5" />,
  edit_document: <Sparkles className="h-5 w-5" />
};

const actionLabels: Record<AIActionType, string> = {
  image: 'Image Generation',
  video: 'Video Generation',
  document: 'Document Creation',
  deep_search: 'Deep Search',
  edit_document: 'Document Editing'
};

const actionColors: Record<AIActionType, string> = {
  image: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  video: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  document: 'bg-green-500/20 text-green-300 border-green-500/30',
  deep_search: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  edit_document: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
};

export const AIActionConfirmation: React.FC<AIActionConfirmationProps> = ({
  action,
  open,
  onConfirm,
  onCancel
}) => {
  if (!action) return null;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              {actionIcons[action.type]}
            </div>
            <AlertDialogTitle className="text-xl">
              AI Action Requested
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={`${actionColors[action.type]} border`}>
                {actionLabels[action.type]}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="text-foreground">{action.description}</p>
              
              {action.prompt && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Prompt:</p>
                  <p className="text-sm text-foreground/90 italic">"{action.prompt}"</p>
                </div>
              )}
              
              {action.documentTitle && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Document:</p>
                  <p className="text-sm text-foreground/90 font-medium">{action.documentTitle}</p>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground pt-2">
              Do you want to allow the AI to proceed with this action?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="bg-muted/50 hover:bg-muted">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-primary hover:bg-primary/90"
          >
            Confirm Action
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
