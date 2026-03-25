type BrandMarkProps = {
  mode?: 'full' | 'logo-only'
}

export function BrandMark({ mode = 'full' }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-3xl bg-white/80 p-3 shadow-[0_18px_60px_rgba(110,30,80,0.18)] ring-1 ring-white/60 backdrop-blur">
        <img
          src="/assets/logo-cesde.svg"
          alt="Logo Cesde"
          className="h-10 w-auto sm:h-12"
        />
      </div>
      {mode === 'full' ? (
        <div>
          <p className="font-heading text-xl text-slate-900 sm:text-2xl">EduPulse</p>
          <p className="text-sm text-slate-600">Evaluacion institucional por periodos</p>
        </div>
      ) : null}
    </div>
  )
}