export interface BenchmarkMetric {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  targetValue: number;
  criticalThreshold: number;
  goodThreshold: number;
  formula?: string;
  relatedNodes: string[];
}

export interface BenchmarkSuite {
  id: string;
  name: string;
  description: string;
  category: string;
  metrics: string[];
  estimatedRunTime: string;
  requirements: string[];
  outputs: string[];
}

export const benchmarkMetrics: Record<string, BenchmarkMetric> = {
  // Performance Metrics
  "response_time": {
    id: "response_time",
    name: "Average Response Time",
    category: "Performance",
    description: "Average time to process and respond to requests",
    unit: "milliseconds",
    targetValue: 100,
    criticalThreshold: 1000,
    goodThreshold: 200,
    formula: "sum(response_times) / count(requests)",
    relatedNodes: ["api_gateway", "load_balancer", "microservice"]
  },
  "throughput": {
    id: "throughput",
    name: "Requests Per Second",
    category: "Performance",
    description: "Number of requests processed per second",
    unit: "requests/second",
    targetValue: 1000,
    criticalThreshold: 100,
    goodThreshold: 500,
    formula: "total_requests / time_period",
    relatedNodes: ["api_gateway", "load_balancer", "server"]
  },
  "latency_p95": {
    id: "latency_p95",
    name: "95th Percentile Latency",
    category: "Performance",
    description: "95% of requests complete within this time",
    unit: "milliseconds",
    targetValue: 500,
    criticalThreshold: 2000,
    goodThreshold: 1000,
    relatedNodes: ["api_gateway", "database", "cache_layer"]
  },
  "cpu_utilization": {
    id: "cpu_utilization",
    name: "CPU Utilization",
    category: "Performance",
    description: "Percentage of CPU capacity being used",
    unit: "percentage",
    targetValue: 70,
    criticalThreshold: 90,
    goodThreshold: 80,
    relatedNodes: ["server", "container", "microservice"]
  },
  "memory_utilization": {
    id: "memory_utilization",
    name: "Memory Utilization",
    category: "Performance",
    description: "Percentage of memory capacity being used",
    unit: "percentage",
    targetValue: 75,
    criticalThreshold: 95,
    goodThreshold: 85,
    relatedNodes: ["server", "container", "cache_layer"]
  },

  // Reliability Metrics
  "uptime": {
    id: "uptime",
    name: "System Uptime",
    category: "Reliability",
    description: "Percentage of time system is operational",
    unit: "percentage",
    targetValue: 99.9,
    criticalThreshold: 99.0,
    goodThreshold: 99.5,
    formula: "(total_time - downtime) / total_time * 100",
    relatedNodes: ["server", "load_balancer", "monitoring"]
  },
  "error_rate": {
    id: "error_rate",
    name: "Error Rate",
    category: "Reliability",
    description: "Percentage of requests that result in errors",
    unit: "percentage",
    targetValue: 0.1,
    criticalThreshold: 5.0,
    goodThreshold: 1.0,
    formula: "error_count / total_requests * 100",
    relatedNodes: ["api_gateway", "microservice", "monitoring"]
  },
  "mttr": {
    id: "mttr",
    name: "Mean Time to Recovery",
    category: "Reliability",
    description: "Average time to recover from failures",
    unit: "minutes",
    targetValue: 5,
    criticalThreshold: 60,
    goodThreshold: 15,
    relatedNodes: ["monitoring", "alerting", "incident_response"]
  },
  "mtbf": {
    id: "mtbf",
    name: "Mean Time Between Failures",
    category: "Reliability",
    description: "Average time between system failures",
    unit: "hours",
    targetValue: 720,
    criticalThreshold: 168,
    goodThreshold: 336,
    relatedNodes: ["server", "database", "monitoring"]
  },

  // Security Metrics
  "vulnerability_count": {
    id: "vulnerability_count",
    name: "Security Vulnerabilities",
    category: "Security",
    description: "Number of identified security vulnerabilities",
    unit: "count",
    targetValue: 0,
    criticalThreshold: 10,
    goodThreshold: 2,
    relatedNodes: ["security_scanner", "firewall", "auth_service"]
  },
  "failed_auth_rate": {
    id: "failed_auth_rate",
    name: "Failed Authentication Rate",
    category: "Security",
    description: "Percentage of authentication attempts that fail",
    unit: "percentage",
    targetValue: 5,
    criticalThreshold: 20,
    goodThreshold: 10,
    relatedNodes: ["auth_service", "identity_provider"]
  },
  "ssl_grade": {
    id: "ssl_grade",
    name: "SSL Security Grade",
    category: "Security",
    description: "SSL configuration security rating",
    unit: "grade",
    targetValue: 95,
    criticalThreshold: 70,
    goodThreshold: 85,
    relatedNodes: ["api_gateway", "load_balancer"]
  },

  // Scalability Metrics
  "auto_scaling_efficiency": {
    id: "auto_scaling_efficiency",
    name: "Auto-scaling Efficiency",
    category: "Scalability",
    description: "How quickly system scales to meet demand",
    unit: "percentage",
    targetValue: 90,
    criticalThreshold: 60,
    goodThreshold: 80,
    relatedNodes: ["container_orchestrator", "load_balancer"]
  },
  "horizontal_scale_time": {
    id: "horizontal_scale_time",
    name: "Horizontal Scaling Time",
    category: "Scalability",
    description: "Time to add new instances",
    unit: "seconds",
    targetValue: 30,
    criticalThreshold: 300,
    goodThreshold: 60,
    relatedNodes: ["container", "serverless_function"]
  },
  "load_balancing_efficiency": {
    id: "load_balancing_efficiency",
    name: "Load Balancing Efficiency",
    category: "Scalability",
    description: "How evenly traffic is distributed",
    unit: "percentage",
    targetValue: 95,
    criticalThreshold: 70,
    goodThreshold: 85,
    relatedNodes: ["load_balancer", "api_gateway"]
  },

  // Cost Metrics
  "cost_per_request": {
    id: "cost_per_request",
    name: "Cost Per Request",
    category: "Cost",
    description: "Average cost to process each request",
    unit: "dollars",
    targetValue: 0.001,
    criticalThreshold: 0.01,
    goodThreshold: 0.005,
    relatedNodes: ["serverless_function", "container", "api_gateway"]
  },
  "resource_utilization": {
    id: "resource_utilization",
    name: "Resource Utilization",
    category: "Cost",
    description: "Percentage of provisioned resources being used",
    unit: "percentage",
    targetValue: 80,
    criticalThreshold: 30,
    goodThreshold: 60,
    relatedNodes: ["server", "container", "database"]
  },
  "cost_optimization_savings": {
    id: "cost_optimization_savings",
    name: "Cost Optimization Savings",
    category: "Cost",
    description: "Percentage cost reduction from optimization",
    unit: "percentage",
    targetValue: 20,
    criticalThreshold: 5,
    goodThreshold: 15,
    relatedNodes: ["cost_optimizer", "resource_allocator"]
  },

  // Data Metrics
  "data_processing_speed": {
    id: "data_processing_speed",
    name: "Data Processing Speed",
    category: "Data",
    description: "Rate of data processing",
    unit: "GB/hour",
    targetValue: 1000,
    criticalThreshold: 100,
    goodThreshold: 500,
    relatedNodes: ["data_pipeline", "stream_processor"]
  },
  "data_quality_score": {
    id: "data_quality_score",
    name: "Data Quality Score",
    category: "Data",
    description: "Overall quality of processed data",
    unit: "percentage",
    targetValue: 95,
    criticalThreshold: 80,
    goodThreshold: 90,
    relatedNodes: ["data_pipeline", "data_validator"]
  },
  "cache_hit_rate": {
    id: "cache_hit_rate",
    name: "Cache Hit Rate",
    category: "Data",
    description: "Percentage of requests served from cache",
    unit: "percentage",
    targetValue: 90,
    criticalThreshold: 60,
    goodThreshold: 80,
    relatedNodes: ["cache_layer", "cdn"]
  },

  // AI/ML Metrics
  "model_accuracy": {
    id: "model_accuracy",
    name: "Model Accuracy",
    category: "AI/ML",
    description: "Accuracy of AI model predictions",
    unit: "percentage",
    targetValue: 95,
    criticalThreshold: 70,
    goodThreshold: 85,
    relatedNodes: ["ml_model", "ai_agent"]
  },
  "inference_time": {
    id: "inference_time",
    name: "Model Inference Time",
    category: "AI/ML",
    description: "Time to generate model predictions",
    unit: "milliseconds",
    targetValue: 100,
    criticalThreshold: 1000,
    goodThreshold: 300,
    relatedNodes: ["ml_model", "inference_engine"]
  },
  "training_time": {
    id: "training_time",
    name: "Model Training Time",
    category: "AI/ML",
    description: "Time to train machine learning models",
    unit: "hours",
    targetValue: 2,
    criticalThreshold: 24,
    goodThreshold: 8,
    relatedNodes: ["training_pipeline", "ml_infrastructure"]
  }
};

