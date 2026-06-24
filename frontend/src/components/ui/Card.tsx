import { cn } from '../../lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  noPad?: boolean;
  hover?: boolean;
}

export function Card({ children, noPad, hover, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-panel border border-border rounded-lg',
        !noPad && 'p-[18px]',
        hover && 'cursor-pointer hover:border-brand transition-colors duration-150',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
