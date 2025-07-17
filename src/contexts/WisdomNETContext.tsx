// WisdomNET React Context - Global State Management

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { WisdomNETCore, createDefaultManifest } from '@/lib/wisdomnet-core';
import type { AgentDefinition, Task, Activity, AgentStatus } from '@/types/wisdomnet';

interface WisdomNETState {
  core: WisdomNETCore | null;
  agents: AgentDefinition[];
  tasks: Task[];
  activities: Activity[];
  isInitialized: boolean;
  selectedNode: string | null;
  chatHistory: ChatMessage[];
  systemMetrics: SystemMetrics;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  sender: 'user' | 'system' | string; // agent ID
  content: string;
  type: 'text' | 'code' | 'task' | 'analysis';
  metadata?: any;
}

interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  completedTasks: number;
  memoryUsage: number;
  systemLoad: number;
  uptime: number;
}

type WisdomNETAction =
  | { type: 'INITIALIZE'; payload: WisdomNETCore }
  | { type: 'UPDATE_AGENTS'; payload: AgentDefinition[] }
  | { type: 'UPDATE_TASKS'; payload: Task[] }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_METRICS'; payload: SystemMetrics }
  | { type: 'AGENT_STATUS_CHANGE'; payload: { agentId: string; status: AgentStatus } };

const initialState: WisdomNETState = {
  core: null,
  agents: [],
  tasks: [],
  activities: [],
  isInitialized: false,
  selectedNode: null,
  chatHistory: [],
  systemMetrics: {
    totalAgents: 0,
    activeAgents: 0,
    completedTasks: 0,
    memoryUsage: 0,
    systemLoad: 0,
    uptime: 0
  }
};

function wisdomNETReducer(state: WisdomNETState, action: WisdomNETAction): WisdomNETState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        core: action.payload,
        isInitialized: true,
        agents: action.payload.getAgents(),
        tasks: action.payload.getTasks(),
        activities: action.payload.getRecentActivities()
      };
    
    case 'UPDATE_AGENTS':
      return {
        ...state,
        agents: action.payload
      };
    
    case 'UPDATE_TASKS':
      return {
        ...state,
        tasks: action.payload
      };
    
    case 'ADD_ACTIVITY':
      return {
        ...state,
        activities: [action.payload, ...state.activities].slice(0, 100) // Keep last 100
      };
    
    case 'SELECT_NODE':
      return {
        ...state,
        selectedNode: action.payload
      };
    
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload]
      };
    
    case 'UPDATE_METRICS':
      return {
        ...state,
        systemMetrics: action.payload
      };
    
    case 'AGENT_STATUS_CHANGE':
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.agentId
            ? { ...agent, status: action.payload.status }
            : agent
        )
      };
    
    default:
      return state;
  }
}

interface WisdomNETContextType extends WisdomNETState {
  // Actions
  initialize: () => void;
  createTask: (task: Omit<Task, 'id' | 'created'>) => void;
  sendChatMessage: (content: string, type?: 'text' | 'code' | 'task') => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  selectNode: (nodeId: string | null) => void;
  queryMemory: (query: string) => Promise<any>;
  
  // System Control
  pauseSystem: () => void;
  resumeSystem: () => void;
  resetSystem: () => void;
}

const WisdomNETContext = createContext<WisdomNETContextType | null>(null);

