import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export function AuthHeading({
  as,
  className,
  children,
}: {
  as: 'h1' | 'h2';
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        'text-forest font-[family-name:var(--font-nr)] font-medium tracking-[-.024em]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
