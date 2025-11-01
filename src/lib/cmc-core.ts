// 🔗 CONNECT: AIM-OS Memory Foundation → Real CMC Implementation
// 🧩 INTENT: Hierarchical memory with RS-based retrieval, temporal decay, and Dumbbell compression
// ✅ SPEC: Phase 1 - Memory Foundation from AIM-OS architecture

import { supabase } from '@/integrations/supabase/client';
import crypto from 'crypto-js';

// Memory tier thresholds
const TIER_THRESHOLDS = {
  short: 200,      // ≤200 tokens - immediate context
  medium: 800,     // ≤800 tokens - session context  
  large: 8000,     // ≥800 tokens - long-term memory
  super_index: Infinity // external RAG
};

// Dumbbell compression config
const DUMBBELL_CONFIG = {
  head_tail_min: 0.20,  // Preserve ≥20% at head and tail
  compression_threshold: 0.15, // L < 0.15
  critical_spans: true  // Protect critical spans
};

// Temporal decay parameter
const DEFAULT_TAU = 0.95; // Exponential decay

export interface CMCMemory {
  id: string;
  content: string;
  content_hash: string;
  tier: 'short' | 'medium' | 'large' | 'super_index';
  token_count: number;
  
  // RS Score components
  quality_score?: number;      // QS
  index_depth_score?: number;  // IDS
  dependency_delta?: number;   // DD
  retrieval_score?: number;    // RS = QS × IDS × (1 - DD)
  
  // Metadata
  tags: string[];
  parent_tags: string[];
  importance: number;
  access_count: number;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
  
  // Compression
  is_compressed: boolean;
  compression_ratio?: number;
  original_token_count?: number;
  head_span?: number;
  tail_span?: number;
  
  // Provenance
  source?: string;
  user_id?: string;
  session_id?: string;
}

export interface TagNode {
  id: string;
  tag: string;
  parent_tag?: string;
  priority: number;
  access_count: number;
  last_accessed_at: string;
  decay_tau: number;
  created_at: string;
}

export interface RetrievalQuery {
  query: string;
  tags?: string[];
  tier?: CMCMemory['tier'];
  minScore?: number;
  limit?: number;
  session_id?: string;
}

/**
 * CMC Core: Contextual Memory Core with RS-based retrieval
 * Implements hierarchical memory, tag graphs, and Dumbbell compression
 */
export class CMCCore {
  private static instance: CMCCore;
  
  private constructor() {}
  
  static getInstance(): CMCCore {
    if (!CMCCore.instance) {
      CMCCore.instance = new CMCCore();
    }
    return CMCCore.instance;
  }
  
  // ==================== Memory Storage ====================
  
  /**
   * Store a new memory with automatic tier assignment and RS scoring
   */
  async storeMemory(options: {
    content: string;
    tags?: string[];
    importance?: number;
    source?: string;
    user_id?: string;
    session_id?: string;
  }): Promise<CMCMemory | null> {
    try {
      const { content, tags = [], importance = 0.5, source, user_id, session_id } = options;
      
      // Calculate token count (rough estimate: 1 token ≈ 4 chars)
      const token_count = Math.ceil(content.length / 4);
      
      // Determine tier
      const tier = this.determineTier(token_count);
      
      // Generate content hash for deduplication
      const content_hash = crypto.SHA256(content).toString();
      
      // Check if memory already exists
      const { data: existing } = await supabase
        .from('cmc_memories')
        .select('id')
        .eq('content_hash', content_hash)
        .maybeSingle();
      
      if (existing) {
        // Update access patterns instead of duplicating
        await this.accessMemory(existing.id);
        return null;
      }
      
      // Calculate initial RS scores
      const quality_score = this.calculateQualityScore(content, tags);
      const index_depth_score = this.calculateIndexDepthScore(tags);
      const dependency_delta = 0; // Initial DD is 0 (no changes yet)
      const retrieval_score = quality_score * index_depth_score * (1 - dependency_delta);
      
      // Store memory
      const { data, error } = await supabase
        .from('cmc_memories')
        .insert({
          content,
          content_hash,
          tier,
          token_count,
          quality_score,
          index_depth_score,
          dependency_delta,
          retrieval_score,
          tags,
          parent_tags: await this.getParentTags(tags),
          importance,
          source,
          user_id,
          session_id
        })
        .select()
        .single();
      
      if (error) {
        console.error('CMC: Failed to store memory:', error);
        return null;
      }
      
      // Update tag graph
      await this.updateTagGraph(tags);
      
      return data as CMCMemory;
    } catch (error) {
      console.error('CMC: Store memory error:', error);
      return null;
    }
  }
  
