import { createContext, useContext, useEffect, useRef, useState, Children, isValidElement, type ReactNode, type ReactElement } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Ctx = { value: string; setValue: (v: string) => void; open: boolean; setOpen: (v: boolean) => void; labels: Record<string, ReactNode> };
const SelectCtx = createContext<Ctx>({ value: '', setValue: () => {}, open: false, setOpen: () => {}, labels: {} });

function collect(children: ReactNode, out: Record<string, ReactNode>) {
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    const el = c as ReactElement<any>;
    if (el.props?.value !== undefined && el.props?.children !== undefined && (el.type as any)?.displayName === 'SelectItem') out[String(el.props.value)] = el.props.children;
    if (el.props?.children) collect(el.props.children, out);
  });
}

export function Select({ value, defaultValue = '', onValueChange, children }: { value?: string; defaultValue?: string; onValueChange?: (v: string) => void; children: ReactNode }) {
  const [inner, setInner] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const current = value ?? inner;
  const labels: Record<string, ReactNode> = {};
  collect(children, labels);
  const setValue = (v: string) => { if (value === undefined) setInner(v); onValueChange?.(v); setOpen(false); };
  return <SelectCtx.Provider value={{ value: current, setValue, open, setOpen, labels }}><div className="relative">{children}</div></SelectCtx.Provider>;
}
export function SelectTrigger({ className, children }: { className?: string; children?: ReactNode }) {
  const { open, setOpen } = useContext(SelectCtx);
  return (
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
      className={cn('flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius)] border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer', className)}>
      <span className="truncate">{children}</span>
      <ChevronDown className="h-4 w-4 opacity-60" />
    </button>
  );
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, labels } = useContext(SelectCtx);
  return <>{value ? (labels[value] ?? value) : <span className="text-muted-foreground">{placeholder}</span>}</>;
}
export function SelectContent({ className, children }: { className?: string; children: ReactNode }) {
  const { open, setOpen } = useContext(SelectCtx);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);
  if (!open) return null;
  return <div ref={ref} role="listbox" className={cn('absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-[var(--radius)] border border-border bg-popover p-1 text-popover-foreground shadow-lg', className)}>{children}</div>;
}
export function SelectItem({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const ctx = useContext(SelectCtx);
  const active = ctx.value === value;
  return (
    <div role="option" aria-selected={active} onClick={() => ctx.setValue(value)}
      className={cn('flex cursor-pointer items-center justify-between rounded-[calc(var(--radius)-4px)] px-2 py-1.5 text-sm hover:bg-muted', className)}>
      {children}
      {active && <Check className="h-4 w-4 text-primary" />}
    </div>
  );
}
SelectItem.displayName = 'SelectItem';
