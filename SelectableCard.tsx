'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

type SelectableCardProps = {
  children: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
};

export function SelectableCard({
  children,
  isSelected,
  onSelect,
  className
}: SelectableCardProps) {
  return (
    <div
      className={cn(
        'relative cursor-pointer group transition-shadow duration-200 ease-in-out overflow-hidden rounded-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isSelected ? 'ring-2 ring-primary ring-offset-background' : 'shadow-sm hover:shadow-lg',
        className
      )}
      onClick={onSelect}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
    >
      {children}
      {isSelected && (
          <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
      )}
      <div className={cn(
        'absolute top-2 right-2 h-7 w-7 transition-all duration-200 ease-in-out rounded-full bg-background flex items-center justify-center shadow-md',
        isSelected ? 'scale-100 opacity-100' : 'scale-125 opacity-0 group-hover:opacity-100 group-hover:scale-100'
      )}>
        <CheckCircle2 className="h-6 w-6 text-primary fill-primary-foreground" />
      </div>
    </div>
  );
}
