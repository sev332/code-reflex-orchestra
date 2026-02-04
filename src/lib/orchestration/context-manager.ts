// Context Manager - Three-tier context management with drift detection

import {
  ContextState,
  ContextItem,
  ContextTier,
  generateId,
} from './types';
import { EventStore } from './event-store';

export class ContextManager {
  private state: ContextState;
  private eventStore: EventStore;

  constructor(eventStore: EventStore, initialState?: ContextState) {
    this.eventStore = eventStore;
    this.state = initialState || {
      pinned: { tier: 'pinned', items: [], max_tokens: 2000, current_tokens: 0 },
      working: { tier: 'working', items: [], max_tokens: 4000, current_tokens: 0 },
      longterm: { tier: 'longterm', items: [], max_tokens: 20000, current_tokens: 0 },
      total_tokens: 0,
      max_total_tokens: 26000,
    };
  }

  // ============================================================================
  // CONTEXT OPERATIONS
  // ============================================================================

  addItem(
    tier: 'pinned' | 'working' | 'longterm',
    item: Omit<ContextItem, 'id' | 'created_at' | 'accessed_at' | 'access_count'>
  ): ContextItem | null {
    const contextTier = this.state[tier];
    
    // Check capacity
    if (contextTier.current_tokens + item.tokens > contextTier.max_tokens) {
      // Try to make room by evicting low-priority items
      if (!this.makeRoom(tier, item.tokens)) {
        this.eventStore.appendEvent('ERROR_RAISED', {
          type: 'context_overflow',
          tier,
          required_tokens: item.tokens,
          available_tokens: contextTier.max_tokens - contextTier.current_tokens,
        });
        return null;
      }
    }

    const now = new Date().toISOString();
    const contextItem: ContextItem = {
      ...item,
      id: generateId(),
      created_at: now,
      accessed_at: now,
      access_count: 0,
    };

    contextTier.items.push(contextItem);
    contextTier.current_tokens += item.tokens;
    this.state.total_tokens += item.tokens;

    this.eventStore.appendEvent('CONTEXT_UPDATED', {
      action: 'add',
      tier,
      item_id: contextItem.id,
      item_type: item.type,
      tokens: item.tokens,
    });

    return contextItem;
  }

  getItem(itemId: string): ContextItem | undefined {
    for (const tier of ['pinned', 'working', 'longterm'] as const) {
      const item = this.state[tier].items.find(i => i.id === itemId);
      if (item) {
        item.access_count++;
        item.accessed_at = new Date().toISOString();
        return item;
      }
    }
    return undefined;
  }

  removeItem(itemId: string): boolean {
    for (const tier of ['pinned', 'working', 'longterm'] as const) {
      const tierState = this.state[tier];
      const index = tierState.items.findIndex(i => i.id === itemId);
      if (index !== -1) {
        const item = tierState.items[index];
        tierState.items.splice(index, 1);
        tierState.current_tokens -= item.tokens;
        this.state.total_tokens -= item.tokens;

        this.eventStore.appendEvent('CONTEXT_UPDATED', {
          action: 'remove',
          tier,
          item_id: itemId,
          tokens_freed: item.tokens,
        });

        return true;
      }
    }
    return false;
  }

  moveItem(itemId: string, toTier: 'pinned' | 'working' | 'longterm'): boolean {
    // Find and remove from current tier
    let item: ContextItem | undefined;
    let fromTier: 'pinned' | 'working' | 'longterm' | undefined;

    for (const tier of ['pinned', 'working', 'longterm'] as const) {
      const tierState = this.state[tier];
      const index = tierState.items.findIndex(i => i.id === itemId);
      if (index !== -1) {
        item = tierState.items[index];
        fromTier = tier;
        tierState.items.splice(index, 1);
        tierState.current_tokens -= item.tokens;
        break;
      }
    }

    if (!item || !fromTier) return false;

    // Add to new tier
    const newTier = this.state[toTier];
    if (newTier.current_tokens + item.tokens > newTier.max_tokens) {
      // Put it back
      this.state[fromTier].items.push(item);
      this.state[fromTier].current_tokens += item.tokens;
      return false;
    }

    newTier.items.push(item);
    newTier.current_tokens += item.tokens;

    this.eventStore.appendEvent('CONTEXT_UPDATED', {
      action: 'move',
      item_id: itemId,
      from_tier: fromTier,
      to_tier: toTier,
    });

    return true;
  }

