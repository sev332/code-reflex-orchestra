export interface DeploymentStrategy {
  id: string;
  name: string;
  description: string;
  complexity: 'Simple' | 'Moderate' | 'Advanced' | 'Expert';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  downtime: 'Zero' | 'Minimal' | 'Planned' | 'Extended';
  rollbackTime: string;
  suitableFor: string[];
  requirements: string[];
  steps: Array<{
    phase: string;
    description: string;
    estimatedTime: string;
    tools: string[];
  }>;
  advantages: string[];
  disadvantages: string[];
  monitoringRequirements: string[];
}

export interface DeploymentEnvironment {
  id: string;
  name: string;
  type: 'Development' | 'Staging' | 'Production' | 'Testing';
  region: string;
  infrastructure: string[];
  capacity: {
    cpu: string;
    memory: string;
    storage: string;
    bandwidth: string;
  };
  securityLevel: 'Basic' | 'Standard' | 'High' | 'Maximum';
  compliance: string[];
  estimatedCost: string;
}

export const deploymentStrategies: Record<string, DeploymentStrategy> = {
  "blue_green": {
    id: "blue_green",
    name: "Blue-Green Deployment",
    description: "Maintain two identical production environments, switching traffic between them",
    complexity: "Moderate",
    riskLevel: "Low",
    downtime: "Zero",
    rollbackTime: "< 1 minute",
    suitableFor: [
      "Web applications",
      "API services",
      "Microservices",
      "E-commerce platforms"
    ],
    requirements: [
      "Duplicate infrastructure",
      "Load balancer with traffic switching",
      "Database synchronization strategy",
      "Automated testing pipeline"
    ],
    steps: [
      {
        phase: "Preparation",
        description: "Deploy new version to inactive environment (Green)",
        estimatedTime: "15-30 minutes",
        tools: ["CI/CD Pipeline", "Container Registry", "Infrastructure as Code"]
      },
      {
        phase: "Testing",
        description: "Run comprehensive tests on Green environment",
        estimatedTime: "30-60 minutes",
        tools: ["Automated Testing", "Performance Testing", "Security Scanning"]
      },
      {
        phase: "Switch",
        description: "Route traffic from Blue to Green environment",
        estimatedTime: "1-2 minutes",
        tools: ["Load Balancer", "DNS Management", "Traffic Router"]
      },
      {
        phase: "Monitoring",
        description: "Monitor Green environment for issues",
        estimatedTime: "30-60 minutes",
        tools: ["APM Tools", "Log Aggregation", "Health Checks"]
      }
    ],
    advantages: [
      "Zero downtime deployment",
      "Instant rollback capability",
      "Full testing in production-like environment",
      "Clear separation of environments"
    ],
    disadvantages: [
      "Requires double infrastructure",
      "Complex database migrations",
      "Higher resource costs",
      "State synchronization challenges"
    ],
    monitoringRequirements: [
      "Application performance metrics",
      "Error rates and response times",
      "Database connection health",
      "Traffic distribution monitoring"
    ]
  },

  "canary": {
    id: "canary",
    name: "Canary Deployment",
    description: "Gradually roll out changes to a small subset of users before full deployment",
    complexity: "Advanced",
    riskLevel: "Medium",
    downtime: "Zero",
    rollbackTime: "2-5 minutes",
    suitableFor: [
      "High-traffic applications",
      "User-facing services",
      "A/B testing scenarios",
      "Risk-sensitive deployments"
    ],
    requirements: [
      "Traffic splitting capabilities",
      "Feature flags infrastructure",
      "Advanced monitoring and alerting",
      "Automated rollback triggers"
    ],
    steps: [
      {
        phase: "Initial Rollout",
        description: "Deploy to 5% of production traffic",
        estimatedTime: "10-15 minutes",
        tools: ["Service Mesh", "Load Balancer", "Feature Flags"]
      },
      {
        phase: "Monitoring",
        description: "Monitor metrics and user feedback",
        estimatedTime: "1-24 hours",
        tools: ["APM", "User Analytics", "Error Tracking"]
      },
      {
        phase: "Gradual Increase",
        description: "Increase traffic to 25%, 50%, 100%",
        estimatedTime: "2-48 hours",
        tools: ["Traffic Router", "Automated Scripts", "Monitoring"]
      },
      {
        phase: "Full Deployment",
        description: "Complete rollout to all users",
        estimatedTime: "15-30 minutes",
        tools: ["CI/CD Pipeline", "Configuration Management"]
      }
    ],
    advantages: [
      "Reduced blast radius of issues",
      "Real user validation",
      "Data-driven deployment decisions",
      "Gradual confidence building"
    ],
    disadvantages: [
      "Complex traffic management",
      "Longer deployment timeline",
      "Requires sophisticated monitoring",
      "Potential inconsistent user experience"
    ],
    monitoringRequirements: [
      "Real-time error rates",
      "User experience metrics",
      "Performance comparisons",
      "Business KPI tracking"
    ]
  },

  "rolling": {
    id: "rolling",
    name: "Rolling Deployment",
    description: "Gradually replace instances of the old version with the new version",
    complexity: "Moderate",
    riskLevel: "Medium",
    downtime: "Minimal",
    rollbackTime: "10-30 minutes",
    suitableFor: [
      "Containerized applications",
      "Kubernetes environments",
      "Microservices architectures",
      "Stateless applications"
    ],
    requirements: [
      "Container orchestration platform",
      "Health check mechanisms",
      "Load balancing",
      "Graceful shutdown procedures"
    ],
    steps: [
      {
        phase: "Rolling Update Start",
        description: "Begin replacing instances one by one",
        estimatedTime: "5-10 minutes",
        tools: ["Kubernetes", "Docker Swarm", "Container Orchestrator"]
      },
      {
        phase: "Instance Replacement",
        description: "Replace each instance and wait for health checks",
        estimatedTime: "20-60 minutes",
        tools: ["Health Checks", "Load Balancer", "Monitoring"]
      },
      {
        phase: "Completion",
        description: "All instances updated and healthy",
        estimatedTime: "5-10 minutes",
        tools: ["Status Dashboard", "Health Monitoring"]
      }
    ],
    advantages: [
      "No additional infrastructure needed",
      "Built into orchestration platforms",
      "Automatic health checking",
      "Predictable deployment process"
    ],
    disadvantages: [
      "Slower than other strategies",
      "Mixed versions during deployment",
      "Potential for partial failures",
      "Database migration challenges"
    ],
    monitoringRequirements: [
      "Pod/container health status",
      "Deployment progress tracking",
      "Service availability metrics",
      "Resource utilization monitoring"
    ]
  },

  "recreate": {
    id: "recreate",
    name: "Recreate Deployment",
    description: "Stop all old instances and start new instances",
    complexity: "Simple",
    riskLevel: "High",
    downtime: "Extended",
    rollbackTime: "10-20 minutes",
    suitableFor: [
      "Development environments",
      "Internal tools",
      "Applications that can tolerate downtime",
      "Database-heavy applications"
    ],
    requirements: [
      "Maintenance window approval",
      "User notification system",
      "Database backup and migration tools",
      "Rollback preparation"
    ],
    steps: [
      {
        phase: "Preparation",
        description: "Notify users and prepare new version",
        estimatedTime: "15-30 minutes",
        tools: ["Notification System", "Backup Tools", "CI/CD Pipeline"]
      },
      {
        phase: "Shutdown",
        description: "Stop all instances of current version",
        estimatedTime: "2-5 minutes",
        tools: ["Deployment Scripts", "Process Manager"]
      },
      {
        phase: "Deploy",
        description: "Start all instances of new version",
        estimatedTime: "10-30 minutes",
        tools: ["Deployment Tools", "Configuration Management"]
      },
      {
        phase: "Verification",
        description: "Verify deployment success and notify users",
        estimatedTime: "10-15 minutes",
        tools: ["Health Checks", "Testing Suite", "Notification System"]
      }
    ],
    advantages: [
      "Simple and straightforward",
      "No version mixing",
      "Easier database migrations",
      "Lower resource requirements"
    ],
    disadvantages: [
      "Service downtime required",
      "High risk deployment",
      "User impact during deployment",
      "Longer rollback time"
    ],
    monitoringRequirements: [
      "Service availability status",
      "Deployment completion tracking",
      "Post-deployment health checks",
      "User impact metrics"
    ]
  },

  "feature_toggle": {
    id: "feature_toggle",
    name: "Feature Toggle Deployment",
    description: "Deploy code with features disabled, then enable them via configuration",
    complexity: "Advanced",
    riskLevel: "Low",
    downtime: "Zero",
    rollbackTime: "< 30 seconds",
    suitableFor: [
      "Feature experimentation",
      "A/B testing",
      "Gradual feature rollouts",
      "Risk mitigation"
    ],
    requirements: [
      "Feature flag management system",
      "Real-time configuration updates",
      "A/B testing infrastructure",
      "User segmentation capabilities"
    ],
    steps: [
      {
        phase: "Code Deployment",
        description: "Deploy new code with features disabled",
        estimatedTime: "15-30 minutes",
        tools: ["CI/CD Pipeline", "Feature Flag System", "Deployment Tools"]
      },
      {
        phase: "Feature Enablement",
        description: "Gradually enable features for user segments",
        estimatedTime: "Minutes to days",
        tools: ["Feature Flag Dashboard", "User Segmentation", "Analytics"]
      },
      {
        phase: "Monitoring",
        description: "Monitor feature performance and user behavior",
        estimatedTime: "Ongoing",
        tools: ["Analytics Platform", "Error Tracking", "Performance Monitoring"]
      }
    ],
    advantages: [
      "Instant feature rollback",
      "Gradual user exposure",
      "A/B testing capabilities",
      "Decoupled deployment and release"
    ],
    disadvantages: [
      "Code complexity increase",
      "Technical debt accumulation",
      "Feature flag management overhead",
      "Potential for dead code"
    ],
    monitoringRequirements: [
      "Feature usage analytics",
      "Performance impact tracking",
      "Error rates by feature",
      "User engagement metrics"
    ]
  }
};

