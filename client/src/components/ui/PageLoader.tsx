interface PageLoaderProps {
  label?: string
}

/** Full-page loading indicator used while a route or the session loads. */
export function PageLoader({ label = 'Loading…' }: PageLoaderProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f7f9f7] text-[#7b857b]">
      <span
        className="w-9 h-9 rounded-full border-[3px] border-[#e6e9e6] border-t-[#f5c842] animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export default PageLoader
