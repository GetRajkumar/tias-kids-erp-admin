import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const bgColors = [
  'bg-brand-100 text-brand-700',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-orange-100 text-orange-700',
  'bg-purple-100 text-purple-700',
  'bg-red-100 text-red-700',
];

function getColor(name?: string) {
  if (!name) return bgColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  return (
    <RadixAvatar.Root
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold overflow-hidden',
        sizeMap[size],
        getColor(name),
        className,
      )}
    >
      <RadixAvatar.Image
        src={src}
        alt={name || ''}
        className="h-full w-full object-cover"
      />
      <RadixAvatar.Fallback
        className="flex h-full w-full items-center justify-center"
        delayMs={0}
      >
        {getInitials(name)}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
