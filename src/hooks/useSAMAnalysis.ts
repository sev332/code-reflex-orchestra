// SAM (System Anatomy Mapping) Analysis Hook
// AI-automated analysis system implementing the SAM Protocol v3.0.0

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// SAM Core Interfaces
export interface SAMSection {
  id: string;
  sectionId: string;
  sourceFile: string;
  title: string;
  tags: string[];
  content: string;
  hash: string;
  startLine: number;
  endLine: number;
  dimension: SAMDimension;
}

export type SAMDimension = 'structure' | 'behavior' | 'interfaces' | 'constraints' | 'evidence';

export interface SAMTag {
  name: string;
  description: string;
  required: boolean;
  scope: 'document' | 'section';
  pairsWith?: string[];
  occurrences: number;
}

export interface SAMDependency {
  from: string;
  to: string;
  type: 'depends_on' | 'uses' | 'extends' | 'implements';
}

export interface SAMQualityMetrics {
  completeness: number;
  consistency: number;
  evidence: number;
  readability: number;
  maintenance: number;
  perfectionScore: number;
}

export interface SAMValidationResult {
  isValid: boolean;
  errors: SAMValidationError[];
  warnings: SAMValidationWarning[];
  suggestions: string[];
}

export interface SAMValidationError {
  type: 'missing_tag' | 'unpaired_tag' | 'nested_tag' | 'unknown_tag' | 'missing_section';
  message: string;
  line?: number;
  tag?: string;
}

export interface SAMValidationWarning {
  type: 'incomplete_section' | 'low_quality' | 'stale_content' | 'missing_evidence';
  message: string;
  section?: string;
}

export interface SAMAnalysisResult {
  sections: SAMSection[];
  tags: SAMTag[];
  dependencies: SAMDependency[];
  qualityMetrics: SAMQualityMetrics;
  validation: SAMValidationResult;
  manifest: SAMManifest;
  index: SAMIndex;
}

export interface SAMManifest {
  version: string;
  buildTimestamp: string;
  sections: SAMSection[];
  integrityRoot: string;
  qualityMetrics: SAMQualityMetrics;
}

export interface SAMIndex {
  version: string;
  sections: Record<string, SAMSection>;
  tags: Record<string, string[]>;
  dependencies: SAMDependency[];
  metadata: {
    totalSections: number;
    totalTags: number;
    totalDependencies: number;
  };
}

export interface SAMGenerationConfig {
  systemName: string;
  targetDimensions: SAMDimension[];
  includeEvidence: boolean;
  strictMode: boolean;
}

// Core SAM Tags Registry
const SAM_CORE_TAGS: SAMTag[] = [
  { name: 'TAG:SAM', description: 'System Anatomy Mapping marker', required: true, scope: 'document', occurrences: 0 },
  { name: 'TAG:OVERVIEW', description: 'System overview section', required: true, scope: 'section', pairsWith: ['END:TAG:OVERVIEW'], occurrences: 0 },
  { name: 'TAG:STRUCTURE', description: 'Static structure section', required: true, scope: 'section', pairsWith: ['END:TAG:STRUCTURE'], occurrences: 0 },
  { name: 'TAG:BEHAVIOR', description: 'Dynamic behavior section', required: true, scope: 'section', pairsWith: ['END:TAG:BEHAVIOR'], occurrences: 0 },
  { name: 'TAG:INTEGRATION', description: 'Interface & integration section', required: true, scope: 'section', pairsWith: ['END:TAG:INTEGRATION'], occurrences: 0 },
  { name: 'TAG:PERFORMANCE', description: 'Performance constraints', required: true, scope: 'section', pairsWith: ['END:TAG:PERFORMANCE'], occurrences: 0 },
  { name: 'TAG:DEPENDENCY', description: 'Dependencies and assumptions', required: true, scope: 'section', pairsWith: ['END:TAG:DEPENDENCY'], occurrences: 0 },
  { name: 'TAG:SUMMARY', description: 'Evidence & validation section', required: true, scope: 'section', pairsWith: ['END:TAG:SUMMARY'], occurrences: 0 },
  { name: 'TAG:RELATIONSHIP', description: 'Relationship matrix section', required: false, scope: 'section', pairsWith: ['END:TAG:RELATIONSHIP'], occurrences: 0 },
];

