import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[36px] border border-white/70 bg-white/75 p-10 text-center shadow-[0_28px_80px_rgba(104,35,84,0.14)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-magenta">Ruta no encontrada</p>
        <h1 className="mt-4 font-heading text-5xl text-slate-950">404</h1>
        <p className="mt-4 text-slate-600">La vista solicitada no existe dentro de esta implementacion inicial.</p>
        <Link to="/login" className="mt-8 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}