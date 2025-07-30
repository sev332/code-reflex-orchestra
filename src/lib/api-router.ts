import { apiRegistry, APIDefinition } from './api-registry';
import { NewsService } from './api-services/news-service';
import { WeatherService } from './api-services/weather-service';
import { GitHubService } from './api-services/github-service';
import { ResearchService } from './api-services/research-service';

export interface APIRequest {
  category: string;
  action: string;
  parameters: Record<string, any>;
  context?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  source: string;
  responseTime: number;
  cached?: boolean;
}

export class APIRouter {
  private static instance: APIRouter;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): APIRouter {
    if (!APIRouter.instance) {
      APIRouter.instance = new APIRouter();
    }
    return APIRouter.instance;
  }

  async route(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        source: 'cache',
        responseTime: Date.now() - startTime,
        cached: true
      };
    }

    try {
      let result: any;
      let source: string;

      switch (request.category) {
        case 'news':
          result = await this.handleNewsRequest(request);
          source = 'news-service';
          break;
        case 'weather':
          result = await this.handleWeatherRequest(request);
          source = 'weather-service';
          break;
        case 'development':
        case 'github':
          result = await this.handleGitHubRequest(request);
          source = 'github-service';
          break;
        case 'research':
        case 'knowledge':
          result = await this.handleResearchRequest(request);
          source = 'research-service';
          break;
        default:
          throw new Error(`Unsupported category: ${request.category}`);
      }

      // Cache successful results
      this.setCache(cacheKey, result);

      return {
        success: true,
        data: result,
        source,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'router',
        responseTime: Date.now() - startTime
      };
    }
  }

  private async handleNewsRequest(request: APIRequest): Promise<any> {
    const newsService = NewsService.getInstance();

    switch (request.action) {
      case 'get_news':
        return newsService.getNews(request.parameters);
      case 'get_headlines':
        return newsService.getTopHeadlines(
          request.parameters.country,
          request.parameters.category
        );
      case 'search':
        return newsService.searchNews(
          request.parameters.query,
          request.parameters.options
        );
      default:
        throw new Error(`Unsupported news action: ${request.action}`);
    }
  }

  private async handleWeatherRequest(request: APIRequest): Promise<any> {
    const weatherService = WeatherService.getInstance();

    switch (request.action) {
      case 'current':
        return weatherService.getCurrentWeather(request.parameters.location);
      case 'forecast':
        return weatherService.getForecast(
          request.parameters.location,
          request.parameters.days
        );
      case 'alerts':
        return weatherService.getWeatherAlerts(request.parameters.location);
      default:
        throw new Error(`Unsupported weather action: ${request.action}`);
    }
  }

  private async handleGitHubRequest(request: APIRequest): Promise<any> {
    const githubService = GitHubService.getInstance();

    switch (request.action) {
      case 'search_repos':
        return githubService.searchRepositories(
          request.parameters.query,
          request.parameters.options
        );
      case 'get_repo':
        return githubService.getRepository(
          request.parameters.owner,
          request.parameters.repo
        );
      case 'get_issues':
        return githubService.getRepositoryIssues(
          request.parameters.owner,
          request.parameters.repo,
          request.parameters.options
        );
      case 'trending':
        return githubService.getTrendingRepositories(
          request.parameters.language,
          request.parameters.since
        );
      default:
        throw new Error(`Unsupported GitHub action: ${request.action}`);
    }
  }

  private async handleResearchRequest(request: APIRequest): Promise<any> {
    const researchService = ResearchService.getInstance();

    switch (request.action) {
      case 'search_papers':
        return researchService.searchArxivPapers(
          request.parameters.query,
          request.parameters.options
        );
      case 'get_wikipedia':
        return researchService.getWikipediaPage(request.parameters.title);
      case 'search_wikipedia':
        return researchService.searchWikipedia(
          request.parameters.query,
          request.parameters.limit
        );
      case 'get_citations':
        return researchService.getCitationInfo(request.parameters.paperId);
      case 'get_related':
        return researchService.getRelatedPapers(
          request.parameters.paperId,
          request.parameters.maxResults
        );
      default:
        throw new Error(`Unsupported research action: ${request.action}`);
    }
  }

  async batchRoute(requests: APIRequest[]): Promise<APIResponse[]> {
    const promises = requests.map(request => this.route(request));
    return Promise.all(promises);
  }

  async routeWithFallback(request: APIRequest, fallbackAPIs: string[] = []): Promise<APIResponse> {
    try {
      return await this.route(request);
    } catch (error) {
      console.warn(`Primary API failed for ${request.category}:${request.action}:`, error);
      
      // Try fallback APIs
      for (const apiId of fallbackAPIs) {
        try {
          const api = apiRegistry.getAPI(apiId);
          if (api && api.capabilities.includes(request.category)) {
            // Attempt with fallback API
            return await this.route(request);
          }
        } catch (fallbackError) {
          console.warn(`Fallback API ${apiId} also failed:`, fallbackError);
        }
      }

      throw error;
    }
  }

  private generateCacheKey(request: APIRequest): string {
    return `${request.category}:${request.action}:${JSON.stringify(request.parameters)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_DURATION
    });
  }

  getAPIStatus(): Array<{
    id: string;
    name: string;
    category: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    requests: number;
    errors: number;
    successRate: number;
  }> {
    return apiRegistry.getAllAPIs().map(api => {
      const stats = apiRegistry.getUsageStats(api.id);
      const successRate = stats ? 
        ((stats.requests - stats.errors) / Math.max(stats.requests, 1)) * 100 : 100;
      
      return {
        id: api.id,
        name: api.name,
        category: api.category,
        status: successRate > 95 ? 'healthy' : successRate > 80 ? 'degraded' : 'down',
        responseTime: stats?.avgResponseTime || 0,
        requests: stats?.requests || 0,
        errors: stats?.errors || 0,
        successRate
      };
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}