export function useSAMAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SAMAnalysisResult | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Extract tags from content
  const extractTags = useCallback((content: string): SAMTag[] => {
    const tagPattern = /\[(?:TAG|END:TAG):([^\]]+)\]/g;
    const tags = new Map<string, number>();
    
    let match;
    while ((match = tagPattern.exec(content)) !== null) {
      const fullTag = match[0].replace('[', '').replace(']', '');
      tags.set(fullTag, (tags.get(fullTag) || 0) + 1);
    }
    
    return Array.from(tags.entries()).map(([name, occurrences]) => {
      const coreTag = SAM_CORE_TAGS.find(t => t.name === name);
      return {
        name,
        description: coreTag?.description || 'Custom tag',
        required: coreTag?.required || false,
        scope: coreTag?.scope || 'section' as const,
        pairsWith: coreTag?.pairsWith,
        occurrences,
      };
    });
  }, []);

  // Validate SAM compliance
  const validateSAM = useCallback((content: string, strictMode: boolean = true): SAMValidationResult => {
    const errors: SAMValidationError[] = [];
    const warnings: SAMValidationWarning[] = [];
    const suggestions: string[] = [];
    
    const extractedTags = extractTags(content);
    const tagMap = new Map(extractedTags.map(t => [t.name, t]));
    
    // Check for required tags
    SAM_CORE_TAGS.filter(t => t.required).forEach(requiredTag => {
      if (!tagMap.has(requiredTag.name)) {
        errors.push({
          type: 'missing_tag',
          message: `Required tag ${requiredTag.name} is missing`,
          tag: requiredTag.name,
        });
      }
    });
    
    // Check for paired tags
    SAM_CORE_TAGS.filter(t => t.pairsWith).forEach(pairedTag => {
      const hasOpening = tagMap.has(pairedTag.name);
      const hasClosing = pairedTag.pairsWith?.some(p => tagMap.has(p));
      
      if (hasOpening && !hasClosing) {
        errors.push({
          type: 'unpaired_tag',
          message: `Tag ${pairedTag.name} is missing its closing tag`,
          tag: pairedTag.name,
        });
      }
    });
    
    // Check for nested tags (not allowed in SAM)
    const tagLines = content.split('\n');
    let openTags: string[] = [];
    tagLines.forEach((line, idx) => {
      const openMatch = line.match(/\[TAG:([^\]]+)\]/g);
      const closeMatch = line.match(/\[END:TAG:([^\]]+)\]/g);
      
      if (openMatch) {
        if (openTags.length > 0 && strictMode) {
          errors.push({
            type: 'nested_tag',
            message: `Nested tag detected at line ${idx + 1}. Tags cannot nest in SAM.`,
            line: idx + 1,
          });
        }
        openTags.push(...openMatch);
      }
      if (closeMatch) {
        openTags = openTags.filter(t => !closeMatch.some(c => c.includes(t.replace('TAG:', ''))));
      }
    });
    
    // Check for unknown tags in strict mode
    if (strictMode) {
      extractedTags.forEach(tag => {
        const isCore = SAM_CORE_TAGS.some(ct => ct.name === tag.name || ct.pairsWith?.includes(tag.name));
        if (!isCore && !tag.name.startsWith('TAG:') && !tag.name.startsWith('END:TAG:')) {
          warnings.push({
            type: 'incomplete_section',
            message: `Unknown tag ${tag.name} - consider adding to registry`,
          });
        }
      });
    }
    
    // Generate suggestions
    if (!content.includes('## 1. SYSTEM OVERVIEW')) {
      suggestions.push('Add a System Overview section with [TAG:OVERVIEW]');
    }
    if (!content.includes('## 2. STATIC STRUCTURE MAP')) {
      suggestions.push('Add a Static Structure Map section with [TAG:STRUCTURE]');
    }
    if (!content.includes('## 3. DYNAMIC BEHAVIOR MAP')) {
      suggestions.push('Add a Dynamic Behavior Map section with [TAG:BEHAVIOR]');
    }
    if (!content.includes('## 4. INTERFACE & INTEGRATION MAP')) {
      suggestions.push('Add an Interface & Integration Map section with [TAG:INTEGRATION]');
    }
    if (!content.includes('## 5. CONSTRAINTS & LIMITATIONS')) {
      suggestions.push('Add a Constraints & Limitations section with [TAG:PERFORMANCE] [TAG:DEPENDENCY]');
    }
    if (!content.includes('## 6. EVIDENCE & VALIDATION')) {
      suggestions.push('Add an Evidence & Validation section with [TAG:SUMMARY]');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }, [extractTags]);

  // Calculate quality metrics
  const calculateQualityMetrics = useCallback((content: string, validation: SAMValidationResult): SAMQualityMetrics => {
    // Completeness: Check for all 5 dimensions
    const hasDimensions = {
      structure: content.includes('[TAG:STRUCTURE]'),
      behavior: content.includes('[TAG:BEHAVIOR]'),
      interfaces: content.includes('[TAG:INTEGRATION]'),
      constraints: content.includes('[TAG:PERFORMANCE]') || content.includes('[TAG:DEPENDENCY]'),
      evidence: content.includes('[TAG:SUMMARY]'),
    };
    const completeness = (Object.values(hasDimensions).filter(Boolean).length / 5) * 100;
    
    // Consistency: Based on validation errors
    const maxErrors = 10;
    const consistency = Math.max(0, 100 - (validation.errors.length / maxErrors) * 100);
    
    // Evidence: Check for test/metrics/validation content
    const hasTests = content.toLowerCase().includes('test');
    const hasMetrics = content.toLowerCase().includes('metric') || content.toLowerCase().includes('performance');
    const hasValidation = content.toLowerCase().includes('validation') || content.toLowerCase().includes('verified');
    const evidence = ((hasTests ? 33 : 0) + (hasMetrics ? 33 : 0) + (hasValidation ? 34 : 0));
    
    // Readability: Simple word/sentence analysis
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgSentenceLength = words / Math.max(sentences, 1);
    const readability = Math.max(0, Math.min(100, 100 - Math.abs(avgSentenceLength - 15) * 3));
    
    // Maintenance: Always 100 for new analysis
    const maintenance = 100;
    
    // Perfection Score
    const perfectionScore = (
      0.25 * completeness +
      0.25 * consistency +
      0.20 * evidence +
      0.15 * readability +
      0.15 * maintenance
    );
    
    return {
      completeness,
      consistency,
      evidence,
      readability,
      maintenance,
      perfectionScore,
    };
  }, []);

  // Generate section hash
  const generateHash = useCallback(async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }, []);

  // Extract sections from content
  const extractSections = useCallback(async (content: string): Promise<SAMSection[]> => {
    const sections: SAMSection[] = [];
    const lines = content.split('\n');
    
    // Find section headers
    const sectionPattern = /^##\s+(\d+)\.\s+(.+)$/;
    let currentSection: Partial<SAMSection> | null = null;
    let sectionContent: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(sectionPattern);
      
      if (match) {
        // Save previous section
        if (currentSection && sectionContent.length > 0) {
          const content = sectionContent.join('\n');
          sections.push({
            id: await generateHash(content),
            sectionId: currentSection.sectionId || '',
            sourceFile: currentSection.sourceFile || 'inline',
            title: currentSection.title || '',
            tags: extractTags(content).map(t => t.name),
            content,
            hash: await generateHash(content),
            startLine: currentSection.startLine || 0,
            endLine: i - 1,
            dimension: currentSection.dimension || 'structure',
          });
        }
        
        // Start new section
        const sectionNumber = parseInt(match[1]);
        const title = match[2];
        
        currentSection = {
          sectionId: `section-${sectionNumber}`,
          title,
          startLine: i,
          dimension: getDimensionFromTitle(title),
        };
        sectionContent = [line];
      } else if (currentSection) {
        sectionContent.push(line);
      }
    }
    
    // Save last section
    if (currentSection && sectionContent.length > 0) {
      const content = sectionContent.join('\n');
      sections.push({
        id: await generateHash(content),
        sectionId: currentSection.sectionId || '',
        sourceFile: 'inline',
        title: currentSection.title || '',
        tags: extractTags(content).map(t => t.name),
        content,
        hash: await generateHash(content),
        startLine: currentSection.startLine || 0,
        endLine: lines.length - 1,
        dimension: currentSection.dimension || 'structure',
      });
    }
    
    return sections;
  }, [extractTags, generateHash]);

  // Analyze content with AI
  const analyzeWithAI = useCallback(async (
    content: string,
    contentType: 'document' | 'code',
    onStream?: (chunk: string) => void
  ): Promise<SAMAnalysisResult> => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Step 1: Extract tags (20%)
      setAnalysisProgress(10);
      const tags = extractTags(content);
      
      // Step 2: Validate (40%)
      setAnalysisProgress(30);
      const validation = validateSAM(content, true);
      
      // Step 3: Extract sections (60%)
      setAnalysisProgress(50);
      const sections = await extractSections(content);
      
      // Step 4: Calculate metrics (80%)
      setAnalysisProgress(70);
      const qualityMetrics = calculateQualityMetrics(content, validation);
      
      // Step 5: Generate AI analysis
      setAnalysisProgress(80);
      
      const { data, error } = await supabase.functions.invoke('dream-mode', {
        body: {
          action: 'sam_analysis',
          content,
          contentType,
          sections: sections.map(s => ({ title: s.title, dimension: s.dimension })),
          tags: tags.map(t => t.name),
          validation,
          qualityMetrics,
        }
      });
      
      if (error) {
        console.error('AI analysis error:', error);
      }
      
      // Step 6: Build dependencies
      setAnalysisProgress(90);
      const dependencies: SAMDependency[] = [];
      sections.forEach((section, idx) => {
        if (idx > 0) {
          dependencies.push({
            from: sections[idx - 1].id,
            to: section.id,
            type: 'depends_on',
          });
        }
      });
      
      // Step 7: Build manifest and index
      const manifest: SAMManifest = {
        version: '3.0.0',
        buildTimestamp: new Date().toISOString(),
        sections,
        integrityRoot: await generateHash(sections.map(s => s.hash).join('|')),
        qualityMetrics,
      };
      
      const index: SAMIndex = {
        version: '3.0.0',
        sections: Object.fromEntries(sections.map(s => [s.id, s])),
        tags: tags.reduce((acc, tag) => {
          acc[tag.name] = sections.filter(s => s.tags.includes(tag.name)).map(s => s.id);
          return acc;
        }, {} as Record<string, string[]>),
        dependencies,
        metadata: {
          totalSections: sections.length,
          totalTags: tags.length,
          totalDependencies: dependencies.length,
        },
      };
      
      setAnalysisProgress(100);
      
      const result: SAMAnalysisResult = {
        sections,
        tags,
        dependencies,
        qualityMetrics,
        validation,
        manifest,
        index,
      };
      
      setAnalysisResult(result);
      return result;
      
    } finally {
      setIsAnalyzing(false);
    }
  }, [extractTags, validateSAM, extractSections, calculateQualityMetrics, generateHash]);

  // Generate SAM documentation with AI
  const generateSAMDocument = useCallback(async (
    sourceContent: string,
    config: SAMGenerationConfig,
    onStream?: (chunk: string) => void
  ): Promise<string> => {
    setIsGenerating(true);
    setStreamingContent('');
    
    try {
      const { data, error } = await supabase.functions.invoke('dream-mode', {
        body: {
          action: 'generate_sam',
          sourceContent,
          systemName: config.systemName,
          dimensions: config.targetDimensions,
          includeEvidence: config.includeEvidence,
          strictMode: config.strictMode,
        }
      });
      
      if (error) throw error;
      
      const generatedContent = data?.content || generateSAMTemplate(config.systemName);
      
      if (onStream) {
        // Simulate streaming for better UX
        const chunks = generatedContent.match(/.{1,50}/g) || [];
        for (const chunk of chunks) {
          onStream(chunk);
          setStreamingContent(prev => prev + chunk);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      return generatedContent;
      
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Improve existing SAM document
  const improveSAMDocument = useCallback(async (
    content: string,
    instruction: string,
    onStream?: (chunk: string) => void
  ): Promise<string> => {
    setIsGenerating(true);
    setStreamingContent('');
    
    try {
      const analysis = await analyzeWithAI(content, 'document');
      
      const { data, error } = await supabase.functions.invoke('dream-mode', {
        body: {
          action: 'improve_sam',
          content,
          instruction,
          analysis,
        }
      });
      
      if (error) throw error;
      
      return data?.improved || content;
      
    } finally {
      setIsGenerating(false);
    }
  }, [analyzeWithAI]);

  // Generate SAM for code
  const generateSAMForCode = useCallback(async (
    code: string,
    language: string,
    fileName: string,
    onStream?: (chunk: string) => void
  ): Promise<string> => {
    setIsGenerating(true);
    setStreamingContent('');
    
    try {
      const { data, error } = await supabase.functions.invoke('dream-mode', {
        body: {
          action: 'generate_sam_for_code',
          code,
          language,
          fileName,
        }
      });
      
      if (error) throw error;
      
      const samDoc = data?.samDocument || generateCodeSAMTemplate(fileName, language);
      
      if (onStream) {
        const chunks = samDoc.match(/.{1,50}/g) || [];
        for (const chunk of chunks) {
          onStream(chunk);
          setStreamingContent(prev => prev + chunk);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      return samDoc;
      
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    // State
    isAnalyzing,
    isGenerating,
    analysisResult,
    streamingContent,
    analysisProgress,
    
    // Core functions
    analyzeWithAI,
    validateSAM,
    extractTags,
    calculateQualityMetrics,
    
    // Generation functions
    generateSAMDocument,
    improveSAMDocument,
    generateSAMForCode,
    
    // Utilities
    setAnalysisResult,
    setStreamingContent,
  };
}

// Helper: Get dimension from section title
function getDimensionFromTitle(title: string): SAMDimension {
  const lower = title.toLowerCase();
  if (lower.includes('structure') || lower.includes('static')) return 'structure';
  if (lower.includes('behavior') || lower.includes('dynamic')) return 'behavior';
  if (lower.includes('interface') || lower.includes('integration')) return 'interfaces';
  if (lower.includes('constraint') || lower.includes('limitation') || lower.includes('performance')) return 'constraints';
  if (lower.includes('evidence') || lower.includes('validation') || lower.includes('summary')) return 'evidence';
  return 'structure';
}

// Helper: Generate SAM template
function generateSAMTemplate(systemName: string): string {
  return `# MASTER ${systemName.toUpperCase()} SYSTEM MAP

**[TAG:SAM] [TAG:MASTER] [TAG:${systemName.toUpperCase().replace(/\s+/g, '_')}]**

## 1. SYSTEM OVERVIEW

**[TAG:OVERVIEW] [TAG:${systemName.toUpperCase().replace(/\s+/g, '_')}]**

### **What is ${systemName}?**

[Brief description of the system]

### **Purpose**

[What problem does this solve?]

### **Scope**

[What is included/excluded?]

**[END:TAG:OVERVIEW]**

---

## 2. STATIC STRUCTURE MAP

**[TAG:STRUCTURE] [TAG:${systemName.toUpperCase().replace(/\s+/g, '_')}]**

### **Core Components**

| Component | Type | Purpose | Location |
|-----------|------|---------|----------|
| ComponentName | Class/Module | Description | path/to/file |

### **Component Relationships**

\`\`\`
ComponentA
  ├─ Owns: ComponentB (reference)
  ├─ Uses: ComponentC (dependency)
  └─ Depends On: ComponentD (import)
\`\`\`

**[END:TAG:STRUCTURE]**

---

## 3. DYNAMIC BEHAVIOR MAP

**[TAG:BEHAVIOR] [TAG:${systemName.toUpperCase().replace(/\s+/g, '_')}]**

### **Lifecycle Flow**

1. **Initialization**: System startup
2. **Operation**: Normal processing
3. **Cleanup**: Shutdown and resource release

### **Key Operations**

| Operation | Trigger | Sequence | Output |
|-----------|---------|----------|--------|
| OperationName | Event | Step1 → Step2 | Result |

**[END:TAG:BEHAVIOR]**

---

## 4. INTERFACE & INTEGRATION MAP

**[TAG:INTEGRATION] [TAG:${systemName.toUpperCase().replace(/\s+/g, '_')}]**

### **Public API**

[Document public interfaces]

### **Integration Points**

| External System | Integration Type | Data Flow |
|----------------|------------------|-----------|
| SystemA | API Call | Request → Response |

**[END:TAG:INTEGRATION]**

---

## 5. CONSTRAINTS & LIMITATIONS

**[TAG:PERFORMANCE] [TAG:DEPENDENCY] [TAG:${systemName.toUpperCase().replace(/\s+/g, '_')}]**

### **Performance Constraints**

| Metric | Limit | Notes |
|--------|-------|-------|
| Latency | < 100ms | P95 |

### **Dependencies**

| Dependency | Version | Purpose |
|------------|---------|---------|
| Library | ^1.0.0 | Core functionality |

**[END:TAG:PERFORMANCE] [END:TAG:DEPENDENCY]**

---

## 6. EVIDENCE & VALIDATION

**[TAG:SUMMARY] [TAG:${systemName.toUpperCase().replace(/\s+/g, '_')}]**

### **Test Coverage**

| Component | Tests | Coverage |
|-----------|-------|----------|
| Component1 | 10 | 95% |

### **Validation Results**

- ✅ Functional tests passing
- ✅ Performance meets targets

**[END:TAG:SUMMARY]**

---

## 7. RELATIONSHIP MATRIX

**[TAG:RELATIONSHIP] [TAG:${systemName.toUpperCase().replace(/\s+/g, '_')}]**

[Document cross-system relationships]

**[END:TAG:RELATIONSHIP]**
`;
}

// Helper: Generate code SAM template
function generateCodeSAMTemplate(fileName: string, language: string): string {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  return generateSAMTemplate(`${baseName} (${language})`);
}