  /**
   * Retrieve memories using RS-based ranking
   */
  async retrieveMemories(query: RetrievalQuery): Promise<CMCMemory[]> {
    try {
      const { tags, tier, minScore = 0.0, limit = 10, session_id } = query;
      
      let dbQuery = supabase
        .from('cmc_memories')
        .select('*')
        .order('retrieval_score', { ascending: false, nullsFirst: false })
        .limit(limit);
      
      // Apply filters
      if (tier) {
        dbQuery = dbQuery.eq('tier', tier);
      }
      
      if (tags && tags.length > 0) {
        dbQuery = dbQuery.overlaps('tags', tags);
      }
      
      if (session_id) {
        dbQuery = dbQuery.eq('session_id', session_id);
      }
      
      if (minScore > 0) {
        dbQuery = dbQuery.gte('retrieval_score', minScore);
      }
      
      const { data, error } = await dbQuery;
      
      if (error) {
        console.error('CMC: Failed to retrieve memories:', error);
        return [];
      }
      
      // Update access patterns for retrieved memories
      if (data && data.length > 0) {
        const ids = data.map(m => m.id);
        await Promise.all(ids.map(id => this.accessMemory(id)));
      }
      
      // Apply temporal decay to scores
      const memoriesWithDecay = data.map(memory => ({
        ...memory,
        retrieval_score: this.applyTemporalDecay(
          memory.retrieval_score || 0,
          memory.last_accessed_at,
          DEFAULT_TAU
        )
      }));
      
      // Re-sort after decay
      memoriesWithDecay.sort((a, b) => (b.retrieval_score || 0) - (a.retrieval_score || 0));
      
      return memoriesWithDecay as CMCMemory[];
    } catch (error) {
      console.error('CMC: Retrieve memories error:', error);
      return [];
    }
  }
  
  /**
   * Compress memories using Dumbbell architecture
   */
  async compressMemory(memoryId: string): Promise<boolean> {
    try {
      const { data: memory, error } = await supabase
        .from('cmc_memories')
        .select('*')
        .eq('id', memoryId)
        .single();
      
      if (error || !memory || memory.is_compressed) {
        return false;
      }
      
      const content = memory.content;
      const tokens = Math.ceil(content.length / 4);
      
      // Calculate head/tail spans (≥20% each)
      const head_span = Math.ceil(tokens * DUMBBELL_CONFIG.head_tail_min);
      const tail_span = Math.ceil(tokens * DUMBBELL_CONFIG.head_tail_min);
      const middle_span = tokens - head_span - tail_span;
      
      if (middle_span <= 0) {
        return false; // Too short to compress
      }
      
      // Extract head, middle, tail
      const chars_per_token = 4;
      const head = content.substring(0, head_span * chars_per_token);
      const tail = content.substring(content.length - (tail_span * chars_per_token));
      
      // Compress middle (simple ellipsis for now - in production use LLM summarization)
      const compressed_content = `${head}\n\n[... compressed ${middle_span} tokens ...]\n\n${tail}`;
      const compressed_tokens = head_span + tail_span + 10; // 10 for ellipsis
      const compression_ratio = compressed_tokens / tokens;
      
      // Only compress if L < threshold
      if (compression_ratio >= DUMBBELL_CONFIG.compression_threshold) {
        return false; // Not worth compressing
      }
      
      // Update memory
      const { error: updateError } = await supabase
        .from('cmc_memories')
        .update({
          content: compressed_content,
          is_compressed: true,
          compression_ratio,
          original_token_count: tokens,
          head_span,
          tail_span,
          token_count: compressed_tokens
        })
        .eq('id', memoryId);
      
      return !updateError;
    } catch (error) {
      console.error('CMC: Compress memory error:', error);
      return false;
    }
  }
  
  /**
   * Build memory hierarchy by organizing memories into levels
   */
  async buildHierarchy(): Promise<{
    L1: CMCMemory[];  // Short-term
    L2: CMCMemory[];  // Medium-term
    L3: CMCMemory[];  // Long-term
  }> {
    try {
      const [l1, l2, l3] = await Promise.all([
        this.retrieveMemories({ query: '', tier: 'short', limit: 50 }),
        this.retrieveMemories({ query: '', tier: 'medium', limit: 100 }),
        this.retrieveMemories({ query: '', tier: 'large', limit: 500 })
      ]);
      
      return { L1: l1, L2: l2, L3: l3 };
    } catch (error) {
      console.error('CMC: Build hierarchy error:', error);
      return { L1: [], L2: [], L3: [] };
    }
  }
  
  // ==================== RS Score Calculation ====================
  