export const benchmarkSuites: Record<string, BenchmarkSuite> = {
  "performance_baseline": {
    id: "performance_baseline",
    name: "Performance Baseline Suite",
    description: "Core performance metrics for system baseline",
    category: "Performance",
    metrics: ["response_time", "throughput", "latency_p95", "cpu_utilization", "memory_utilization"],
    estimatedRunTime: "30 minutes",
    requirements: ["Load testing tools", "Performance monitoring", "System access"],
    outputs: ["Performance report", "Baseline metrics", "Recommendations"]
  },
  "reliability_assessment": {
    id: "reliability_assessment",
    name: "Reliability Assessment Suite",
    description: "Comprehensive reliability and availability testing",
    category: "Reliability",
    metrics: ["uptime", "error_rate", "mttr", "mtbf"],
    estimatedRunTime: "2 hours",
    requirements: ["Historical data", "Monitoring systems", "Incident logs"],
    outputs: ["Reliability report", "SLA compliance", "Failure analysis"]
  },
  "security_audit": {
    id: "security_audit",
    name: "Security Audit Suite",
    description: "Security vulnerability and compliance assessment",
    category: "Security",
    metrics: ["vulnerability_count", "failed_auth_rate", "ssl_grade"],
    estimatedRunTime: "4 hours",
    requirements: ["Security scanning tools", "Access logs", "SSL certificates"],
    outputs: ["Security report", "Vulnerability list", "Compliance status"]
  },
  "scalability_test": {
    id: "scalability_test",
    name: "Scalability Test Suite",
    description: "System scalability and load handling assessment",
    category: "Scalability",
    metrics: ["auto_scaling_efficiency", "horizontal_scale_time", "load_balancing_efficiency"],
    estimatedRunTime: "1 hour",
    requirements: ["Auto-scaling configuration", "Load balancer access", "Scaling policies"],
    outputs: ["Scalability report", "Scaling recommendations", "Capacity planning"]
  },
  "cost_optimization": {
    id: "cost_optimization",
    name: "Cost Optimization Suite",
    description: "Cost efficiency and resource utilization analysis",
    category: "Cost",
    metrics: ["cost_per_request", "resource_utilization", "cost_optimization_savings"],
    estimatedRunTime: "45 minutes",
    requirements: ["Billing data", "Resource monitoring", "Usage metrics"],
    outputs: ["Cost analysis", "Optimization opportunities", "ROI projections"]
  },
  "data_pipeline_health": {
    id: "data_pipeline_health",
    name: "Data Pipeline Health Suite",
    description: "Data processing and quality assessment",
    category: "Data",
    metrics: ["data_processing_speed", "data_quality_score", "cache_hit_rate"],
    estimatedRunTime: "1.5 hours",
    requirements: ["Data pipeline access", "Quality metrics", "Cache statistics"],
    outputs: ["Data health report", "Quality issues", "Performance optimization"]
  },
  "ai_model_evaluation": {
    id: "ai_model_evaluation",
    name: "AI Model Evaluation Suite",
    description: "AI/ML model performance and efficiency testing",
    category: "AI/ML",
    metrics: ["model_accuracy", "inference_time", "training_time"],
    estimatedRunTime: "3 hours",
    requirements: ["Model access", "Test datasets", "Training infrastructure"],
    outputs: ["Model performance report", "Accuracy metrics", "Optimization recommendations"]
  }
};

export const benchmarkCategories = [
  "Performance",
  "Reliability",
  "Security",
  "Scalability",
  "Cost",
  "Data",
  "AI/ML"
];

export function getBenchmarksByCategory(category: string): BenchmarkMetric[] {
  return Object.values(benchmarkMetrics).filter(metric => metric.category === category);
}

export function getSuitesByCategory(category: string): BenchmarkSuite[] {
  return Object.values(benchmarkSuites).filter(suite => suite.category === category);
}

export function getMetricsByNode(nodeType: string): BenchmarkMetric[] {
  return Object.values(benchmarkMetrics).filter(metric => 
    metric.relatedNodes.includes(nodeType)
  );
}