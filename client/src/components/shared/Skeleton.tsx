import { cn } from '@/lib/utils'

export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-control bg-[#EFEDE7]', className)} />
}