  /**
   * Calculate Quality Score: QS = 0.4×Completeness + 0.3×Density + 0.3×Relevance
   */
  private calculateQualityScore(content: string, tags: string[]): number {
    // Completeness: based on content length and structure
    const hasMultipleSentences = content.split(/[.!?]+/).filter(s => s.trim()).length > 1;
    const hasStructure = content.includes('\n') || content.includes('- ');
    const completeness = (content.length > 100 ? 0.5 : 0.3) + 
                        (hasMultipleSentences ? 0.3 : 0) +
                        (hasStructure ? 0.2 : 0);
    
    // Density: information richness (unique words / total words)
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const density = words.length > 0 ? Math.min(uniqueWords.size / words.length, 1.0) : 0;
    
    // Relevance: based on tag count (more tags = more connected)
    const relevance = Math.min(tags.length / 5, 1.0); // Normalize to max 5 tags
    
    return 0.4 * completeness + 0.3 * density + 0.3 * relevance;
  }
  
  /**
   * Calculate Index Depth Score: IDS = normalized log depth × connection density
   */
  private calculateIndexDepthScore(tags: string[]): number {
    // Depth: logarithmic scale of tag count
    const depth = tags.length > 0 ? Math.log(tags.length + 1) / Math.log(10) : 0;
    
    // Connection density: ratio of tags (simple approximation)
    const density = Math.min(tags.length / 3, 1.0); // Normalize to 3 tags
    
    return depth * density;
  }
  
  /**
   * Apply temporal decay: score × τ^(hours_since_access)
   */
  private applyTemporalDecay(score: number, lastAccessed: string, tau: number): number {
    const now = new Date();
    const accessed = new Date(lastAccessed);
    const hoursSince = (now.getTime() - accessed.getTime()) / (1000 * 60 * 60);
    
    return score * Math.pow(tau, hoursSince);
  }
  
  // ==================== Tag Graph Management ====================
  
  /**
   * Update tag graph with new tags
   */
  private async updateTagGraph(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const { data: existing } = await supabase
          .from('cmc_tag_graph')
          .select('id, access_count')
          .eq('tag', tag)
          .maybeSingle();
        
        if (existing) {
          // Update access count
          await supabase
            .from('cmc_tag_graph')
            .update({
              access_count: existing.access_count + 1,
              last_accessed_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        } else {
          // Insert new tag
          await supabase
            .from('cmc_tag_graph')
            .insert({
              tag,
              priority: 0.5,
              decay_tau: DEFAULT_TAU
            });
        }
      }
    } catch (error) {
      console.error('CMC: Update tag graph error:', error);
    }
  }
  
  /**
   * Get parent tags for hierarchical relationships
   */
  private async getParentTags(tags: string[]): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('cmc_tag_graph')
        .select('parent_tag')
        .in('tag', tags)
        .not('parent_tag', 'is', null);
      
      return data ? data.map(row => row.parent_tag).filter(Boolean) as string[] : [];
    } catch (error) {
      return [];
    }
  }
  
  // ==================== Helper Methods ====================
  
  /**
   * Determine memory tier based on token count
   */
  private determineTier(tokenCount: number): CMCMemory['tier'] {
    if (tokenCount <= TIER_THRESHOLDS.short) return 'short';
    if (tokenCount <= TIER_THRESHOLDS.medium) return 'medium';
    if (tokenCount <= TIER_THRESHOLDS.large) return 'large';
    return 'super_index';
  }
  
  /**
   * Update memory access patterns
   */
  private async accessMemory(memoryId: string): Promise<void> {
    try {
      const { data: memory } = await supabase
        .from('cmc_memories')
        .select('access_count')
        .eq('id', memoryId)
        .single();
      
      if (memory) {
        await supabase
          .from('cmc_memories')
          .update({
            access_count: memory.access_count + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', memoryId);
      }
    } catch (error) {
      // Silent fail - access tracking is non-critical
    }
  }
  
  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    total: number;
    by_tier: Record<string, number>;
    avg_rs_score: number;
    compressed_count: number;
  }> {
    try {
      const { data: memories } = await supabase
        .from('cmc_memories')
        .select('tier, retrieval_score, is_compressed');
      
      if (!memories) return { total: 0, by_tier: {}, avg_rs_score: 0, compressed_count: 0 };
      
      const by_tier = memories.reduce((acc, m) => {
        acc[m.tier] = (acc[m.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const scores = memories.map(m => m.retrieval_score || 0).filter(s => s > 0);
      const avg_rs_score = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      
      const compressed_count = memories.filter(m => m.is_compressed).length;
      
      return {
        total: memories.length,
        by_tier,
        avg_rs_score,
        compressed_count
      };
    } catch (error) {
      console.error('CMC: Get stats error:', error);
      return { total: 0, by_tier: {}, avg_rs_score: 0, compressed_count: 0 };
    }
  }
}

// Export singleton instance
export const cmcCore = CMCCore.getInstance();
