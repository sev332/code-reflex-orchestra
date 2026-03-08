/**
 * useVM — React hook for accessing the unified VM service
 * All apps can use this to execute code, access the shared filesystem,
 * and manage processes.
 */
import { useState, useEffect, useCallback } from 'react';
import { vm, VMExecResult, VMProcess, VMStats, VMBackend } from '@/lib/vm/vm-service';

export function useVM() {
  const [processes, setProcesses] = useState<VMProcess[]>(vm.proc.list());
  const [stats, setStats] = useState<VMStats>(vm.stats());

  useEffect(() => {
    const unsub1 = vm.proc.onChange(() => {
      setProcesses(vm.proc.list());
      setStats(vm.stats());
    });
    const unsub2 = vm.fs.onChange(() => {
      setStats(vm.stats());
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const exec = useCallback(async (code: string, language: string, backend?: VMBackend): Promise<VMExecResult> => {
    return vm.exec(code, language, backend);
  }, []);

  const kill = useCallback((pid: number) => {
    vm.proc.kill(pid);
  }, []);

  return {
    exec,
    kill,
    processes,
    activeProcesses: processes.filter(p => p.state === 'running'),
    stats,
    fs: vm.fs,
    eval: vm.eval.bind(vm),
  };
}
