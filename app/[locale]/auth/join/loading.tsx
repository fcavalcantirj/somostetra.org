export default function JoinLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-16 space-y-6">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-lg mx-auto" />
          <div className="h-16 w-full max-w-2xl bg-muted animate-pulse rounded-lg mx-auto" />
          <div className="h-8 w-full max-w-xl bg-muted animate-pulse rounded-lg mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="glass-strong p-10 rounded-3xl space-y-8">
            <div className="w-20 h-20 bg-muted animate-pulse rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
              <div className="h-20 w-full bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="h-14 w-full bg-muted animate-pulse rounded-lg" />
          </div>

          <div className="glass-strong p-10 rounded-3xl space-y-8">
            <div className="w-20 h-20 bg-muted animate-pulse rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
              <div className="h-20 w-full bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="h-14 w-full bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
