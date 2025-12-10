// Background Settings Panel
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Settings2, 
  Star, 
  Cloud, 
  Palette, 
  Sparkles,
  RotateCcw,
  X
} from 'lucide-react';
import { BackgroundSettings, DEFAULT_BACKGROUND_SETTINGS } from './StarfieldNebulaBackground';

export interface BackgroundSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Local storage key for persisting settings
const STORAGE_KEY = 'lucid-background-settings';

export function BackgroundSettingsPanel({
  isOpen,
  onClose,
}: BackgroundSettingsPanelProps) {
  const [settings, setSettings] = useState<BackgroundSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_BACKGROUND_SETTINGS;
  });

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Dispatch custom event so background component can listen
    window.dispatchEvent(new CustomEvent('background-settings-changed', { detail: settings }));
  }, [settings]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof BackgroundSettings>(
    key: K,
    value: BackgroundSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_BACKGROUND_SETTINGS);
  };

  return (
    <div className="fixed bottom-14 right-14 w-80 max-h-[70vh] bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Background Settings</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[calc(70vh-60px)]">
        <div className="p-4 space-y-6">
          {/* Stars Section */}
          <Card className="p-4 border-border/30">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-400" />
              <h4 className="font-medium text-sm">Stars</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs">Star Count</Label>
                  <span className="text-xs text-muted-foreground">{settings.starCount}</span>
                </div>
                <Slider
                  value={[settings.starCount]}
                  onValueChange={([v]) => updateSetting('starCount', v)}
                  min={500}
                  max={5000}
                  step={100}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs">Star Speed</Label>
                  <span className="text-xs text-muted-foreground">{settings.starSpeed.toFixed(2)}</span>
                </div>
                <Slider
                  value={[settings.starSpeed]}
                  onValueChange={([v]) => updateSetting('starSpeed', v)}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs">Star Size</Label>
                  <span className="text-xs text-muted-foreground">{settings.starSize.toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.starSize]}
                  onValueChange={([v]) => updateSetting('starSize', v)}
                  min={0.5}
                  max={4}
                  step={0.1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs">Brightness</Label>
                  <span className="text-xs text-muted-foreground">{settings.starBrightness.toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.starBrightness]}
                  onValueChange={([v]) => updateSetting('starBrightness', v)}
                  min={0.2}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Star Twinkle</Label>
                <Switch
                  checked={settings.starTwinkle}
                  onCheckedChange={(v) => updateSetting('starTwinkle', v)}
                />
              </div>
            </div>
          </Card>

          {/* Nebula Section */}
          <Card className="p-4 border-border/30">
            <div className="flex items-center gap-2 mb-4">
              <Cloud className="w-4 h-4 text-purple-400" />
              <h4 className="font-medium text-sm">Nebula Clouds</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs">Opacity</Label>
                  <span className="text-xs text-muted-foreground">{settings.nebulaOpacity.toFixed(2)}</span>
                </div>
                <Slider
                  value={[settings.nebulaOpacity]}
                  onValueChange={([v]) => updateSetting('nebulaOpacity', v)}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs">Speed</Label>
                  <span className="text-xs text-muted-foreground">{settings.nebulaSpeed.toFixed(3)}</span>
                </div>
                <Slider
                  value={[settings.nebulaSpeed]}
                  onValueChange={([v]) => updateSetting('nebulaSpeed', v)}
                  min={0}
                  max={0.1}
                  step={0.005}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs">Scale</Label>
                  <span className="text-xs text-muted-foreground">{settings.nebulaScale.toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.nebulaScale]}
                  onValueChange={([v]) => updateSetting('nebulaScale', v)}
                  min={0.5}
                  max={5}
                  step={0.1}
                />
              </div>
            </div>
          </Card>

          {/* Colors Section */}
          <Card className="p-4 border-border/30">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-cyan-400" />
              <h4 className="font-medium text-sm">Colors</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="text-xs w-20">Primary</Label>
                <Input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting('primaryColor', e.target.value)}
                  className="w-10 h-8 p-1 cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting('primaryColor', e.target.value)}
                  className="flex-1 h-8 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-xs w-20">Secondary</Label>
                <Input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                  className="w-10 h-8 p-1 cursor-pointer"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                  className="flex-1 h-8 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-xs w-20">Accent</Label>
                <Input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  className="w-10 h-8 p-1 cursor-pointer"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  className="flex-1 h-8 text-xs font-mono"
                />
              </div>
            </div>
          </Card>

          {/* Effects Section */}
          <Card className="p-4 border-border/30">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-medium text-sm">Effects</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs">Glow Intensity</Label>
                  <span className="text-xs text-muted-foreground">{settings.glowIntensity.toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.glowIntensity]}
                  onValueChange={([v]) => updateSetting('glowIntensity', v)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Shooting Stars</Label>
                <Switch
                  checked={settings.shootingStars}
                  onCheckedChange={(v) => updateSetting('shootingStars', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Neural Network (Processing)</Label>
                <Switch
                  checked={settings.neuralNetwork}
                  onCheckedChange={(v) => updateSetting('neuralNetwork', v)}
                />
              </div>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