export const deploymentEnvironments: Record<string, DeploymentEnvironment> = {
  "dev_local": {
    id: "dev_local",
    name: "Local Development",
    type: "Development",
    region: "Local",
    infrastructure: ["Docker Desktop", "Local Database", "Development Server"],
    capacity: {
      cpu: "4 cores",
      memory: "8GB RAM",
      storage: "100GB SSD",
      bandwidth: "Local network"
    },
    securityLevel: "Basic",
    compliance: [],
    estimatedCost: "$0/month"
  },
  "dev_cloud": {
    id: "dev_cloud",
    name: "Cloud Development",
    type: "Development",
    region: "us-east-1",
    infrastructure: ["Container Service", "Managed Database", "Object Storage"],
    capacity: {
      cpu: "2 vCPUs",
      memory: "4GB RAM",
      storage: "50GB SSD",
      bandwidth: "1 Gbps"
    },
    securityLevel: "Standard",
    compliance: [],
    estimatedCost: "$200/month"
  },
  "staging": {
    id: "staging",
    name: "Staging Environment",
    type: "Staging",
    region: "us-east-1",
    infrastructure: ["Kubernetes Cluster", "Managed Database", "CDN", "Load Balancer"],
    capacity: {
      cpu: "8 vCPUs",
      memory: "16GB RAM",
      storage: "200GB SSD",
      bandwidth: "5 Gbps"
    },
    securityLevel: "High",
    compliance: ["SOC 2"],
    estimatedCost: "$800/month"
  },
  "production_single": {
    id: "production_single",
    name: "Single Region Production",
    type: "Production",
    region: "us-east-1",
    infrastructure: ["Auto-scaling Cluster", "High-availability Database", "CDN", "WAF"],
    capacity: {
      cpu: "32 vCPUs",
      memory: "64GB RAM",
      storage: "1TB SSD",
      bandwidth: "10 Gbps"
    },
    securityLevel: "Maximum",
    compliance: ["SOC 2", "PCI DSS", "GDPR"],
    estimatedCost: "$3,200/month"
  },
  "production_multi": {
    id: "production_multi",
    name: "Multi-Region Production",
    type: "Production",
    region: "Global",
    infrastructure: ["Global Load Balancer", "Multi-region Clusters", "Global Database", "Edge CDN"],
    capacity: {
      cpu: "128 vCPUs",
      memory: "256GB RAM",
      storage: "5TB SSD",
      bandwidth: "100 Gbps"
    },
    securityLevel: "Maximum",
    compliance: ["SOC 2", "PCI DSS", "GDPR", "HIPAA"],
    estimatedCost: "$15,000/month"
  }
};

export const deploymentTools = {
  "ci_cd": [
    "Jenkins", "GitLab CI", "GitHub Actions", "Azure DevOps", "CircleCI", "Travis CI"
  ],
  "container_orchestration": [
    "Kubernetes", "Docker Swarm", "Amazon ECS", "Azure Container Instances"
  ],
  "infrastructure": [
    "Terraform", "CloudFormation", "Ansible", "Puppet", "Chef"
  ],
  "monitoring": [
    "Prometheus", "Grafana", "Datadog", "New Relic", "Splunk", "ELK Stack"
  ],
  "feature_flags": [
    "LaunchDarkly", "Split.io", "Unleash", "AWS AppConfig", "Azure App Configuration"
  ]
};

export function getStrategiesByComplexity(complexity: string): DeploymentStrategy[] {
  return Object.values(deploymentStrategies).filter(strategy => strategy.complexity === complexity);
}

export function getStrategiesByRisk(riskLevel: string): DeploymentStrategy[] {
  return Object.values(deploymentStrategies).filter(strategy => strategy.riskLevel === riskLevel);
}

export function getEnvironmentsByType(type: string): DeploymentEnvironment[] {
  return Object.values(deploymentEnvironments).filter(env => env.type === type);
}