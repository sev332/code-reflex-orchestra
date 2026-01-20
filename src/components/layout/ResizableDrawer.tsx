// Resizable drawer wrapper component
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizableDrawerProps {
  children: React.ReactNode;
  side: 'left' | 'right';
  isOpen: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

export const ResizableDrawer: React.FC<ResizableDrawerProps> = ({
  children,
  side,
  isOpen,
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 600,
  className
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    let newWidth: number;
    if (side === 'left') {
      newWidth = e.clientX - 48; // Account for icon bar width
    } else {
      newWidth = window.innerWidth - e.clientX - 48;
    }
    
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(newWidth);
  }, [isResizing, side, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      className={cn(
        "fixed top-12 bottom-0 bg-background/95 backdrop-blur-xl z-30 flex animate-slide-in-right",
        side === 'left' ? "left-12 border-r border-border/50" : "right-12 border-l border-border/30",
        className
      )}
      style={{ width }}
    >
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 bottom-0 w-1 cursor-col-resize transition-colors hover:bg-primary/50",
          side === 'left' ? "right-0" : "left-0",
          isResizing && "bg-primary/50"
        )}
      />
      
      {/* Resize indicator line */}
      {isResizing && (
        <div 
          className={cn(
            "absolute top-0 bottom-0 w-0.5 bg-primary",
            side === 'left' ? "right-0" : "left-0"
          )}
        />
      )}
    </div>
  );
};
