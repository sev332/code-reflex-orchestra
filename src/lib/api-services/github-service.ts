import { apiRegistry } from '../api-registry';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  language: string;
  stars: number;
  forks: number;
  issues: number;
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubSearchResult {
  total_count: number;
  repositories: GitHubRepository[];
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
}

export class GitHubService {
  private static instance: GitHubService;
  
  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  async searchRepositories(query: string, options: {
    sort?: 'stars' | 'forks' | 'updated';
    order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubSearchResult> {
    const api = apiRegistry.getAPI('github');
    if (!api) {
      throw new Error('GitHub API not available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      // Mock implementation - would use actual GitHub API
      const mockRepos: GitHubRepository[] = [
        {
          id: 1,
          name: 'awesome-ai',
          full_name: 'user/awesome-ai',
          description: 'A curated list of AI resources',
          html_url: 'https://github.com/user/awesome-ai',
          clone_url: 'https://github.com/user/awesome-ai.git',
          language: 'Python',
          stars: 1500,
          forks: 250,
          issues: 12,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
          owner: {
            login: 'user',
            avatar_url: 'https://github.com/avatars/user'
          }
        }
      ];

      const result: GitHubSearchResult = {
        total_count: mockRepos.length,
        repositories: mockRepos
      };

      success = true;
      return result;
    } catch (error) {
      console.error('Error searching GitHub repositories:', error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const api = apiRegistry.getAPI('github');
    if (!api) {
      throw new Error('GitHub API not available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      // Mock implementation
      const repository: GitHubRepository = {
        id: 1,
        name: repo,
        full_name: `${owner}/${repo}`,
        description: 'Repository description',
        html_url: `https://github.com/${owner}/${repo}`,
        clone_url: `https://github.com/${owner}/${repo}.git`,
        language: 'TypeScript',
        stars: 100,
        forks: 25,
        issues: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
        owner: {
          login: owner,
          avatar_url: `https://github.com/avatars/${owner}`
        }
      };

      success = true;
      return repository;
    } catch (error) {
      console.error('Error fetching GitHub repository:', error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  async getRepositoryIssues(owner: string, repo: string, options: {
    state?: 'open' | 'closed' | 'all';
    sort?: 'created' | 'updated' | 'comments';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubIssue[]> {
    const api = apiRegistry.getAPI('github');
    if (!api) {
      throw new Error('GitHub API not available');
    }

    const startTime = Date.now();
    let success = false;

    try {
      // Mock implementation
      const issues: GitHubIssue[] = [
        {
          id: 1,
          number: 1,
          title: 'Add new feature',
          body: 'Description of the feature request',
          state: 'open',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
          html_url: `https://github.com/${owner}/${repo}/issues/1`,
          user: {
            login: 'contributor',
            avatar_url: 'https://github.com/avatars/contributor'
          },
          labels: [
            { name: 'enhancement', color: 'a2eeef' },
            { name: 'good first issue', color: '7057ff' }
          ]
        }
      ];

      success = true;
      return issues;
    } catch (error) {
      console.error('Error fetching repository issues:', error);
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      apiRegistry.recordAPIUsage(api.id, responseTime, success);
    }
  }

  async getTrendingRepositories(language?: string, since: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<GitHubRepository[]> {
    // Mock implementation for trending repositories
    return this.searchRepositories(`created:>${this.getDateString(since)} ${language ? `language:${language}` : ''}`, {
      sort: 'stars',
      order: 'desc',
      per_page: 30
    }).then(result => result.repositories);
  }

  private getDateString(since: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    const daysAgo = since === 'daily' ? 1 : since === 'weekly' ? 7 : 30;
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }
}