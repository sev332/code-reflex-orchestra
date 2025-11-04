import { ChainNode } from '@/components/Orchestration/PromptChainDesigner';
import { Edge } from '@xyflow/react';

export interface ChainTemplate {
  id: string;
  name: string;
  description: string;
  category: 'code-gen' | 'research' | 'analysis' | 'creative' | 'multi-agent';
  nodes: ChainNode[];
  edges: Edge[];
  icon: string;
}

export const orchestrationTemplates: ChainTemplate[] = [
  {
    id: 'simple-code-gen',
    name: 'Simple Code Generator',
    description: 'Generate code from a description',
    category: 'code-gen',
    icon: 'Code',
    nodes: [
      {
        id: '1',
        type: 'prompt',
        position: { x: 100, y: 100 },
        data: { 
          label: 'User Request',
          prompt: 'Create a React component that...'
        }
      },
      {
        id: '2',
        type: 'llm',
        position: { x: 100, y: 250 },
        data: { 
          label: 'Code Generator',
          model: 'google/gemini-2.5-flash',
          prompt: 'You are an expert React developer. Generate clean, production-ready code.',
          maxTokens: 2000
        }
      },
      {
        id: '3',
        type: 'tool',
        position: { x: 100, y: 400 },
        data: { 
          label: 'Code Formatter',
          toolName: 'code_generator'
        }
      },
      {
        id: '4',
        type: 'output',
        position: { x: 100, y: 550 },
        data: { 
          label: 'Generated Code'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' }
    ]
  },
  {
    id: 'research-analysis',
    name: 'Research & Analysis',
    description: 'Multi-step research with synthesis',
    category: 'research',
    icon: 'Search',
    nodes: [
      {
        id: '1',
        type: 'prompt',
        position: { x: 100, y: 100 },
        data: { 
          label: 'Research Query',
          prompt: 'Research topic...'
        }
      },
      {
        id: '2',
        type: 'tool',
        position: { x: 100, y: 250 },
        data: { 
          label: 'Search',
          toolName: 'search'
        }
      },
      {
        id: '3',
        type: 'llm',
        position: { x: 100, y: 400 },
        data: { 
          label: 'Analyzer',
          model: 'google/gemini-2.5-pro',
          prompt: 'Analyze the research findings and provide key insights.',
          maxTokens: 1500
        }
      },
      {
        id: '4',
        type: 'llm',
        position: { x: 100, y: 550 },
        data: { 
          label: 'Synthesizer',
          model: 'google/gemini-2.5-flash',
          prompt: 'Create a comprehensive summary with actionable conclusions.',
          maxTokens: 1000
        }
      },
      {
        id: '5',
        type: 'output',
        position: { x: 100, y: 700 },
        data: { 
          label: 'Research Report'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' }
    ]
  },
  {
    id: 'multi-agent-reasoning',
    name: 'Multi-Agent Reasoning',
    description: 'Parallel agents with consensus',
    category: 'multi-agent',
    icon: 'Users',
    nodes: [
      {
        id: '1',
        type: 'prompt',
        position: { x: 300, y: 100 },
        data: { 
          label: 'Problem Statement',
          prompt: 'Complex problem to solve...'
        }
      },
      {
        id: '2',
        type: 'llm',
        position: { x: 100, y: 250 },
        data: { 
          label: 'Agent 1: Analyst',
          model: 'google/gemini-2.5-pro',
          prompt: 'Analyze from a logical perspective.',
          maxTokens: 1000
        }
      },
      {
        id: '3',
        type: 'llm',
        position: { x: 300, y: 250 },
        data: { 
          label: 'Agent 2: Creative',
          model: 'google/gemini-2.5-flash',
          prompt: 'Analyze from a creative perspective.',
          maxTokens: 1000
        }
      },
      {
        id: '4',
        type: 'llm',
        position: { x: 500, y: 250 },
        data: { 
          label: 'Agent 3: Critic',
          model: 'google/gemini-2.5-flash',
          prompt: 'Analyze from a critical perspective.',
          maxTokens: 1000
        }
      },
      {
        id: '5',
        type: 'merge',
        position: { x: 300, y: 400 },
        data: { 
          label: 'Merge Perspectives'
        }
      },
      {
        id: '6',
        type: 'llm',
        position: { x: 300, y: 550 },
        data: { 
          label: 'Consensus Builder',
          model: 'google/gemini-2.5-pro',
          prompt: 'Synthesize all perspectives into a unified solution.',
          maxTokens: 1500
        }
      },
      {
        id: '7',
        type: 'output',
        position: { x: 300, y: 700 },
        data: { 
          label: 'Consensus Solution'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e1-3', source: '1', target: '3' },
      { id: 'e1-4', source: '1', target: '4' },
      { id: 'e2-5', source: '2', target: '5' },
      { id: 'e3-5', source: '3', target: '5' },
      { id: 'e4-5', source: '4', target: '5' },
      { id: 'e5-6', source: '5', target: '6' },
      { id: 'e6-7', source: '6', target: '7' }
    ]
  }
];

export const getTemplatesByCategory = (category: ChainTemplate['category']) => {
  return orchestrationTemplates.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
  return orchestrationTemplates.find(t => t.id === id);
};
