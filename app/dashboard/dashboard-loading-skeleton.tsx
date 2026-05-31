"use client"

function SkeletonLine({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-muted ${className}`}
    />
  )
}

function SkeletonCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[24px] border border-border/70 bg-card/80 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.12)] ${className}`}
    >
      {children}
    </div>
  )
}

export default function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-7">
      <section className="space-y-3">
        <SkeletonLine className="h-11 w-56 md:h-12 md:w-72" />
        <SkeletonLine className="h-4 w-full max-w-[460px]" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <SkeletonCard key={index}>
            <div className="mb-7 flex items-start justify-between gap-6">
              <SkeletonLine className="h-4 w-28" />
              <div className="h-10 w-10 rounded-[18px] bg-muted animate-pulse" />
            </div>

            <div className="flex items-end gap-3">
              <SkeletonLine className="h-10 w-20" />
              <SkeletonLine className="h-4 w-32" />
            </div>
          </SkeletonCard>
        ))}
      </section>

      <section className="rounded-[24px] border border-border/70 bg-card p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:p-7">
        <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <SkeletonLine className="mb-3 h-3 w-36" />
            <SkeletonLine className="h-8 w-44" />
            <SkeletonLine className="mt-3 h-4 w-72" />
          </div>

          <div className="flex w-fit rounded-full bg-muted p-1">
            <div className="h-9 w-20 rounded-full bg-card animate-pulse" />
            <div className="h-9 w-20 rounded-full bg-muted animate-pulse" />
          </div>
        </div>

        <div className="h-[320px] rounded-[22px] border border-border/70 bg-background/45 p-4">
          <div className="flex h-full items-end gap-3 px-2 pb-6">
            {[42, 62, 48, 78, 55, 92, 66, 84, 58, 72, 50, 88].map((height, index) => (
              <div key={index} className="flex flex-1 items-end">
                <div
                  className="w-full animate-pulse rounded-t-lg bg-muted"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SkeletonLine className="h-5 w-40" />

        <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
          <div className="overflow-hidden">
            <div className="grid min-w-[1200px] grid-cols-7 gap-0 border-b border-border/70 bg-muted px-5 py-4 md:px-7">
              {Array.from({ length: 7 }).map((_, index) => (
                <SkeletonLine key={index} className="h-3.5 w-[72%]" />
              ))}
            </div>

            <div className="divide-y divide-border/70">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid min-w-[1200px] grid-cols-7 items-center gap-0 px-5 py-5 md:px-7"
                >
                  <SkeletonLine className="h-5 w-20" />
                  <SkeletonLine className="h-4 w-24" />
                  <SkeletonLine className="h-4 w-28" />
                  <SkeletonLine className="h-4 w-24" />
                  <SkeletonLine className="h-4 w-24" />
                  <SkeletonLine className="h-4 w-20" />
                  <div className="h-7 w-24 rounded-full bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  )
}
