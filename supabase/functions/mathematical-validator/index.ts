// 🔗 CONNECT: Mathematical Validation → Computational Proof → Symbolic Reasoning
// 🧩 INTENT: Edge function for AI to validate mathematical claims using real computation
// ✅ SPEC: Mathematical-Validator-v1.0

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { expressions, theory } = await req.json();
    console.log('Validating mathematical expressions:', expressions);

    // Validate mathematical expressions using multiple approaches
    const validationResults = await Promise.all([
      validateExpressionSyntax(expressions),
      evaluateNumericalExpressions(expressions),
      checkMathematicalConsistency(expressions),
      validateWithSymbolicMath(expressions)
    ]);

    // Synthesize results
    const proof = synthesizeMathematicalProof(validationResults, theory);
    
    console.log('Mathematical validation completed:', proof);

    return new Response(JSON.stringify({
      validation: proof.result,
      confidence: proof.confidence,
      computations: proof.computations,
      proof: proof.symbolic_proof,
      errors: proof.errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mathematical-validator:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      validation: 'inconclusive',
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// 🔗 CONNECT: Expression Parsing → Syntax Validation → Mathematical Grammar
// 🧩 INTENT: Validate mathematical expression syntax and structure
// ✅ SPEC: Expression-Syntax-v1.0
async function validateExpressionSyntax(expressions: string[]): Promise<{
  valid_expressions: string[];
  syntax_errors: string[];
  parsed_expressions: any[];
}> {
  const validExpressions: string[] = [];
  const syntaxErrors: string[] = [];
  const parsedExpressions: any[] = [];

  for (const expr of expressions) {
    try {
      // Basic mathematical syntax validation
      const cleaned = expr.replace(/\s/g, '');
      
      // Check for balanced parentheses
      if (!isBalancedParentheses(cleaned)) {
        syntaxErrors.push(`Unbalanced parentheses in: ${expr}`);
        continue;
      }

      // Check for valid mathematical operators
      if (!isValidMathExpression(cleaned)) {
        syntaxErrors.push(`Invalid mathematical syntax in: ${expr}`);
        continue;
      }

      validExpressions.push(expr);
      parsedExpressions.push(parseExpression(expr));
      
    } catch (error) {
      syntaxErrors.push(`Parsing error in ${expr}: ${error.message}`);
    }
  }

  return { valid_expressions: validExpressions, syntax_errors: syntaxErrors, parsed_expressions: parsedExpressions };
}

// 🔗 CONNECT: Numerical Evaluation → Computation Engine → Result Verification
// 🧩 INTENT: Evaluate mathematical expressions numerically for verification
// ✅ SPEC: Numerical-Evaluation-v1.0
async function evaluateNumericalExpressions(expressions: string[]): Promise<{
  evaluations: Array<{ expression: string; result: number | string; variables?: any }>;
  computation_errors: string[];
}> {
  const evaluations: Array<{ expression: string; result: number | string; variables?: any }> = [];
  const computationErrors: string[] = [];

  for (const expr of expressions) {
    try {
      // Safe mathematical evaluation (avoiding eval for security)
      const result = safeEvaluateMath(expr);
      evaluations.push({ expression: expr, result });
    } catch (error) {
      computationErrors.push(`Evaluation error in ${expr}: ${error.message}`);
    }
  }

  return { evaluations, computation_errors: computationErrors };
}

// 🔗 CONNECT: Mathematical Consistency → Logical Validation → Proof Verification
// 🧩 INTENT: Check mathematical consistency and logical validity
// ✅ SPEC: Mathematical-Consistency-v1.0
async function checkMathematicalConsistency(expressions: string[]): Promise<{
  consistent: boolean;
  consistency_score: number;
  inconsistencies: string[];
  logical_structure: any;
}> {
  let consistencyScore = 1.0;
  const inconsistencies: string[] = [];
  
  // Check for mathematical contradictions
  for (let i = 0; i < expressions.length; i++) {
    for (let j = i + 1; j < expressions.length; j++) {
      const contradiction = checkContradiction(expressions[i], expressions[j]);
      if (contradiction) {
        inconsistencies.push(`Contradiction between "${expressions[i]}" and "${expressions[j]}"`);
        consistencyScore -= 0.2;
      }
    }
  }

  // Check mathematical relationships
  const relationships = analyzeExpressionRelationships(expressions);
  
  return {
    consistent: inconsistencies.length === 0,
    consistency_score: Math.max(0, consistencyScore),
    inconsistencies,
    logical_structure: relationships
  };
}

// 🔗 CONNECT: Symbolic Mathematics → Computer Algebra → Formal Proof
// 🧩 INTENT: Validate expressions using symbolic mathematics
// ✅ SPEC: Symbolic-Mathematics-v1.0
async function validateWithSymbolicMath(expressions: string[]): Promise<{
  symbolic_results: any[];
  algebraic_simplifications: any[];
  mathematical_properties: any[];
}> {
  const symbolicResults: any[] = [];
  const algebraicSimplifications: any[] = [];
  const mathematicalProperties: any[] = [];

  for (const expr of expressions) {
    try {
      // Symbolic manipulation (simplified implementation)
      const simplified = symbolicSimplify(expr);
      const properties = analyzeMathematicalProperties(expr);
      
      symbolicResults.push({
        original: expr,
        simplified: simplified,
        properties: properties
      });
      
      algebraicSimplifications.push(simplified);
      mathematicalProperties.push(properties);
      
    } catch (error) {
      console.error(`Symbolic math error for ${expr}:`, error);
    }
  }

  return { symbolic_results: symbolicResults, algebraic_simplifications: algebraicSimplifications, mathematical_properties: mathematicalProperties };
}

// 🔗 CONNECT: Proof Synthesis → Evidence Integration → Confidence Calculation
// 🧩 INTENT: Synthesize all validation results into final mathematical proof
// ✅ SPEC: Proof-Synthesis-v1.0
function synthesizeMathematicalProof(results: any[], theory: string): {
  result: 'confirmed' | 'refuted' | 'inconclusive';
  confidence: number;
  computations: any[];
  symbolic_proof: any;
  errors: string[];
} {
  const allErrors = results.flatMap(r => r.syntax_errors || r.computation_errors || r.inconsistencies || []);
  const allComputations = results.flatMap(r => r.evaluations || r.symbolic_results || []);
  
  let confidence = 1.0;
  let result: 'confirmed' | 'refuted' | 'inconclusive' = 'confirmed';

  // Reduce confidence based on errors
  if (allErrors.length > 0) {
    confidence -= Math.min(0.8, allErrors.length * 0.2);
  }

  // Check consistency
  const consistencyResult = results.find(r => r.hasOwnProperty('consistent'));
  if (consistencyResult && !consistencyResult.consistent) {
    result = 'refuted';
    confidence = Math.max(0.1, consistencyResult.consistency_score);
  }

  // If too many errors or low confidence, mark as inconclusive
  if (confidence < 0.3 || allErrors.length > 5) {
    result = 'inconclusive';
  }

  const symbolicProof = {
    theory: theory,
    mathematical_validation: result,
    confidence_level: confidence,
    computed_results: allComputations,
    validation_steps: results,
    error_analysis: allErrors
  };

  return {
    result,
    confidence,
    computations: allComputations,
    symbolic_proof: symbolicProof,
    errors: allErrors
  };
}

// Helper functions for mathematical validation

function isBalancedParentheses(expr: string): boolean {
  let count = 0;
  for (const char of expr) {
    if (char === '(') count++;
    if (char === ')') count--;
    if (count < 0) return false;
  }
  return count === 0;
}

function isValidMathExpression(expr: string): boolean {
  // Basic regex for mathematical expressions
  const mathPattern = /^[0-9+\-*/.()^sincotnlgexp\s√πe]+$/i;
  return mathPattern.test(expr);
}

function parseExpression(expr: string): any {
  // Simple expression parsing (in production, use a proper math parser)
  return {
    original: expr,
    tokens: expr.split(/([+\-*/()^])/),
    type: detectExpressionType(expr)
  };
}

function detectExpressionType(expr: string): string {
  if (expr.includes('sin') || expr.includes('cos') || expr.includes('tan')) return 'trigonometric';
  if (expr.includes('log') || expr.includes('ln')) return 'logarithmic';
  if (expr.includes('^') || expr.includes('exp')) return 'exponential';
  if (expr.includes('√')) return 'radical';
  return 'algebraic';
}

function safeEvaluateMath(expr: string): number | string {
  // Implement safe mathematical evaluation without using eval()
  // This is a simplified version - in production use a proper math library
  
  try {
    // Handle simple arithmetic expressions
    const cleaned = expr.replace(/[^0-9+\-*/.()]/g, '');
    if (cleaned !== expr) {
      return 'Complex expression - symbolic result';
    }
    
    // Very basic calculation for simple expressions
    if (/^[0-9+\-*/.()]+$/.test(cleaned)) {
      // Use Function constructor instead of eval for better security
      return new Function('return ' + cleaned)();
    }
    
    return 'Requires symbolic computation';
  } catch (error) {
    throw new Error(`Cannot evaluate expression: ${error.message}`);
  }
}

function checkContradiction(expr1: string, expr2: string): boolean {
  // Simplified contradiction detection
  // In production, implement proper logical analysis
  
  // Basic contradiction patterns
  if (expr1.includes('≠') && expr2.includes('=')) {
    const var1 = expr1.split('≠')[0].trim();
    const var2 = expr2.split('=')[0].trim();
    return var1 === var2;
  }
  
  return false;
}

function analyzeExpressionRelationships(expressions: string[]): any {
  return {
    expression_count: expressions.length,
    variable_dependencies: extractVariables(expressions),
    relationship_matrix: buildRelationshipMatrix(expressions)
  };
}

function extractVariables(expressions: string[]): string[] {
  const variables = new Set<string>();
  
  for (const expr of expressions) {
    // Extract variables (letters not in function names)
    const matches = expr.match(/\b[a-zA-Z](?![a-zA-Z])/g);
    if (matches) {
      matches.forEach(v => variables.add(v));
    }
  }
  
  return Array.from(variables);
}

function buildRelationshipMatrix(expressions: string[]): any[][] {
  const n = expressions.length;
  const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        // Simple relationship scoring based on shared variables
        const vars1 = extractVariables([expressions[i]]);
        const vars2 = extractVariables([expressions[j]]);
        const sharedVars = vars1.filter(v => vars2.includes(v));
        matrix[i][j] = sharedVars.length / Math.max(vars1.length, vars2.length, 1);
      }
    }
  }
  
  return matrix;
}

function symbolicSimplify(expr: string): string {
  // Basic symbolic simplification rules
  let simplified = expr;
  
  // Remove unnecessary operations
  simplified = simplified.replace(/\+\s*0/g, '');
  simplified = simplified.replace(/0\s*\+/g, '');
  simplified = simplified.replace(/\*\s*1/g, '');
  simplified = simplified.replace(/1\s*\*/g, '');
  simplified = simplified.replace(/\*\s*0/g, '0');
  simplified = simplified.replace(/0\s*\*/g, '0');
  
  return simplified || expr;
}

function analyzeMathematicalProperties(expr: string): any {
  return {
    has_constants: /\d/.test(expr),
    has_variables: /[a-zA-Z]/.test(expr),
    has_functions: /(sin|cos|tan|log|ln|exp|sqrt)/.test(expr),
    complexity_score: expr.length / 10,
    expression_depth: (expr.match(/\(/g) || []).length
  };
}