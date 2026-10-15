import { forwardRef, isValidElement, cloneElement, type ButtonHTMLAttributes, type ReactElement } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link: 'text-primary underline-offset-4 hover:underline',
};
const sizes = { default: 'h-10 px-4 py-2', sm: 'h-9 px-3 text-sm', lg: 'h-11 px-6 text-base', icon: 'h-10 w-10' };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
}

export function buttonVariants({ variant = 'default', size = 'default', className = '' }: { variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string } = {}) {
  return cn('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer', variants[variant], sizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, children, ...props }, ref) => {
  const cls = buttonVariants({ variant, size, className });
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<any>;
    return cloneElement(child, { className: cn(cls, child.props.className) });
  }
  return <button ref={ref} className={cls} {...props}>{children}</button>;
});
Button.displayName = 'Button';
