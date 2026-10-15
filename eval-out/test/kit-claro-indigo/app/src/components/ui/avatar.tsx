import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted', className)}>{children}</span>;
}
export function AvatarImage({ src, alt = '', className }: { src?: string; alt?: string; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  return <img src={src} alt={alt} onError={() => setOk(false)} className={cn('absolute inset-0 h-full w-full object-cover', className)} />;
}
export function AvatarFallback({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground', className)}>{children}</span>;
}
