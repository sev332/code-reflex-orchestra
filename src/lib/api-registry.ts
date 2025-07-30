export interface APIDefinition {
  id: string;
  name: string;
  category: string;
  baseUrl: string;
  requiresAuth: boolean;
  authType: 'bearer' | 'api-key' | 'oauth' | 'basic';
  rateLimit: {
    requests: number;
    window: number; // in milliseconds
  };
  capabilities: string[];
  cost: 'free' | 'paid' | 'freemium';
  reliability: number; // 0-1 score
  documentation: string;
  healthEndpoint?: string;
}

export interface APIUsageStats {
  apiId: string;
  requests: number;
  errors: number;
  avgResponseTime: number;
  lastUsed: string;
  rateLimitHit: number;
}

export class APIRegistry {
  private static instance: APIRegistry;
  private apis: Map<string, APIDefinition> = new Map();
  private usageStats: Map<string, APIUsageStats> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  static getInstance(): APIRegistry {
    if (!APIRegistry.instance) {
      APIRegistry.instance = new APIRegistry();
    }
    return APIRegistry.instance;
  }

  registerAPI(api: APIDefinition): void {
    this.apis.set(api.id, api);
    if (!this.usageStats.has(api.id)) {
      this.usageStats.set(api.id, {
        apiId: api.id,
        requests: 0,
        errors: 0,
        avgResponseTime: 0,
        lastUsed: new Date().toISOString(),
        rateLimitHit: 0
      });
    }
  }

  getAPI(id: string): APIDefinition | undefined {
    return this.apis.get(id);
  }

  getAPIsByCategory(category: string): APIDefinition[] {
    return Array.from(this.apis.values()).filter(api => api.category === category);
  }

  getAPIsByCapability(capability: string): APIDefinition[] {
    return Array.from(this.apis.values()).filter(api => 
      api.capabilities.includes(capability)
    );
  }

  getBestAPIForTask(capabilities: string[], preferredCost: string[] = ['free', 'freemium']): APIDefinition | null {
    const candidates = Array.from(this.apis.values()).filter(api => {
      const hasCapabilities = capabilities.some(cap => api.capabilities.includes(cap));
      const matchesCost = preferredCost.includes(api.cost);
      const isHealthy = !this.isRateLimited(api.id);
      return hasCapabilities && matchesCost && isHealthy;
    });

    if (candidates.length === 0) return null;

    // Sort by reliability score and usage stats
    return candidates.sort((a, b) => {
      const statsA = this.usageStats.get(a.id)!;
      const statsB = this.usageStats.get(b.id)!;
      const scoreA = a.reliability - (statsA.errors / Math.max(statsA.requests, 1));
      const scoreB = b.reliability - (statsB.errors / Math.max(statsB.requests, 1));
      return scoreB - scoreA;
    })[0];
  }

  recordAPIUsage(apiId: string, responseTime: number, success: boolean): void {
    const stats = this.usageStats.get(apiId);
    if (stats) {
      stats.requests++;
      if (!success) stats.errors++;
      stats.avgResponseTime = (stats.avgResponseTime + responseTime) / 2;
      stats.lastUsed = new Date().toISOString();
      this.usageStats.set(apiId, stats);
    }

    // Update rate limiting
    const api = this.apis.get(apiId);
    if (api) {
      const now = Date.now();
      const limit = this.rateLimits.get(apiId) || { count: 0, resetTime: now + api.rateLimit.window };
      
      if (now > limit.resetTime) {
        limit.count = 1;
        limit.resetTime = now + api.rateLimit.window;
      } else {
        limit.count++;
      }
      
      this.rateLimits.set(apiId, limit);
    }
  }

  isRateLimited(apiId: string): boolean {
    const api = this.apis.get(apiId);
    const limit = this.rateLimits.get(apiId);
    if (!api || !limit) return false;
    
    const now = Date.now();
    if (now > limit.resetTime) return false;
    
    return limit.count >= api.rateLimit.requests;
  }

  getUsageStats(apiId: string): APIUsageStats | undefined {
    return this.usageStats.get(apiId);
  }

  getAllAPIs(): APIDefinition[] {
    return Array.from(this.apis.values());
  }

  getAllUsageStats(): APIUsageStats[] {
    return Array.from(this.usageStats.values());
  }
}

// Pre-register core APIs
const registry = APIRegistry.getInstance();

// News APIs
registry.registerAPI({
  id: 'newsapi',
  name: 'NewsAPI',
  category: 'news',
  baseUrl: 'https://newsapi.org/v2',
  requiresAuth: true,
  authType: 'api-key',
  rateLimit: { requests: 1000, window: 24 * 60 * 60 * 1000 },
  capabilities: ['news', 'headlines', 'sources'],
  cost: 'freemium',
  reliability: 0.95,
  documentation: 'https://newsapi.org/docs'
});

registry.registerAPI({
  id: 'guardian',
  name: 'Guardian API',
  category: 'news',
  baseUrl: 'https://content.guardianapis.com',
  requiresAuth: true,
  authType: 'api-key',
  rateLimit: { requests: 5000, window: 24 * 60 * 60 * 1000 },
  capabilities: ['news', 'articles', 'content'],
  cost: 'free',
  reliability: 0.92,
  documentation: 'https://open-platform.theguardian.com/documentation/'
});

// Weather APIs
registry.registerAPI({
  id: 'openweathermap',
  name: 'OpenWeatherMap',
  category: 'weather',
  baseUrl: 'https://api.openweathermap.org/data/2.5',
  requiresAuth: true,
  authType: 'api-key',
  rateLimit: { requests: 1000, window: 24 * 60 * 60 * 1000 },
  capabilities: ['weather', 'forecast', 'climate'],
  cost: 'freemium',
  reliability: 0.98,
  documentation: 'https://openweathermap.org/api'
});

// GitHub API
registry.registerAPI({
  id: 'github',
  name: 'GitHub API',
  category: 'development',
  baseUrl: 'https://api.github.com',
  requiresAuth: true,
  authType: 'bearer',
  rateLimit: { requests: 5000, window: 60 * 60 * 1000 },
  capabilities: ['repositories', 'code', 'issues', 'search'],
  cost: 'free',
  reliability: 0.99,
  documentation: 'https://docs.github.com/en/rest'
});

// Wikipedia API
registry.registerAPI({
  id: 'wikipedia',
  name: 'Wikipedia API',
  category: 'knowledge',
  baseUrl: 'https://en.wikipedia.org/api/rest_v1',
  requiresAuth: false,
  authType: 'bearer',
  rateLimit: { requests: 100, window: 60 * 1000 },
  capabilities: ['encyclopedia', 'search', 'content'],
  cost: 'free',
  reliability: 0.97,
  documentation: 'https://www.mediawiki.org/wiki/API:Main_page'
});

// ArXiv API
registry.registerAPI({
  id: 'arxiv',
  name: 'ArXiv API',
  category: 'research',
  baseUrl: 'http://export.arxiv.org/api',
  requiresAuth: false,
  authType: 'bearer',
  rateLimit: { requests: 1000, window: 60 * 1000 },
  capabilities: ['research', 'papers', 'academic'],
  cost: 'free',
  reliability: 0.96,
  documentation: 'https://arxiv.org/help/api'
});

export { registry as apiRegistry };