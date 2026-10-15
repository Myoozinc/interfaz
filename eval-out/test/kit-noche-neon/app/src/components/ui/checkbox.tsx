import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Checkbox({ checked = false, onCheckedChange, disabled, className, id }: { checked?: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean; className?: string; id?: string }) {
  return (
    <button id={id} type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={() => onCheckedChange?.(!checked)}
      className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors disabled:opacity-50 cursor-pointer', checked ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-card', className)}>
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
