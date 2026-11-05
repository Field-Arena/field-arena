import { cn } from '@/shared/lib/utils';

// Deterministic (not random) so the same organizer/rider/member always gets
// the same color across re-renders and across every screen that shows them.
const GRADIENTS = [
  'from-[#5b5bd6] to-[#3f3fb0]',
  'from-[#0b6bb8] to-[#08508c]',
  'from-[#c0367a] to-[#96285e]',
  'from-[#1c7a52] to-[#0e5537]',
  'from-[#c07a11] to-[#9a5f0c]',
] as const;

function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  const last = parts[parts.length - 1];
  if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase();
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

export function OrgAvatar({
  name,
  size = 38,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid flex-none place-items-center rounded-[10px] bg-gradient-to-br font-bold text-white',
        gradientFor(name),
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.37) }}
    >
      {initialsOf(name)}
    </span>
  );
}
