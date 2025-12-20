'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'ready' | 'free' | 'occupied' | 'busy' | 'pending' | 'suspended' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'ready':
      case 'free':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'occupied':
      case 'busy':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'pending':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'suspended':
        return {
          variant: 'destructive' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'inactive':
        return {
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}