import { useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Download, Code, FileJson, FileCode } from 'lucide-react';
import { toast } from 'sonner';

interface MonacoCodeEditorProps {
  onExecute?: (code: string, language: string) => Promise<string>;
  initialCode?: string;
  initialLanguage?: string;
}

export const MonacoCodeEditor = ({ 
  onExecute, 
  initialCode = '', 
  initialLanguage = 'typescript' 
}: MonacoCodeEditorProps) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco themes
    monaco.editor.defineTheme('wisdomnet-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#1a1a2e',
        'editor.foreground': '#e0e0e0',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
      },
    });
    
    monaco.editor.setTheme('wisdomnet-dark');
  };

  const handleExecute = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    setIsExecuting(true);
    setOutput('Executing...\n');

    try {
      if (onExecute) {
        const result = await onExecute(code, language);
        setOutput(result);
        toast.success('Code executed successfully');
      } else {
        // Fallback: just display the code
        setOutput(`Language: ${language}\n\nCode:\n${code}\n\n(No execution handler provided)`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setOutput(`Error: ${errorMsg}`);
      toast.error('Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const downloadCode = () => {
    const extensions: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      json: 'json',
      html: 'html',
      css: 'css',
    };

    const ext = extensions[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded');
  };

  const loadTemplate = (lang: string) => {
    const templates: Record<string, string> = {
      typescript: `// TypeScript Example
interface User {
  name: string;
  age: number;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`;
}

const user: User = { name: "Alice", age: 30 };
console.log(greetUser(user));`,
      
      javascript: `// JavaScript Example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));`,
      
      python: `# Python Example
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(f"Factorial(5): {factorial(5)}")`,
      
      json: `{
  "name": "WisdomNET Project",
  "version": "1.0.0",
  "features": [
    "AI Orchestration",
    "Code Generation",
    "Prompt Chains"
  ],
  "config": {
    "maxTokens": 1000,
    "temperature": 0.7
  }
}`,
    };

    setLanguage(lang);
    setCode(templates[lang] || '');
    toast.info(`Loaded ${lang} template`);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-3 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-primary" />
          <span className="font-semibold">Code Editor</span>
          <Badge variant="outline">{language}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={downloadCode}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            <Play className="w-4 h-4 mr-2" />
            {isExecuting ? 'Running...' : 'Execute'}
          </Button>
        </div>
      </div>

      {/* Language Selector */}
      <div className="border-b p-2 bg-muted/30">
        <Tabs value={language} onValueChange={loadTemplate}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Output Panel */}
        {output && (
          <Card className="w-[400px] border-l rounded-none flex flex-col">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="font-semibold text-sm">Output</h3>
            </div>
            <pre className="flex-1 p-4 overflow-auto text-xs font-mono bg-black/50 text-green-400">
              {output}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
};
