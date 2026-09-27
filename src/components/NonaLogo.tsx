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
  const src = variant === 'dark' ? '/nona-logo-dark.png' : '/nona-logo.png';

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
            className="absolute inset-0 bg-blue-500/25 rounded-full blur-xl animate-pulse pointer-events-none"
            style={{ transform: 'scale(1.4)' }}
          />
        )}

        {/* Badge container if requested */}
        {isBadge ? (
          <div
            className="flex items-center justify-center rounded-2xl bg-white border border-slate-200/90 shadow-sm p-1.5 transition-all hover:shadow-md hover:border-slate-300"
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
              className={`font-extrabold tracking-tight text-slate-900 font-sans ${textClassName || (dim >= 40 ? 'text-xl' : dim >= 28 ? 'text-sm' : 'text-xs')}`}
            >
              NONA
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200/60 uppercase tracking-wider">
              AI Factory
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
