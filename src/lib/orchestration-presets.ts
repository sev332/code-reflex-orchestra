import {
  MessageSquare, Network, Cpu, Activity, Search, Cloud, Users, 
  PenTool, Database, Rocket, BarChart3, ShoppingCart, Globe,
  Brain, Code, Eye, Shield, Zap, Factory, Layers, Building
} from 'lucide-react';

export interface OrchestrationPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'Low' | 'Medium' | 'High' | 'Extreme';
  icon: any;
  estimatedCost: number;
  nodes: {
    id: string;
    nodeType: string;
    position: { x: number; y: number };
    config?: Record<string, any>;
  }[];
  connections: {
    sourceId: string;
    targetId: string;
    type: string;
  }[];
  metadata?: {
    useCase?: string;
    industry?: string[];
    scalability?: string;
    performance?: string;
  };
}

export const orchestrationPresets: OrchestrationPreset[] = [
  {
    id: 'simple_chat_system',
    name: 'Simple Chat System',
    description: 'Basic AI chat system with memory and processing',
    category: 'AI Systems',
    complexity: 'Low',
    icon: MessageSquare,
    estimatedCost: 50,
    nodes: [
      { id: 'chat_input', nodeType: 'data_input', position: { x: 100, y: 200 } },
      { id: 'main_agent', nodeType: 'research_agent', position: { x: 300, y: 200 } },
      { id: 'memory_store', nodeType: 'memory_agent', position: { x: 500, y: 150 } },
      { id: 'chat_output', nodeType: 'data_output', position: { x: 700, y: 200 } }
    ],
    connections: [
      { sourceId: 'chat_input', targetId: 'main_agent', type: 'data_flow' },
      { sourceId: 'main_agent', targetId: 'memory_store', type: 'data_flow' },
      { sourceId: 'memory_store', targetId: 'main_agent', type: 'feedback_loop' },
      { sourceId: 'main_agent', targetId: 'chat_output', type: 'data_flow' }
    ],
    metadata: {
      useCase: 'Customer Support',
      industry: ['Technology', 'Retail', 'Healthcare'],
      scalability: 'Medium',
      performance: 'Real-time'
    }
  },

  {
    id: 'microservices_api',
    name: 'Microservices API',
    description: 'Complete microservices architecture with API gateway',
    category: 'Infrastructure',
    complexity: 'Medium',
    icon: Network,
    estimatedCost: 200,
    nodes: [
      { id: 'api_gateway', nodeType: 'api_gateway', position: { x: 100, y: 300 } },
      { id: 'auth_service', nodeType: 'auth_service', position: { x: 300, y: 150 } },
      { id: 'user_service', nodeType: 'microservice', position: { x: 300, y: 250 } },
      { id: 'order_service', nodeType: 'microservice', position: { x: 300, y: 350 } },
      { id: 'user_db', nodeType: 'database', position: { x: 500, y: 200 } },
      { id: 'order_db', nodeType: 'database', position: { x: 500, y: 350 } },
      { id: 'payment_processor', nodeType: 'payment_gateway', position: { x: 500, y: 450 } }
    ],
    connections: [
      { sourceId: 'api_gateway', targetId: 'auth_service', type: 'api_call' },
      { sourceId: 'api_gateway', targetId: 'user_service', type: 'api_call' },
      { sourceId: 'api_gateway', targetId: 'order_service', type: 'api_call' },
      { sourceId: 'user_service', targetId: 'user_db', type: 'data_flow' },
      { sourceId: 'order_service', targetId: 'order_db', type: 'data_flow' },
      { sourceId: 'order_service', targetId: 'payment_processor', type: 'api_call' }
    ],
    metadata: {
      useCase: 'E-commerce Platform',
      industry: ['Retail', 'Technology'],
      scalability: 'High',
      performance: 'Sub-second'
    }
  },

  {
    id: 'ai_content_pipeline',
    name: 'AI Content Pipeline',
    description: 'Aggregate and analyze data from multiple social media platforms',
    category: 'AI/ML',
    complexity: 'High',
    icon: Cpu,
    estimatedCost: 500,
    nodes: [
      { id: 'content_input', nodeType: 'data_input', position: { x: 50, y: 300 } },
      { id: 'content_router', nodeType: 'decision_gate', position: { x: 200, y: 300 } },
      { id: 'text_analyzer', nodeType: 'code_agent', position: { x: 350, y: 200 } },
      { id: 'image_analyzer', nodeType: 'image_processor', position: { x: 350, y: 300 } },
      { id: 'video_analyzer', nodeType: 'video_processor', position: { x: 350, y: 400 } },
      { id: 'moderation_engine', nodeType: 'moderation_agent', position: { x: 500, y: 300 } },
      { id: 'approval_queue', nodeType: 'workflow_orchestrator', position: { x: 650, y: 300 } },
      { id: 'content_output', nodeType: 'data_output', position: { x: 800, y: 300 } }
    ],
    connections: [
      { sourceId: 'content_input', targetId: 'content_router', type: 'data_flow' },
      { sourceId: 'content_router', targetId: 'text_analyzer', type: 'control_flow' },
      { sourceId: 'content_router', targetId: 'image_analyzer', type: 'control_flow' },
      { sourceId: 'content_router', targetId: 'video_analyzer', type: 'control_flow' },
      { sourceId: 'text_analyzer', targetId: 'moderation_engine', type: 'data_flow' },
      { sourceId: 'image_analyzer', targetId: 'moderation_engine', type: 'data_flow' },
      { sourceId: 'video_analyzer', targetId: 'moderation_engine', type: 'data_flow' },
      { sourceId: 'moderation_engine', targetId: 'approval_queue', type: 'data_flow' },
      { sourceId: 'approval_queue', targetId: 'content_output', type: 'data_flow' }
    ],
    metadata: {
      useCase: 'Social Media Management',
      industry: ['Media', 'Marketing', 'Technology'],
      scalability: 'Global',
      performance: 'Real-time'
    }
  },

  {
    id: 'ml_pipeline',
    name: 'Dynamic ML Training Pipeline',
    description: 'Self-optimizing machine learning workflow with feedback loops',
    category: 'AI/ML',
    complexity: 'High',
    icon: Activity,
    estimatedCost: 800,
    nodes: [
      { id: 'ml_input', nodeType: 'data_input', position: { x: 50, y: 400 } },
      { id: 'ml_preprocess', nodeType: 'transformer', position: { x: 200, y: 400 } },
      { id: 'data_augmentation', nodeType: 'condition_checker', position: { x: 350, y: 350 } },
      { id: 'ml_parallel_train', nodeType: 'parallel_executor', position: { x: 500, y: 400 } },
      { id: 'ml_model_a', nodeType: 'ml_model', position: { x: 650, y: 300 } },
      { id: 'ml_model_b', nodeType: 'ml_model', position: { x: 650, y: 400 } },
      { id: 'ml_model_c', nodeType: 'ml_model', position: { x: 650, y: 500 } },
      { id: 'hyperparameter_optimizer', nodeType: 'optimization_agent', position: { x: 800, y: 300 } },
      { id: 'ml_merge_eval', nodeType: 'merge_hub', position: { x: 950, y: 400 } },
      { id: 'ml_decision_best', nodeType: 'decision_gate', position: { x: 1100, y: 400 } },
      { id: 'ml_deploy', nodeType: 'deployment_strategy', position: { x: 1250, y: 400 } },
      { id: 'prod_monitoring', nodeType: 'monitor', position: { x: 1250, y: 550 } }
    ],
    connections: [
      { sourceId: 'ml_input', targetId: 'ml_preprocess', type: 'data_flow' },
      { sourceId: 'ml_preprocess', targetId: 'data_augmentation', type: 'data_flow' },
      { sourceId: 'data_augmentation', targetId: 'ml_parallel_train', type: 'control_flow' },
      { sourceId: 'ml_parallel_train', targetId: 'ml_model_a', type: 'data_flow' },
      { sourceId: 'ml_parallel_train', targetId: 'ml_model_b', type: 'data_flow' },
      { sourceId: 'ml_parallel_train', targetId: 'ml_model_c', type: 'data_flow' },
      { sourceId: 'ml_model_a', targetId: 'hyperparameter_optimizer', type: 'feedback_loop' },
      { sourceId: 'ml_model_a', targetId: 'ml_merge_eval', type: 'data_flow' },
      { sourceId: 'ml_model_b', targetId: 'ml_merge_eval', type: 'data_flow' },
      { sourceId: 'ml_model_c', targetId: 'ml_merge_eval', type: 'data_flow' },
      { sourceId: 'ml_merge_eval', targetId: 'ml_decision_best', type: 'data_flow' },
      { sourceId: 'ml_decision_best', targetId: 'ml_deploy', type: 'control_flow' },
      { sourceId: 'ml_deploy', targetId: 'prod_monitoring', type: 'orchestration' },
      { sourceId: 'prod_monitoring', targetId: 'hyperparameter_optimizer', type: 'feedback_loop' }
    ],
    metadata: {
      useCase: 'Machine Learning Operations',
      industry: ['Technology', 'Healthcare', 'Finance'],
      scalability: 'High',
      performance: 'Batch Processing'
    }
  },

  {
    id: 'deep_research_swarm',
    name: 'Collaborative Research Swarm',
    description: 'Multi-agent system with cross-talk and shared knowledge base',
    category: 'AI/ML',
    complexity: 'Extreme',
    icon: Search,
    estimatedCost: 1200,
    nodes: [
      { id: 'research_input', nodeType: 'data_input', position: { x: 100, y: 400 } },
      { id: 'shared_memory', nodeType: 'knowledge_graph', position: { x: 400, y: 200 } },
      { id: 'research_manager', nodeType: 'workflow_orchestrator', position: { x: 250, y: 400 } },
      { id: 'search_agent_1', nodeType: 'research_agent', position: { x: 400, y: 350 } },
      { id: 'search_agent_2', nodeType: 'research_agent', position: { x: 400, y: 400 } },
      { id: 'search_agent_3', nodeType: 'research_agent', position: { x: 400, y: 450 } },
      { id: 'synthesis_agent', nodeType: 'code_agent', position: { x: 600, y: 400 } }
    ],
    connections: [
      { sourceId: 'research_input', targetId: 'research_manager', type: 'data_flow' },
      { sourceId: 'research_manager', targetId: 'search_agent_1', type: 'orchestration' },
      { sourceId: 'research_manager', targetId: 'search_agent_2', type: 'orchestration' },
      { sourceId: 'research_manager', targetId: 'search_agent_3', type: 'orchestration' },
      { sourceId: 'search_agent_1', targetId: 'shared_memory', type: 'data_flow' },
      { sourceId: 'search_agent_2', targetId: 'shared_memory', type: 'data_flow' },
      { sourceId: 'search_agent_3', targetId: 'shared_memory', type: 'data_flow' },
      { sourceId: 'shared_memory', targetId: 'search_agent_1', type: 'feedback_loop' },
      { sourceId: 'shared_memory', targetId: 'search_agent_2', type: 'feedback_loop' },
      { sourceId: 'shared_memory', targetId: 'search_agent_3', type: 'feedback_loop' },
      { sourceId: 'search_agent_1', targetId: 'synthesis_agent', type: 'data_flow' },
      { sourceId: 'search_agent_2', targetId: 'synthesis_agent', type: 'data_flow' },
      { sourceId: 'search_agent_3', targetId: 'synthesis_agent', type: 'data_flow' }
    ],
    metadata: {
      useCase: 'Advanced Research & Analysis',
      industry: ['Research', 'Academia', 'Consulting'],
      scalability: 'Distributed',
      performance: 'Deep Analysis'
    }
  },

  {
    id: 'hyperscale_cloud_platform',
    name: 'Hyperscale Cloud Platform',
    description: 'Scalable cloud platform with multi-region support',
    category: 'Infrastructure',
    complexity: 'Extreme',
    icon: Cloud,
    estimatedCost: 2500,
    nodes: [
      { id: 'global_load_balancer', nodeType: 'load_balancer', position: { x: 200, y: 300 } },
      { id: 'us_region', nodeType: 'data_center', position: { x: 400, y: 200 } },
      { id: 'eu_region', nodeType: 'data_center', position: { x: 400, y: 300 } },
      { id: 'apac_region', nodeType: 'data_center', position: { x: 400, y: 400 } },
      { id: 'kubernetes_control_plane', nodeType: 'kubernetes_cluster', position: { x: 600, y: 300 } },
      { id: 'container_registry', nodeType: 'container_registry', position: { x: 800, y: 200 } },
      { id: 'monitoring_system', nodeType: 'monitoring', position: { x: 800, y: 400 } }
    ],
    connections: [
      { sourceId: 'global_load_balancer', targetId: 'us_region', type: 'load_balance' },
      { sourceId: 'global_load_balancer', targetId: 'eu_region', type: 'load_balance' },
      { sourceId: 'global_load_balancer', targetId: 'apac_region', type: 'load_balance' },
      { sourceId: 'us_region', targetId: 'kubernetes_control_plane', type: 'orchestration' },
      { sourceId: 'eu_region', targetId: 'kubernetes_control_plane', type: 'orchestration' },
      { sourceId: 'apac_region', targetId: 'kubernetes_control_plane', type: 'orchestration' },
      { sourceId: 'kubernetes_control_plane', targetId: 'container_registry', type: 'dependency' },
      { sourceId: 'kubernetes_control_plane', targetId: 'monitoring_system', type: 'orchestration' }
    ],
    metadata: {
      useCase: 'Enterprise Cloud Infrastructure',
      industry: ['Technology', 'Enterprise'],
      scalability: 'Global',
      performance: 'Ultra-high'
    }
  },

  {
    id: 'replit_multiplayer_infrastructure',
    name: 'Replit Multiplayer Code Infrastructure',
    description: 'Real-time collaborative coding platform with multiplayer editing',
    category: 'Development',
    complexity: 'Extreme',
    icon: Users,
    estimatedCost: 3000,
    nodes: [
      { id: 'multiplayer_coordination_hub', nodeType: 'collaboration_hub', position: { x: 200, y: 300 } },
      { id: 'realtime_sync_engine', nodeType: 'realtime_db', position: { x: 400, y: 250 } },
      { id: 'conflict_resolution_system', nodeType: 'merge_hub', position: { x: 400, y: 350 } },
      { id: 'code_execution_engine', nodeType: 'serverless_platform', position: { x: 600, y: 200 } },
      { id: 'sandbox_orchestrator', nodeType: 'container_orchestrator', position: { x: 600, y: 300 } },
      { id: 'ai_code_assistant', nodeType: 'code_agent', position: { x: 600, y: 400 } },
      { id: 'project_storage_system', nodeType: 'storage_system', position: { x: 800, y: 300 } }
    ],
    connections: [
      { sourceId: 'multiplayer_coordination_hub', targetId: 'realtime_sync_engine', type: 'real_time' },
      { sourceId: 'multiplayer_coordination_hub', targetId: 'conflict_resolution_system', type: 'orchestration' },
      { sourceId: 'realtime_sync_engine', targetId: 'code_execution_engine', type: 'event_stream' },
      { sourceId: 'conflict_resolution_system', targetId: 'sandbox_orchestrator', type: 'control_flow' },
      { sourceId: 'code_execution_engine', targetId: 'ai_code_assistant', type: 'api_call' },
      { sourceId: 'sandbox_orchestrator', targetId: 'project_storage_system', type: 'data_flow' },
      { sourceId: 'ai_code_assistant', targetId: 'project_storage_system', type: 'data_flow' }
    ],
    metadata: {
      useCase: 'Collaborative Development Environment',
      industry: ['Education', 'Technology', 'Development'],
      scalability: 'Global',
      performance: 'Real-time'
    }
  },

  {
    id: 'figma_realtime_collaboration',
    name: 'Figma Real-time Collaboration Engine',
    description: 'Massive real-time design collaboration platform',
    category: 'Design',
    complexity: 'Extreme',
    icon: PenTool,
    estimatedCost: 2800,
    nodes: [
      { id: 'collaboration_core_engine', nodeType: 'collaboration_engine', position: { x: 200, y: 300 } },
      { id: 'multiplayer_cursor_system', nodeType: 'cursor_system', position: { x: 400, y: 200 } },
      { id: 'vector_sync_engine', nodeType: 'vector_processor', position: { x: 400, y: 300 } },
      { id: 'comment_collaboration_hub', nodeType: 'collaboration_hub', position: { x: 400, y: 400 } },
      { id: 'vector_processing_farm', nodeType: 'vector_processor', position: { x: 600, y: 250 } },
      { id: 'component_library_system', nodeType: 'asset_manager', position: { x: 600, y: 350 } },
      { id: 'design_system_engine', nodeType: 'design_system', position: { x: 800, y: 300 } }
    ],
    connections: [
      { sourceId: 'collaboration_core_engine', targetId: 'multiplayer_cursor_system', type: 'real_time' },
      { sourceId: 'collaboration_core_engine', targetId: 'vector_sync_engine', type: 'real_time' },
      { sourceId: 'collaboration_core_engine', targetId: 'comment_collaboration_hub', type: 'event_stream' },
      { sourceId: 'vector_sync_engine', targetId: 'vector_processing_farm', type: 'data_flow' },
      { sourceId: 'comment_collaboration_hub', targetId: 'component_library_system', type: 'data_flow' },
      { sourceId: 'vector_processing_farm', targetId: 'design_system_engine', type: 'data_flow' },
      { sourceId: 'component_library_system', targetId: 'design_system_engine', type: 'dependency' }
    ],
    metadata: {
      useCase: 'Design Collaboration Platform',
      industry: ['Design', 'Technology', 'Creative'],
      scalability: 'Global',
      performance: 'Real-time'
    }
  },

  {
    id: 'enterprise_ecommerce',
    name: 'Enterprise E-Commerce Platform',
    description: 'Complete enterprise e-commerce with AI and fraud detection',
    category: 'Business',
    complexity: 'Extreme',
    icon: ShoppingCart,
    estimatedCost: 1800,
    nodes: [
      { id: 'api_gateway', nodeType: 'api_gateway', position: { x: 100, y: 400 } },
      { id: 'product_catalog', nodeType: 'database', position: { x: 300, y: 300 } },
      { id: 'recommendation_engine', nodeType: 'predictive_analytics', position: { x: 300, y: 400 } },
      { id: 'inventory_management', nodeType: 'inventory_system', position: { x: 300, y: 500 } },
      { id: 'fraud_detection', nodeType: 'fraud_detection_system', position: { x: 500, y: 350 } },
      { id: 'payment_processor', nodeType: 'payment_gateway', position: { x: 500, y: 450 } },
      { id: 'order_fulfillment', nodeType: 'logistics_hub', position: { x: 700, y: 400 } },
      { id: 'customer_service_ai', nodeType: 'research_agent', position: { x: 700, y: 300 } }
    ],
    connections: [
      { sourceId: 'api_gateway', targetId: 'product_catalog', type: 'api_call' },
      { sourceId: 'api_gateway', targetId: 'recommendation_engine', type: 'api_call' },
      { sourceId: 'product_catalog', targetId: 'inventory_management', type: 'data_flow' },
      { sourceId: 'recommendation_engine', targetId: 'fraud_detection', type: 'data_flow' },
      { sourceId: 'fraud_detection', targetId: 'payment_processor', type: 'control_flow' },
      { sourceId: 'payment_processor', targetId: 'order_fulfillment', type: 'event_stream' },
      { sourceId: 'order_fulfillment', targetId: 'customer_service_ai', type: 'webhook' },
      { sourceId: 'customer_service_ai', targetId: 'recommendation_engine', type: 'feedback_loop' }
    ],
    metadata: {
      useCase: 'Enterprise E-commerce',
      industry: ['Retail', 'E-commerce'],
      scalability: 'Global',
      performance: 'High-throughput'
    }
  },

  {
    id: 'autonomous_ai_ecosystem',
    name: 'Autonomous AI Ecosystem',
    description: 'Self-improving AI system with research, coding, and deployment',
    category: 'AI/ML',
    complexity: 'Extreme',
    icon: Brain,
    estimatedCost: 5000,
    nodes: [
      { id: 'master_orchestrator', nodeType: 'ai_orchestrator', position: { x: 400, y: 300 } },
      { id: 'research_swarm', nodeType: 'research_agent', position: { x: 200, y: 200 } },
      { id: 'code_generation_farm', nodeType: 'code_agent', position: { x: 200, y: 300 } },
      { id: 'testing_automation', nodeType: 'testing_agent', position: { x: 200, y: 400 } },
      { id: 'deployment_system', nodeType: 'deployment_strategy', position: { x: 600, y: 200 } },
      { id: 'learning_feedback_loop', nodeType: 'learning_system', position: { x: 600, y: 300 } },
      { id: 'performance_optimizer', nodeType: 'optimization_ai', position: { x: 600, y: 400 } },
      { id: 'knowledge_base', nodeType: 'knowledge_graph', position: { x: 400, y: 500 } }
    ],
    connections: [
      { sourceId: 'master_orchestrator', targetId: 'research_swarm', type: 'orchestration' },
      { sourceId: 'master_orchestrator', targetId: 'code_generation_farm', type: 'orchestration' },
      { sourceId: 'master_orchestrator', targetId: 'testing_automation', type: 'orchestration' },
      { sourceId: 'research_swarm', targetId: 'knowledge_base', type: 'data_flow' },
      { sourceId: 'code_generation_farm', targetId: 'deployment_system', type: 'data_flow' },
      { sourceId: 'testing_automation', targetId: 'deployment_system', type: 'control_flow' },
      { sourceId: 'deployment_system', targetId: 'learning_feedback_loop', type: 'feedback_loop' },
      { sourceId: 'learning_feedback_loop', targetId: 'performance_optimizer', type: 'data_flow' },
      { sourceId: 'performance_optimizer', targetId: 'master_orchestrator', type: 'feedback_loop' },
      { sourceId: 'knowledge_base', targetId: 'master_orchestrator', type: 'feedback_loop' }
    ],
    metadata: {
      useCase: 'Autonomous AI Development',
      industry: ['AI Research', 'Technology'],
      scalability: 'Self-scaling',
      performance: 'Continuous Improvement'
    }
  },

  {
    id: 'smart_city_platform',
    name: 'Smart City IoT Platform',
    description: 'Integrated IoT-based city management with predictive analytics',
    category: 'IoT',
    complexity: 'Extreme',
    icon: Building,
    estimatedCost: 4000,
    nodes: [
      { id: 'iot_data_ingestion', nodeType: 'data_input', position: { x: 100, y: 400 } },
      { id: 'edge_processing_network', nodeType: 'edge_computing_network', position: { x: 300, y: 350 } },
      { id: 'traffic_management', nodeType: 'predictive_analytics', position: { x: 500, y: 250 } },
      { id: 'energy_optimization', nodeType: 'optimization_agent', position: { x: 500, y: 350 } },
      { id: 'emergency_response', nodeType: 'workflow_orchestrator', position: { x: 500, y: 450 } },
      { id: 'citizen_services', nodeType: 'customer_journey_engine', position: { x: 700, y: 300 } },
      { id: 'city_dashboard', nodeType: 'analytics_engine', position: { x: 700, y: 400 } },
      { id: 'data_lake', nodeType: 'data_lake', position: { x: 300, y: 500 } }
    ],
    connections: [
      { sourceId: 'iot_data_ingestion', targetId: 'edge_processing_network', type: 'data_flow' },
      { sourceId: 'edge_processing_network', targetId: 'traffic_management', type: 'event_stream' },
      { sourceId: 'edge_processing_network', targetId: 'energy_optimization', type: 'event_stream' },
      { sourceId: 'edge_processing_network', targetId: 'emergency_response', type: 'event_stream' },
      { sourceId: 'edge_processing_network', targetId: 'data_lake', type: 'data_flow' },
      { sourceId: 'traffic_management', targetId: 'citizen_services', type: 'api_call' },
      { sourceId: 'energy_optimization', targetId: 'city_dashboard', type: 'data_flow' },
      { sourceId: 'emergency_response', targetId: 'citizen_services', type: 'webhook' },
      { sourceId: 'data_lake', targetId: 'city_dashboard', type: 'data_flow' }
    ],
    metadata: {
      useCase: 'Smart City Management',
      industry: ['Government', 'Urban Planning', 'IoT'],
      scalability: 'City-wide',
      performance: 'Real-time Analytics'
    }
  }
];

// Helper functions for working with presets
export const getPresetsByCategory = (category: string): OrchestrationPreset[] => {
  return orchestrationPresets.filter(preset => preset.category === category);
};

export const getPresetById = (id: string): OrchestrationPreset | undefined => {
  return orchestrationPresets.find(preset => preset.id === id);
};

export const getPresetsByComplexity = (complexity: string): OrchestrationPreset[] => {
  return orchestrationPresets.filter(preset => preset.complexity === complexity);
};

export const getAllPresetCategories = (): string[] => {
  return [...new Set(orchestrationPresets.map(preset => preset.category))];
};

export const getEstimatedCostRange = (): { min: number; max: number } => {
  const costs = orchestrationPresets.map(preset => preset.estimatedCost);
  return {
    min: Math.min(...costs),
    max: Math.max(...costs)
  };
};