import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

type BadgeColor = 'green' | 'amber' | 'red' | 'blue' | 'brand' | 'default';

interface BadgeProps {
  color?: BadgeColor;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const colors: Record<BadgeColor, string> = {
  green:  'bg-green-500/10 text-green-400 border-green-500/20',
  amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  brand:  'bg-brand/10 text-brand border-brand/20',
  default:'bg-surface-elev text-content-dim border-border',
};

export function Badge({ color = 'default', dot, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap',
        colors[color],
        className
      )}
    >
      {dot && <span className="w-[7px] h-[7px] rounded-full bg-current flex-shrink-0" />}
      {children}
    </span>
  );
}
