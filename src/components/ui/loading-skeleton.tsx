import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className, width = "full", height = "4" }: SkeletonProps) {
  return <div className={cn(`h-${height} w-${width} animate-pulse rounded bg-muted`, className)} />
}

export function TableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="h-10 border-b bg-muted/5 px-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 border-b p-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-lg border p-6">
        <Skeleton className="h-8 w-2/3 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}
