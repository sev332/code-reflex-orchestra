import type { ComponentType } from 'react';
import {
  MessageSquare,
  Brain,
  MessageCircle,
  Users,
  Database,
  Eye,
  GitBranch,
  Activity,
  Cpu,
  Network,
  Workflow,
  KeyRound,
} from 'lucide-react';

export type RightSystemDrawerId =
  | 'chat'
  | 'thinking'
  | 'discord'
  | 'agents'
  | 'memory'
  | 'context'
  | 'reasoning'
  | 'analytics'
  | 'processing'
  | 'network'
  | 'workflows'
  | 'vault';

export type RightSystemDrawerTab = RightSystemDrawerId | null;

export interface RightSystemDrawerItem {
  id: RightSystemDrawerId;
  icon: ComponentType<any>;
  label: string;
}

export const RIGHT_SYSTEM_DRAWER_ITEMS: RightSystemDrawerItem[] = [
  { id: 'chat', icon: MessageSquare, label: 'Assistant' },
  { id: 'thinking', icon: Brain, label: 'Thinking' },
  { id: 'discord', icon: MessageCircle, label: 'Agent Discord' },
  { id: 'agents', icon: Users, label: 'Agents' },
  { id: 'memory', icon: Database, label: 'Memory' },
  { id: 'context', icon: Eye, label: 'Context' },
  { id: 'reasoning', icon: GitBranch, label: 'Reasoning' },
  { id: 'analytics', icon: Activity, label: 'Analytics' },
  { id: 'processing', icon: Cpu, label: 'Processing' },
  { id: 'network', icon: Network, label: 'Network' },
  { id: 'workflows', icon: Workflow, label: 'Workflows' },
  { id: 'vault', icon: KeyRound, label: 'Vault' },
];

export const ENHANCED_SYSTEM_DRAWERS = [
  'thinking',
  'discord',
  'agents',
  'memory',
  'context',
  'reasoning',
  'analytics',
  'processing',
  'network',
] as const;

export type EnhancedSystemDrawerId = (typeof ENHANCED_SYSTEM_DRAWERS)[number];

export const isEnhancedSystemDrawer = (tab: RightSystemDrawerId): tab is EnhancedSystemDrawerId => {
  return (ENHANCED_SYSTEM_DRAWERS as readonly string[]).includes(tab);
};
