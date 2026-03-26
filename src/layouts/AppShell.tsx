import { ClipboardList, LayoutDashboard, LogOut, Settings2, Users } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { clearAuthSession, getAuthSession } from '../lib/auth'

const links = [
  { to: '/app/admin/dashboard', activePrefix: '/app/admin/dashboard', label: 'Dashboard Admin', icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/app/admin/catalogos/niveles', activePrefix: '/app/admin/catalogos', label: 'Gestion Academica', icon: Settings2, roles: ['ADMIN'] },
  { to: '/app/admin/usuarios/estudiantes', activePrefix: '/app/admin/usuarios', label: 'Gestion de Usuarios', icon: Users, roles: ['ADMIN'] },
  { to: '/app/student/encuesta', activePrefix: '/app/student/encuesta', label: 'Encuesta Vigente', icon: ClipboardList, roles: ['ESTUDIANTE'] },
]

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()
  const visibleLinks = links.filter((link) => session && link.roles.includes(session.role))
  const dashboardLink = visibleLinks.find((link) => link.activePrefix === '/app/admin/dashboard')
  const managementLinks = visibleLinks.filter(
    (link) => link.activePrefix === '/app/admin/catalogos' || link.activePrefix === '/app/admin/usuarios',
  )
  const secondaryLinks = visibleLinks.filter(
    (link) => link !== dashboardLink && !managementLinks.includes(link),
  )

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const renderNavLink = (to: string, activePrefix: string, label: string, Icon: typeof LayoutDashboard) => {
    const isActive = location.pathname.startsWith(activePrefix)

    return (
      <NavLink
        key={to}
        to={to}
        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
          isActive
            ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_30px_rgba(15,23,42,0.18)]'
            : 'border-slate-200 bg-white/82 text-slate-800 hover:bg-white hover:text-slate-950'
        }`}
      >
        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-700'}`} />
        <span className={isActive ? 'text-white' : 'text-slate-800'}>{label}</span>
      </NavLink>
    )
  }

  const logoutButton = (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/88 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white xl:max-w-65"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesion
    </button>
  )

  return (
    <div className="min-h-screen bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-4xl border border-white/70 bg-white/72 px-4 py-4 shadow-[0_28px_70px_rgba(95,34,77,0.12)] backdrop-blur sm:px-6">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-start">
            <div className="flex justify-start">
              <BrandMark mode="logo-only" />
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <p className="font-heading text-2xl text-slate-950 sm:text-3xl">EduPulse</p>
              <p className="mt-1 text-sm text-slate-600">Evaluacion institucional por periodos</p>
            </div>

            <div className="flex flex-col gap-3 xl:min-w-60 xl:items-center xl:justify-self-end">
              <div className="w-full rounded-3xl border border-white/70 bg-white/80 px-4 py-3 xl:max-w-65">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Sesion activa</p>
                <p className="mt-1 font-heading text-lg text-slate-950">{session?.fullName}</p>
                <p className="text-sm font-medium text-slate-600">Rol {session?.role}</p>
              </div>
            </div>
          </div>

          {session?.role === 'ADMIN' ? (
            <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto_1fr] xl:items-start">
              <div className="flex justify-start">
                {dashboardLink
                  ? renderNavLink(dashboardLink.to, dashboardLink.activePrefix, dashboardLink.label, dashboardLink.icon)
                  : null}
              </div>

              <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Gestiones administrativas">
                {managementLinks.map(({ to, activePrefix, label, icon }) => renderNavLink(to, activePrefix, label, icon))}
              </nav>

              <div className="flex justify-start xl:justify-end">{logoutButton}</div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto_1fr] xl:items-start">
              <div className="hidden xl:block" />

              <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Navegacion principal">
                {secondaryLinks.map(({ to, activePrefix, label, icon }) => renderNavLink(to, activePrefix, label, icon))}
              </nav>

              <div className="flex justify-start xl:justify-end">{logoutButton}</div>
            </div>
          )}
        </header>

        <main className="rounded-[36px] border border-white/70 bg-white/55 p-4 shadow-[0_32px_80px_rgba(95,34,77,0.12)] backdrop-blur sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}