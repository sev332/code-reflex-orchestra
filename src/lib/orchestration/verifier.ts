// Verifier & Auditor - Deterministic checks + rubric evaluation

import {
  AcceptanceCriterion,
  VerificationResult,
  VerificationType,
  AuditEntry,
  OrchestrationTask,
  generateId,
} from './types';
import { EventStore } from './event-store';

export class Verifier {
  private eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  // ============================================================================
  // DETERMINISTIC CHECKS
  // ============================================================================

  async verifyCriterion(
    criterion: AcceptanceCriterion,
    output: string,
    artifacts?: Record<string, string>
  ): Promise<VerificationResult> {
    this.eventStore.appendEvent('VERIFICATION_RUN', {
      criterion_id: criterion.id,
      criterion_type: criterion.type,
      description: criterion.description,
    });

    let result: VerificationResult;

    try {
      switch (criterion.type) {
        case 'schema':
          result = this.verifySchema(criterion, output);
          break;
        case 'contains':
          result = this.verifyContains(criterion, output);
          break;
        case 'not_contains':
          result = this.verifyNotContains(criterion, output);
          break;
        case 'word_limit':
          result = this.verifyWordLimit(criterion, output);
          break;
        case 'lint':
          result = await this.verifyLint(criterion, output, artifacts);
          break;
        case 'test':
          result = await this.verifyTest(criterion, output, artifacts);
          break;
        case 'custom':
          result = this.verifyCustom(criterion, output);
          break;
        default:
          result = {
            criterion_id: criterion.id,
            type: 'schema_validation',
            passed: false,
            message: `Unknown criterion type: ${criterion.type}`,
          };
      }
    } catch (error) {
      result = {
        criterion_id: criterion.id,
        type: criterion.type as VerificationType,
        passed: false,
        message: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        evidence: String(error),
      };
    }

    // Log result
    this.eventStore.appendEvent(
      result.passed ? 'VERIFICATION_PASSED' : 'VERIFICATION_FAILED',
      {
        criterion_id: criterion.id,
        criterion: criterion.description,
        message: result.message,
        evidence: result.evidence,
      }
    );

    return result;
  }

  async verifyAll(
    criteria: AcceptanceCriterion[],
    output: string,
    artifacts?: Record<string, string>
  ): Promise<{
    allPassed: boolean;
    results: VerificationResult[];
    failedCriteria: AcceptanceCriterion[];
  }> {
    const results: VerificationResult[] = [];
    const failedCriteria: AcceptanceCriterion[] = [];

    for (const criterion of criteria) {
      const result = await this.verifyCriterion(criterion, output, artifacts);
      results.push(result);
      
      if (!result.passed) {
        failedCriteria.push(criterion);
      }
    }

    return {
      allPassed: failedCriteria.length === 0,
      results,
      failedCriteria,
    };
  }

  // ============================================================================
  // SPECIFIC VERIFICATION METHODS
  // ============================================================================

  private verifySchema(criterion: AcceptanceCriterion, output: string): VerificationResult {
    const schema = criterion.config.schema as Record<string, unknown>;
    
    try {
      const parsed = JSON.parse(output);
      const errors = this.validateAgainstSchema(parsed, schema);
      
      return {
        criterion_id: criterion.id,
        type: 'schema_validation',
        passed: errors.length === 0,
        message: errors.length === 0 
          ? 'JSON schema validation passed' 
          : `Schema validation failed: ${errors.join(', ')}`,
        evidence: errors.length > 0 ? errors.join('\n') : undefined,
      };
    } catch {
      return {
        criterion_id: criterion.id,
        type: 'schema_validation',
        passed: false,
        message: 'Output is not valid JSON',
        evidence: output.slice(0, 200),
      };
    }
  }

  private validateAgainstSchema(data: unknown, schema: Record<string, unknown>): string[] {
    const errors: string[] = [];
    
    if (schema.type) {
      const actualType = Array.isArray(data) ? 'array' : typeof data;
      if (actualType !== schema.type) {
        errors.push(`Expected type ${schema.type}, got ${actualType}`);
      }
    }

    if (schema.required && typeof data === 'object' && data !== null) {
      const requiredFields = schema.required as string[];
      for (const field of requiredFields) {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    if (schema.properties && typeof data === 'object' && data !== null) {
      const props = schema.properties as Record<string, Record<string, unknown>>;
      for (const [key, propSchema] of Object.entries(props)) {
        if (key in data) {
          const propErrors = this.validateAgainstSchema(
            (data as Record<string, unknown>)[key],
            propSchema
          );
          errors.push(...propErrors.map(e => `${key}: ${e}`));
        }
      }
    }

    return errors;
  }

  private verifyContains(criterion: AcceptanceCriterion, output: string): VerificationResult {
    const required = criterion.config.patterns as string[] || [criterion.config.pattern as string];
    const missing: string[] = [];

    for (const pattern of required) {
      const regex = new RegExp(pattern, 'i');
      if (!regex.test(output)) {
        missing.push(pattern);
      }
    }

    return {
      criterion_id: criterion.id,
      type: 'contains_check',
      passed: missing.length === 0,
      message: missing.length === 0
        ? 'All required patterns found'
        : `Missing patterns: ${missing.join(', ')}`,
      evidence: missing.length > 0 ? `Searched in: ${output.slice(0, 500)}...` : undefined,
    };
  }

  private verifyNotContains(criterion: AcceptanceCriterion, output: string): VerificationResult {
    const forbidden = criterion.config.patterns as string[] || [criterion.config.pattern as string];
    const found: string[] = [];

    for (const pattern of forbidden) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(output)) {
        found.push(pattern);
      }
    }

    return {
      criterion_id: criterion.id,
      type: 'exclusion_check',
      passed: found.length === 0,
      message: found.length === 0
        ? 'No forbidden patterns found'
        : `Found forbidden patterns: ${found.join(', ')}`,
      evidence: found.length > 0 ? `Found in output` : undefined,
    };
  }

