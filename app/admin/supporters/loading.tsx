export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-white" />
        <p className="text-white/60">Carregando apoiadores...</p>
      </div>
    </div>
  )
}
