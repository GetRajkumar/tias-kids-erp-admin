import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

export function Tabs({ children, defaultValue, value, onValueChange, className }: {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <RadixTabs.Root defaultValue={defaultValue} value={value} onValueChange={onValueChange} className={className}>
      {children}
    </RadixTabs.Root>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixTabs.List className={cn('flex gap-1 border-b border-gray-200 pb-px', className)}>
      {children}
    </RadixTabs.List>
  );
}

export function TabsTrigger({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={cn(
        'px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors',
        'border-b-2 border-transparent -mb-px',
        'hover:text-gray-700',
        'data-[state=active]:border-brand-500 data-[state=active]:text-brand-600',
        className,
      )}
    >
      {children}
    </RadixTabs.Trigger>
  );
}

export function TabsContent({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) {
  return (
    <RadixTabs.Content value={value} className={cn('pt-4', className)}>
      {children}
    </RadixTabs.Content>
  );
}
