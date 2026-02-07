// Placeholder page for upcoming editors (Image, Audio, Video, Map)
import React from 'react';
import { Image, Music, Video, Map, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageId } from '@/components/layout/PageTopBar';

const pageConfig: Record<string, { icon: React.ComponentType<any>; title: string; description: string; gradient: string }> = {
  image: {
    icon: Image,
    title: 'Image Editor',
    description: 'AI-powered image editing, generation, and manipulation tools.',
    gradient: 'from-pink-500/20 via-purple-500/20 to-indigo-500/20',
  },
  audio: {
    icon: Music,
    title: 'Audio Editor',
    description: 'Multi-track audio editing, effects processing, and AI audio generation.',
    gradient: 'from-emerald-500/20 via-cyan-500/20 to-blue-500/20',
  },
  video: {
    icon: Video,
    title: 'Video Editor',
    description: 'Timeline-based video editing with AI scene understanding and generation.',
    gradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
  },
  map: {
    icon: Map,
    title: 'Map Workspace',
    description: 'Spatial data visualization, navigation, and geospatial AI tools.',
    gradient: 'from-blue-500/20 via-teal-500/20 to-emerald-500/20',
  },
};

export function PlaceholderPage({ pageId }: { pageId: PageId }) {
  const config = pageConfig[pageId];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center h-full">
      <div className={cn('max-w-md text-center p-12 rounded-2xl bg-gradient-to-br border border-border/20', config.gradient)}>
        <div className="w-16 h-16 rounded-2xl bg-background/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-border/30">
          <Icon className="w-8 h-8 text-foreground/70" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{config.title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{config.description}</p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
