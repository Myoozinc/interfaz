/**
 * Kit de interfaz de NONA: componentes con la API de shadcn/ui (que los modelos conocen muy bien) y temas de diseño
 * curados. Se añaden solos a cada app nueva para que todas tengan una base visual profesional y consistente,
 * en lugar de que cada modelo invente botones y colores distintos en cada archivo.
 */

export interface Theme { id: string; label: string; use: string; dark: boolean; css: string }

const theme = (id: string, label: string, use: string, dark: boolean, fonts: { display: string; sans: string; url: string }, c: Record<string, string>, radius = '0.75rem'): Theme => ({
  id, label, use, dark,
  css: `@import url('https://fonts.googleapis.com/css2?${fonts.url}&display=swap');

/* Tema «${label}» de NONA. Cambia estos valores para cambiar el aspecto de toda la app. */
:root {
${Object.entries(c).map(([k, v]) => `  --color-${k}: ${v};`).join('\n')}
  --radius: ${radius};
  --font-display: '${fonts.display}', ui-sans-serif, system-ui, sans-serif;
  --font-sans: '${fonts.sans}', ui-sans-serif, system-ui, sans-serif;
}

html, body { background: var(--color-background); color: var(--color-foreground); font-family: var(--font-sans); }
h1, h2, h3, .font-display { font-family: var(--font-display); }
::selection { background: color-mix(in srgb, var(--color-primary) 25%, transparent); }
`,
});

const tokens = (t: {
  background: string; foreground: string; card: string; muted: string; mutedFg: string; border: string;
  primary: string; primaryFg: string; secondary: string; secondaryFg: string; accent: string; accentFg: string;
}) => ({
  background: t.background, foreground: t.foreground,
  card: t.card, 'card-foreground': t.foreground, popover: t.card, 'popover-foreground': t.foreground,
  primary: t.primary, 'primary-foreground': t.primaryFg,
  secondary: t.secondary, 'secondary-foreground': t.secondaryFg,
  muted: t.muted, 'muted-foreground': t.mutedFg,
  accent: t.accent, 'accent-foreground': t.accentFg,
  destructive: '#DC2626', 'destructive-foreground': '#FFFFFF',
  success: '#16A34A', warning: '#D97706',
  border: t.border, input: t.border, ring: t.primary,
});