  private verifyWordLimit(criterion: AcceptanceCriterion, output: string): VerificationResult {
    const maxWords = criterion.config.max_words as number;
    const minWords = criterion.config.min_words as number || 0;
    const wordCount = output.split(/\s+/).filter(w => w.length > 0).length;

    const passed = wordCount >= minWords && wordCount <= maxWords;

    return {
      criterion_id: criterion.id,
      type: 'word_limit',
      passed,
      message: passed
        ? `Word count (${wordCount}) is within limits [${minWords}, ${maxWords}]`
        : `Word count (${wordCount}) is outside limits [${minWords}, ${maxWords}]`,
      details: { wordCount, minWords, maxWords },
    };
  }

  private async verifyLint(
    criterion: AcceptanceCriterion,
    output: string,
    artifacts?: Record<string, string>
  ): Promise<VerificationResult> {
    // Simulated lint check - in production, would run actual linter
    const language = criterion.config.language as string || 'typescript';
    
    // Basic syntax checks
    const issues: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Check for common issues
      if (output.includes('console.log') && criterion.config.no_console) {
        issues.push('Contains console.log statements');
      }
      if (output.includes('any') && criterion.config.no_any) {
        issues.push('Contains "any" type');
      }
      // Check for unbalanced brackets
      const openBrackets = (output.match(/\{/g) || []).length;
      const closeBrackets = (output.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets) {
        issues.push('Unbalanced curly brackets');
      }
    }

    return {
      criterion_id: criterion.id,
      type: 'lint_check',
      passed: issues.length === 0,
      message: issues.length === 0
        ? 'Lint check passed'
        : `Lint issues: ${issues.join(', ')}`,
      evidence: issues.length > 0 ? issues.join('\n') : undefined,
    };
  }

  private async verifyTest(
    criterion: AcceptanceCriterion,
    output: string,
    artifacts?: Record<string, string>
  ): Promise<VerificationResult> {
    // Simulated test run - in production, would execute actual tests
    const testFile = criterion.config.test_file as string;
    
    // Check if test file exists in artifacts
    if (artifacts && testFile && !artifacts[testFile]) {
      return {
        criterion_id: criterion.id,
        type: 'test_run',
        passed: false,
        message: `Test file not found: ${testFile}`,
      };
    }

    // Simulate test execution
    return {
      criterion_id: criterion.id,
      type: 'test_run',
      passed: true,
      message: 'Tests passed (simulated)',
      details: { tests_run: 1, tests_passed: 1, tests_failed: 0 },
    };
  }

