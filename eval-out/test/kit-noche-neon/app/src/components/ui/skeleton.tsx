import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-[var(--radius)] bg-muted', className)} {...p} />;
}
