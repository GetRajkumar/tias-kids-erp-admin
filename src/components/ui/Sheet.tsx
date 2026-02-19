import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Sheet({ open, onOpenChange, children, side = 'right', size = 'md', title, description, footer }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex flex-col bg-white shadow-xl transition-transform duration-300',
            'top-0 h-full w-full',
            sizeMap[size],
            side === 'right' ? 'right-0' : 'left-0',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            side === 'right'
              ? 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
              : 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
          )}
        >
          {title && (
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">{title}</Dialog.Title>
                {description && <Dialog.Description className="text-sm text-gray-500 mt-0.5">{description}</Dialog.Description>}
              </div>
              <Dialog.Close className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && <div className="border-t px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
