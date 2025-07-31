// Advanced Document Processing Engine for LUCID System
// Supports parsing, analysis, and knowledge extraction from various document types

export interface DocumentMetadata {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'json' | 'csv' | 'xml' | 'code';
  size: number;
  language: string;
  author?: string;
  created: string;
  modified: string;
  tags: string[];
  source: string;
  encoding?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  startIndex: number;
  endIndex: number;
  chunkIndex: number;
  embeddings?: number[];
  metadata: {
    section?: string;
    headers?: string[];
    tables?: any[];
    images?: string[];
    links?: string[];
    footnotes?: string[];
  };
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  summary: string;
  keyTopics: string[];
  entities: ExtractedEntity[];
  concepts: string[];
  sentiment: {
    overall: number;
    sections: { section: string; score: number }[];
  };
  complexity: number;
  readability: number;
  language: string;
  wordCount: number;
  structure: DocumentStructure;
  relationships: DocumentRelationship[];
  insights: string[];
}

export interface ExtractedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'number' | 'concept' | 'technology';
  confidence: number;
  startIndex: number;
  endIndex: number;
  context: string;
}

export interface DocumentStructure {
  outline: OutlineItem[];
  sections: DocumentSection[];
  tables: TableData[];
  images: ImageData[];
  codeBlocks: CodeBlock[];
}

export interface OutlineItem {
  level: number;
  title: string;
  startIndex: number;
  endIndex: number;
  children: OutlineItem[];
}

export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  level: number;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  keyPhrases: string[];
}

export interface TableData {
  id: string;
  caption?: string;
  headers: string[];
  rows: string[][];
  startIndex: number;
  endIndex: number;
}

export interface ImageData {
  id: string;
  alt?: string;
  caption?: string;
  url: string;
  description?: string;
  startIndex: number;
  endIndex: number;
}

export interface CodeBlock {
  id: string;
  language?: string;
  content: string;
  startIndex: number;
  endIndex: number;
  analysis?: {
    complexity: number;
    patterns: string[];
    dependencies: string[];
    suggestions: string[];
  };
}

export interface DocumentRelationship {
  sourceDoc: string;
  targetDoc: string;
  type: 'references' | 'cites' | 'similar' | 'follows' | 'contradicts' | 'expands';
  strength: number;
  description: string;
}

export interface ProcessingOptions {
  chunkSize: number;
  chunkOverlap: number;
  extractEntities: boolean;
  analyzeStructure: boolean;
  generateEmbeddings: boolean;
  performSentiment: boolean;
  extractCode: boolean;
  analyzeTables: boolean;
  processImages: boolean;
  language: 'auto' | string;
  preserveFormatting: boolean;
}

export class DocumentProcessor {
  private documents: Map<string, DocumentMetadata> = new Map();
  private chunks: Map<string, DocumentChunk[]> = new Map();
  private analyses: Map<string, DocumentAnalysis> = new Map();
  private relationships: Map<string, DocumentRelationship[]> = new Map();

