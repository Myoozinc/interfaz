import { createContext, useContext, useState, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const Ctx = createContext<{ value: string; setValue: (v: string) => void }>({ value: '', setValue: () => {} });

export function Tabs({ value, defaultValue = '', onValueChange, className, children }: { value?: string; defaultValue?: string; onValueChange?: (v: string) => void; className?: string; children: ReactNode }) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const setValue = (v: string) => { if (value === undefined) setInner(v); onValueChange?.(v); };
  return <Ctx.Provider value={{ value: current, setValue }}><div className={className}>{children}</div></Ctx.Provider>;
}
export function TabsList({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div role="tablist" className={cn('inline-flex items-center gap-1 rounded-[var(--radius)] bg-muted p-1 text-muted-foreground', className)} {...p} />;
}
export function TabsTrigger({ value, className, children, ...p }: HTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = useContext(Ctx);
  const active = ctx.value === value;
  return (
    <button type="button" role="tab" aria-selected={active} onClick={() => ctx.setValue(value)}
      className={cn('inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius)-4px)] px-3 py-1.5 text-sm font-medium transition-all cursor-pointer', active ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground', className)} {...p}>
      {children}
    </button>
  );
}
export function TabsContent({ value, className, ...p }: HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = useContext(Ctx);
  if (ctx.value !== value) return null;
  return <div role="tabpanel" className={cn('mt-4', className)} {...p} />;
}
