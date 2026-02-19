import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-brand-500',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
  success: 'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500',
  blue: 'bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-500',
  orange: 'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500',
  'outline-orange': 'text-orange-600 border border-orange-300 hover:bg-orange-50',
  'outline-brand': 'text-brand-600 border border-brand-300 hover:bg-brand-50',
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded',
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
