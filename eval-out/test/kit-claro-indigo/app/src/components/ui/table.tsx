import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...p }: HTMLAttributes<HTMLTableElement>) {
  return <div className="w-full overflow-x-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...p} /></div>;
}
export function TableHeader({ className, ...p }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-border', className)} {...p} />;
}
export function TableBody({ className, ...p }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />;
}
export function TableRow({ className, ...p }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-border transition-colors hover:bg-muted/50', className)} {...p} />;
}
export function TableHead({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('h-11 px-4 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground', className)} {...p} />;
}
export function TableCell({ className, ...p }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...p} />;
}
