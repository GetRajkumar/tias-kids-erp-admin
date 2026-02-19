import { cn } from '../../lib/utils';

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}

export function Thead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <thead className={cn('border-b bg-gray-50/80 text-left', className)}>{children}</thead>;
}

export function Tbody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={cn('divide-y divide-gray-100', className)}>{children}</tbody>;
}

export function Tr({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr className={cn('transition-colors hover:bg-gray-50/50', onClick && 'cursor-pointer', className)} onClick={onClick}>
      {children}
    </tr>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={cn('px-4 py-3 text-gray-700', className)} colSpan={colSpan}>
      {children}
    </td>
  );
}
