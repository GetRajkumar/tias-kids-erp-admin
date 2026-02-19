import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
              'focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              icon && 'pl-10',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
