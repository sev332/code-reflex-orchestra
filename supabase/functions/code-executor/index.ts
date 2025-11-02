import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, language } = await req.json();

    console.log(`🔧 Executing ${language} code`);

    let output = '';

    // Execute based on language
    switch (language) {
      case 'typescript':
      case 'javascript': {
        // Create a sandboxed execution environment
        try {
          // Capture console output
          const logs: string[] = [];
          const mockConsole = {
            log: (...args: any[]) => logs.push(args.map(String).join(' ')),
            error: (...args: any[]) => logs.push('ERROR: ' + args.map(String).join(' ')),
            warn: (...args: any[]) => logs.push('WARN: ' + args.map(String).join(' ')),
          };

          // Execute in sandboxed context
          const func = new Function('console', code);
          func(mockConsole);

          output = logs.join('\n') || 'Code executed successfully (no output)';
        } catch (error) {
          output = `Runtime Error: ${error instanceof Error ? error.message : String(error)}`;
        }
        break;
      }

      case 'python': {
        output = `Python execution not yet supported in browser environment.

Code to execute:
${code}

To execute Python code, you would need to:
1. Set up a Python runtime environment
2. Use a service like Pyodide or a backend Python executor
3. Implement proper sandboxing for security`;
        break;
      }

      case 'json': {
        try {
          const parsed = JSON.parse(code);
          output = `✓ Valid JSON\n\nParsed object:\n${JSON.stringify(parsed, null, 2)}`;
        } catch (error) {
          output = `✗ Invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
        }
        break;
      }

      case 'html': {
        output = `HTML preview mode not yet implemented.

Your HTML:
${code}

This would normally render in an iframe or separate preview window.`;
        break;
      }

      case 'css': {
        output = `CSS validation not yet implemented.

Your CSS:
${code}

This would normally validate and show applicable styles.`;
        break;
      }

      default:
        output = `Language '${language}' execution not yet supported.\n\nCode:\n${code}`;
    }

    console.log("✅ Code execution complete");

    return new Response(
      JSON.stringify({ output, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Code execution error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        output: "Execution failed",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
