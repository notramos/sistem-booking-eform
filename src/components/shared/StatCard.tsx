import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon, description, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="shrink-0 rounded-full bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
