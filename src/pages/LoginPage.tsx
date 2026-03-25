import { useState } from 'react'
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { getAuthSession, getDefaultRouteForRole, saveAuthSession } from '../lib/auth'
import { ApiError, apiRequest } from '../lib/api'
import type { AuthResponse } from '../types/dashboard'

export function LoginPage() {
  const session = getAuthSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [credentials, setCredentials] = useState({
    username: 'admin@edupulse.local',
    password: 'Admin123*',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (session) {
    return <Navigate to={getDefaultRouteForRole(session.role)} replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: credentials,
      })
      saveAuthSession(response)
      const from = typeof location.state?.from === 'string' ? location.state.from : null
      navigate(from ?? getDefaultRouteForRole(response.role), { replace: true })
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message)
      } else {
        setError('No fue posible iniciar sesion')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[40px] border border-white/70 bg-white/60 p-8 shadow-[0_36px_100px_rgba(104,35,84,0.16)] backdrop-blur sm:p-10">
          <BrandMark />
          <div className="mt-12 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-brand-magenta">Inicio de implementacion</p>
            <h1 className="mt-4 font-heading text-5xl leading-none text-slate-950 sm:text-6xl">
              Panel institucional y encuesta vigente en una sola base visual.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Esta version deja lista la entrada visual de EduPulse con lineamientos de marca, rutas principales, dashboard exportable y experiencia del estudiante enfocada solo en la encuesta activa.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-10 space-y-4 rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_rgba(104,35,84,0.1)]">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="username">Usuario</label>
              <input
                id="username"
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">Contrasena</label>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
              />
            </div>
            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[28px] bg-slate-950 px-5 py-4 text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              {isSubmitting ? 'Ingresando...' : 'Ingresar con el backend real'}
            </button>
          </form>
        </section>
        <aside className="rounded-[40px] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
          <div className="flex items-center gap-3 text-brand-soft-pink">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-[0.28em]">Credenciales seeded backend</p>
          </div>
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white/8 p-5 ring-1 ring-white/10">
              <p className="text-sm text-white/60">Administrador</p>
              <p className="mt-2 font-mono text-sm text-white">admin@edupulse.local / Admin123*</p>
            </div>
            <div className="rounded-3xl bg-white/8 p-5 ring-1 ring-white/10">
              <p className="text-sm text-white/60">Estudiante</p>
              <p className="mt-2 font-mono text-sm text-white">estudiante@edupulse.local / Estudiante123*</p>
            </div>
          </div>
          <p className="mt-8 text-sm leading-6 text-white/70">
            Esta pantalla ya consume el endpoint real de autenticacion JWT. Puedes cambiar las credenciales seeded para entrar con el rol correspondiente y validar navegacion protegida.
          </p>
        </aside>
      </div>
    </div>
  )
}