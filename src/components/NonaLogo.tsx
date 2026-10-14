import React from 'react';

export interface NonaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'default' | 'badge' | 'dark' | 'glow';
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export const NonaLogo: React.FC<NonaLogoProps> = ({
  size = 'md',
  variant = 'default',
  showText = false,
  textClassName = '',
  subtitle,
  className = '',
  onClick,
}) => {
  // Dimension mapping
  const sizeMap: Record<string, { img: number; container?: string }> = {
    xs: { img: 18 },
    sm: { img: 24 },
    md: { img: 32 },
    lg: { img: 48 },
    xl: { img: 72 },
  };

  const dim = typeof size === 'number' ? size : (sizeMap[size]?.img || 32);

  // Logo source selection
  // La interfaz es oscura: se usa siempre la versión con la N clara
  const src = '/nona-logo-dark.png';

  const isBadge = variant === 'badge';
  const isGlow = variant === 'glow';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer hover:opacity-95 transition-all' : ''} ${className}`}
    >
      <div className="relative flex items-center justify-center shrink-0">
        {/* Glow halo */}
        {isGlow && (
          <div
            className="absolute inset-0 bg-accent/25 rounded-full blur-xl animate-pulse pointer-events-none"
            style={{ transform: 'scale(1.4)' }}
          />
        )}

        {/* Badge container if requested */}
        {isBadge ? (
          <div
            className="flex items-center justify-center rounded-2xl bg-panel border border-line/90 shadow-sm p-1.5 transition-all hover:shadow-md hover:border-line-strong"
            style={{ width: dim + 14, height: dim + 14 }}
          >
            <img
              src={src}
              alt="NONA Logo"
              width={dim}
              height={dim}
              className="object-contain drop-shadow-2xs select-none"
              draggable={false}
            />
          </div>
        ) : (
          <img
            src={src}
            alt="NONA Logo"
            width={dim}
            height={dim}
            className="object-contain select-none transition-transform"
            draggable={false}
          />
        )}
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight text-fg font-sans ${textClassName || (dim >= 40 ? 'text-xl' : dim >= 28 ? 'text-sm' : 'text-xs')}`}
            >
              NONA
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-muted font-medium mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
