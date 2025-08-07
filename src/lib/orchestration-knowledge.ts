import { Brain, Code, Database, Shield, Cpu, Network, Users, BarChart3, Zap, Globe, Settings, Activity, GitBranch, Cloud, Server, Building, Rocket, Container, Package, Factory, Truck, Warehouse, ShoppingCart, CreditCard, Mail, Phone, Bell, Lock, Eye, TestTube, PenTool, Microscope, Layers, FileText, Search, Bot, Video, Image, Mic, Bitcoin, Pickaxe, Wallet } from 'lucide-react';

export interface KnowledgeEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  timeToRead: string;
  prerequisites: string[];
  relatedNodes: string[];
  content: {
    overview: string;
    whenToUse: string[];
    benefits: string[];
    challenges: string[];
    bestPractices: string[];
    examples: Array<{
      title: string;
      description: string;
      complexity: string;
    }>;
    codeExample?: string;
    architecturalPatterns: string[];
  };
}

export const orchestrationKnowledge: Record<string, KnowledgeEntry> = {
  "microservices_architecture": {
    id: "microservices_architecture",
    title: "Microservices Architecture Patterns",
    description: "Comprehensive guide to designing and implementing microservices architectures",
    category: "Architecture",
    tags: ["microservices", "distributed", "scalability", "api", "containers"],
    difficulty: "Advanced",
    timeToRead: "25 minutes",
    prerequisites: ["REST APIs", "Container Technology", "Distributed Systems"],
    relatedNodes: ["microservice", "api_gateway", "load_balancer", "service_mesh"],
    content: {
      overview: "Microservices architecture breaks down applications into small, independent services that communicate over well-defined APIs. Each service is owned by a small team and can be developed, deployed, and scaled independently.",
      whenToUse: [
        "Large, complex applications with multiple teams",
        "Need for independent scaling of different components",
        "Different technology stacks for different services",
        "Rapid development and deployment cycles",
        "High availability requirements"
      ],
      benefits: [
        "Independent deployability",
        "Technology diversity",
        "Fault isolation",
        "Scalability",
        "Team autonomy"
      ],
      challenges: [
        "Distributed system complexity",
        "Network latency and reliability",
        "Data consistency across services",
        "Service discovery and communication",
        "Monitoring and debugging complexity"
      ],
      bestPractices: [
        "Design around business capabilities",
        "Implement circuit breakers",
        "Use API gateways for external communication",
        "Implement comprehensive monitoring",
        "Design for failure",
        "Use event-driven communication",
        "Implement proper authentication and authorization"
      ],
      examples: [
        {
          title: "E-commerce Platform",
          description: "Separate services for user management, product catalog, orders, payments, and recommendations",
          complexity: "High"
        },
        {
          title: "Banking System",
          description: "Account management, transaction processing, fraud detection, and reporting services",
          complexity: "Expert"
        }
      ],
      architecturalPatterns: ["API Gateway", "Service Mesh", "Event Sourcing", "CQRS"]
    }
  },

  "event_driven_architecture": {
    id: "event_driven_architecture",
    title: "Event-Driven Architecture",
    description: "Building reactive systems with event-driven patterns",
    category: "Architecture",
    tags: ["events", "reactive", "messaging", "decoupling", "async"],
    difficulty: "Advanced",
    timeToRead: "20 minutes",
    prerequisites: ["Message Queues", "Pub/Sub Patterns", "Async Programming"],
    relatedNodes: ["event_stream", "message_queue", "event_sourcing", "cqrs"],
    content: {
      overview: "Event-driven architecture uses events to trigger and communicate between decoupled services. When something happens in one part of the system, it publishes an event that other parts can react to.",
      whenToUse: [
        "Real-time data processing requirements",
        "Loose coupling between services",
        "Complex business processes with multiple steps",
        "Integration with external systems",
        "Scalable, responsive applications"
      ],
      benefits: [
        "Loose coupling between components",
        "Scalability and performance",
        "Real-time responsiveness",
        "Easier integration",
        "Event sourcing capabilities"
      ],
      challenges: [
        "Event ordering and consistency",
        "Debugging complex event flows",
        "Handling duplicate events",
        "Event schema evolution",
        "Monitoring event streams"
      ],
      bestPractices: [
        "Design idempotent event handlers",
        "Use event sourcing for audit trails",
        "Implement proper error handling",
        "Version your events",
        "Monitor event flow and latency",
        "Use event schemas for consistency"
      ],
      examples: [
        {
          title: "Order Processing System",
          description: "Events for order created, payment processed, inventory checked, shipping initiated",
          complexity: "Intermediate"
        },
        {
          title: "IoT Data Pipeline",
          description: "Sensor events trigger real-time analytics and alerts",
          complexity: "Advanced"
        }
      ],
      architecturalPatterns: ["Event Sourcing", "CQRS", "Saga Pattern", "Event Streaming"]
    }
  },

  "ai_agent_orchestration": {
    id: "ai_agent_orchestration",
    title: "AI Agent Orchestration",
    description: "Coordinating multiple AI agents for complex tasks",
    category: "AI/ML",
    tags: ["ai", "agents", "orchestration", "automation", "intelligence"],
    difficulty: "Expert",
    timeToRead: "30 minutes",
    prerequisites: ["Machine Learning", "API Integration", "Workflow Design"],
    relatedNodes: ["ai_agent", "research_agent", "code_agent", "memory_agent"],
    content: {
      overview: "AI agent orchestration involves coordinating multiple specialized AI agents to work together on complex tasks, leveraging their unique capabilities to achieve better outcomes than any single agent could.",
      whenToUse: [
        "Complex multi-step AI workflows",
        "Tasks requiring different AI specializations",
        "Autonomous system development",
        "Research and analysis pipelines",
        "Code generation and review processes"
      ],
      benefits: [
        "Specialized expertise for each task",
        "Improved accuracy through collaboration",
        "Scalable AI workflows",
        "Reduced single points of failure",
        "Continuous learning and improvement"
      ],
      challenges: [
        "Agent communication protocols",
        "Conflict resolution between agents",
        "Resource allocation and scheduling",
        "Quality control and validation",
        "Cost management for AI services"
      ],
      bestPractices: [
        "Define clear agent responsibilities",
        "Implement robust communication protocols",
        "Use consensus mechanisms for decisions",
        "Monitor agent performance and costs",
        "Implement feedback loops for learning",
        "Design failover mechanisms"
      ],
      examples: [
        {
          title: "Autonomous Code Review",
          description: "Code analysis agent, security audit agent, and performance optimization agent working together",
          complexity: "Expert"
        },
        {
          title: "Research Pipeline",
          description: "Search agent, analysis agent, synthesis agent, and fact-checking agent collaboration",
          complexity: "Advanced"
        }
      ],
      architecturalPatterns: ["Multi-Agent Systems", "Workflow Orchestration", "Consensus Algorithms"]
    }
  },

  "container_orchestration": {
    id: "container_orchestration",
    title: "Container Orchestration with Kubernetes",
    description: "Managing containerized applications at scale",
    category: "Infrastructure",
    tags: ["containers", "kubernetes", "docker", "orchestration", "scaling"],
    difficulty: "Advanced",
    timeToRead: "35 minutes",
    prerequisites: ["Docker", "Container Technology", "Networking Basics"],
    relatedNodes: ["container", "kubernetes_cluster", "container_registry", "service_mesh"],
    content: {
      overview: "Container orchestration automates the deployment, management, scaling, and networking of containerized applications. Kubernetes is the leading platform for container orchestration.",
      whenToUse: [
        "Microservices deployments",
        "Scalable web applications",
        "CI/CD pipelines",
        "Multi-environment deployments",
        "Resource optimization needs"
      ],
      benefits: [
        "Automated scaling and healing",
        "Resource efficiency",
        "Deployment consistency",
        "Service discovery",
        "Load balancing"
      ],
      challenges: [
        "Complexity of configuration",
        "Networking complexities",
        "Persistent storage management",
        "Security considerations",
        "Monitoring and observability"
      ],
      bestPractices: [
        "Use declarative configurations",
        "Implement health checks",
        "Manage secrets securely",
        "Use namespaces for isolation",
        "Implement proper RBAC",
        "Monitor resource usage"
      ],
      examples: [
        {
          title: "Web Application Deployment",
          description: "Frontend, backend, and database containers with auto-scaling",
          complexity: "Intermediate"
        },
        {
          title: "ML Model Serving",
          description: "Multiple model versions with A/B testing and canary deployments",
          complexity: "Advanced"
        }
      ],
      architecturalPatterns: ["Service Mesh", "Sidecar Pattern", "Ambassador Pattern"]
    }
  },

  "data_pipeline_architecture": {
    id: "data_pipeline_architecture",
    title: "Modern Data Pipeline Architecture",
    description: "Building scalable data processing and analytics pipelines",
    category: "Data Engineering",
    tags: ["data", "pipeline", "etl", "streaming", "analytics"],
    difficulty: "Advanced",
    timeToRead: "28 minutes",
    prerequisites: ["Database Systems", "Data Modeling", "Stream Processing"],
    relatedNodes: ["data_pipeline", "data_lake", "stream_processor", "analytics_engine"],
    content: {
      overview: "Modern data pipelines handle the extraction, transformation, and loading of data from various sources to enable analytics, machine learning, and business intelligence.",
      whenToUse: [
        "Large-scale data processing",
        "Real-time analytics requirements",
        "Multi-source data integration",
        "Machine learning workflows",
        "Business intelligence and reporting"
      ],
      benefits: [
        "Scalable data processing",
        "Real-time insights",
        "Data quality assurance",
        "Automated workflows",
        "Cost-effective storage"
      ],
      challenges: [
        "Data quality and consistency",
        "Schema evolution",
        "Performance optimization",
        "Error handling and recovery",
        "Cost management"
      ],
      bestPractices: [
        "Design for idempotency",
        "Implement data validation",
        "Use schema registries",
        "Monitor data lineage",
        "Implement proper error handling",
        "Optimize for cost and performance"
      ],
      examples: [
        {
          title: "E-commerce Analytics",
          description: "Customer behavior, sales metrics, and inventory analytics pipeline",
          complexity: "Advanced"
        },
        {
          title: "IoT Sensor Processing",
          description: "Real-time sensor data processing with anomaly detection",
          complexity: "Expert"
        }
      ],
      architecturalPatterns: ["Lambda Architecture", "Kappa Architecture", "Data Mesh"]
    }
  },

  "serverless_architecture": {
    id: "serverless_architecture",
    title: "Serverless Architecture Patterns",
    description: "Building applications with Function-as-a-Service",
    category: "Architecture",
    tags: ["serverless", "functions", "cloud", "scaling", "cost-optimization"],
    difficulty: "Intermediate",
    timeToRead: "22 minutes",
    prerequisites: ["Cloud Computing", "HTTP APIs", "Event-Driven Systems"],
    relatedNodes: ["cloud_function", "api_gateway", "event_trigger", "serverless_database"],
    content: {
      overview: "Serverless architecture allows you to build and run applications without managing servers. Code runs in stateless compute containers managed by cloud providers.",
      whenToUse: [
        "Variable or unpredictable workloads",
        "Event-driven applications",
        "Rapid prototyping and development",
        "Cost-sensitive applications",
        "Microservices with minimal overhead"
      ],
      benefits: [
        "No server management",
        "Automatic scaling",
        "Pay-per-execution pricing",
        "High availability",
        "Faster time to market"
      ],
      challenges: [
        "Cold start latency",
        "Vendor lock-in",
        "Limited execution time",
        "Debugging complexity",
        "State management"
      ],
      bestPractices: [
        "Design stateless functions",
        "Optimize for cold starts",
        "Use appropriate triggers",
        "Implement proper error handling",
        "Monitor function performance",
        "Manage dependencies efficiently"
      ],
      examples: [
        {
          title: "Image Processing API",
          description: "On-demand image resizing and optimization service",
          complexity: "Beginner"
        },
        {
          title: "Real-time Notification System",
          description: "Event-triggered notifications across multiple channels",
          complexity: "Intermediate"
        }
      ],
      architecturalPatterns: ["Backend for Frontend", "Event Sourcing", "CQRS"]
    }
  },

  "security_architecture": {
    id: "security_architecture",
    title: "Security Architecture Best Practices",
    description: "Implementing security by design in modern applications",
    category: "Security",
    tags: ["security", "authentication", "authorization", "encryption", "compliance"],
    difficulty: "Advanced",
    timeToRead: "32 minutes",
    prerequisites: ["Cryptography Basics", "Network Security", "Identity Management"],
    relatedNodes: ["auth_service", "firewall", "encryption_service", "audit_logger"],
    content: {
      overview: "Security architecture ensures that security considerations are built into every layer of an application, from infrastructure to application code to data protection.",
      whenToUse: [
        "Applications handling sensitive data",
        "Compliance requirements (GDPR, HIPAA, SOX)",
        "Multi-tenant applications",
        "Financial services applications",
        "Healthcare systems"
      ],
      benefits: [
        "Reduced security vulnerabilities",
        "Compliance assurance",
        "User trust and confidence",
        "Data protection",
        "Incident response readiness"
      ],
      challenges: [
        "Balancing security and usability",
        "Keeping up with threats",
        "Performance impact",
        "Complexity of implementation",
        "Ongoing maintenance"
      ],
      bestPractices: [
        "Implement defense in depth",
        "Use zero-trust architecture",
        "Regular security assessments",
        "Encrypt data at rest and in transit",
        "Implement proper logging and monitoring",
        "Use least privilege principles"
      ],
      examples: [
        {
          title: "Banking Application Security",
          description: "Multi-factor authentication, encryption, fraud detection, and audit logging",
          complexity: "Expert"
        },
        {
          title: "Healthcare Data Platform",
          description: "HIPAA-compliant architecture with role-based access and audit trails",
          complexity: "Advanced"
        }
      ],
      architecturalPatterns: ["Zero Trust", "Defense in Depth", "Secure by Design"]
    }
  },

  "realtime_systems": {
    id: "realtime_systems",
    title: "Real-time Systems Architecture",
    description: "Building responsive, real-time applications",
    category: "Architecture",
    tags: ["realtime", "websockets", "streaming", "performance", "low-latency"],
    difficulty: "Advanced",
    timeToRead: "26 minutes",
    prerequisites: ["WebSocket Protocol", "Event Streaming", "Performance Optimization"],
    relatedNodes: ["websocket_server", "message_broker", "cache_layer", "load_balancer"],
    content: {
      overview: "Real-time systems provide immediate response to user actions and external events, enabling live collaboration, gaming, trading, and monitoring applications.",
      whenToUse: [
        "Collaborative applications",
        "Live gaming platforms",
        "Financial trading systems",
        "Monitoring dashboards",
        "Chat and messaging apps"
      ],
      benefits: [
        "Immediate user feedback",
        "Enhanced user experience",
        "Real-time collaboration",
        "Competitive advantage",
        "Better decision making"
      ],
      challenges: [
        "Connection management",
        "State synchronization",
        "Scaling concurrent connections",
        "Handling network issues",
        "Performance optimization"
      ],
      bestPractices: [
        "Use connection pooling",
        "Implement heartbeat mechanisms",
        "Design for network partitions",
        "Use efficient serialization",
        "Implement proper error handling",
        "Monitor connection metrics"
      ],
      examples: [
        {
          title: "Collaborative Code Editor",
          description: "Real-time code editing with conflict resolution and presence awareness",
          complexity: "Advanced"
        },
        {
          title: "Trading Platform",
          description: "Low-latency order matching and real-time market data",
          complexity: "Expert"
        }
      ],
      architecturalPatterns: ["Event Sourcing", "CQRS", "Reactive Patterns"]
    }
  }
};

export const knowledgeCategories = [
  "Architecture",
  "AI/ML",
  "Infrastructure", 
  "Data Engineering",
  "Security",
  "Development",
  "Business Logic",
  "Integration"
];

export const difficultyLevels = [
  "Beginner",
  "Intermediate", 
  "Advanced",
  "Expert"
];

export function getKnowledgeByCategory(category: string): KnowledgeEntry[] {
  return Object.values(orchestrationKnowledge).filter(entry => entry.category === category);
}

export function getKnowledgeByDifficulty(difficulty: string): KnowledgeEntry[] {
  return Object.values(orchestrationKnowledge).filter(entry => entry.difficulty === difficulty);
}

export function searchKnowledge(query: string): KnowledgeEntry[] {
  const searchTerm = query.toLowerCase();
  return Object.values(orchestrationKnowledge).filter(entry =>
    entry.title.toLowerCase().includes(searchTerm) ||
    entry.description.toLowerCase().includes(searchTerm) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    entry.content.overview.toLowerCase().includes(searchTerm)
  );
}