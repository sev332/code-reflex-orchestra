// Settings Page — Theme, shortcuts, preferences, system info
import React, { useState } from 'react';
import { useAIAppIntegration } from '@/hooks/useAIAppIntegration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Settings, Palette, Keyboard, Bell, Shield, Database, Cpu,
  Monitor, Moon, Sun, Globe, Volume2, VolumeX, Eye, EyeOff,
  ChevronRight, Check, Zap, Brain, HardDrive, Gauge, Clock,
  Layers, RefreshCw, Download, Upload, Trash2, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsSection = 'appearance' | 'shortcuts' | 'notifications' | 'ai' | 'performance' | 'about';

const sections: { id: SettingsSection; icon: React.ComponentType<any>; label: string }[] = [
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'shortcuts', icon: Keyboard, label: 'Shortcuts' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'ai', icon: Brain, label: 'AI & Models' },
  { id: 'performance', icon: Gauge, label: 'Performance' },
  { id: 'about', icon: Info, label: 'About' },
];

const shortcuts = [
  { keys: '⌘ K', action: 'Command Palette' },
  { keys: '⌘ 1', action: 'Open Chat' },
  { keys: '⌘ D', action: 'Open Documents' },
  { keys: '⌘ R', action: 'Reload Page' },
  { keys: 'F11', action: 'Toggle Fullscreen' },
  { keys: '⌘ B', action: 'Toggle Left Drawer' },
  { keys: '⌘ /', action: 'Toggle Right Drawer' },
  { keys: '⌘ \\', action: 'Toggle Bottom Dock' },
  { keys: '⌘ E', action: 'Quick Search' },
  { keys: '⌘ S', action: 'Save (context-aware)' },
  { keys: '⌘ Z', action: 'Undo' },
  { keys: '⌘ ⇧ Z', action: 'Redo' },
  { keys: 'F5', action: 'Present (Slides)' },
  { keys: 'G', action: 'Grid View (Slides)' },
  { keys: 'Esc', action: 'Close / Cancel' },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState('cyan');
  const [fontSize, setFontSize] = useState(14);
  const [uiDensity, setUiDensity] = useState<'compact' | 'normal' | 'comfortable'>('compact');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [nebulaEnabled, setNebulaEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifAgents, setNotifAgents] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);
  const [aiModel, setAiModel] = useState('gemini-pro');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const accentColors = [
    { id: 'cyan', label: 'Cyan', hsl: 'hsl(193, 100%, 50%)' },
    { id: 'purple', label: 'Purple', hsl: 'hsl(270, 80%, 60%)' },
    { id: 'emerald', label: 'Emerald', hsl: 'hsl(150, 100%, 50%)' },
    { id: 'amber', label: 'Amber', hsl: 'hsl(45, 100%, 55%)' },
    { id: 'rose', label: 'Rose', hsl: 'hsl(350, 80%, 60%)' },
    { id: 'blue', label: 'Blue', hsl: 'hsl(210, 90%, 55%)' },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['dark', 'light', 'system'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-colors capitalize',
                      theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 hover:border-border/60'
                    )}
                  >
                    {t === 'dark' && <Moon className="w-5 h-5 mx-auto mb-1.5" />}
                    {t === 'light' && <Sun className="w-5 h-5 mx-auto mb-1.5" />}
                    {t === 'system' && <Monitor className="w-5 h-5 mx-auto mb-1.5" />}
                    <span className="text-xs">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Accent Color</h3>
              <div className="flex gap-2">
                {accentColors.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-transform',
                      accentColor === c.id ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: c.hsl }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Font Size</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6">{fontSize}</span>
                <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={11} max={18} step={1} className="flex-1" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">UI Density</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'normal', 'comfortable'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setUiDensity(d)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs capitalize transition-colors',
                      uiDensity === d ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 hover:border-border/60'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Effects</h3>
              <SettingToggle label="Animations" description="UI transition animations" value={animationsEnabled} onChange={setAnimationsEnabled} />
              <SettingToggle label="Neural Particles" description="Background particle effects" value={particlesEnabled} onChange={setParticlesEnabled} />
              <SettingToggle label="Nebula Background" description="Starfield nebula effect" value={nebulaEnabled} onChange={setNebulaEnabled} />
              <SettingToggle label="Sound Effects" description="UI interaction sounds" value={soundEnabled} onChange={setSoundEnabled} />
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div>
            <h3 className="text-sm font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-0.5">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/20">
                  <span className="text-xs">{s.action}</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border/40">{s.keys}</Badge>
                </div>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Notification Preferences</h3>
            <SettingToggle label="Enable Notifications" description="Show system notifications" value={notifEnabled} onChange={setNotifEnabled} />
            <SettingToggle label="Agent Activity" description="Notify on agent task completion" value={notifAgents} onChange={setNotifAgents} />
            <SettingToggle label="System Alerts" description="API limits, errors, warnings" value={notifSystem} onChange={setNotifSystem} />
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-3">Default Model</h3>
              <div className="grid grid-cols-2 gap-2">
                {['gemini-pro', 'gemini-flash', 'gpt-4o', 'claude-3.5'].map(m => (
                  <button
                    key={m}
                    onClick={() => setAiModel(m)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-xs transition-colors',
                      aiModel === m ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 hover:border-border/60'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Temperature: {temperature}</h3>
              <Slider value={[temperature * 100]} onValueChange={([v]) => setTemperature(v / 100)} max={100} step={5} />
              <p className="text-[10px] text-muted-foreground mt-1">Lower = more focused, Higher = more creative</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Max Tokens: {maxTokens}</h3>
              <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} min={256} max={16384} step={256} />
            </div>

            <SettingToggle label="Streaming Responses" description="Show AI responses as they generate" value={streamingEnabled} onChange={setStreamingEnabled} />
            <SettingToggle label="Auto-Save Context" description="Persist conversation context to memory" value={autoSave} onChange={setAutoSave} />
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">System Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-card/30">
                <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Cpu className="w-3 h-3" /> Memory</div>
                <div className="text-lg font-semibold">128 MB</div>
                <p className="text-[9px] text-muted-foreground">of 512 MB limit</p>
              </Card>
              <Card className="p-3 bg-card/30">
                <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><HardDrive className="w-3 h-3" /> Storage</div>
                <div className="text-lg font-semibold">2.4 GB</div>
                <p className="text-[9px] text-muted-foreground">localStorage + IndexedDB</p>
              </Card>
              <Card className="p-3 bg-card/30">
                <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Layers className="w-3 h-3" /> Apps Loaded</div>
                <div className="text-lg font-semibold">23</div>
                <p className="text-[9px] text-muted-foreground">all lazy-loaded</p>
              </Card>
              <Card className="p-3 bg-card/30">
                <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Uptime</div>
                <div className="text-lg font-semibold">{Math.floor(performance.now() / 60000)}m</div>
                <p className="text-[9px] text-muted-foreground">session duration</p>
              </Card>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-semibold mb-3">Cache Management</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <RefreshCw className="w-3 h-3" /> Clear Cache
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Download className="w-3 h-3" /> Export Data
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1 text-destructive border-destructive/30">
                  <Trash2 className="w-3 h-3" /> Reset All
                </Button>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">LUCID Browser OS</h2>
              <p className="text-xs text-muted-foreground mt-1">v2.0.0 — Professional Suite</p>
            </div>

            <Card className="p-3 bg-card/30 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Applications</span><span>23 pro-grade apps</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Architecture</span><span>AIMOS / APOE</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Backend</span><span>Supabase Edge Functions</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Framework</span><span>React 18 + Vite + TypeScript</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">UI</span><span>Tailwind CSS + shadcn/ui</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">3D Engine</span><span>React Three Fiber + Three.js</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Flow Editor</span><span>XYFlow (React Flow)</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Code Editor</span><span>Monaco Editor</span></div>
            </Card>

            <p className="text-[10px] text-muted-foreground text-center">
              Built with ♥ using Lovable · Powered by AIMOS Architecture
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-52 border-r border-border/30 bg-card/20 flex flex-col">
        <div className="px-3 py-3 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Settings</span>
          </div>
        </div>
        <ScrollArea className="flex-1 p-1.5">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors mb-0.5',
                  activeSection === s.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-xl mx-auto p-6">
          <h2 className="text-lg font-semibold mb-4 capitalize">{activeSection}</h2>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable Toggle ─── */
function SettingToggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/10">
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground">{description}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
