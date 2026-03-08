import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  KeyRound,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Mail,
  Key,
  Globe,
  Lock,
  Shield,
  Search,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type VaultCategory = 'api-key' | 'email' | 'credential' | 'token' | 'other';

interface VaultEntry {
  id: string;
  label: string;
  value: string;
  category: VaultCategory;
  createdAt: Date;
  lastUsed?: Date;
}

const categoryConfig: Record<VaultCategory, { icon: React.ComponentType<any>; color: string; label: string }> = {
  'api-key': { icon: Key, color: 'text-amber-500', label: 'API Key' },
  'email': { icon: Mail, color: 'text-blue-500', label: 'Email' },
  'credential': { icon: Lock, color: 'text-red-500', label: 'Credential' },
  'token': { icon: Shield, color: 'text-emerald-500', label: 'Token' },
  'other': { icon: Globe, color: 'text-muted-foreground', label: 'Other' },
};

const STORAGE_KEY = 'lucid-vault-entries';

export function VaultPanel() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<VaultCategory>('api-key');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<VaultCategory | 'all'>('all');

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setEntries(parsed.map((e: any) => ({ ...e, createdAt: new Date(e.createdAt), lastUsed: e.lastUsed ? new Date(e.lastUsed) : undefined })));
      }
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = () => {
    if (!newLabel.trim() || !newValue.trim()) return;
    const entry: VaultEntry = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      value: newValue.trim(),
      category: newCategory,
      createdAt: new Date(),
    };
    setEntries(prev => [entry, ...prev]);
    setNewLabel('');
    setNewValue('');
    setIsAdding(false);
    toast.success('Secret added to vault');
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Secret removed');
  };

  const copyValue = (entry: VaultEntry) => {
    navigator.clipboard.writeText(entry.value);
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, lastUsed: new Date() } : e));
    toast.success('Copied to clipboard');
  };

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const maskValue = (val: string) => {
    if (val.length <= 8) return '••••••••';
    return val.slice(0, 4) + '••••••••' + val.slice(-4);
  };

  const filtered = entries.filter(e => {
    if (filterCat !== 'all' && e.category !== filterCat) return false;
    if (search && !e.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Vault</h3>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{entries.length}</Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(!isAdding)} className="h-7 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search secrets..."
            className="h-7 pl-7 text-xs bg-muted/30 border-border/30"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-1 mt-2 flex-wrap">
          <Button
            size="sm"
            variant={filterCat === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilterCat('all')}
            className="h-6 px-2 text-[10px]"
          >
            All
          </Button>
          {(Object.keys(categoryConfig) as VaultCategory[]).map(cat => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            return (
              <Button
                key={cat}
                size="sm"
                variant={filterCat === cat ? 'default' : 'ghost'}
                onClick={() => setFilterCat(cat)}
                className="h-6 px-2 text-[10px] gap-1"
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="p-3 border-b border-border/30 bg-muted/20 space-y-2">
          <Input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Label (e.g. OpenAI Key)"
            className="h-7 text-xs"
          />
          <Input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="Value / Secret"
            type="password"
            className="h-7 text-xs"
          />
          <div className="flex gap-1 flex-wrap">
            {(Object.keys(categoryConfig) as VaultCategory[]).map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={newCategory === cat ? 'default' : 'outline'}
                onClick={() => setNewCategory(cat)}
                className="h-6 px-2 text-[10px]"
              >
                {categoryConfig[cat].label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addEntry} disabled={!newLabel.trim() || !newValue.trim()} className="h-7 text-xs flex-1">
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Entries list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderOpen className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">{entries.length === 0 ? 'No secrets stored yet' : 'No matching secrets'}</p>
            </div>
          )}
          {filtered.map(entry => {
            const cfg = categoryConfig[entry.category];
            const Icon = cfg.icon;
            const revealed = revealedIds.has(entry.id);

            return (
              <Card key={entry.id} className="p-2.5 bg-muted/20 border-border/30 hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', cfg.color)} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{entry.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {revealed ? entry.value : maskValue(entry.value)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => toggleReveal(entry.id)} className="h-6 w-6">
                      {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => copyValue(entry)} className="h-6 w-6">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => removeEntry(entry.id)} className="h-6 w-6 text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{cfg.label}</Badge>
                  <span className="text-[9px] text-muted-foreground">
                    {entry.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border/30">
        <p className="text-[9px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Stored locally in browser — not synced
        </p>
      </div>
    </div>
  );
}