  // ============================================================================
  // CAPACITY MANAGEMENT
  // ============================================================================

  private makeRoom(tier: 'pinned' | 'working' | 'longterm', needed: number): boolean {
    const tierState = this.state[tier];
    const available = tierState.max_tokens - tierState.current_tokens;
    
    if (available >= needed) return true;

    // Sort by priority (lower first) and access count (lower first)
    const sortedItems = [...tierState.items]
      .filter(i => i.type !== 'constraint') // Never evict constraints
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.access_count - b.access_count;
      });

    let freed = 0;
    const toRemove: string[] = [];

    for (const item of sortedItems) {
      if (freed >= needed - available) break;
      toRemove.push(item.id);
      freed += item.tokens;
    }

    if (freed < needed - available) return false;

    // Evict items
    for (const itemId of toRemove) {
      // Move to longterm if not already there
      if (tier !== 'longterm') {
        this.moveItem(itemId, 'longterm');
      } else {
        this.removeItem(itemId);
      }
    }

    return true;
  }

  // ============================================================================
  // CONTEXT SELECTION
  // ============================================================================

  selectContext(taskPrompt: string, maxTokens: number): ContextItem[] {
    const selected: ContextItem[] = [];
    let usedTokens = 0;

    // Always include pinned items
    for (const item of this.state.pinned.items) {
      if (usedTokens + item.tokens <= maxTokens) {
        selected.push(item);
        usedTokens += item.tokens;
        item.access_count++;
        item.accessed_at = new Date().toISOString();
      }
    }

    // Add working set items by relevance
    const workingItems = [...this.state.working.items].sort((a, b) => {
      // Simple relevance: keyword matching + priority
      const aRelevance = this.calculateRelevance(a, taskPrompt);
      const bRelevance = this.calculateRelevance(b, taskPrompt);
      return bRelevance - aRelevance;
    });

    for (const item of workingItems) {
      if (usedTokens + item.tokens <= maxTokens) {
        selected.push(item);
        usedTokens += item.tokens;
        item.access_count++;
        item.accessed_at = new Date().toISOString();
      }
    }

    // Fill remaining with longterm if needed
    if (usedTokens < maxTokens * 0.8) {
      const longtermItems = [...this.state.longterm.items].sort((a, b) => {
        const aRelevance = this.calculateRelevance(a, taskPrompt);
        const bRelevance = this.calculateRelevance(b, taskPrompt);
        return bRelevance - aRelevance;
      });

      for (const item of longtermItems) {
        if (usedTokens + item.tokens <= maxTokens) {
          selected.push(item);
          usedTokens += item.tokens;
          item.access_count++;
          item.accessed_at = new Date().toISOString();
        }
      }
    }

    return selected;
  }

  private calculateRelevance(item: ContextItem, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = item.content.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.some(w => w.includes(word) || word.includes(w))) {
        matches++;
      }
    }

    const keywordScore = matches / queryWords.length;
    const priorityScore = item.priority / 100;
    const recencyScore = 1 - (Date.now() - new Date(item.accessed_at).getTime()) / (1000 * 60 * 60 * 24 * 7);

    return keywordScore * 0.5 + priorityScore * 0.3 + Math.max(0, recencyScore) * 0.2;
  }

  // ============================================================================
  // SUMMARIZATION
  // ============================================================================

  summarizeContext(actionCount: number): string {
    const summary: string[] = [];

    summary.push(`## Context Summary (after ${actionCount} actions)`);
    summary.push('');
    summary.push(`### Pinned (${this.state.pinned.items.length} items, ${this.state.pinned.current_tokens} tokens)`);
    for (const item of this.state.pinned.items) {
      summary.push(`- [${item.type}] ${item.content.slice(0, 100)}...`);
    }

    summary.push('');
    summary.push(`### Working Set (${this.state.working.items.length} items, ${this.state.working.current_tokens} tokens)`);
    for (const item of this.state.working.items.slice(0, 5)) {
      summary.push(`- [${item.type}] ${item.content.slice(0, 100)}...`);
    }
    if (this.state.working.items.length > 5) {
      summary.push(`  ... and ${this.state.working.items.length - 5} more`);
    }

    summary.push('');
    summary.push(`### Long-term Memory: ${this.state.longterm.items.length} items, ${this.state.longterm.current_tokens} tokens`);

    const summaryText = summary.join('\n');

    this.eventStore.appendEvent('CHECKPOINT_CREATED', {
      trigger: 'periodic',
      action_count: actionCount,
      summary_length: summaryText.length,
    });

    return summaryText;
  }

  // ============================================================================
  // DRIFT DETECTION
  // ============================================================================

  detectContradictions(newContent: string): {
    hasContradiction: boolean;
    contradictions: Array<{
      pinned_item: ContextItem;
      conflict: string;
    }>;
  } {
    const contradictions: Array<{ pinned_item: ContextItem; conflict: string }> = [];

    // Check against pinned constraints
    for (const item of this.state.pinned.items) {
      if (item.type === 'constraint') {
        // Simple negation detection
        const constraint = item.content.toLowerCase();
        const content = newContent.toLowerCase();

        // Check for explicit contradictions
        if (constraint.includes('must not') && this.findViolation(constraint, content, 'must not')) {
          contradictions.push({
            pinned_item: item,
            conflict: `Content appears to violate constraint: "${item.content}"`,
          });
        }

        if (constraint.includes('must') && !constraint.includes('must not')) {
          if (!this.checkRequirement(constraint, content)) {
            contradictions.push({
              pinned_item: item,
              conflict: `Content may not satisfy requirement: "${item.content}"`,
            });
          }
        }

        if (constraint.includes('never') && this.findViolation(constraint, content, 'never')) {
          contradictions.push({
            pinned_item: item,
            conflict: `Content violates 'never' constraint: "${item.content}"`,
          });
        }
      }
    }

    if (contradictions.length > 0) {
      this.eventStore.appendEvent('CONTRADICTION_DETECTED', {
        count: contradictions.length,
        details: contradictions.map(c => ({
          constraint: c.pinned_item.content,
          conflict: c.conflict,
        })),
      });
    }

    return {
      hasContradiction: contradictions.length > 0,
      contradictions,
    };
  }

  private findViolation(constraint: string, content: string, keyword: string): boolean {
    // Extract what should not be done
    const parts = constraint.split(keyword);
    if (parts.length < 2) return false;

    const forbidden = parts[1].trim().split(/[.,;]/)[0].trim();
    return content.includes(forbidden);
  }

  private checkRequirement(constraint: string, content: string): boolean {
    // Extract what must be present
    const parts = constraint.split('must');
    if (parts.length < 2) return true;

    const required = parts[1].trim().split(/[.,;]/)[0].trim();
    
    // Allow for partial matches
    const requiredWords = required.split(/\s+/);
    const matchCount = requiredWords.filter(w => content.includes(w)).length;
    
    return matchCount >= requiredWords.length * 0.5;
  }

  // ============================================================================
  // STATE ACCESS
  // ============================================================================

  getState(): ContextState {
    return JSON.parse(JSON.stringify(this.state));
  }

  setState(state: ContextState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  getStats(): {
    pinned: { items: number; tokens: number; capacity: number };
    working: { items: number; tokens: number; capacity: number };
    longterm: { items: number; tokens: number; capacity: number };
    total: { tokens: number; capacity: number };
  } {
    return {
      pinned: {
        items: this.state.pinned.items.length,
        tokens: this.state.pinned.current_tokens,
        capacity: this.state.pinned.max_tokens,
      },
      working: {
        items: this.state.working.items.length,
        tokens: this.state.working.current_tokens,
        capacity: this.state.working.max_tokens,
      },
      longterm: {
        items: this.state.longterm.items.length,
        tokens: this.state.longterm.current_tokens,
        capacity: this.state.longterm.max_tokens,
      },
      total: {
        tokens: this.state.total_tokens,
        capacity: this.state.max_total_tokens,
      },
    };
  }

  // ============================================================================
  // CONSTRAINT MANAGEMENT
  // ============================================================================

  addConstraint(content: string, priority: number = 100): ContextItem | null {
    return this.addItem('pinned', {
      content,
      type: 'constraint',
      source: 'user',
      tokens: Math.ceil(content.split(/\s+/).length * 1.3),
      priority,
    });
  }

  getConstraints(): ContextItem[] {
    return this.state.pinned.items.filter(i => i.type === 'constraint');
  }

  countConstraints(): number {
    return this.getConstraints().length;
  }
}
