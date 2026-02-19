import { cn } from '../../lib/utils';

const colorMap: Record<string, string> = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  gray: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, color = 'gray', className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        colorMap[color] || colorMap.gray,
        className,
      )}
    >
      {children}
    </span>
  );
}