export const THEMES: Theme[] = [
  theme('claro-indigo', 'Claro índigo', 'SaaS, productividad, paneles, apps de gestión', false,
    { display: 'Plus Jakarta Sans', sans: 'Plus Jakarta Sans', url: 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800' },
    tokens({ background: '#F7F8FB', foreground: '#0F172A', card: '#FFFFFF', muted: '#F1F3F8', mutedFg: '#5B6478', border: '#E3E7EF', primary: '#4F46E5', primaryFg: '#FFFFFF', secondary: '#EEF0FF', secondaryFg: '#3730A3', accent: '#E0F2FE', accentFg: '#075985' })),
  theme('oscuro-pro', 'Oscuro profesional', 'herramientas técnicas, analítica, IA, apps nocturnas', true,
    { display: 'Geist', sans: 'Geist', url: 'family=Geist:wght@400;500;600;700' },
    tokens({ background: '#0B0F17', foreground: '#E6EAF2', card: '#121826', muted: '#18202F', mutedFg: '#8C95A8', border: '#243044', primary: '#6E8BFF', primaryFg: '#0B0F17', secondary: '#1B2436', secondaryFg: '#C9D3E6', accent: '#123040', accentFg: '#7DD3FC' }), '0.625rem'),
  theme('editorial-verde', 'Editorial verde y oro', 'restaurantes, cafeterías, hoteles, eventos, marcas premium', false,
    { display: 'Fraunces', sans: 'Inter', url: 'family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600' },
    tokens({ background: '#F8F6F1', foreground: '#1C2420', card: '#FFFFFF', muted: '#EFEBE3', mutedFg: '#66706A', border: '#E2DCD0', primary: '#1F5F4A', primaryFg: '#FFFFFF', secondary: '#F3E9D2', secondaryFg: '#6B4E12', accent: '#E8F1EC', accentFg: '#1F5F4A' }), '0.5rem'),
  theme('fresco-salud', 'Fresco y saludable', 'salud, fitness, clínicas, bienestar, hábitos', false,
    { display: 'Manrope', sans: 'Manrope', url: 'family=Manrope:wght@400;500;600;700;800' },
    tokens({ background: '#F4FBF8', foreground: '#0B2A22', card: '#FFFFFF', muted: '#E8F5EF', mutedFg: '#557268', border: '#D3EBE1', primary: '#0E9F75', primaryFg: '#FFFFFF', secondary: '#FFF4DB', secondaryFg: '#8A5A00', accent: '#E0F2FE', accentFg: '#0C4A6E' }), '1rem'),
  theme('vibrante', 'Vibrante creativo', 'moda, belleza, música, redes sociales, apps juveniles', false,
    { display: 'Outfit', sans: 'Outfit', url: 'family=Outfit:wght@400;500;600;700;800' },
    tokens({ background: '#FFF8FB', foreground: '#1D1030', card: '#FFFFFF', muted: '#F8EEF5', mutedFg: '#6E5A86', border: '#EEDDEB', primary: '#D9367C', primaryFg: '#FFFFFF', secondary: '#EFE7FF', secondaryFg: '#5B21B6', accent: '#FFF1D6', accentFg: '#92400E' }), '1rem'),
  theme('corporativo', 'Corporativo azul', 'finanzas, banca, seguros, B2B, inmobiliarias, educación', false,
    { display: 'IBM Plex Sans', sans: 'IBM Plex Sans', url: 'family=IBM+Plex+Sans:wght@400;500;600;700' },
    tokens({ background: '#F5F7FA', foreground: '#101828', card: '#FFFFFF', muted: '#EEF2F6', mutedFg: '#5D6B82', border: '#E1E6ED', primary: '#1D4ED8', primaryFg: '#FFFFFF', secondary: '#E8F0FE', secondaryFg: '#1E3A8A', accent: '#E0F7FA', accentFg: '#155E75' }), '0.5rem'),
  theme('noche-neon', 'Noche neón', 'juegos, entretenimiento, música, streaming, eventos nocturnos', true,
    { display: 'Space Grotesk', sans: 'Space Grotesk', url: 'family=Space+Grotesk:wght@400;500;600;700' },
    tokens({ background: '#08070F', foreground: '#F1EDFF', card: '#131022', muted: '#1A162D', mutedFg: '#9E96C4', border: '#2A2348', primary: '#8B5CF6', primaryFg: '#FFFFFF', secondary: '#24193F', secondaryFg: '#E9D5FF', accent: '#3B0F2E', accentFg: '#F9A8D4' }), '0.875rem'),
  theme('minimal', 'Minimalista', 'portafolios, blogs, revistas, fotografía, arquitectura', false,
    { display: 'Instrument Serif', sans: 'Inter', url: 'family=Instrument+Serif&family=Inter:wght@400;500;600' },
    tokens({ background: '#FAFAF9', foreground: '#141414', card: '#FFFFFF', muted: '#F2F2F0', mutedFg: '#6B6B6B', border: '#E7E5E4', primary: '#141414', primaryFg: '#FFFFFF', secondary: '#F2F2F0', secondaryFg: '#141414', accent: '#E8EEFF', accentFg: '#1D4ED8' }), '0.375rem'),
];

export const THEME_MENU = THEMES.map(t => `${t.id} (${t.label}${t.dark ? ', oscuro' : ''}: ${t.use})`).join('; ');

/** Tema por palabras clave cuando no hay plan (construcción en una sola respuesta). */
export function guessTheme(text: string): string {
  const t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const rules: [RegExp, string][] = [
    [/juego|game|arcade|musica|dj|stream|neon|gamer|esport/, 'noche-neon'],
    [/restaurante|cafe|cafeteria|menu|carta|hotel|vino|panaderia|evento|boda/, 'editorial-verde'],
    [/salud|fitness|gym|gimnasio|clinica|veterin|medic|habito|yoga|nutri|bienestar/, 'fresco-salud'],
    [/moda|belleza|salon|maquillaje|social|influencer|tatuaje|barber/, 'vibrante'],
    [/finanza|banco|gasto|presupuesto|factura|seguro|inmobiliaria|contab|escuela|curso/, 'corporativo'],
    [/portafolio|portfolio|blog|revista|fotograf|arquitect|galeria/, 'minimal'],
    [/ia |inteligencia artificial|analitica|terminal|codigo|dev|teleprompter|grabar|camara|oscuro/, 'oscuro-pro'],
  ];
  return rules.find(([re]) => re.test(t))?.[1] || 'claro-indigo';
}

const UTILS = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Une clases de Tailwind sin conflictos (igual que shadcn/ui). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

const BUTTON = `import { forwardRef, isValidElement, cloneElement, type ButtonHTMLAttributes, type ReactElement } from 'react';
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
`;

const CARD = `import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-[var(--radius)] border border-border bg-card text-card-foreground shadow-sm', className)} {...p} />;
}
export function CardHeader({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...p} />;
}
export function CardTitle({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display text-lg font-semibold leading-tight tracking-tight', className)} {...p} />;
}
export function CardDescription({ className, ...p }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...p} />;
}
export function CardContent({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...p} />;
}
export function CardFooter({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2 p-6 pt-0', className)} {...p} />;
}
`;

const INPUT = `import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('flex h-10 w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', className)} {...props} />
));
Input.displayName = 'Input';
`;

const TEXTAREA = `import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('flex min-h-[90px] w-full rounded-[var(--radius)] border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', className)} {...props} />
));
Textarea.displayName = 'Textarea';
`;

const LABEL = `import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Label({ className, ...p }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium text-foreground', className)} {...p} />;
}
`;

const BADGE = `import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border text-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
};

export function Badge({ className, variant = 'default', ...p }: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)} {...p} />;
}
`;

const DIALOG = `import { createContext, useContext, useEffect, useState, isValidElement, cloneElement, type ReactNode, type HTMLAttributes, type ReactElement } from 'react';
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
`;

const TABS = `import { createContext, useContext, useState, type ReactNode, type HTMLAttributes } from 'react';
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
`;

const SELECT = `import { createContext, useContext, useEffect, useRef, useState, Children, isValidElement, type ReactNode, type ReactElement } from 'react';
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
`;

const SWITCH = `import { cn } from '@/lib/utils';

export function Switch({ checked = false, onCheckedChange, disabled, className, id }: { checked?: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean; className?: string; id?: string }) {
  return (
    <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onCheckedChange?.(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 cursor-pointer', checked ? 'bg-primary' : 'bg-border', className)}>
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}
`;

const CHECKBOX = `import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Checkbox({ checked = false, onCheckedChange, disabled, className, id }: { checked?: boolean; onCheckedChange?: (v: boolean) => void; disabled?: boolean; className?: string; id?: string }) {
  return (
    <button id={id} type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={() => onCheckedChange?.(!checked)}
      className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors disabled:opacity-50 cursor-pointer', checked ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-card', className)}>
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
`;

const AVATAR = `import { useState, type ReactNode } from 'react';
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
`;

const MISC = (name: string) => ({
  separator: `import { cn } from '@/lib/utils';

export function Separator({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return <div role="separator" className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} />;
}
`,
  skeleton: `import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-[var(--radius)] bg-muted', className)} {...p} />;
}
`,
  progress: `import { cn } from '@/lib/utils';

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: \`\${Math.max(0, Math.min(100, value))}%\` }} />
    </div>
  );
}
`,
  table: `import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
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
`,
} as Record<string, string>)[name];

export const UI_KIT_FILES: Record<string, string> = {
  'src/lib/utils.ts': UTILS,
  'src/components/ui/button.tsx': BUTTON,
  'src/components/ui/card.tsx': CARD,
  'src/components/ui/input.tsx': INPUT,
  'src/components/ui/textarea.tsx': TEXTAREA,
  'src/components/ui/label.tsx': LABEL,
  'src/components/ui/badge.tsx': BADGE,
  'src/components/ui/dialog.tsx': DIALOG,
  'src/components/ui/tabs.tsx': TABS,
  'src/components/ui/select.tsx': SELECT,
  'src/components/ui/switch.tsx': SWITCH,
  'src/components/ui/checkbox.tsx': CHECKBOX,
  'src/components/ui/avatar.tsx': AVATAR,
  'src/components/ui/separator.tsx': MISC('separator'),
  'src/components/ui/skeleton.tsx': MISC('skeleton'),
  'src/components/ui/progress.tsx': MISC('progress'),
  'src/components/ui/table.tsx': MISC('table'),
};

export const THEME_PATH = 'src/styles/theme.css';
export const isKitPath = (p: string) => p in UI_KIT_FILES || p === THEME_PATH;

/** Qué hay en el kit (para los prompts). */
export const UI_KIT_PROMPT = `KIT DE INTERFAZ YA INCLUIDO (como shadcn/ui; NO escribas estos archivos, impórtalos con la ruta exacta):
  import { Button } from '@/components/ui/button'  (variant: default|secondary|outline|ghost|destructive|link · size: default|sm|lg|icon · asChild)
  import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
  import { Input } from '@/components/ui/input' · { Textarea } '@/components/ui/textarea' · { Label } '@/components/ui/label'
  import { Badge } from '@/components/ui/badge'  (variant: default|secondary|outline|success|warning|destructive)
  import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'  (Dialog open/onOpenChange)
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'  (Tabs defaultValue|value/onValueChange)
  import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'  (Select value/onValueChange)
  import { Switch } '@/components/ui/switch' · { Checkbox } '@/components/ui/checkbox' (checked/onCheckedChange) · { Avatar, AvatarImage, AvatarFallback } '@/components/ui/avatar'
  import { Separator } '@/components/ui/separator' · { Skeleton } '@/components/ui/skeleton' · { Progress } '@/components/ui/progress' (value 0-100)
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
  import { cn } from '@/lib/utils' · avisos: import { toast, Toaster } from 'sonner' (pon <Toaster richColors /> en App)
COLORES Y TIPOGRAFÍA DEL TEMA (ya cargados; úsalos SIEMPRE en vez de colores fijos para que todo combine):
  bg-background text-foreground · bg-card text-card-foreground · bg-primary text-primary-foreground · bg-secondary text-secondary-foreground
  bg-muted text-muted-foreground · bg-accent text-accent-foreground · border-border · ring-ring · text-destructive · text-success · text-warning
  Opacidad con /: bg-primary/10. Radio: rounded-[var(--radius)]. Títulos con font-display. NO redefinas estas variables ni crees otra paleta.`;

/** Copia el tema y los componentes del kit (sin pisar archivos existentes). */
export function addKitFiles(files: Record<string, string>, themeId?: string) {
  if (!files[THEME_PATH]) {
    const th = THEMES.find(t => t.id === themeId) || THEMES.find(t => t.id === guessTheme(Object.values(files).join(' ').slice(0, 4000))) || THEMES[0];
    files[THEME_PATH] = th.css;
  }
  for (const [p, c] of Object.entries(UI_KIT_FILES)) if (!files[p]) files[p] = c;
}

/**
 * Añade el kit y el tema a un proyecto React y se asegura de que App.tsx cargue el tema.
 * Devuelve false si no es un proyecto React.
 */
export function ensureUiKit(files: Record<string, string>, themeId?: string): boolean {
  const appPath = files['src/App.tsx'] ? 'src/App.tsx' : files['src/App.jsx'] ? 'src/App.jsx' : '';
  if (!appPath) return false;
  addKitFiles(files, themeId);
  if (!/['"]\.\/styles\/theme\.css['"]/.test(files[appPath])) files[appPath] = `import './styles/theme.css';\n${files[appPath]}`;
  return true;
}
