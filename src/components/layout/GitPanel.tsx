// Git History and Branch Management Panel for Code Builder
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  Check,
  Clock,
  User,
  Circle,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Commit {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

interface Branch {
  name: string;
  isActive: boolean;
  ahead: number;
  behind: number;
  lastCommit: string;
}

export function GitPanel() {
  const [activeTab, setActiveTab] = useState('branches');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);

  // Mock data - in real implementation, this would come from Git API
  const branches: Branch[] = [
    { name: 'main', isActive: true, ahead: 0, behind: 0, lastCommit: '2h ago' },
    { name: 'feature/ai-enhancement', isActive: false, ahead: 3, behind: 1, lastCommit: '5h ago' },
    { name: 'feature/new-ui', isActive: false, ahead: 7, behind: 0, lastCommit: '1d ago' },
    { name: 'hotfix/memory-leak', isActive: false, ahead: 1, behind: 2, lastCommit: '3d ago' },
  ];

  const commits: Commit[] = [
    { id: '1', hash: 'a1b2c3d', message: 'feat: Add SAM analysis integration', author: 'AI Builder', date: '2h ago', branch: 'main' },
    { id: '2', hash: 'e4f5g6h', message: 'fix: Resolve chat persistence issue', author: 'AI Builder', date: '4h ago', branch: 'main' },
    { id: '3', hash: 'i7j8k9l', message: 'refactor: Optimize workspace panels', author: 'AI Builder', date: '6h ago', branch: 'main' },
    { id: '4', hash: 'm0n1o2p', message: 'docs: Update README with new features', author: 'AI Builder', date: '1d ago', branch: 'main' },
    { id: '5', hash: 'q3r4s5t', message: 'feat: Implement Dream Mode auto-exploration', author: 'AI Builder', date: '2d ago', branch: 'main' },
  ];

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCommits = commits.filter(c => 
    c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hash.includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Git</h3>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search branches, commits..." 
            className="pl-8 h-8 text-sm bg-muted/30 border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 px-4 py-2">
          <TabsTrigger value="branches" className="text-xs">
            <GitBranch className="w-3 h-3 mr-1" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <GitCommit className="w-3 h-3 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {/* Current branch indicator */}
              <div className="mb-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                  <span className="text-xs text-emerald-400">Current branch:</span>
                  <span className="text-sm font-medium">{branches.find(b => b.isActive)?.name}</span>
                </div>
              </div>

              {filteredBranches.map((branch, i) => (
                <Card
                  key={i}
                  className={cn(
                    "p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/30",
                    branch.isActive && "border-emerald-500/30 bg-emerald-500/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className={cn(
                        "w-4 h-4",
                        branch.isActive ? "text-emerald-500" : "text-muted-foreground"
                      )} />
                      <span className="text-sm font-medium">{branch.name}</span>
                      {branch.isActive && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                          active
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="w-6 h-6">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {branch.lastCommit}
                    </span>
                    {branch.ahead > 0 && (
                      <Badge variant="secondary" className="text-[10px] py-0 h-4">
                        ↑{branch.ahead}
                      </Badge>
                    )}
                    {branch.behind > 0 && (
                      <Badge variant="secondary" className="text-[10px] py-0 h-4">
                        ↓{branch.behind}
                      </Badge>
                    )}
                  </div>

                  {!branch.isActive && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 h-7 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Checkout
                    </Button>
                  )}
                </Card>
              ))}

              {/* Create new branch button */}
              <Button variant="outline" className="w-full mt-3 border-dashed border-border/50">
                <Plus className="w-4 h-4 mr-2" />
                New Branch
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {filteredCommits.map((commit, i) => (
                <Card
                  key={commit.id}
                  className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/30"
                  onClick={() => setExpandedCommit(expandedCommit === commit.id ? null : commit.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <GitCommit className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{commit.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <code className="px-1 py-0.5 bg-muted/30 rounded text-[10px]">
                          {commit.hash}
                        </code>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {commit.author}
                        </span>
                        <span>{commit.date}</span>
                      </div>
                    </div>
                    {expandedCommit === commit.id ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {expandedCommit === commit.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                          View Changes
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                          Revert
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                        <GitBranch className="w-3 h-3 mr-1" />
                        Create branch from here
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Quick actions footer */}
      <div className="p-3 border-t border-border/30 space-y-2">
        <Button variant="outline" className="w-full text-sm justify-start">
          <GitPullRequest className="w-4 h-4 mr-2 text-purple-400" />
          Pull Requests
          <Badge variant="secondary" className="ml-auto text-[10px]">2</Badge>
        </Button>
        <Button variant="outline" className="w-full text-sm justify-start">
          <GitMerge className="w-4 h-4 mr-2 text-cyan-400" />
          Merge Changes
        </Button>
      </div>
    </div>
  );
}
