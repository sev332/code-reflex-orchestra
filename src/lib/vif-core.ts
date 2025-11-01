// 🔗 CONNECT: AIM-OS Verification → Real VIF Implementation
// 🧩 INTENT: Uncertainty quantification and provenance tracking for reliable AI outputs
// ✅ SPEC: Phase 3 - VIF (Verification & Inference Framework) from AIM-OS architecture

import { APOEChain } from './apoe-core';
import { CMCMemory } from './cmc-core';

export interface VerificationResult {
  passed: boolean;
  provenance_coverage: number; // κ (kappa)
  semantic_entropy?: number;
  logit_variance?: number;
  confidence_level: 'high' | 'medium' | 'low' | 'abstain';
  calibration_score?: number; // ECE (Expected Calibration Error)
  issues: string[];
  recommendations: string[];
}

export interface UncertaintyMetrics {
  semantic_entropy: number;
  logit_variance: number;
  temperature_samples: number;
  abstain_threshold: number;
}

/**
 * VIF Core: Verification & Inference Framework
 * Implements uncertainty quantification, provenance tracking, and confidence gating
 */
export class VIFCore {
  private static instance: VIFCore;
  
  // Thresholds
  private readonly MIN_PROVENANCE = 0.85; // κ ≥ 0.85
  private readonly HIGH_CONFIDENCE = 0.80;
  private readonly MEDIUM_CONFIDENCE = 0.60;
  private readonly ABSTAIN_ENTROPY = 2.0; // High entropy = abstain
  
  private constructor() {}
  
  static getInstance(): VIFCore {
    if (!VIFCore.instance) {
      VIFCore.instance = new VIFCore();
    }
    return VIFCore.instance;
  }
  
  /**
   * Verify an APOE chain output
   */
  async verifyChain(chain: APOEChain): Promise<VerificationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check provenance coverage (κ)
    const { provenance_coverage } = chain;
    const provenancePassed = provenance_coverage >= this.MIN_PROVENANCE;
    
    if (!provenancePassed) {
      issues.push(`Provenance coverage ${provenance_coverage.toFixed(2)} below threshold ${this.MIN_PROVENANCE}`);
      recommendations.push('Increase citation density or retrieve more relevant sources');
    }
    
    // Check confidence level
    const confidence_level = this.getConfidenceLevel(chain.confidence, chain.semantic_entropy);
    
    if (confidence_level === 'low' || confidence_level === 'abstain') {
      issues.push(`Confidence level: ${confidence_level} (score: ${chain.confidence.toFixed(2)})`);
      recommendations.push('Consider multi-temperature sampling or retrieve additional context');
    }
    
    // Check semantic entropy (if available)
    if (chain.semantic_entropy !== undefined && chain.semantic_entropy > this.ABSTAIN_ENTROPY) {
      issues.push(`High semantic entropy ${chain.semantic_entropy.toFixed(2)} indicates uncertainty`);
      recommendations.push('Abstain from providing definitive answer or add uncertainty qualifiers');
    }
    
    // Calculate calibration (simplified ECE approximation)
    const calibration_score = this.estimateCalibration(chain);
    
    if (calibration_score > 0.10) {
      issues.push(`Poor calibration (ECE: ${calibration_score.toFixed(3)}, target: <0.10)`);
      recommendations.push('Apply temperature scaling or isotonic regression');
    }
    
    const passed = provenancePassed && 
                  confidence_level !== 'abstain' && 
                  calibration_score <= 0.10;
    
