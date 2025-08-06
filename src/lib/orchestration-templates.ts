import {
  ShoppingCart, Brain, Building, BarChart3, Factory, Shield,
  Rocket, Users, Code, Database, Network, Globe, MessageSquare,
  Cpu, Activity, Search, Cloud, PenTool, Bot, FileText, Video,
  Mic, Image, Layers, Package, Truck, Bitcoin, TrendingUp,
  Zap, HardDrive, Eye, Lock, Mail, Phone, Smartphone, Settings,
  Monitor, Bell, Webhook, Calendar, CreditCard, Gauge, TestTube
} from 'lucide-react';

export interface OrchestrationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  complexity: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  estimatedNodes: number;
  estimatedCost: number;
  tags: string[];
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
  metadata: {
    industry: string[];
    useCase: string;
    scalability: string;
    performance: string;
    dataFlow: string;
    securityLevel: string;
  };
}

export const orchestrationTemplates: OrchestrationTemplate[] = [
  {
    id: 'ecommerce_complete',
    name: 'Complete E-Commerce Platform',
    description: 'Full-featured e-commerce platform with AI recommendations, fraud detection, and global scaling',
    category: 'E-Commerce',
    icon: ShoppingCart,
    complexity: 'Expert',
    estimatedNodes: 25,
    estimatedCost: 2500,
    tags: ['e-commerce', 'ai', 'payments', 'fraud-detection', 'global-scale'],
    nodes: [
      { id: 'api_gateway', nodeType: 'api_gateway', position: { x: 100, y: 400 } },
      { id: 'auth_service', nodeType: 'auth_service', position: { x: 300, y: 200 } },
      { id: 'user_management', nodeType: 'user_management', position: { x: 300, y: 300 } },
      { id: 'product_catalog', nodeType: 'database', position: { x: 500, y: 200 } },
      { id: 'search_engine', nodeType: 'search_agent', position: { x: 500, y: 300 } },
      { id: 'recommendation_ai', nodeType: 'predictive_analytics', position: { x: 500, y: 400 } },
      { id: 'shopping_cart', nodeType: 'cache_layer', position: { x: 700, y: 250 } },
      { id: 'inventory_system', nodeType: 'inventory_system', position: { x: 700, y: 350 } },
      { id: 'fraud_detection', nodeType: 'fraud_detection_system', position: { x: 900, y: 200 } },
      { id: 'payment_gateway', nodeType: 'payment_gateway', position: { x: 900, y: 300 } },
      { id: 'order_management', nodeType: 'order_management', position: { x: 900, y: 400 } },
      { id: 'logistics_hub', nodeType: 'logistics_hub', position: { x: 1100, y: 300 } },
      { id: 'notification_service', nodeType: 'notification', position: { x: 1100, y: 400 } },
      { id: 'analytics_engine', nodeType: 'analytics_engine', position: { x: 1300, y: 300 } },
      { id: 'customer_support_ai', nodeType: 'research_agent', position: { x: 1300, y: 400 } }
    ],
    connections: [
      { sourceId: 'api_gateway', targetId: 'auth_service', type: 'api_call' },
      { sourceId: 'api_gateway', targetId: 'user_management', type: 'api_call' },
      { sourceId: 'auth_service', targetId: 'product_catalog', type: 'data_flow' },
      { sourceId: 'product_catalog', targetId: 'search_engine', type: 'data_flow' },
      { sourceId: 'search_engine', targetId: 'recommendation_ai', type: 'data_flow' },
      { sourceId: 'recommendation_ai', targetId: 'shopping_cart', type: 'api_call' },
      { sourceId: 'shopping_cart', targetId: 'inventory_system', type: 'data_flow' },
      { sourceId: 'inventory_system', targetId: 'fraud_detection', type: 'data_flow' },
      { sourceId: 'fraud_detection', targetId: 'payment_gateway', type: 'control_flow' },
      { sourceId: 'payment_gateway', targetId: 'order_management', type: 'event_stream' },
      { sourceId: 'order_management', targetId: 'logistics_hub', type: 'webhook' },
      { sourceId: 'logistics_hub', targetId: 'notification_service', type: 'event_stream' },
      { sourceId: 'notification_service', targetId: 'analytics_engine', type: 'data_flow' },
      { sourceId: 'analytics_engine', targetId: 'customer_support_ai', type: 'feedback_loop' }
    ],
    metadata: {
      industry: ['Retail', 'E-commerce', 'Technology'],
      useCase: 'Global E-commerce Platform',
      scalability: 'Global',
      performance: 'High-throughput',
      dataFlow: 'Event-driven',
      securityLevel: 'Enterprise'
    }
  },

  {
    id: 'autonomous_ai_research',
    name: 'Autonomous AI Research System',
    description: 'Self-improving AI system that conducts research, writes code, and deploys applications',
    category: 'AI Research',
    icon: Brain,
    complexity: 'Expert',
    estimatedNodes: 30,
    estimatedCost: 5000,
    tags: ['ai', 'autonomous', 'research', 'self-improving', 'ml-ops'],
    nodes: [
      { id: 'master_ai_orchestrator', nodeType: 'ai_orchestrator', position: { x: 600, y: 400 } },
      { id: 'research_coordinator', nodeType: 'workflow_orchestrator', position: { x: 300, y: 200 } },
      { id: 'web_research_swarm', nodeType: 'research_agent', position: { x: 100, y: 150 } },
      { id: 'paper_analysis_agent', nodeType: 'code_agent', position: { x: 100, y: 250 } },
      { id: 'trend_detector', nodeType: 'predictive_analytics', position: { x: 100, y: 350 } },
      { id: 'knowledge_synthesizer', nodeType: 'knowledge_graph', position: { x: 300, y: 300 } },
      { id: 'hypothesis_generator', nodeType: 'code_agent', position: { x: 500, y: 150 } },
      { id: 'experiment_designer', nodeType: 'testing_agent', position: { x: 500, y: 250 } },
      { id: 'code_generation_farm', nodeType: 'generation_farm', position: { x: 900, y: 200 } },
      { id: 'automated_testing_hub', nodeType: 'testing_hub', position: { x: 900, y: 300 } },
      { id: 'performance_evaluator', nodeType: 'performance_analyzer', position: { x: 900, y: 400 } },
      { id: 'deployment_orchestrator', nodeType: 'deployment_orchestrator', position: { x: 1100, y: 250 } },
      { id: 'improvement_engine', nodeType: 'improvement_engine', position: { x: 1100, y: 350 } },
      { id: 'knowledge_updater', nodeType: 'knowledge_updater', position: { x: 1100, y: 450 } },
      { id: 'success_metrics_analyzer', nodeType: 'analytics_engine', position: { x: 600, y: 600 } }
    ],
    connections: [
      { sourceId: 'master_ai_orchestrator', targetId: 'research_coordinator', type: 'orchestration' },
      { sourceId: 'research_coordinator', targetId: 'web_research_swarm', type: 'orchestration' },
      { sourceId: 'research_coordinator', targetId: 'paper_analysis_agent', type: 'orchestration' },
      { sourceId: 'research_coordinator', targetId: 'trend_detector', type: 'orchestration' },
      { sourceId: 'web_research_swarm', targetId: 'knowledge_synthesizer', type: 'data_flow' },
      { sourceId: 'paper_analysis_agent', targetId: 'knowledge_synthesizer', type: 'data_flow' },
      { sourceId: 'trend_detector', targetId: 'knowledge_synthesizer', type: 'data_flow' },
      { sourceId: 'knowledge_synthesizer', targetId: 'hypothesis_generator', type: 'data_flow' },
      { sourceId: 'hypothesis_generator', targetId: 'experiment_designer', type: 'data_flow' },
      { sourceId: 'experiment_designer', targetId: 'code_generation_farm', type: 'control_flow' },
      { sourceId: 'code_generation_farm', targetId: 'automated_testing_hub', type: 'data_flow' },
      { sourceId: 'automated_testing_hub', targetId: 'performance_evaluator', type: 'data_flow' },
      { sourceId: 'performance_evaluator', targetId: 'deployment_orchestrator', type: 'control_flow' },
      { sourceId: 'deployment_orchestrator', targetId: 'improvement_engine', type: 'feedback_loop' },
      { sourceId: 'improvement_engine', targetId: 'knowledge_updater', type: 'data_flow' },
      { sourceId: 'knowledge_updater', targetId: 'master_ai_orchestrator', type: 'feedback_loop' },
      { sourceId: 'deployment_orchestrator', targetId: 'success_metrics_analyzer', type: 'webhook' },
      { sourceId: 'success_metrics_analyzer', targetId: 'master_ai_orchestrator', type: 'feedback_loop' }
    ],
    metadata: {
      industry: ['AI Research', 'Technology', 'Academia'],
      useCase: 'Autonomous AI Development',
      scalability: 'Self-scaling',
      performance: 'Continuous Learning',
      dataFlow: 'Feedback-driven',
      securityLevel: 'High'
    }
  },

  {
    id: 'smart_city_iot',
    name: 'Smart City IoT Management',
    description: 'Comprehensive IoT-based city management with predictive analytics and citizen services',
    category: 'Smart City',
    icon: Building,
    complexity: 'Expert',
    estimatedNodes: 28,
    estimatedCost: 4200,
    tags: ['iot', 'smart-city', 'analytics', 'predictive', 'government'],
    nodes: [
      { id: 'city_data_hub', nodeType: 'data_lake', position: { x: 600, y: 400 } },
      { id: 'iot_gateway_cluster', nodeType: 'api_gateway', position: { x: 200, y: 300 } },
      { id: 'edge_processing_network', nodeType: 'edge_computing_network', position: { x: 400, y: 200 } },
      { id: 'traffic_sensors', nodeType: 'data_input', position: { x: 100, y: 150 } },
      { id: 'air_quality_monitors', nodeType: 'data_input', position: { x: 100, y: 250 } },
      { id: 'energy_meters', nodeType: 'data_input', position: { x: 100, y: 350 } },
      { id: 'security_cameras', nodeType: 'data_input', position: { x: 100, y: 450 } },
      { id: 'traffic_ai_optimizer', nodeType: 'optimization_agent', position: { x: 800, y: 150 } },
      { id: 'environmental_predictor', nodeType: 'predictive_analytics', position: { x: 800, y: 250 } },
      { id: 'energy_efficiency_engine', nodeType: 'optimization_agent', position: { x: 800, y: 350 } },
      { id: 'security_threat_detector', nodeType: 'threat_intelligence', position: { x: 800, y: 450 } },
      { id: 'emergency_response_system', nodeType: 'workflow_orchestrator', position: { x: 1000, y: 200 } },
      { id: 'citizen_service_portal', nodeType: 'customer_journey_engine', position: { x: 1000, y: 350 } },
      { id: 'city_dashboard', nodeType: 'analytics_engine', position: { x: 1200, y: 300 } },
      { id: 'public_notification_system', nodeType: 'notification', position: { x: 1200, y: 400 } }
    ],
    connections: [
      { sourceId: 'traffic_sensors', targetId: 'iot_gateway_cluster', type: 'data_flow' },
      { sourceId: 'air_quality_monitors', targetId: 'iot_gateway_cluster', type: 'data_flow' },
      { sourceId: 'energy_meters', targetId: 'iot_gateway_cluster', type: 'data_flow' },
      { sourceId: 'security_cameras', targetId: 'iot_gateway_cluster', type: 'data_flow' },
      { sourceId: 'iot_gateway_cluster', targetId: 'edge_processing_network', type: 'event_stream' },
      { sourceId: 'edge_processing_network', targetId: 'city_data_hub', type: 'data_flow' },
      { sourceId: 'city_data_hub', targetId: 'traffic_ai_optimizer', type: 'data_flow' },
      { sourceId: 'city_data_hub', targetId: 'environmental_predictor', type: 'data_flow' },
      { sourceId: 'city_data_hub', targetId: 'energy_efficiency_engine', type: 'data_flow' },
      { sourceId: 'city_data_hub', targetId: 'security_threat_detector', type: 'data_flow' },
      { sourceId: 'traffic_ai_optimizer', targetId: 'emergency_response_system', type: 'webhook' },
      { sourceId: 'security_threat_detector', targetId: 'emergency_response_system', type: 'webhook' },
      { sourceId: 'environmental_predictor', targetId: 'citizen_service_portal', type: 'api_call' },
      { sourceId: 'energy_efficiency_engine', targetId: 'city_dashboard', type: 'data_flow' },
      { sourceId: 'emergency_response_system', targetId: 'public_notification_system', type: 'webhook' },
      { sourceId: 'citizen_service_portal', targetId: 'city_dashboard', type: 'data_flow' }
    ],
    metadata: {
      industry: ['Government', 'Urban Planning', 'IoT', 'Public Safety'],
      useCase: 'Smart City Management',
      scalability: 'City-wide',
      performance: 'Real-time Analytics',
      dataFlow: 'Event-driven',
      securityLevel: 'Government-grade'
    }
  },

  {
    id: 'fintech_trading_platform',
    name: 'High-Frequency Trading Platform',
    description: 'Advanced trading platform with AI strategies, risk management, and regulatory compliance',
    category: 'FinTech',
    icon: BarChart3,
    complexity: 'Expert',
    estimatedNodes: 32,
    estimatedCost: 6000,
    tags: ['fintech', 'trading', 'ai-strategies', 'risk-management', 'compliance'],
    nodes: [
      { id: 'trading_engine_core', nodeType: 'stream_processor', position: { x: 600, y: 400 } },
      { id: 'market_data_aggregator', nodeType: 'data_input', position: { x: 200, y: 200 } },
      { id: 'news_sentiment_analyzer', nodeType: 'research_agent', position: { x: 200, y: 300 } },
      { id: 'alternative_data_processor', nodeType: 'transformer', position: { x: 200, y: 400 } },
      { id: 'ai_strategy_engine', nodeType: 'predictive_analytics', position: { x: 400, y: 250 } },
      { id: 'risk_assessment_system', nodeType: 'fraud_detection_system', position: { x: 400, y: 350 } },
      { id: 'portfolio_optimizer', nodeType: 'optimization_agent', position: { x: 400, y: 450 } },
      { id: 'order_execution_engine', nodeType: 'parallel_executor', position: { x: 800, y: 300 } },
      { id: 'liquidity_aggregator', nodeType: 'merge_hub', position: { x: 800, y: 400 } },
      { id: 'compliance_monitor', nodeType: 'compliance_monitor', position: { x: 1000, y: 200 } },
      { id: 'trade_surveillance', nodeType: 'audit_agent', position: { x: 1000, y: 300 } },
      { id: 'performance_analytics', nodeType: 'analytics_engine', position: { x: 1000, y: 400 } },
      { id: 'client_reporting', nodeType: 'notification', position: { x: 1200, y: 300 } },
      { id: 'regulatory_reporting', nodeType: 'notification', position: { x: 1200, y: 400 } }
    ],
    connections: [
      { sourceId: 'market_data_aggregator', targetId: 'ai_strategy_engine', type: 'real_time' },
      { sourceId: 'news_sentiment_analyzer', targetId: 'ai_strategy_engine', type: 'data_flow' },
      { sourceId: 'alternative_data_processor', targetId: 'risk_assessment_system', type: 'data_flow' },
      { sourceId: 'ai_strategy_engine', targetId: 'trading_engine_core', type: 'control_flow' },
      { sourceId: 'risk_assessment_system', targetId: 'trading_engine_core', type: 'control_flow' },
      { sourceId: 'portfolio_optimizer', targetId: 'trading_engine_core', type: 'control_flow' },
      { sourceId: 'trading_engine_core', targetId: 'order_execution_engine', type: 'real_time' },
      { sourceId: 'trading_engine_core', targetId: 'liquidity_aggregator', type: 'real_time' },
      { sourceId: 'order_execution_engine', targetId: 'compliance_monitor', type: 'webhook' },
      { sourceId: 'liquidity_aggregator', targetId: 'trade_surveillance', type: 'data_flow' },
      { sourceId: 'trade_surveillance', targetId: 'performance_analytics', type: 'data_flow' },
      { sourceId: 'compliance_monitor', targetId: 'regulatory_reporting', type: 'webhook' },
      { sourceId: 'performance_analytics', targetId: 'client_reporting', type: 'data_flow' },
      { sourceId: 'performance_analytics', targetId: 'portfolio_optimizer', type: 'feedback_loop' }
    ],
    metadata: {
      industry: ['Financial Services', 'Trading', 'Investment Management'],
      useCase: 'Algorithmic Trading Platform',
      scalability: 'Global Markets',
      performance: 'Microsecond Latency',
      dataFlow: 'Ultra-low Latency',
      securityLevel: 'Financial-grade'
    }
  },

  {
    id: 'manufacturing_industry_4',
    name: 'Industry 4.0 Manufacturing',
    description: 'Smart manufacturing platform with IoT, predictive maintenance, and quality control',
    category: 'Manufacturing',
    icon: Factory,
    complexity: 'Advanced',
    estimatedNodes: 24,
    estimatedCost: 3200,
    tags: ['manufacturing', 'industry-4.0', 'iot', 'predictive-maintenance', 'quality-control'],
    nodes: [
      { id: 'manufacturing_control_system', nodeType: 'workflow_orchestrator', position: { x: 600, y: 400 } },
      { id: 'sensor_network_hub', nodeType: 'iot_gateway_cluster', position: { x: 200, y: 300 } },
      { id: 'production_line_monitors', nodeType: 'data_input', position: { x: 100, y: 200 } },
      { id: 'quality_inspection_cameras', nodeType: 'image_processor', position: { x: 100, y: 300 } },
      { id: 'environmental_sensors', nodeType: 'data_input', position: { x: 100, y: 400 } },
      { id: 'predictive_maintenance_ai', nodeType: 'predictive_analytics', position: { x: 400, y: 250 } },
      { id: 'quality_control_ai', nodeType: 'audit_agent', position: { x: 400, y: 350 } },
      { id: 'production_optimizer', nodeType: 'optimization_agent', position: { x: 400, y: 450 } },
      { id: 'inventory_management', nodeType: 'inventory_system', position: { x: 800, y: 200 } },
      { id: 'supply_chain_coordinator', nodeType: 'supply_chain_orchestrator', position: { x: 800, y: 300 } },
      { id: 'maintenance_scheduler', nodeType: 'scheduler', position: { x: 800, y: 400 } },
      { id: 'production_dashboard', nodeType: 'analytics_engine', position: { x: 1000, y: 300 } },
      { id: 'alert_system', nodeType: 'notification', position: { x: 1000, y: 400 } }
    ],
    connections: [
      { sourceId: 'production_line_monitors', targetId: 'sensor_network_hub', type: 'data_flow' },
      { sourceId: 'quality_inspection_cameras', targetId: 'sensor_network_hub', type: 'data_flow' },
      { sourceId: 'environmental_sensors', targetId: 'sensor_network_hub', type: 'data_flow' },
      { sourceId: 'sensor_network_hub', targetId: 'predictive_maintenance_ai', type: 'event_stream' },
      { sourceId: 'sensor_network_hub', targetId: 'quality_control_ai', type: 'event_stream' },
      { sourceId: 'sensor_network_hub', targetId: 'production_optimizer', type: 'event_stream' },
      { sourceId: 'predictive_maintenance_ai', targetId: 'manufacturing_control_system', type: 'control_flow' },
      { sourceId: 'quality_control_ai', targetId: 'manufacturing_control_system', type: 'control_flow' },
      { sourceId: 'production_optimizer', targetId: 'manufacturing_control_system', type: 'control_flow' },
      { sourceId: 'manufacturing_control_system', targetId: 'inventory_management', type: 'orchestration' },
      { sourceId: 'manufacturing_control_system', targetId: 'supply_chain_coordinator', type: 'orchestration' },
      { sourceId: 'predictive_maintenance_ai', targetId: 'maintenance_scheduler', type: 'webhook' },
      { sourceId: 'manufacturing_control_system', targetId: 'production_dashboard', type: 'data_flow' },
      { sourceId: 'production_dashboard', targetId: 'alert_system', type: 'webhook' }
    ],
    metadata: {
      industry: ['Manufacturing', 'Automotive', 'Aerospace', 'Electronics'],
      useCase: 'Smart Manufacturing',
      scalability: 'Enterprise',
      performance: 'Real-time Control',
      dataFlow: 'IoT-driven',
      securityLevel: 'Industrial'
    }
  },

  {
    id: 'cybersecurity_soc',
    name: 'Security Operations Center',
    description: 'Advanced SOC with threat hunting, incident response, and automated defense',
    category: 'Cybersecurity',
    icon: Shield,
    complexity: 'Expert',
    estimatedNodes: 26,
    estimatedCost: 4500,
    tags: ['cybersecurity', 'soc', 'threat-hunting', 'incident-response', 'ai-defense'],
    nodes: [
      { id: 'soc_orchestration_hub', nodeType: 'security_operations_center', position: { x: 600, y: 400 } },
      { id: 'network_traffic_analyzer', nodeType: 'data_input', position: { x: 200, y: 200 } },
      { id: 'endpoint_telemetry', nodeType: 'data_input', position: { x: 200, y: 300 } },
      { id: 'log_aggregation_system', nodeType: 'log_aggregator', position: { x: 200, y: 400 } },
      { id: 'threat_intelligence_feeds', nodeType: 'data_input', position: { x: 200, y: 500 } },
      { id: 'ai_threat_detector', nodeType: 'threat_intelligence', position: { x: 400, y: 250 } },
      { id: 'behavioral_analytics', nodeType: 'fraud_detection_system', position: { x: 400, y: 350 } },
      { id: 'vulnerability_scanner', nodeType: 'security_scanner', position: { x: 400, y: 450 } },
      { id: 'incident_response_engine', nodeType: 'workflow_orchestrator', position: { x: 800, y: 200 } },
      { id: 'automated_response_system', nodeType: 'parallel_executor', position: { x: 800, y: 300 } },
      { id: 'forensics_analyzer', nodeType: 'audit_agent', position: { x: 800, y: 400 } },
      { id: 'threat_hunting_platform', nodeType: 'research_agent', position: { x: 1000, y: 250 } },
      { id: 'security_dashboard', nodeType: 'analytics_engine', position: { x: 1000, y: 350 } },
      { id: 'alert_management', nodeType: 'notification', position: { x: 1000, y: 450 } }
    ],
    connections: [
      { sourceId: 'network_traffic_analyzer', targetId: 'ai_threat_detector', type: 'real_time' },
      { sourceId: 'endpoint_telemetry', targetId: 'behavioral_analytics', type: 'real_time' },
      { sourceId: 'log_aggregation_system', targetId: 'ai_threat_detector', type: 'data_flow' },
      { sourceId: 'threat_intelligence_feeds', targetId: 'vulnerability_scanner', type: 'data_flow' },
      { sourceId: 'ai_threat_detector', targetId: 'soc_orchestration_hub', type: 'webhook' },
      { sourceId: 'behavioral_analytics', targetId: 'soc_orchestration_hub', type: 'webhook' },
      { sourceId: 'vulnerability_scanner', targetId: 'soc_orchestration_hub', type: 'webhook' },
      { sourceId: 'soc_orchestration_hub', targetId: 'incident_response_engine', type: 'orchestration' },
      { sourceId: 'incident_response_engine', targetId: 'automated_response_system', type: 'control_flow' },
      { sourceId: 'incident_response_engine', targetId: 'forensics_analyzer', type: 'orchestration' },
      { sourceId: 'automated_response_system', targetId: 'threat_hunting_platform', type: 'feedback_loop' },
      { sourceId: 'forensics_analyzer', targetId: 'security_dashboard', type: 'data_flow' },
      { sourceId: 'threat_hunting_platform', targetId: 'security_dashboard', type: 'data_flow' },
      { sourceId: 'security_dashboard', targetId: 'alert_management', type: 'webhook' }
    ],
    metadata: {
      industry: ['Cybersecurity', 'Financial Services', 'Government', 'Healthcare'],
      useCase: 'Enterprise Security Operations',
      scalability: 'Global Enterprise',
      performance: 'Real-time Threat Detection',
      dataFlow: 'Security Event-driven',
      securityLevel: 'Military-grade'
    }
  },

  {
    id: 'devops_cicd_platform',
    name: 'Enterprise DevOps Platform',
    description: 'Complete DevOps platform with CI/CD, infrastructure as code, and monitoring',
    category: 'DevOps',
    icon: Rocket,
    complexity: 'Advanced',
    estimatedNodes: 22,
    estimatedCost: 2800,
    tags: ['devops', 'ci-cd', 'infrastructure-as-code', 'monitoring', 'automation'],
    nodes: [
      { id: 'devops_orchestrator', nodeType: 'devops_agent', position: { x: 600, y: 400 } },
      { id: 'source_code_repository', nodeType: 'git_service', position: { x: 200, y: 300 } },
      { id: 'ci_pipeline_engine', nodeType: 'ci_cd_orchestrator', position: { x: 400, y: 250 } },
      { id: 'automated_testing_farm', nodeType: 'testing_hub', position: { x: 400, y: 350 } },
      { id: 'security_scanning', nodeType: 'security_scanner', position: { x: 400, y: 450 } },
      { id: 'artifact_registry', nodeType: 'container_registry', position: { x: 600, y: 200 } },
      { id: 'infrastructure_provisioner', nodeType: 'infrastructure_provisioner', position: { x: 800, y: 250 } },
      { id: 'deployment_engine', nodeType: 'deployment_system', position: { x: 800, y: 350 } },
      { id: 'monitoring_system', nodeType: 'monitoring', position: { x: 1000, y: 200 } },
      { id: 'log_analytics', nodeType: 'log_aggregator', position: { x: 1000, y: 300 } },
      { id: 'performance_metrics', nodeType: 'performance_profiler', position: { x: 1000, y: 400 } },
      { id: 'alert_system', nodeType: 'alerting', position: { x: 1200, y: 300 } }
    ],
    connections: [
      { sourceId: 'source_code_repository', targetId: 'ci_pipeline_engine', type: 'webhook' },
      { sourceId: 'ci_pipeline_engine', targetId: 'automated_testing_farm', type: 'orchestration' },
      { sourceId: 'ci_pipeline_engine', targetId: 'security_scanning', type: 'orchestration' },
      { sourceId: 'automated_testing_farm', targetId: 'devops_orchestrator', type: 'control_flow' },
      { sourceId: 'security_scanning', targetId: 'devops_orchestrator', type: 'control_flow' },
      { sourceId: 'devops_orchestrator', targetId: 'artifact_registry', type: 'data_flow' },
      { sourceId: 'artifact_registry', targetId: 'infrastructure_provisioner', type: 'dependency' },
      { sourceId: 'infrastructure_provisioner', targetId: 'deployment_engine', type: 'orchestration' },
      { sourceId: 'deployment_engine', targetId: 'monitoring_system', type: 'webhook' },
      { sourceId: 'monitoring_system', targetId: 'log_analytics', type: 'data_flow' },
      { sourceId: 'log_analytics', targetId: 'performance_metrics', type: 'data_flow' },
      { sourceId: 'performance_metrics', targetId: 'alert_system', type: 'webhook' },
      { sourceId: 'alert_system', targetId: 'devops_orchestrator', type: 'feedback_loop' }
    ],
    metadata: {
      industry: ['Technology', 'Software Development', 'SaaS'],
      useCase: 'Enterprise Software Delivery',
      scalability: 'Multi-cloud',
      performance: 'Continuous Deployment',
      dataFlow: 'Pipeline-driven',
      securityLevel: 'DevSecOps'
    }
  },

  {
    id: 'collaboration_workspace',
    name: 'Collaborative Workspace Platform',
    description: 'Real-time collaboration platform with multiplayer editing and team coordination',
    category: 'Collaboration',
    icon: Users,
    complexity: 'Advanced',
    estimatedNodes: 20,
    estimatedCost: 2200,
    tags: ['collaboration', 'real-time', 'multiplayer', 'workspace', 'team-coordination'],
    nodes: [
      { id: 'collaboration_orchestrator', nodeType: 'collaboration_engine', position: { x: 600, y: 400 } },
      { id: 'realtime_sync_hub', nodeType: 'realtime_db', position: { x: 400, y: 300 } },
      { id: 'conflict_resolution', nodeType: 'merge_hub', position: { x: 400, y: 400 } },
      { id: 'presence_awareness', nodeType: 'cursor_system', position: { x: 400, y: 500 } },
      { id: 'document_editor', nodeType: 'document_editor', position: { x: 200, y: 250 } },
      { id: 'whiteboard_system', nodeType: 'whiteboard', position: { x: 200, y: 350 } },
      { id: 'video_conferencing', nodeType: 'voice_chat_system', position: { x: 200, y: 450 } },
      { id: 'file_sharing', nodeType: 'file_handler', position: { x: 800, y: 250 } },
      { id: 'task_management', nodeType: 'task_board', position: { x: 800, y: 350 } },
      { id: 'notification_hub', nodeType: 'notification', position: { x: 800, y: 450 } },
      { id: 'user_activity_tracker', nodeType: 'behavior_tracker', position: { x: 1000, y: 350 } }
    ],
    connections: [
      { sourceId: 'document_editor', targetId: 'realtime_sync_hub', type: 'real_time' },
      { sourceId: 'whiteboard_system', targetId: 'realtime_sync_hub', type: 'real_time' },
      { sourceId: 'video_conferencing', targetId: 'presence_awareness', type: 'real_time' },
      { sourceId: 'realtime_sync_hub', targetId: 'conflict_resolution', type: 'data_flow' },
      { sourceId: 'conflict_resolution', targetId: 'collaboration_orchestrator', type: 'control_flow' },
      { sourceId: 'presence_awareness', targetId: 'collaboration_orchestrator', type: 'event_stream' },
      { sourceId: 'collaboration_orchestrator', targetId: 'file_sharing', type: 'orchestration' },
      { sourceId: 'collaboration_orchestrator', targetId: 'task_management', type: 'orchestration' },
      { sourceId: 'task_management', targetId: 'notification_hub', type: 'webhook' },
      { sourceId: 'collaboration_orchestrator', targetId: 'user_activity_tracker', type: 'data_flow' },
      { sourceId: 'user_activity_tracker', targetId: 'notification_hub', type: 'feedback_loop' }
    ],
    metadata: {
      industry: ['Technology', 'Remote Work', 'Education', 'Creative'],
      useCase: 'Team Collaboration Platform',
      scalability: 'Global Teams',
      performance: 'Real-time Sync',
      dataFlow: 'Event-driven',
      securityLevel: 'Enterprise'
    }
  }
];

// Helper functions
export const getTemplatesByCategory = (category: string): OrchestrationTemplate[] => {
  return orchestrationTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string): OrchestrationTemplate | undefined => {
  return orchestrationTemplates.find(template => template.id === id);
};

export const getTemplatesByComplexity = (complexity: string): OrchestrationTemplate[] => {
  return orchestrationTemplates.filter(template => template.complexity === complexity);
};

export const getAllTemplateCategories = (): string[] => {
  return [...new Set(orchestrationTemplates.map(template => template.category))];
};

export const getTemplatesByTag = (tag: string): OrchestrationTemplate[] => {
  return orchestrationTemplates.filter(template => template.tags.includes(tag));
};

export const getAllTags = (): string[] => {
  const allTags = orchestrationTemplates.flatMap(template => template.tags);
  return [...new Set(allTags)].sort();
};