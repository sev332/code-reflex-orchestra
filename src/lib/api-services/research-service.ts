import { apiRegistry } from '../api-registry';

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  pdfUrl?: string;
  publishedDate: string;
  category: string;
  journal?: string;
  citations?: number;
  keywords: string[];
}

export interface WikipediaPage {
  title: string;
  extract: string;
  url: string;
  image?: string;
  categories: string[];
  links: string[];
}

export class ResearchService {
  private static instance: ResearchService;
  
  static getInstance(): ResearchService {
    if (!ResearchService.instance) {
      ResearchService.instance = new ResearchService();
    }
    return ResearchService.instance;
  }

  async searchArxivPapers(query: string, options: {
    maxResults?: number;
    category?: string;
    sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  } = {}): Promise<ResearchPaper[]> {
    const api = apiRegistry.getAPI('arxiv');
    if (!api) {
      throw new Error('ArXiv API not available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      // Mock implementation - would use actual ArXiv API
      const papers: ResearchPaper[] = [
        {
          id: 'arxiv:2401.00001',
          title: 'Advances in Large Language Models for 2025',
          authors: ['Dr. AI Researcher', 'Prof. ML Expert'],
          abstract: 'This paper presents recent advances in large language models, focusing on efficiency improvements and novel architectures that emerged in 2025.',
          url: 'https://arxiv.org/abs/2401.00001',
          pdfUrl: 'https://arxiv.org/pdf/2401.00001.pdf',
          publishedDate: '2025-01-01',
          category: 'cs.AI',
          citations: 42,
          keywords: ['artificial intelligence', 'language models', 'machine learning']
        },
        {
          id: 'arxiv:2401.00002',
          title: 'Autonomous Agent Architectures: A Survey',
          authors: ['Dr. Autonomous Systems', 'Prof. AI Architecture'],
          abstract: 'A comprehensive survey of autonomous agent architectures, covering multi-agent systems, decision-making frameworks, and real-world applications.',
          url: 'https://arxiv.org/abs/2401.00002',
          pdfUrl: 'https://arxiv.org/pdf/2401.00002.pdf',
          publishedDate: '2025-01-02',
          category: 'cs.MA',
          citations: 28,
          keywords: ['autonomous agents', 'multi-agent systems', 'architecture']
        }
      ];

      success = true;
      return papers.slice(0, options.maxResults || 10);
    } catch (error) {
      console.error('Error searching ArXiv papers:', error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  async getWikipediaPage(title: string): Promise<WikipediaPage> {
    const api = apiRegistry.getAPI('wikipedia');
    if (!api) {
      throw new Error('Wikipedia API not available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      // Mock implementation - would use actual Wikipedia API
      const page: WikipediaPage = {
        title,
        extract: `This is a comprehensive article about ${title}. It covers the definition, history, applications, and current research in the field. The topic has evolved significantly over the years and continues to be an active area of research and development.`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        image: 'https://upload.wikimedia.org/wikipedia/commons/placeholder.jpg',
        categories: ['Technology', 'Science', 'Research'],
        links: ['Related Topic 1', 'Related Topic 2', 'History of ' + title]
      };

      success = true;
      return page;
    } catch (error) {
      console.error('Error fetching Wikipedia page:', error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  async searchWikipedia(query: string, limit: number = 10): Promise<string[]> {
    const api = apiRegistry.getAPI('wikipedia');
    if (!api) {
      throw new Error('Wikipedia API not available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      // Mock implementation
      const results = [
        `${query} (overview)`,
        `${query} in practice`,
        `History of ${query}`,
        `${query} applications`,
        `Future of ${query}`
      ];

      success = true;
      return results.slice(0, limit);
    } catch (error) {
      console.error('Error searching Wikipedia:', error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  async getCitationInfo(paperId: string): Promise<{
    citationCount: number;
    citedBy: Array<{
      title: string;
      authors: string[];
      year: string;
      url?: string;
    }>;
  }> {
    // Mock implementation for citation information
    return {
      citationCount: Math.floor(Math.random() * 100),
      citedBy: [
        {
          title: 'Follow-up Research on the Topic',
          authors: ['Researcher A', 'Researcher B'],
          year: '2025',
          url: 'https://example.com/citation1'
        },
        {
          title: 'Practical Applications Study',
          authors: ['Practitioner C'],
          year: '2025',
          url: 'https://example.com/citation2'
        }
      ]
    };
  }

  async getRelatedPapers(paperId: string, maxResults: number = 5): Promise<ResearchPaper[]> {
    // Mock implementation - would use semantic similarity or citation networks
    return this.searchArxivPapers('related research', { maxResults });
  }
}