import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Virtual filesystem for edge-side operations
const edgeFS: Map<string, string> = new Map();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { code, language, action, path, content } = await req.json();

    // Filesystem operations
    if (action === 'fs') {
      switch (language) {
        case 'write':
          edgeFS.set(path, content);
          return respond({ success: true, output: `Written ${path}` });
        case 'read':
          const data = edgeFS.get(path);
          return respond({ success: !!data, output: data || `File not found: ${path}` });
        case 'list':
          const files = [...edgeFS.keys()].filter(k => k.startsWith(path || '/'));
          return respond({ success: true, output: files.join('\n') });
        case 'delete':
          edgeFS.delete(path);
          return respond({ success: true, output: `Deleted ${path}` });
      }
    }

    console.log(`🔧 VM Edge Executor: ${language}`);
    const startTime = Date.now();
    let output = '';
    let success = true;

    switch (language) {
      case 'typescript':
      case 'javascript':
      case 'js':
      case 'ts': {
        try {
          const logs: string[] = [];
          const mockConsole = {
            log: (...args: any[]) => logs.push(args.map(v => typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)).join(' ')),
            error: (...args: any[]) => logs.push('ERROR: ' + args.map(String).join(' ')),
            warn: (...args: any[]) => logs.push('WARN: ' + args.map(String).join(' ')),
            info: (...args: any[]) => logs.push('INFO: ' + args.map(String).join(' ')),
            table: (data: any) => logs.push(JSON.stringify(data, null, 2)),
            dir: (obj: any) => logs.push(JSON.stringify(obj, null, 2)),
            assert: (c: boolean, ...a: any[]) => { if (!c) logs.push('Assertion: ' + a.join(' ')); },
            time: () => {}, timeEnd: () => {}, clear: () => {},
          };

          const func = new Function('console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Map', 'Set', 'Promise', code);
          const result = func(mockConsole, Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise);
          if (result !== undefined && logs.length === 0) {
            logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
          }
          output = logs.join('\n') || '(executed successfully, no output)';
        } catch (error) {
          output = `Runtime Error: ${error instanceof Error ? error.message : String(error)}`;
          success = false;
        }
        break;
      }

      case 'json': {
        try {
          const parsed = JSON.parse(code);
          output = `✓ Valid JSON\n${JSON.stringify(parsed, null, 2)}`;
        } catch (error) {
          output = `✗ Invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
          success = false;
        }
        break;
      }

      case 'sql': {
        output = `SQL execution requires database connection.\nQuery: ${code}\n\nUse the Database Explorer app for live SQL queries.`;
        break;
      }

      case 'markdown':
      case 'md': {
        output = `Markdown preview:\n---\n${code}\n---\nRendered in browser.`;
        break;
      }

      case 'yaml':
      case 'yml': {
        try {
          // Basic YAML validation
          const lines = code.split('\n');
          const errors: string[] = [];
          lines.forEach((l, i) => {
            if (l.includes('\t')) errors.push(`Line ${i + 1}: tabs not allowed in YAML`);
          });
          output = errors.length > 0 ? `YAML issues:\n${errors.join('\n')}` : `✓ Valid YAML (${lines.length} lines)`;
          success = errors.length === 0;
        } catch (e) {
          output = `YAML error: ${e}`;
          success = false;
        }
        break;
      }

      case 'regex': {
        try {
          const [pattern, ...testLines] = code.split('\n');
          const regex = new RegExp(pattern.replace(/^\/|\/[gimsuvy]*$/g, ''), pattern.match(/\/([gimsuvy]*)$/)?.[1] || '');
          const results = testLines.map(l => {
            const match = l.match(regex);
            return match ? `✓ "${l}" → matched: ${JSON.stringify(match)}` : `✗ "${l}" → no match`;
          });
          output = `Regex: ${regex}\n\n${results.join('\n')}`;
        } catch (e) {
          output = `Regex error: ${e instanceof Error ? e.message : String(e)}`;
          success = false;
        }
        break;
      }

      default:
        output = `Language '${language}' not yet supported on edge.\nSupported: javascript, typescript, json, sql, yaml, regex, markdown`;
        success = false;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Executed in ${duration}ms`);

    return respond({ output, success, duration, language, backend: 'edge' });
  } catch (error) {
    console.error("❌ VM execution error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", output: "Execution failed", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function respond(data: any) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
