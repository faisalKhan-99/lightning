import { COLOSSEUM_API_KEY, COLOSSEUM_API_BASE } from '../config.js';

export interface AgentStatus {
  status: string;
  hackathon: {
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    currentDay: number;
    daysRemaining: number;
    timeRemainingMs: number;
    timeRemainingFormatted: string;
  };
  skillUrl: string;
  heartbeatUrl: string;
  engagement: {
    forumPostCount: number;
    repliesOnYourPosts: number;
    projectStatus: string;
  };
  nextSteps: string[];
  hasActivePoll: boolean;
  announcement?: {
    title: string;
    message: string;
  };
}

export interface ActivePoll {
  poll: {
    id: number;
    slug: string;
    title: string;
    prompt: string;
    responseSchema: object;
    activeFrom: string;
    activeUntil: string;
    pollUrl: string;
    submitUrl: string;
    exampleRequest: string;
  };
}

export interface ForumPost {
  id: number;
  agentId: number;
  agentName: string;
  title: string;
  body: string;
  tags: string[];
  score: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  hackathonId: number;
  name: string;
  slug: string;
  description: string;
  repoLink?: string;
  solanaIntegration?: string;
  technicalDemoLink?: string;
  presentationLink?: string;
  tags: string[];
  status: 'draft' | 'submitted';
  humanUpvotes: number;
  agentUpvotes: number;
}

class ColosseumAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = COLOSSEUM_API_KEY;
    this.baseUrl = COLOSSEUM_API_BASE;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Colosseum API error ${response.status}: ${error}`);
    }

    return response.json();
  }

  // Agent Status
  async getStatus(): Promise<AgentStatus> {
    return this.request<AgentStatus>('/agents/status');
  }

  // Polls
  async getActivePoll(): Promise<ActivePoll | null> {
    try {
      return await this.request<ActivePoll>('/agents/polls/active');
    } catch (err) {
      return null;
    }
  }

  async submitPollResponse(pollId: number, response: object): Promise<void> {
    await this.request(`/agents/polls/${pollId}/response`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  // Forum
  async getForumPosts(sort: 'hot' | 'new' | 'top' = 'hot', limit = 10): Promise<{ posts: ForumPost[] }> {
    return this.request<{ posts: ForumPost[] }>(`/forum/posts?sort=${sort}&limit=${limit}`);
  }

  async getMyPosts(): Promise<{ posts: ForumPost[] }> {
    return this.request<{ posts: ForumPost[] }>('/forum/me/posts');
  }

  async createPost(title: string, body: string, tags: string[]): Promise<{ post: ForumPost }> {
    return this.request<{ post: ForumPost }>('/forum/posts', {
      method: 'POST',
      body: JSON.stringify({ title, body, tags }),
    });
  }

  async createComment(postId: number, body: string): Promise<void> {
    await this.request(`/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  // Project
  async getMyProject(): Promise<{ project: Project } | null> {
    try {
      return await this.request<{ project: Project }>('/my-project');
    } catch (err) {
      return null;
    }
  }

  async createProject(data: {
    name: string;
    description: string;
    repoLink?: string;
    solanaIntegration?: string;
    technicalDemoLink?: string;
    presentationLink?: string;
    tags?: string[];
  }): Promise<{ project: Project }> {
    return this.request<{ project: Project }>('/my-project', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(data: Partial<{
    name: string;
    description: string;
    repoLink: string;
    solanaIntegration: string;
    technicalDemoLink: string;
    presentationLink: string;
    tags: string[];
  }>): Promise<{ project: Project }> {
    return this.request<{ project: Project }>('/my-project', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Leaderboard
  async getLeaderboard(): Promise<{ projects: Project[] }> {
    return this.request<{ projects: Project[] }>('/leaderboard');
  }
}

export const colosseumAPI = new ColosseumAPI();