    return {
      passed,
      provenance_coverage,
      semantic_entropy: chain.semantic_entropy,
      logit_variance: chain.logit_variance,
      confidence_level,
      calibration_score,
      issues,
      recommendations
    };
  }
  
  /**
   * Calculate semantic entropy across multiple completions
   * In production, this would sample at different temperatures
   */
  async calculateSemanticEntropy(
    query: string,
    completions: string[]
  ): Promise<number> {
    if (completions.length < 2) return 0;
    
    // Cluster semantically similar outputs
    const clusters = this.clusterOutputs(completions);
    
    // Calculate entropy: H = -Σ p_i log(p_i)
    const probabilities = clusters.map(cluster => cluster.length / completions.length);
    const entropy = -probabilities.reduce((sum, p) => {
      return p > 0 ? sum + p * Math.log2(p) : sum;
    }, 0);
    
    return entropy;
  }
  
  /**
   * Calculate logit variance across temperature ladder
   * T ∈ {0.3, 0.7, 1.0}
   */
  async calculateLogitVariance(
    logits: number[][]
  ): Promise<number> {
    if (logits.length === 0) return 0;
    
    // Calculate variance across temperature samples
    const variances: number[] = [];
    
    for (let i = 0; i < logits[0].length; i++) {
      const values = logits.map(sample => sample[i]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      variances.push(variance);
    }
    
    return variances.reduce((a, b) => a + b, 0) / variances.length;
  }
  
  /**
   * Calculate provenance coverage κ
   * κ = cited_content / total_content
   */
  calculateProvenanceCoverage(
    answer: string,
    citations: Array<{ quote: string; cid: string }>
  ): number {
    const cited_content = citations.reduce((sum, c) => sum + c.quote.length, 0);
    const total_content = answer.length;
    
    return total_content > 0 ? Math.min(cited_content / total_content, 1.0) : 0;
  }
  
  /**
   * Check if answer should abstain due to uncertainty
   */
  shouldAbstain(
    confidence: number,
    semantic_entropy?: number,
    provenance_coverage?: number
  ): boolean {
    if (confidence < this.MEDIUM_CONFIDENCE) return true;
    if (semantic_entropy && semantic_entropy > this.ABSTAIN_ENTROPY) return true;
    if (provenance_coverage && provenance_coverage < this.MIN_PROVENANCE) return true;
    
    return false;
  }
  
  /**
   * Bind provenance to output for auditability
   */
  bindProvenance(
    answer: string,
    sources: CMCMemory[]
  ): {
    answer: string;
    provenance: Array<{
      cid: string;
      content: string;
      score: number;
      tags: string[];
    }>;
  } {
    return {
      answer,
      provenance: sources.map(s => ({
        cid: s.content_hash,
        content: s.content,
        score: s.retrieval_score || 0,
        tags: s.tags
      }))
    };
  }
  
  // ==================== Helper Methods ====================
  
  private getConfidenceLevel(
    confidence: number,
    semantic_entropy?: number
  ): VerificationResult['confidence_level'] {
    if (semantic_entropy && semantic_entropy > this.ABSTAIN_ENTROPY) {
      return 'abstain';
    }
    
    if (confidence >= this.HIGH_CONFIDENCE) return 'high';
    if (confidence >= this.MEDIUM_CONFIDENCE) return 'medium';
    if (confidence < this.MEDIUM_CONFIDENCE) return 'low';
    
    return 'abstain';
  }
  
  private estimateCalibration(chain: APOEChain): number {
    // Simplified ECE: |predicted_confidence - actual_accuracy|
    // In production, this requires historical data and bins
    
    const predicted = chain.confidence;
    const actual = chain.provenance_coverage; // Use κ as proxy for accuracy
    
    return Math.abs(predicted - actual);
  }
  
  private clusterOutputs(outputs: string[]): string[][] {
    // Simple clustering by exact match (in production, use semantic similarity)
    const clusters: Map<string, string[]> = new Map();
    
    for (const output of outputs) {
      const normalized = output.toLowerCase().trim();
      const cluster = clusters.get(normalized) || [];
      cluster.push(output);
      clusters.set(normalized, cluster);
    }
    
    return Array.from(clusters.values());
  }
}

// Export singleton instance
export const vifCore = VIFCore.getInstance();