  async processDocument(
    content: string | File | Blob,
    options: Partial<ProcessingOptions> = {}
  ): Promise<string> {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultOptions: ProcessingOptions = {
      chunkSize: 1000,
      chunkOverlap: 100,
      extractEntities: true,
      analyzeStructure: true,
      generateEmbeddings: true,
      performSentiment: true,
      extractCode: true,
      analyzeTables: true,
      processImages: false,
      language: 'auto',
      preserveFormatting: true,
      ...options
    };

    try {
      // Extract text content
      const textContent = await this.extractTextContent(content);
      
      // Create document metadata
      const metadata = await this.createDocumentMetadata(docId, content, textContent);
      this.documents.set(docId, metadata);

      // Process in parallel for efficiency
      const [chunks, analysis] = await Promise.all([
        this.createDocumentChunks(docId, textContent, defaultOptions),
        this.analyzeDocument(docId, textContent, defaultOptions)
      ]);

      // Store results
      this.chunks.set(docId, chunks);
      this.analyses.set(docId, analysis);

      // Generate relationships with existing documents
      await this.updateDocumentRelationships(docId, analysis);

      console.log(`✅ Document processed: ${metadata.title} (${chunks.length} chunks)`);
      return docId;
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  private async extractTextContent(content: string | File | Blob): Promise<string> {
    if (typeof content === 'string') {
      return content;
    }

    // Handle different file types
    if (content instanceof File || content instanceof Blob) {
      const fileType = content instanceof File ? content.type : 'application/octet-stream';
      
      if (fileType.startsWith('text/') || fileType === 'application/json') {
        return await content.text();
      }
      
      if (fileType === 'application/pdf') {
        return await this.extractPDFText(content);
      }
      
      if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractDocxText(content);
      }
      
      // Fallback to text extraction
      return await content.text();
    }

    throw new Error('Unsupported content type');
  }

  private async extractPDFText(file: File | Blob): Promise<string> {
    // In a real implementation, you would use pdf.js or similar
    console.log('📄 Processing PDF document...');
    return `[PDF Content] - Mock extracted text from PDF document. In production, this would use pdf.js to extract actual text content.`;
  }

  private async extractDocxText(file: File | Blob): Promise<string> {
    // In a real implementation, you would use mammoth.js or similar
    console.log('📝 Processing DOCX document...');
    return `[DOCX Content] - Mock extracted text from DOCX document. In production, this would use mammoth.js to extract actual text content.`;
  }

  private async createDocumentMetadata(
    docId: string, 
    originalContent: string | File | Blob, 
    textContent: string
  ): Promise<DocumentMetadata> {
    let title = 'Untitled Document';
    let type: DocumentMetadata['type'] = 'txt';
    let size = textContent.length;

    if (originalContent instanceof File) {
      title = originalContent.name;
      size = originalContent.size;
      
      if (originalContent.type.includes('pdf')) type = 'pdf';
      else if (originalContent.type.includes('word')) type = 'docx';
      else if (originalContent.type.includes('json')) type = 'json';
      else if (originalContent.type.includes('html')) type = 'html';
      else if (originalContent.type.includes('xml')) type = 'xml';
      else if (originalContent.name.endsWith('.md')) type = 'md';
      else if (originalContent.name.endsWith('.csv')) type = 'csv';
    }

    // Auto-detect language
    const language = this.detectLanguage(textContent);

    return {
      id: docId,
      title,
      type,
      size,
      language,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      tags: [],
      source: originalContent instanceof File ? originalContent.name : 'direct-input',
      encoding: 'utf-8'
    };
  }

  private detectLanguage(text: string): string {
    // Simple language detection - in production would use proper NLP libraries
    const commonWords = {
      en: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'],
      es: ['el', 'la', 'y', 'o', 'pero', 'en', 'con', 'por', 'para', 'de', 'que', 'es', 'son', 'fue', 'fueron'],
      fr: ['le', 'la', 'et', 'ou', 'mais', 'dans', 'sur', 'avec', 'par', 'pour', 'de', 'que', 'est', 'sont'],
      de: ['der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'auf', 'mit', 'von', 'für', 'ist', 'sind', 'war']
    };

    const words = text.toLowerCase().split(/\s+/).slice(0, 100);
    let bestLang = 'en';
    let bestScore = 0;

    for (const [lang, wordList] of Object.entries(commonWords)) {
      const score = words.filter(word => wordList.includes(word)).length;
      if (score > bestScore) {
        bestScore = score;
        bestLang = lang;
      }
    }

    return bestLang;
  }

  private async createDocumentChunks(
    docId: string, 
    content: string, 
    options: ProcessingOptions
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const { chunkSize, chunkOverlap } = options;

    // Smart chunking - preserve sentence boundaries
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let currentChunk = '';
    let currentIndex = 0;
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;
      
      if (potentialChunk.length > chunkSize && currentChunk) {
        // Create chunk
        const startIndex = content.indexOf(currentChunk, currentIndex);
        const endIndex = startIndex + currentChunk.length;
        
        chunks.push({
          id: `${docId}_chunk_${chunkIndex}`,
          documentId: docId,
          content: currentChunk,
          startIndex,
          endIndex,
          chunkIndex,
          metadata: await this.extractChunkMetadata(currentChunk)
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
        currentChunk = overlapText + (overlapText ? '. ' : '') + trimmedSentence;
        currentIndex = Math.max(0, endIndex - chunkOverlap);
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      const startIndex = content.indexOf(currentChunk, currentIndex);
      chunks.push({
        id: `${docId}_chunk_${chunkIndex}`,
        documentId: docId,
        content: currentChunk,
        startIndex,
        endIndex: startIndex + currentChunk.length,
        chunkIndex,
        metadata: await this.extractChunkMetadata(currentChunk)
      });
    }

    return chunks;
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;
    
    const overlapText = text.slice(-overlapSize);
    // Try to start at a word boundary
    const spaceIndex = overlapText.indexOf(' ');
    return spaceIndex > 0 ? overlapText.slice(spaceIndex + 1) : overlapText;
  }

  private async extractChunkMetadata(content: string): Promise<DocumentChunk['metadata']> {
    const metadata: DocumentChunk['metadata'] = {};

    // Extract headers (lines starting with #, ##, etc. or ALL CAPS)
    const lines = content.split('\n');
    metadata.headers = lines.filter(line => 
      line.trim().startsWith('#') || 
      (line.trim().length > 0 && line.trim() === line.trim().toUpperCase() && line.trim().length < 100)
    );

    // Extract links
    const linkRegex = /https?:\/\/[^\s]+/g;
    metadata.links = content.match(linkRegex) || [];

    // Simple table detection (lines with multiple | or tabs)
    metadata.tables = lines
      .filter(line => (line.match(/\|/g) || []).length > 2 || (line.match(/\t/g) || []).length > 2)
      .map((line, index) => ({ row: index, content: line }));

    return metadata;
  }

  private async analyzeDocument(
    docId: string, 
    content: string, 
    options: ProcessingOptions
  ): Promise<DocumentAnalysis> {
    console.log(`🔍 Analyzing document ${docId}...`);

    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Extract key topics using simple frequency analysis
    const keyTopics = this.extractKeyTopics(content);

    // Entity extraction
    const entities = options.extractEntities ? await this.extractEntities(content) : [];

    // Sentiment analysis
    const sentiment = options.performSentiment ? await this.analyzeSentiment(content) : {
      overall: 0,
      sections: []
    };

    // Structure analysis
    const structure = options.analyzeStructure ? await this.analyzeStructure(content) : {
      outline: [],
      sections: [],
      tables: [],
      images: [],
      codeBlocks: []
    };

    // Calculate complexity and readability
    const complexity = this.calculateComplexity(content);
    const readability = this.calculateReadability(content);

    return {
      id: `analysis_${docId}`,
      documentId: docId,
      summary: await this.generateSummary(content),
      keyTopics,
      entities,
      concepts: keyTopics, // Simplified - would use more sophisticated concept extraction
      sentiment,
      complexity,
      readability,
      language: this.detectLanguage(content),
      wordCount: words.length,
      structure,
      relationships: [],
      insights: await this.generateInsights(content, keyTopics, entities)
    };
  }

  private extractKeyTopics(content: string): string[] {
    // Simple keyword extraction using TF-IDF-like approach
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !this.isStopWord(word));

    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  private async extractEntities(content: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    
    // Simple regex-based entity extraction (in production would use NLP libraries)
    const patterns = {
      person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      organization: /\b[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*(?:\s+(?:Inc|Corp|LLC|Ltd|Company)\.?)\b/g,
      date: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g,
      number: /\b\d+(?:,\d{3})*(?:\.\d+)?\b/g,
      technology: /\b(?:JavaScript|Python|React|Node\.js|API|AI|ML|database|algorithm)\b/gi
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        entities.push({
          text: match[0],
          type: type as ExtractedEntity['type'],
          confidence: 0.8, // Would be calculated by NLP model
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context: content.slice(Math.max(0, match.index - 50), match.index + match[0].length + 50)
        });
      }
    }

    return entities;
  }

  private async analyzeSentiment(content: string): Promise<DocumentAnalysis['sentiment']> {
    // Simple sentiment analysis (in production would use proper NLP models)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'best', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'dislike', 'poor', 'disappointing'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positive = words.filter(word => positiveWords.includes(word)).length;
    const negative = words.filter(word => negativeWords.includes(word)).length;
    
    const overall = positive > negative ? 0.6 : negative > positive ? -0.6 : 0;
    
    return {
      overall,
      sections: []
    };
  }

  private async analyzeStructure(content: string): Promise<DocumentStructure> {
    const lines = content.split('\n');
    const structure: DocumentStructure = {
      outline: [],
      sections: [],
      tables: [],
      images: [],
      codeBlocks: []
    };

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      structure.codeBlocks.push({
        id: `code_${structure.codeBlocks.length}`,
        language: match[1] || 'unknown',
        content: match[2],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // Extract headers and create outline
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const level = (trimmed.match(/^#+/) || [''])[0].length;
        const title = trimmed.replace(/^#+\s*/, '');
        
        structure.outline.push({
          level,
          title,
          startIndex: content.indexOf(line),
          endIndex: content.indexOf(line) + line.length,
          children: []
        });
      }
    });

    return structure;
  }

  private calculateComplexity(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    
    // Average sentence length
    const avgSentenceLength = words.length / sentences.length;
    
    // Long word ratio
    const longWords = words.filter(word => word.length > 6).length;
    const longWordRatio = longWords / words.length;
    
    // Complexity score (0-10)
    return Math.min(10, (avgSentenceLength / 20) * 5 + longWordRatio * 5);
  }

  private calculateReadability(content: string): number {
    // Simplified Flesch Reading Ease score
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    // Simple syllable counting
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    return Math.max(1, count);
  }

  private async generateSummary(content: string): Promise<string> {
    // Simple extractive summarization
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keyTopics = this.extractKeyTopics(content);
    
    // Score sentences based on keyword density
    const sentenceScores = sentences.map(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      const keywordCount = words.filter(word => keyTopics.includes(word)).length;
      return { sentence, score: keywordCount / words.length };
    });
    
    // Return top 3 sentences
    return sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.sentence.trim())
      .join('. ') + '.';
  }

  private async generateInsights(content: string, topics: string[], entities: ExtractedEntity[]): Promise<string[]> {
    const insights: string[] = [];
    
    // Topic-based insights
    if (topics.length > 0) {
      insights.push(`Main topics include: ${topics.slice(0, 5).join(', ')}`);
    }
    
    // Entity insights
    const entityTypes = [...new Set(entities.map(e => e.type))];
    if (entityTypes.length > 0) {
      insights.push(`Contains ${entityTypes.join(', ')} entities`);
    }
    
    // Length insight
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 5000) {
      insights.push('This is a long document that may benefit from summarization');
    } else if (wordCount < 500) {
      insights.push('This is a short document with concise content');
    }
    
    return insights;
  }

  private async updateDocumentRelationships(docId: string, analysis: DocumentAnalysis): Promise<void> {
    const relationships: DocumentRelationship[] = [];
    
    // Compare with existing documents
    for (const existingDocId of this.analyses.keys()) {
      if (existingDocId === docId) continue;
      
      const existingAnalysis = this.analyses.get(existingDocId);
      if (!existingAnalysis) continue;
      
      // Calculate similarity based on shared topics
      const sharedTopics = analysis.keyTopics.filter(topic => 
        existingAnalysis.keyTopics.includes(topic)
      );
      
      if (sharedTopics.length > 0) {
        relationships.push({
          sourceDoc: docId,
          targetDoc: existingDocId,
          type: 'similar',
          strength: sharedTopics.length / Math.max(analysis.keyTopics.length, existingAnalysis.keyTopics.length),
          description: `Shares topics: ${sharedTopics.join(', ')}`
        });
      }
    }
    
    this.relationships.set(docId, relationships);
  }

  // Public API methods
  getDocument(docId: string): DocumentMetadata | undefined {
    return this.documents.get(docId);
  }

  getDocumentChunks(docId: string): DocumentChunk[] {
    return this.chunks.get(docId) || [];
  }

  getDocumentAnalysis(docId: string): DocumentAnalysis | undefined {
    return this.analyses.get(docId);
  }

  getDocumentRelationships(docId: string): DocumentRelationship[] {
    return this.relationships.get(docId) || [];
  }

  getAllDocuments(): DocumentMetadata[] {
    return Array.from(this.documents.values());
  }

  searchDocuments(query: string): DocumentMetadata[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc =>
      doc.title.toLowerCase().includes(queryLower) ||
      doc.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  getDocumentStats(): any {
    const documents = Array.from(this.documents.values());
    const analyses = Array.from(this.analyses.values());
    
    return {
      totalDocuments: documents.length,
      totalWords: analyses.reduce((sum, analysis) => sum + analysis.wordCount, 0),
      averageComplexity: analyses.reduce((sum, analysis) => sum + analysis.complexity, 0) / analyses.length || 0,
      averageReadability: analyses.reduce((sum, analysis) => sum + analysis.readability, 0) / analyses.length || 0,
      languageDistribution: documents.reduce((dist, doc) => {
        dist[doc.language] = (dist[doc.language] || 0) + 1;
        return dist;
      }, {} as Record<string, number>),
      typeDistribution: documents.reduce((dist, doc) => {
        dist[doc.type] = (dist[doc.type] || 0) + 1;
        return dist;
      }, {} as Record<string, number>)
    };
  }
}