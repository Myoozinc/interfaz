import { createContext, useContext, useEffect, useState, isValidElement, cloneElement, type ReactNode, type HTMLAttributes, type ReactElement } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Ctx = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });

export function Dialog({ open, defaultOpen, onOpenChange, children }: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (v: boolean) => void; children: ReactNode }) {
  const [inner, setInner] = useState(!!defaultOpen);
  const isOpen = open ?? inner;
  const setOpen = (v: boolean) => { if (open === undefined) setInner(v); onOpenChange?.(v); };
  return <Ctx.Provider value={{ open: isOpen, setOpen }}>{children}</Ctx.Provider>;
}

export function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const { setOpen } = useContext(Ctx);
  if (isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, { onClick: (e: any) => { child.props.onClick?.(e); setOpen(true); } });
  }
  return <button type="button" onClick={() => setOpen(true)}>{children}</button>;
}

export function DialogClose({ children }: { children: ReactNode }) {
  const { setOpen } = useContext(Ctx);
  if (isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, { onClick: (e: any) => { child.props.onClick?.(e); setOpen(false); } });
  }
  return <button type="button" onClick={() => setOpen(false)}>{children}</button>;
}

export function DialogContent({ className, children, ...p }: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useContext(Ctx);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden="true" />
      <div role="dialog" aria-modal="true" className={cn('relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[var(--radius)] border border-border bg-card text-card-foreground p-6 shadow-2xl', className)} {...p}>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
export function DialogHeader({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5 pr-6', className)} {...p} />;
}
export function DialogTitle({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('font-display text-lg font-semibold', className)} {...p} />;
}
export function DialogDescription({ className, ...p }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...p} />;
}
export function DialogFooter({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...p} />;
}
