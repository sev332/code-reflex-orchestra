import { apiRegistry } from '../api-registry';

export interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  source: string;
  author?: string;
  imageUrl?: string;
}

export interface NewsSearchParams {
  query?: string;
  category?: string;
  country?: string;
  sources?: string[];
  from?: string;
  to?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number;
  page?: number;
}

export class NewsService {
  private static instance: NewsService;
  
  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  async getNews(params: NewsSearchParams = {}): Promise<NewsArticle[]> {
    const api = apiRegistry.getBestAPIForTask(['news', 'headlines']);
    if (!api) {
      throw new Error('No news API available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      let articles: NewsArticle[] = [];

      switch (api.id) {
        case 'newsapi':
          articles = await this.fetchFromNewsAPI(params);
          break;
        case 'guardian':
          articles = await this.fetchFromGuardian(params);
          break;
        default:
          throw new Error(`Unsupported news API: ${api.id}`);
      }

      success = true;
      return articles;
    } catch (error) {
      console.error(`Error fetching news from ${api.id}:`, error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  private async fetchFromNewsAPI(params: NewsSearchParams): Promise<NewsArticle[]> {
    // This would use the actual NewsAPI - for now returning mock data
    return [
      {
        title: "Breaking: AI Advances in 2025",
        description: "Latest developments in artificial intelligence show remarkable progress",
        content: "Full article content here...",
        url: "https://example.com/ai-advances",
        publishedAt: new Date().toISOString(),
        source: "Tech News",
        author: "AI Reporter",
        imageUrl: "https://example.com/ai-image.jpg"
      }
    ];
  }

  private async fetchFromGuardian(params: NewsSearchParams): Promise<NewsArticle[]> {
    // This would use the actual Guardian API - for now returning mock data
    return [
      {
        title: "Global Climate Update",
        description: "Recent climate changes and their impact",
        content: "Detailed climate analysis...",
        url: "https://theguardian.com/climate-update",
        publishedAt: new Date().toISOString(),
        source: "The Guardian",
        author: "Climate Correspondent"
      }
    ];
  }

  async getTopHeadlines(country?: string, category?: string): Promise<NewsArticle[]> {
    return this.getNews({
      country,
      category,
      sortBy: 'popularity',
      pageSize: 20
    });
  }

  async searchNews(query: string, options: Partial<NewsSearchParams> = {}): Promise<NewsArticle[]> {
    return this.getNews({
      query,
      sortBy: 'relevancy',
      ...options
    });
  }
}