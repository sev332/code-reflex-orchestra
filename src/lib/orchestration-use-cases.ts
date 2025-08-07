import { Brain, Code, Database, Shield, Cpu, Network, Users, BarChart3, Zap, Globe, Settings, Activity, GitBranch, Cloud, Server, Building, Rocket, Container, Package, Factory, Truck, Warehouse, ShoppingCart, CreditCard, Mail, Phone, Bell, Lock, Eye, TestTube, PenTool, Microscope, Layers, FileText, Search, Bot, Video, Image, Mic, Bitcoin, Pickaxe, Wallet } from 'lucide-react';

export interface UseCase {
  id: string;
  title: string;
  description: string;
  industry: string;
  complexity: 'Simple' | 'Moderate' | 'Complex' | 'Enterprise';
  estimatedCost: string;
  timeToImplement: string;
  businessValue: string[];
  technicalRequirements: string[];
  keyComponents: string[];
  scalabilityFactors: string[];
  riskFactors: string[];
  successMetrics: string[];
  realWorldExamples: Array<{
    company: string;
    implementation: string;
    results: string;
  }>;
  icon: any;
  nodeTypes: string[];
  estimatedUsers: string;
  dataVolume: string;
}

export const orchestrationUseCases: Record<string, UseCase> = {
  "autonomous_trading_platform": {
    id: "autonomous_trading_platform",
    title: "Autonomous Trading Platform",
    description: "AI-powered high-frequency trading system with risk management and regulatory compliance",
    industry: "Financial Services",
    complexity: "Enterprise",
    estimatedCost: "$2M - $10M",
    timeToImplement: "12-18 months",
    businessValue: [
      "Reduced trading latency from seconds to microseconds",
      "24/7 automated trading without human intervention",
      "Advanced risk management and position sizing",
      "Regulatory compliance automation",
      "Multi-asset class support"
    ],
    technicalRequirements: [
      "Ultra-low latency infrastructure",
      "Real-time market data feeds",
      "Machine learning models for price prediction",
      "Risk management algorithms",
      "Regulatory reporting systems"
    ],
    keyComponents: [
      "ai_trading_agent", "market_data_processor", "risk_manager", 
      "order_execution_engine", "compliance_monitor", "portfolio_optimizer"
    ],
    scalabilityFactors: [
      "Horizontal scaling for multiple trading strategies",
      "Geographic distribution for global markets",
      "Real-time data processing capacity",
      "Concurrent order execution"
    ],
    riskFactors: [
      "Market volatility and flash crashes",
      "Regulatory changes and compliance",
      "Technology failures and downtime",
      "Cybersecurity threats",
      "Model risk and overfitting"
    ],
    successMetrics: [
      "Sharpe ratio > 2.0",
      "Maximum drawdown < 5%",
      "Trade execution latency < 100μs",
      "99.99% system uptime",
      "Regulatory audit pass rate 100%"
    ],
    realWorldExamples: [
      {
        company: "Renaissance Technologies",
        implementation: "Medallion Fund using statistical arbitrage",
        results: "35% annual returns over 30 years"
      },
      {
        company: "Two Sigma",
        implementation: "Machine learning-driven quantitative strategies",
        results: "$60B+ assets under management"
      }
    ],
    icon: BarChart3,
    nodeTypes: ["ai_agent", "real_time_processor", "risk_manager", "compliance_engine"],
    estimatedUsers: "100-500 traders",
    dataVolume: "10TB+ per day"
  },

  "smart_city_iot_platform": {
    id: "smart_city_iot_platform",
    title: "Smart City IoT Management Platform",
    description: "Comprehensive IoT platform for managing city infrastructure with predictive analytics",
    industry: "Government/Public Sector",
    complexity: "Enterprise",
    estimatedCost: "$5M - $25M",
    timeToImplement: "18-36 months",
    businessValue: [
      "30% reduction in energy consumption",
      "50% faster emergency response times",
      "Predictive maintenance reducing infrastructure costs",
      "Improved citizen services and satisfaction",
      "Data-driven city planning decisions"
    ],
    technicalRequirements: [
      "IoT sensor networks across the city",
      "Edge computing infrastructure",
      "Real-time data processing capabilities",
      "Machine learning for predictive analytics",
      "Citizen-facing mobile applications"
    ],
    keyComponents: [
      "iot_sensor_network", "edge_processor", "analytics_engine", 
      "predictive_maintenance", "citizen_portal", "emergency_response"
    ],
    scalabilityFactors: [
      "Support for millions of IoT devices",
      "Geographic distribution across city districts",
      "Multi-protocol IoT communication",
      "Elastic cloud infrastructure"
    ],
    riskFactors: [
      "Privacy and surveillance concerns",
      "Cybersecurity vulnerabilities",
      "Technology obsolescence",
      "Integration complexity",
      "Political and budget constraints"
    ],
    successMetrics: [
      "99.9% sensor uptime",
      "Sub-second emergency alert delivery",
      "30% reduction in maintenance costs",
      "90% citizen satisfaction score",
      "ROI positive within 3 years"
    ],
    realWorldExamples: [
      {
        company: "Barcelona Smart City",
        implementation: "Integrated IoT sensors for parking, lighting, and waste management",
        results: "€36.5M annual savings, 30% reduction in water usage"
      },
      {
        company: "Singapore Smart Nation",
        implementation: "Comprehensive sensor network with AI analytics",
        results: "25% improvement in traffic flow, 20% energy savings"
      }
    ],
    icon: Building,
    nodeTypes: ["iot_gateway", "edge_processor", "analytics_engine", "alert_system"],
    estimatedUsers: "1M+ citizens",
    dataVolume: "100TB+ per day"
  },

  "global_supply_chain_optimizer": {
    id: "global_supply_chain_optimizer",
    title: "Global Supply Chain Optimization Platform",
    description: "AI-driven supply chain management with real-time optimization and risk mitigation",
    industry: "Manufacturing/Retail",
    complexity: "Enterprise",
    estimatedCost: "$3M - $15M",
    timeToImplement: "12-24 months",
    businessValue: [
      "25% reduction in inventory carrying costs",
      "40% improvement in delivery times",
      "Real-time supply chain visibility",
      "Automated risk mitigation",
      "Sustainability tracking and optimization"
    ],
    technicalRequirements: [
      "Integration with ERP and WMS systems",
      "Real-time tracking and IoT sensors",
      "Machine learning for demand forecasting",
      "Blockchain for supply chain transparency",
      "Mobile apps for stakeholders"
    ],
    keyComponents: [
      "demand_forecaster", "inventory_optimizer", "logistics_coordinator",
      "supplier_network", "risk_monitor", "sustainability_tracker"
    ],
    scalabilityFactors: [
      "Multi-region support",
      "Thousands of suppliers and vendors",
      "Real-time processing of logistics data",
      "Integration with multiple systems"
    ],
    riskFactors: [
      "Supplier dependency and disruptions",
      "Geopolitical risks",
      "Technology integration complexity",
      "Data quality and consistency",
      "Change management resistance"
    ],
    successMetrics: [
      "Perfect order rate > 98%",
      "Inventory turnover improvement > 30%",
      "Supply chain visibility > 95%",
      "Cost reduction > 20%",
      "Customer satisfaction > 90%"
    ],
    realWorldExamples: [
      {
        company: "Amazon",
        implementation: "Predictive analytics and automated warehousing",
        results: "Same-day delivery for 75% of orders"
      },
      {
        company: "Walmart",
        implementation: "Blockchain-based food traceability system",
        results: "Food tracing time reduced from weeks to seconds"
      }
    ],
    icon: Truck,
    nodeTypes: ["ai_optimizer", "blockchain_tracker", "iot_sensors", "analytics_engine"],
    estimatedUsers: "10K+ employees",
    dataVolume: "50TB+ per day"
  },

  "personalized_healthcare_platform": {
    id: "personalized_healthcare_platform",
    title: "Personalized Healthcare AI Platform",
    description: "AI-powered personalized medicine platform with genomic analysis and treatment optimization",
    industry: "Healthcare",
    complexity: "Enterprise",
    estimatedCost: "$10M - $50M",
    timeToImplement: "24-48 months",
    businessValue: [
      "Personalized treatment plans based on genetic profiles",
      "Early disease detection and prevention",
      "Reduced adverse drug reactions",
      "Improved patient outcomes and survival rates",
      "Accelerated drug discovery processes"
    ],
    technicalRequirements: [
      "Genomic sequencing and analysis capabilities",
      "HIPAA-compliant infrastructure",
      "Machine learning for pattern recognition",
      "Integration with electronic health records",
      "Secure patient data management"
    ],
    keyComponents: [
      "genomic_analyzer", "ai_diagnostics", "treatment_optimizer",
      "drug_interaction_checker", "clinical_decision_support", "patient_portal"
    ],
    scalabilityFactors: [
      "Processing large genomic datasets",
      "Multi-institutional collaboration",
      "Integration with diverse health systems",
      "Global patient population support"
    ],
    riskFactors: [
      "Regulatory compliance (FDA, HIPAA)",
      "Privacy and genetic data protection",
      "Ethical considerations",
      "Technology validation and clinical trials",
      "Healthcare system integration challenges"
    ],
    successMetrics: [
      "Diagnostic accuracy > 95%",
      "Treatment efficacy improvement > 40%",
      "Adverse reaction reduction > 60%",
      "Patient satisfaction > 90%",
      "Regulatory approval rate > 80%"
    ],
    realWorldExamples: [
      {
        company: "23andMe",
        implementation: "Consumer genetic testing with health insights",
        results: "12M+ customers, FDA-approved health reports"
      },
      {
        company: "IBM Watson Health",
        implementation: "AI-powered cancer treatment recommendations",
        results: "96% concordance with oncologist recommendations"
      }
    ],
    icon: Microscope,
    nodeTypes: ["ai_diagnostics", "genomic_processor", "clinical_ai", "secure_database"],
    estimatedUsers: "1M+ patients",
    dataVolume: "1PB+ genomic data"
  },

  "autonomous_content_creation": {
    id: "autonomous_content_creation",
    title: "Autonomous Content Creation Studio",
    description: "AI-powered content generation platform for multimedia content across all channels",
    industry: "Media/Entertainment",
    complexity: "Complex",
    estimatedCost: "$1M - $5M",
    timeToImplement: "8-15 months",
    businessValue: [
      "90% reduction in content production time",
      "Personalized content for every audience segment",
      "Multi-language content generation",
      "Real-time trend adaptation",
      "Consistent brand voice across all channels"
    ],
    technicalRequirements: [
      "Large language models for text generation",
      "Computer vision for image/video creation",
      "Voice synthesis and audio processing",
      "Brand guidelines and style enforcement",
      "Multi-platform publishing automation"
    ],
    keyComponents: [
      "content_generator", "brand_enforcer", "trend_analyzer",
      "multi_media_processor", "quality_controller", "distribution_manager"
    ],
    scalabilityFactors: [
      "Support for multiple content types",
      "High-volume content generation",
      "Multi-language capabilities",
      "Real-time processing requirements"
    ],
    riskFactors: [
      "Content quality and authenticity",
      "Copyright and intellectual property",
      "Brand reputation risks",
      "Technology dependence",
      "Creative industry disruption"
    ],
    successMetrics: [
      "Content production speed 10x faster",
      "Engagement rates > 15% improvement",
      "Cost per content piece < 50% traditional",
      "Quality score > 85%",
      "Brand consistency > 95%"
    ],
    realWorldExamples: [
      {
        company: "The Washington Post",
        implementation: "Heliograf AI for automated sports and election reporting",
        results: "850+ articles generated, freeing journalists for complex stories"
      },
      {
        company: "Associated Press",
        implementation: "Automated earnings reports using AI",
        results: "4,400+ earnings stories per quarter"
      }
    ],
    icon: PenTool,
    nodeTypes: ["ai_writer", "image_generator", "video_processor", "brand_analyzer"],
    estimatedUsers: "1K+ content creators",
    dataVolume: "10TB+ per day"
  },

  "quantum_computing_simulator": {
    id: "quantum_computing_simulator",
    title: "Quantum Computing Simulation Platform",
    description: "Cloud-based quantum computing simulator for research and algorithm development",
    industry: "Technology/Research",
    complexity: "Enterprise",
    estimatedCost: "$5M - $20M",
    timeToImplement: "18-30 months",
    businessValue: [
      "Accelerated quantum algorithm development",
      "Research collaboration platform",
      "Quantum advantage demonstration",
      "Educational and training capabilities",
      "Commercial quantum application testing"
    ],
    technicalRequirements: [
      "High-performance computing clusters",
      "Quantum circuit simulation engines",
      "Quantum algorithm libraries",
      "Visualization and debugging tools",
      "Cloud-based access infrastructure"
    ],
    keyComponents: [
      "quantum_simulator", "circuit_designer", "algorithm_library",
      "performance_analyzer", "collaboration_tools", "educational_platform"
    ],
    scalabilityFactors: [
      "Support for large qubit systems",
      "Parallel simulation capabilities",
      "Global researcher access",
      "Multiple quantum computing models"
    ],
    riskFactors: [
      "Technology complexity and expertise",
      "Hardware requirements and costs",
      "Quantum computing evolution",
      "Competition from tech giants",
      "Limited commercial applications"
    ],
    successMetrics: [
      "Simulation accuracy > 99.9%",
      "Support for 1000+ qubit systems",
      "Research publications > 100/year",
      "User adoption > 10K researchers",
      "Commercial partnerships > 50"
    ],
    realWorldExamples: [
      {
        company: "IBM Qiskit",
        implementation: "Open-source quantum computing framework",
        results: "400K+ users, 2B+ quantum circuits executed"
      },
      {
        company: "Google Cirq",
        implementation: "Quantum circuit simulation platform",
        results: "Quantum supremacy demonstration achievement"
      }
    ],
    icon: Cpu,
    nodeTypes: ["quantum_processor", "circuit_simulator", "algorithm_engine", "visualization"],
    estimatedUsers: "10K+ researchers",
    dataVolume: "100TB+ simulations"
  },

  "decentralized_finance_platform": {
    id: "decentralized_finance_platform",
    title: "Decentralized Finance (DeFi) Platform",
    description: "Complete DeFi ecosystem with lending, trading, and yield farming capabilities",
    industry: "Financial Technology",
    complexity: "Enterprise",
    estimatedCost: "$2M - $8M",
    timeToImplement: "12-20 months",
    businessValue: [
      "Democratized access to financial services",
      "Automated market making and liquidity provision",
      "Transparent and auditable transactions",
      "Global accessibility without traditional banking",
      "Programmable money and smart contracts"
    ],
    technicalRequirements: [
      "Blockchain infrastructure (Ethereum, Polygon)",
      "Smart contract development and auditing",
      "Decentralized exchange (DEX) protocols",
      "Oracle integration for price feeds",
      "Web3 user interface and wallet integration"
    ],
    keyComponents: [
      "smart_contracts", "dex_protocol", "lending_pool",
      "yield_farming", "governance_token", "oracle_network"
    ],
    scalabilityFactors: [
      "Layer 2 scaling solutions",
      "Cross-chain interoperability",
      "High transaction throughput",
      "Global user base support"
    ],
    riskFactors: [
      "Smart contract vulnerabilities",
      "Regulatory uncertainty",
      "Market volatility and liquidations",
      "Technical complexity for users",
      "Scalability limitations"
    ],
    successMetrics: [
      "Total Value Locked (TVL) > $1B",
      "Daily active users > 100K",
      "Transaction volume > $100M/day",
      "Security audit score > 95%",
      "Cross-chain integration > 5 networks"
    ],
    realWorldExamples: [
      {
        company: "Uniswap",
        implementation: "Automated market maker protocol",
        results: "$10B+ TVL, 4M+ users"
      },
      {
        company: "Aave",
        implementation: "Decentralized lending and borrowing protocol",
        results: "$12B+ TVL, 500K+ users"
      }
    ],
    icon: Bitcoin,
    nodeTypes: ["smart_contract", "blockchain_node", "dex_engine", "oracle_feed"],
    estimatedUsers: "1M+ DeFi users",
    dataVolume: "1TB+ blockchain data"
  },

  "metaverse_collaboration_platform": {
    id: "metaverse_collaboration_platform",
    title: "Enterprise Metaverse Collaboration Platform",
    description: "Immersive virtual workspace for remote collaboration and training",
    industry: "Technology/Collaboration",
    complexity: "Complex",
    estimatedCost: "$3M - $12M",
    timeToImplement: "15-24 months",
    businessValue: [
      "Enhanced remote collaboration experiences",
      "Immersive training and onboarding",
      "Virtual events and conferences",
      "Reduced travel and office costs",
      "Innovative customer engagement"
    ],
    technicalRequirements: [
      "3D rendering and game engines",
      "Virtual reality and augmented reality support",
      "Real-time multiplayer networking",
      "Spatial audio and communication",
      "Avatar and identity management"
    ],
    keyComponents: [
      "vr_engine", "avatar_system", "spatial_audio",
      "collaboration_tools", "content_management", "analytics_platform"
    ],
    scalabilityFactors: [
      "Concurrent user support",
      "Cross-platform compatibility",
      "Global server infrastructure",
      "Bandwidth optimization"
    ],
    riskFactors: [
      "Technology adoption barriers",
      "Hardware requirements",
      "Motion sickness and user comfort",
      "Privacy and security concerns",
      "Content moderation challenges"
    ],
    successMetrics: [
      "Concurrent users > 10K",
      "Session duration > 60 minutes",
      "User satisfaction > 85%",
      "VR/AR device compatibility > 95%",
      "Network latency < 50ms"
    ],
    realWorldExamples: [
      {
        company: "Meta Horizon Workrooms",
        implementation: "VR meeting and collaboration platform",
        results: "500K+ downloads, enterprise partnerships"
      },
      {
        company: "Microsoft Mesh",
        implementation: "Mixed reality collaboration platform",
        results: "Integration with Teams, enterprise adoption"
      }
    ],
    icon: Users,
    nodeTypes: ["vr_renderer", "multiplayer_server", "avatar_service", "spatial_audio"],
    estimatedUsers: "100K+ remote workers",
    dataVolume: "50TB+ 3D assets"
  }
};

export const industryCategories = [
  "Financial Services",
  "Healthcare",
  "Manufacturing/Retail",
  "Technology/Research",
  "Government/Public Sector",
  "Media/Entertainment",
  "Financial Technology",
  "Technology/Collaboration"
];

export const complexityLevels = [
  "Simple",
  "Moderate", 
  "Complex",
  "Enterprise"
];

export function getUseCasesByIndustry(industry: string): UseCase[] {
  return Object.values(orchestrationUseCases).filter(useCase => useCase.industry === industry);
}

export function getUseCasesByComplexity(complexity: string): UseCase[] {
  return Object.values(orchestrationUseCases).filter(useCase => useCase.complexity === complexity);
}

export function searchUseCases(query: string): UseCase[] {
  const searchTerm = query.toLowerCase();
  return Object.values(orchestrationUseCases).filter(useCase =>
    useCase.title.toLowerCase().includes(searchTerm) ||
    useCase.description.toLowerCase().includes(searchTerm) ||
    useCase.industry.toLowerCase().includes(searchTerm) ||
    useCase.businessValue.some(value => value.toLowerCase().includes(searchTerm))
  );
}