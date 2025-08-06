import {
  Workflow, Split, Merge, Share2, Repeat, RefreshCw, Eye, Zap,
  Network, Shield, Database, GitBranch, Clock, Target, Layers,
  Cpu, Activity, BarChart3, AlertTriangle, CheckCircle, Filter, Users
} from 'lucide-react';

export interface ArchitecturalPattern {
  id: string;
  name: string;
  description: string;
  category: 'Messaging' | 'Data' | 'Integration' | 'Resilience' | 'Security' | 'Performance';
  icon: any;
  complexity: 'Simple' | 'Moderate' | 'Complex' | 'Advanced';
  benefits: string[];
  tradeoffs: string[];
  useCase: string;
  implementation: {
    nodes: string[];
    connections: string[];
    keyComponents: string[];
  };
  examples: string[];
  relatedPatterns: string[];
}

export const architecturalPatterns: ArchitecturalPattern[] = [
  {
    id: 'saga_pattern',
    name: 'SAGA Pattern',
    description: 'Manage distributed transactions using a sequence of local transactions with compensating actions',
    category: 'Integration',
    icon: Workflow,
    complexity: 'Complex',
    benefits: [
      'Maintains data consistency across microservices',
      'Handles long-running transactions',
      'Provides rollback capabilities',
      'Decouples services while ensuring atomicity'
    ],
    tradeoffs: [
      'Complexity in orchestration logic',
      'Eventual consistency model',
      'Requires careful error handling',
      'Potential for partial failures'
    ],
    useCase: 'E-commerce order processing across multiple services (payment, inventory, shipping)',
    implementation: {
      nodes: ['workflow_orchestrator', 'decision_gate', 'rollback_system', 'audit_agent'],
      connections: ['orchestration', 'control_flow', 'feedback_loop'],
      keyComponents: ['Saga Orchestrator', 'Compensation Handlers', 'Transaction Log']
    },
    examples: [
      'Order processing in e-commerce',
      'Travel booking systems',
      'Financial transaction processing',
      'Supply chain coordination'
    ],
    relatedPatterns: ['choreography_pattern', 'two_phase_commit', 'event_sourcing']
  },

  {
    id: 'fan_out_fan_in',
    name: 'Fan-out/Fan-in Pattern',
    description: 'Distribute work to multiple parallel processors and aggregate results back',
    category: 'Performance',
    icon: Share2,
    complexity: 'Moderate',
    benefits: [
      'Parallel processing capabilities',
      'Improved throughput and performance',
      'Scalable workload distribution',
      'Fault isolation between workers'
    ],
    tradeoffs: [
      'Complexity in result aggregation',
      'Potential for uneven load distribution',
      'Synchronization overhead',
      'Memory usage for result collection'
    ],
    useCase: 'Parallel data processing, image/video analysis, batch job execution',
    implementation: {
      nodes: ['parallel_executor', 'merge_hub', 'data_filter', 'load_balancer'],
      connections: ['data_flow', 'load_balance', 'orchestration'],
      keyComponents: ['Work Distributor', 'Worker Pool', 'Result Aggregator']
    },
    examples: [
      'MapReduce operations',
      'Parallel image processing',
      'Distributed calculations',
      'Multi-model AI inference'
    ],
    relatedPatterns: ['scatter_gather', 'pipeline_pattern', 'worker_pool']
  },

  {
    id: 'strangler_fig_pattern',
    name: 'Strangler Fig Pattern',
    description: 'Gradually replace a legacy system by incrementally replacing specific pieces of functionality',
    category: 'Integration',
    icon: RefreshCw,
    complexity: 'Advanced',
    benefits: [
      'Gradual system modernization',
      'Reduced risk during migration',
      'Continuous operation during transition',
      'Incremental validation of new functionality'
    ],
    tradeoffs: [
      'Extended migration timeline',
      'Complexity of dual system management',
      'Data synchronization challenges',
      'Potential for feature parity issues'
    ],
    useCase: 'Legacy system modernization, monolith to microservices migration',
    implementation: {
      nodes: ['api_gateway', 'decision_gate', 'transformer', 'sync_engine'],
      connections: ['api_call', 'control_flow', 'data_flow'],
      keyComponents: ['Routing Layer', 'Legacy Adapter', 'New Service Implementation']
    },
    examples: [
      'Monolith decomposition',
      'Database migration',
      'API modernization',
      'UI framework migration'
    ],
    relatedPatterns: ['facade_pattern', 'adapter_pattern', 'proxy_pattern']
  },

  {
    id: 'circuit_breaker',
    name: 'Circuit Breaker Pattern',
    description: 'Prevent cascading failures by monitoring and isolating failing services',
    category: 'Resilience',
    icon: Shield,
    complexity: 'Moderate',
    benefits: [
      'Prevents cascading failures',
      'Fast failure response',
      'Automatic recovery detection',
      'System stability maintenance'
    ],
    tradeoffs: [
      'Added complexity in failure handling',
      'Configuration of thresholds',
      'Potential for false positives',
      'Recovery time considerations'
    ],
    useCase: 'Microservices communication, external API integration, database connections',
    implementation: {
      nodes: ['condition_checker', 'decision_gate', 'monitor', 'alerting'],
      connections: ['control_flow', 'webhook', 'feedback_loop'],
      keyComponents: ['Failure Detector', 'State Manager', 'Recovery Monitor']
    },
    examples: [
      'API gateway protection',
      'Database connection pooling',
      'External service calls',
      'Payment processing systems'
    ],
    relatedPatterns: ['bulkhead_pattern', 'timeout_pattern', 'retry_pattern']
  },

  {
    id: 'event_sourcing',
    name: 'Event Sourcing Pattern',
    description: 'Store all changes to application state as a sequence of immutable events',
    category: 'Data',
    icon: Database,
    complexity: 'Advanced',
    benefits: [
      'Complete audit trail',
      'Ability to reconstruct any past state',
      'Natural event-driven architecture',
      'Temporal queries and analytics'
    ],
    tradeoffs: [
      'Storage overhead for events',
      'Complexity in event schema evolution',
      'Eventual consistency challenges',
      'Query complexity for current state'
    ],
    useCase: 'Financial systems, audit requirements, collaborative applications',
    implementation: {
      nodes: ['event_stream', 'data_lake', 'stream_processor', 'knowledge_graph'],
      connections: ['event_stream', 'data_flow', 'replication'],
      keyComponents: ['Event Store', 'Event Publisher', 'State Projections']
    },
    examples: [
      'Banking transaction logs',
      'Version control systems',
      'Collaborative document editing',
      'Gaming state management'
    ],
    relatedPatterns: ['cqrs_pattern', 'saga_pattern', 'snapshot_pattern']
  },

  {
    id: 'cqrs_pattern',
    name: 'CQRS (Command Query Responsibility Segregation)',
    description: 'Separate read and write operations using different models and potentially different databases',
    category: 'Data',
    icon: Split,
    complexity: 'Complex',
    benefits: [
      'Optimized read and write operations',
      'Independent scaling of reads and writes',
      'Simplified queries with read models',
      'Better performance for complex domains'
    ],
    tradeoffs: [
      'Increased complexity',
      'Eventual consistency between models',
      'Code duplication potential',
      'Synchronization overhead'
    ],
    useCase: 'High-traffic applications, complex business domains, reporting systems',
    implementation: {
      nodes: ['decision_gate', 'database', 'cache_layer', 'sync_engine'],
      connections: ['control_flow', 'data_flow', 'replication'],
      keyComponents: ['Command Handlers', 'Query Handlers', 'Read Models']
    },
    examples: [
      'E-commerce platforms',
      'Financial trading systems',
      'Social media platforms',
      'Content management systems'
    ],
    relatedPatterns: ['event_sourcing', 'materialized_view', 'read_replica']
  },

  {
    id: 'bulkhead_pattern',
    name: 'Bulkhead Pattern',
    description: 'Isolate critical resources to prevent failures from spreading across the system',
    category: 'Resilience',
    icon: Shield,
    complexity: 'Moderate',
    benefits: [
      'Failure isolation',
      'Resource protection',
      'Independent scaling',
      'Improved system reliability'
    ],
    tradeoffs: [
      'Resource overhead',
      'Increased infrastructure complexity',
      'Potential resource underutilization',
      'Management complexity'
    ],
    useCase: 'Multi-tenant systems, resource-intensive operations, critical service isolation',
    implementation: {
      nodes: ['resource_allocator', 'container_cluster', 'load_balancer', 'monitor'],
      connections: ['orchestration', 'load_balance', 'dependency'],
      keyComponents: ['Resource Pools', 'Isolation Boundaries', 'Resource Monitors']
    },
    examples: [
      'Thread pool isolation',
      'Database connection pools',
      'CPU/Memory partitioning',
      'Network bandwidth allocation'
    ],
    relatedPatterns: ['circuit_breaker', 'throttling_pattern', 'isolation_pattern']
  },

  {
    id: 'pipeline_pattern',
    name: 'Pipeline Pattern',
    description: 'Process data through a series of processing stages in a linear fashion',
    category: 'Data',
    icon: Workflow,
    complexity: 'Simple',
    benefits: [
      'Clear separation of concerns',
      'Reusable processing stages',
      'Easy to understand and maintain',
      'Parallel processing opportunities'
    ],
    tradeoffs: [
      'Linear processing constraints',
      'Potential bottlenecks at stages',
      'Error handling complexity',
      'State management between stages'
    ],
    useCase: 'Data transformation, image processing, compilation, ETL operations',
    implementation: {
      nodes: ['data_pipeline', 'transformer', 'data_filter', 'condition_checker'],
      connections: ['data_flow', 'control_flow', 'orchestration'],
      keyComponents: ['Pipeline Stages', 'Data Connectors', 'Error Handlers']
    },
    examples: [
      'CI/CD pipelines',
      'Data ETL processes',
      'Image processing workflows',
      'Compiler design'
    ],
    relatedPatterns: ['chain_of_responsibility', 'decorator_pattern', 'filter_pattern']
  },

  {
    id: 'scatter_gather',
    name: 'Scatter-Gather Pattern',
    description: 'Send a request to multiple recipients and aggregate their responses',
    category: 'Integration',
    icon: Share2,
    complexity: 'Moderate',
    benefits: [
      'Parallel request processing',
      'Improved response times',
      'Fault tolerance through redundancy',
      'Load distribution'
    ],
    tradeoffs: [
      'Complexity in response aggregation',
      'Handling partial responses',
      'Timeout management',
      'Resource overhead'
    ],
    useCase: 'Price comparison, search aggregation, distributed queries',
    implementation: {
      nodes: ['parallel_executor', 'merge_hub', 'condition_checker', 'timer'],
      connections: ['data_flow', 'orchestration', 'control_flow'],
      keyComponents: ['Request Broadcaster', 'Response Aggregator', 'Timeout Handler']
    },
    examples: [
      'Price comparison engines',
      'Search result aggregation',
      'Distributed database queries',
      'Multi-provider API calls'
    ],
    relatedPatterns: ['fan_out_fan_in', 'aggregator_pattern', 'timeout_pattern']
  },

  {
    id: 'choreography_pattern',
    name: 'Choreography Pattern',
    description: 'Coordinate distributed services through event-driven communication without central orchestration',
    category: 'Integration',
    icon: Network,
    complexity: 'Complex',
    benefits: [
      'Decentralized coordination',
      'High autonomy for services',
      'Natural event-driven architecture',
      'Reduced single points of failure'
    ],
    tradeoffs: [
      'Complex interaction patterns',
      'Difficult to track overall flow',
      'Debugging and monitoring challenges',
      'Potential for event cycles'
    ],
    useCase: 'Microservices coordination, event-driven architectures, loose coupling scenarios',
    implementation: {
      nodes: ['event_stream', 'message_queue', 'workflow_orchestrator', 'audit_agent'],
      connections: ['event_stream', 'message_queue', 'webhook'],
      keyComponents: ['Event Publishers', 'Event Subscribers', 'Event Store']
    },
    examples: [
      'Order fulfillment processes',
      'User registration workflows',
      'Content publishing pipelines',
      'IoT device coordination'
    ],
    relatedPatterns: ['saga_pattern', 'event_sourcing', 'publish_subscribe']
  },

  {
    id: 'competing_consumers',
    name: 'Competing Consumers Pattern',
    description: 'Multiple consumers process messages from a shared queue to improve throughput and reliability',
    category: 'Performance',
    icon: Users,
    complexity: 'Moderate',
    benefits: [
      'Improved throughput',
      'Load distribution',
      'Fault tolerance',
      'Scalable processing'
    ],
    tradeoffs: [
      'Message ordering challenges',
      'Consumer coordination complexity',
      'Potential for duplicate processing',
      'Resource contention'
    ],
    useCase: 'Message processing, task queues, batch job processing',
    implementation: {
      nodes: ['message_queue', 'parallel_executor', 'load_balancer', 'monitor'],
      connections: ['message_queue', 'load_balance', 'orchestration'],
      keyComponents: ['Message Queue', 'Consumer Pool', 'Load Balancer']
    },
    examples: [
      'Order processing systems',
      'Email sending services',
      'Image processing queues',
      'Background job processing'
    ],
    relatedPatterns: ['worker_pool', 'queue_based_load_leveling', 'priority_queue']
  },

  {
    id: 'retry_pattern',
    name: 'Retry Pattern',
    description: 'Automatically retry failed operations with configurable retry policies',
    category: 'Resilience',
    icon: RefreshCw,
    complexity: 'Simple',
    benefits: [
      'Improved reliability',
      'Transient failure handling',
      'Configurable retry strategies',
      'Automatic error recovery'
    ],
    tradeoffs: [
      'Potential for cascading failures',
      'Increased latency during retries',
      'Resource consumption',
      'Complexity in retry logic'
    ],
    useCase: 'Network communications, database operations, external API calls',
    implementation: {
      nodes: ['condition_checker', 'loop_controller', 'timer', 'alerting'],
      connections: ['control_flow', 'feedback_loop', 'webhook'],
      keyComponents: ['Retry Logic', 'Backoff Strategy', 'Failure Counter']
    },
    examples: [
      'HTTP request retries',
      'Database connection retries',
      'File upload operations',
      'Message delivery systems'
    ],
    relatedPatterns: ['circuit_breaker', 'timeout_pattern', 'exponential_backoff']
  },

  {
    id: 'cache_aside',
    name: 'Cache-Aside Pattern',
    description: 'Application manages cache directly, loading data on cache miss and updating cache on data changes',
    category: 'Performance',
    icon: Zap,
    complexity: 'Simple',
    benefits: [
      'Application control over caching',
      'Cache data on demand',
      'Flexibility in cache strategy',
      'Simple implementation'
    ],
    tradeoffs: [
      'Application complexity',
      'Cache consistency challenges',
      'Potential for cache stampede',
      'Error handling complexity'
    ],
    useCase: 'Read-heavy applications, expensive computations, database query optimization',
    implementation: {
      nodes: ['cache_layer', 'database', 'condition_checker', 'sync_engine'],
      connections: ['data_flow', 'control_flow', 'dependency'],
      keyComponents: ['Cache Manager', 'Data Store', 'Cache Invalidation']
    },
    examples: [
      'Web application caching',
      'API response caching',
      'Database query caching',
      'Computed result caching'
    ],
    relatedPatterns: ['read_through', 'write_through', 'write_behind']
  },

  {
    id: 'materialized_view',
    name: 'Materialized View Pattern',
    description: 'Pre-compute and store query results to improve read performance',
    category: 'Performance',
    icon: Database,
    complexity: 'Moderate',
    benefits: [
      'Improved query performance',
      'Reduced computation overhead',
      'Optimized for specific queries',
      'Better user experience'
    ],
    tradeoffs: [
      'Storage overhead',
      'Synchronization complexity',
      'Stale data potential',
      'Maintenance overhead'
    ],
    useCase: 'Reporting systems, analytics dashboards, complex aggregations',
    implementation: {
      nodes: ['database', 'stream_processor', 'scheduler', 'sync_engine'],
      connections: ['data_flow', 'replication', 'orchestration'],
      keyComponents: ['View Store', 'Refresh Mechanism', 'Change Detection']
    },
    examples: [
      'Business intelligence dashboards',
      'Aggregated metrics views',
      'Search indexes',
      'Reporting tables'
    ],
    relatedPatterns: ['cqrs_pattern', 'cache_pattern', 'denormalization']
  }
];

