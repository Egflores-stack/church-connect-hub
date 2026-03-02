import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'activo' | 'inactivo' | 'presente' | 'ausente';
}

const styles: Record<string, string> = {
  activo: 'bg-success/10 text-success border-success/20',
  inactivo: 'bg-destructive/10 text-destructive border-destructive/20',
  presente: 'bg-success/10 text-success border-success/20',
  ausente: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', styles[status])}>
      {status}
    </span>
  );
}
