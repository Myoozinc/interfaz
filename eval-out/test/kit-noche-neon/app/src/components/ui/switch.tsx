import { cn } from '@/lib/utils';

export function Switch({ checked = false, onCheckedChange, disabled, className, id }: { checked?: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean; className?: string; id?: string }) {
  return (
    <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onCheckedChange?.(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 cursor-pointer', checked ? 'bg-primary' : 'bg-border', className)}>
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}
