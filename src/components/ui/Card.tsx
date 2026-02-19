import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', padding && 'p-5', className)}>
      {children}
    </div>
  );
}