export function WisdomNETProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wisdomNETReducer, initialState);

  // Initialize WisdomNET system
  const initialize = useCallback(() => {
    const manifest = createDefaultManifest();
    const core = new WisdomNETCore(manifest);
    
    dispatch({ type: 'INITIALIZE', payload: core });
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sender: 'system',
      content: `WisdomNET AGI System initialized successfully. 
      
🧠 **Neural Network Status**: Active
🤖 **Agents Online**: ${manifest.agents.length}
🔄 **System Loops**: Running
📊 **Memory Model**: Ready

How can I assist you in building the future?`,
      type: 'text'
    };
    
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: welcomeMessage });
  }, []);

  // Create a new task
  const createTask = useCallback((taskData: Omit<Task, 'id' | 'created'>) => {
    if (!state.core) return;
    
    const taskId = state.core.createTask(taskData);
    const updatedTasks = state.core.getTasks();
    
    dispatch({ type: 'UPDATE_TASKS', payload: updatedTasks });
    
    // Add task creation message
    const taskMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sender: 'system',
      content: `✅ Task created: **${taskData.title}**\n\nType: ${taskData.type}\nPriority: ${taskData.priority}\nID: ${taskId}`,
      type: 'task',
      metadata: { taskId }
    };
    
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: taskMessage });
  }, [state.core]);

  // Send chat message
  const sendChatMessage = useCallback((content: string, type: 'text' | 'code' | 'task' = 'text') => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sender: 'user',
      content,
      type
    };
    
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
    
    // Simulate AI response (in real implementation, this would trigger agent processing)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        timestamp: new Date().toISOString(),
        sender: 'orchestrator_001',
        content: `Processing your request: "${content}"\n\nI'm analyzing the context and routing this to the appropriate agents...`,
        type: 'text'
      };
      
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiResponse });
    }, 1000);
  }, []);

  // Update agent status
  const updateAgentStatus = useCallback((agentId: string, status: AgentStatus) => {
    if (!state.core) return;
    
    state.core.updateAgentStatus(agentId, status);
    const updatedAgents = state.core.getAgents();
    
    dispatch({ type: 'UPDATE_AGENTS', payload: updatedAgents });
    dispatch({ type: 'AGENT_STATUS_CHANGE', payload: { agentId, status } });
  }, [state.core]);

  // Select node in tree
  const selectNode = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: nodeId });
  }, []);

  // Query memory
  const queryMemory = useCallback(async (query: string) => {
    if (!state.core) return null;
    
    const ragContext = await state.core.queryMemory(query);
    
    const memoryMessage: ChatMessage = {
      id: `msg_${Date.now()}_memory`,
      timestamp: new Date().toISOString(),
      sender: 'memory_keeper_001',
      content: `🧠 Memory Query: "${query}"\n\nRetrieved ${ragContext.retrievedDocs.length} relevant documents with average relevance score of ${(ragContext.retrievedDocs.reduce((sum, doc) => sum + doc.score, 0) / ragContext.retrievedDocs.length).toFixed(2)}`,
      type: 'analysis',
      metadata: ragContext
    };
    
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: memoryMessage });
    
    return ragContext;
  }, [state.core]);

  // System control methods
  const pauseSystem = useCallback(() => {
    // Implementation for pausing system loops
  }, []);

  const resumeSystem = useCallback(() => {
    // Implementation for resuming system loops
  }, []);

  const resetSystem = useCallback(() => {
    // Implementation for resetting system
  }, []);

  // Update metrics periodically
  useEffect(() => {
    if (!state.core) return;

    const updateMetrics = () => {
      const systemState = state.core!.getCurrentState();
      const metrics: SystemMetrics = {
        totalAgents: systemState.agents.total,
        activeAgents: systemState.agents.active,
        completedTasks: state.tasks.filter(t => t.status === 'completed').length,
        memoryUsage: systemState.memory.entries,
        systemLoad: Math.random() * 100, // Simulated
        uptime: Date.now() - new Date(state.core!.getManifest().created).getTime()
      };
      
      dispatch({ type: 'UPDATE_METRICS', payload: metrics });
    };

    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [state.core, state.tasks]);

  const contextValue: WisdomNETContextType = {
    ...state,
    initialize,
    createTask,
    sendChatMessage,
    updateAgentStatus,
    selectNode,
    queryMemory,
    pauseSystem,
    resumeSystem,
    resetSystem
  };

  return (
    <WisdomNETContext.Provider value={contextValue}>
      {children}
    </WisdomNETContext.Provider>
  );
}

export function useWisdomNET() {
  const context = useContext(WisdomNETContext);
  if (!context) {
    throw new Error('useWisdomNET must be used within a WisdomNETProvider');
  }
  return context;
}