  private verifyCustom(criterion: AcceptanceCriterion, output: string): VerificationResult {
    const checkFn = criterion.config.check as string;
    
    try {
      // Simple expression evaluation for demo
      // In production, use a safe sandboxed evaluator
      const checks: Record<string, (output: string) => boolean> = {
        'is_not_empty': (o) => o.trim().length > 0,
        'starts_with_header': (o) => o.startsWith('#'),
        'has_code_block': (o) => o.includes('```'),
        'no_todos': (o) => !o.toLowerCase().includes('todo'),
      };

      if (checkFn in checks) {
        const passed = checks[checkFn](output);
        return {
          criterion_id: criterion.id,
          type: 'rubric_eval',
          passed,
          message: passed ? `Custom check '${checkFn}' passed` : `Custom check '${checkFn}' failed`,
        };
      }

      return {
        criterion_id: criterion.id,
        type: 'rubric_eval',
        passed: false,
        message: `Unknown custom check: ${checkFn}`,
      };
    } catch (error) {
      return {
        criterion_id: criterion.id,
        type: 'rubric_eval',
        passed: false,
        message: `Custom check error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  // ============================================================================
  // FIX TASK GENERATION
  // ============================================================================

  generateFixTask(
    originalTask: OrchestrationTask,
    failedCriteria: AcceptanceCriterion[],
    verificationResults: VerificationResult[]
  ): Partial<OrchestrationTask> {
    const failureDetails = verificationResults
      .filter(r => !r.passed)
      .map(r => `- ${r.message}${r.evidence ? `\n  Evidence: ${r.evidence}` : ''}`)
      .join('\n');

    return {
      title: `Fix: ${originalTask.title}`,
      prompt: `The previous attempt at "${originalTask.title}" failed verification.

## Original Task
${originalTask.prompt}

## Verification Failures
${failureDetails}

## Instructions
Please fix the output to satisfy all acceptance criteria. Focus on:
${failedCriteria.map(c => `- ${c.description}`).join('\n')}

Do not change anything that was working correctly.`,
      acceptance_criteria: failedCriteria,
      dependencies: [originalTask.task_id],
      priority: Math.min(100, originalTask.priority + 10) as any,
      context_refs: originalTask.context_refs,
      tags: [...originalTask.tags, 'fix', 'retry'],
    };
  }
}

// ============================================================================
// AUDITOR - Rubric-based evaluation
// ============================================================================

export class Auditor {
  private entries: AuditEntry[] = [];
  private eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  // ============================================================================
  // AUDIT ENTRIES
  // ============================================================================

  addEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const auditEntry: AuditEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    this.entries.push(auditEntry);

    this.eventStore.appendEvent('AUDIT_NOTE', {
      audit_id: auditEntry.id,
      type: entry.type,
      severity: entry.severity,
      description: entry.description,
    });

    return auditEntry;
  }

  resolveEntry(entryId: string, resolution: string): boolean {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return false;

    entry.resolved = true;
    entry.resolution = resolution;

    this.eventStore.appendEvent('AUDIT_NOTE', {
      audit_id: entryId,
      action: 'resolved',
      resolution,
    });

    return true;
  }

  // ============================================================================
  // RUBRIC CHECKS
  // ============================================================================

  checkAcceptanceMeaningful(
    task: OrchestrationTask,
    output: string,
    verificationResults: VerificationResult[]
  ): AuditEntry | null {
    // Check if verification results actually prove the task was completed meaningfully
    const passedCount = verificationResults.filter(r => r.passed).length;
    const totalCount = verificationResults.length;

    if (passedCount === totalCount && totalCount > 0) {
      return null; // All good
    }

    if (passedCount === 0 && output.length > 100) {
      return this.addEntry({
        type: 'quality',
        description: 'Task produced output but failed all verification criteria',
        evidence: [`Output length: ${output.length}`, `Failed criteria: ${totalCount}`],
        severity: 'warning',
        resolved: false,
      });
    }

    return null;
  }

  checkContradiction(
    previousDecisions: string[],
    currentDecision: string
  ): AuditEntry | null {
    // Check for contradictions with previous decisions
    for (const prev of previousDecisions) {
      if (this.detectContradiction(prev, currentDecision)) {
        return this.addEntry({
          type: 'contradiction',
          description: 'Current decision contradicts a previous decision',
          evidence: [
            `Previous: ${prev.slice(0, 200)}`,
            `Current: ${currentDecision.slice(0, 200)}`,
          ],
          severity: 'warning',
          resolved: false,
        });
      }
    }
    return null;
  }

  private detectContradiction(prev: string, current: string): boolean {
    // Simple contradiction detection
    const prevLower = prev.toLowerCase();
    const currentLower = current.toLowerCase();

    // Check for explicit negations
    const prevStatements = prevLower.split(/[.!?]/);
    const currentStatements = currentLower.split(/[.!?]/);

    for (const prevStmt of prevStatements) {
      for (const currStmt of currentStatements) {
        // Check if one negates the other
        if (prevStmt.includes('should') && currStmt.includes('should not')) {
          const prevSubject = prevStmt.replace('should', '').trim();
          const currSubject = currStmt.replace('should not', '').trim();
          if (this.similarity(prevSubject, currSubject) > 0.7) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private similarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
  }

  checkFollowUpCreated(
    failedTask: OrchestrationTask,
    queuedTasks: OrchestrationTask[]
  ): AuditEntry | null {
    // Check if a fix task was created for a failed task
    const hasFixTask = queuedTasks.some(t => 
      t.dependencies.includes(failedTask.task_id) &&
      (t.tags.includes('fix') || t.title.toLowerCase().includes('fix'))
    );

    if (!hasFixTask) {
      return this.addEntry({
        type: 'process',
        description: 'Failed task did not generate a fix task',
        evidence: [`Failed task: ${failedTask.title}`, `Task ID: ${failedTask.task_id}`],
        severity: 'error',
        resolved: false,
      });
    }

    return null;
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  getUnresolvedEntries(): AuditEntry[] {
    return this.entries.filter(e => !e.resolved);
  }

  getEntriesBySeverity(severity: AuditEntry['severity']): AuditEntry[] {
    return this.entries.filter(e => e.severity === severity);
  }

  getAllEntries(): AuditEntry[] {
    return [...this.entries];
  }

  getCriticalIssues(): AuditEntry[] {
    return this.entries.filter(e => 
      !e.resolved && 
      (e.severity === 'error' || e.severity === 'critical')
    );
  }
}