// Helper functions
export const getPatternsByCategory = (category: string): ArchitecturalPattern[] => {
  return architecturalPatterns.filter(pattern => pattern.category === category);
};

export const getPatternById = (id: string): ArchitecturalPattern | undefined => {
  return architecturalPatterns.find(pattern => pattern.id === id);
};

export const getPatternsByComplexity = (complexity: string): ArchitecturalPattern[] => {
  return architecturalPatterns.filter(pattern => pattern.complexity === complexity);
};

export const getAllPatternCategories = (): string[] => {
  return [...new Set(architecturalPatterns.map(pattern => pattern.category))];
};

export const getRelatedPatterns = (patternId: string): ArchitecturalPattern[] => {
  const pattern = getPatternById(patternId);
  if (!pattern) return [];
  
  return pattern.relatedPatterns.map(id => getPatternById(id)).filter(Boolean) as ArchitecturalPattern[];
};

export const searchPatterns = (query: string): ArchitecturalPattern[] => {
  const lowerQuery = query.toLowerCase();
  return architecturalPatterns.filter(pattern => 
    pattern.name.toLowerCase().includes(lowerQuery) ||
    pattern.description.toLowerCase().includes(lowerQuery) ||
    pattern.benefits.some(benefit => benefit.toLowerCase().includes(lowerQuery)) ||
    pattern.useCase.toLowerCase().includes(lowerQuery) ||
    pattern.examples.some(example => example.toLowerCase().includes(lowerQuery))
  );
};