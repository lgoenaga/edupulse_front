import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileSpreadsheet, Filter } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FilterBar } from '../components/FilterBar'
import { StatCard } from '../components/StatCard'
import { ApiError, apiRequest, toQueryString } from '../lib/api'
import { exportAggregatesToExcel, exportDashboardToPdf } from '../lib/export'
import type { CatalogMetadata, DashboardFilters, DashboardStatistics } from '../types/dashboard'

const initialFilters: DashboardFilters = {
  levelId: 'all',
  groupId: 'all',
  periodId: 'all',
  techniqueId: 'all',
  teacherId: 'all',
}

export function AdminDashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters)
  const [isExporting, setIsExporting] = useState(false)
  const [metadata, setMetadata] = useState<CatalogMetadata>({
    levels: [],
    groups: [],
    periods: [],
    techniques: [],
    teachers: [],
  })
  const [data, setData] = useState<DashboardStatistics>({
    totalResponses: 0,
    categoryAverages: [],
    techniqueAverages: [],
    teacherAverages: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const dashboardRef = useRef<HTMLDivElement>(null)

  const overallAverage = useMemo(() => {
    if (!data.categoryAverages.length) {
      return 0
    }

    const sum = data.categoryAverages.reduce((accumulator, item) => accumulator + item.average, 0)
    return Number((sum / data.categoryAverages.length).toFixed(2))
  }, [data.categoryAverages])

  useEffect(() => {
    let isMounted = true

    const loadMetadata = async () => {
      try {
        const response = await apiRequest<CatalogMetadata>('/admin/catalog/metadata')
        if (isMounted) {
          setMetadata(response)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar los filtros')
        }
      }
    }

    void loadMetadata()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadStatistics = async () => {
      setIsLoading(true)
      setError('')

      try {
        const query = toQueryString(filters)
        const response = await apiRequest<DashboardStatistics>(`/admin/statistics${query}`)
        if (isMounted) {
          setData(response)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar el dashboard')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadStatistics()

    return () => {
      isMounted = false
    }
  }, [filters])

  const handleChange = (name: keyof DashboardFilters, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const handlePdfExport = async () => {
    if (!dashboardRef.current) return
    setIsExporting(true)
    try {
      await exportDashboardToPdf(dashboardRef.current, 'edupulse-dashboard-filtrado.pdf')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-4xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(247,196,220,0.55),rgba(224,210,219,0.5))] p-6 shadow-[0_24px_70px_rgba(104,35,84,0.14)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-magenta">Panel administrativo</p>
          <h1 className="mt-3 font-heading text-4xl text-slate-950 sm:text-5xl">Estadisticas filtrables y exportables</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Esta vista refleja el comportamiento esperado del dashboard: filtros completos, resumen agregado y exportacion exacta del estado visible a PDF y Excel.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePdfExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
          </button>
          <button
            type="button"
            onClick={() => exportAggregatesToExcel('edupulse-dashboard-filtrado.xlsx', data.categoryAverages, data.techniqueAverages, data.teacherAverages)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>
      </header>

      <FilterBar
        filters={filters}
        levels={metadata.levels}
        groups={metadata.groups}
        periods={metadata.periods}
        techniques={metadata.techniques}
        teachers={metadata.teachers}
        onChange={handleChange}
      />

      {error ? <p className="rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</p> : null}

      <div ref={dashboardRef} className="space-y-6 rounded-[36px] bg-white/45 p-2">
        <section className="grid gap-4 lg:grid-cols-3">
          <StatCard label="Promedio general" value={overallAverage.toFixed(2)} helper="Promedio visible con los filtros activos" />
          <StatCard label="Respuestas agregadas" value={String(data.totalResponses)} helper="Total agregado utilizado en el tablero actual" />
          <StatCard label="Estado de exportacion" value="Exacta" helper="PDF y Excel respetan el estado filtrado en pantalla" />
        </section>

        {isLoading ? <p className="rounded-3xl bg-white/85 px-4 py-4 text-sm text-slate-600">Cargando estadisticas filtradas...</p> : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
            <div className="flex items-center gap-2 text-slate-800">
              <Filter className="h-4 w-4 text-brand-magenta" />
              <h2 className="font-heading text-2xl">Promedio por docente</h2>
            </div>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.teacherAverages} margin={{ left: 0, right: 8, top: 12, bottom: 18 }}>
                  <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} angle={-12} textAnchor="end" height={60} />
                  <YAxis domain={[0, 5]} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(190, 24, 93, 0.06)' }} />
                  <Bar dataKey="average" fill="url(#teacherGradient)" radius={[14, 14, 0, 0]} />
                  <defs>
                    <linearGradient id="teacherGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#be185d" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-4xl border border-white/70 bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <h2 className="font-heading text-2xl">Promedios visibles por categoria</h2>
            <div className="mt-5 space-y-4">
              {data.categoryAverages.map((item) => (
                <div key={`${item.label}-${item.id ?? 'none'}`} className="rounded-3xl bg-white/8 p-4 ring-1 ring-white/10">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold tracking-[0.2em] text-brand-soft-pink">{item.label}</p>
                    <p className="font-heading text-3xl text-white">{item.average.toFixed(2)}</p>
                  </div>
                  <p className="mt-2 text-sm text-white/60">{item.totalResponses} respuestas visibles con los filtros actuales</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
            <h2 className="font-heading text-2xl text-slate-950">Tecnicas agregadas</h2>
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tecnica</th>
                    <th className="px-4 py-3 font-semibold">Promedio</th>
                    <th className="px-4 py-3 font-semibold">Respuestas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.techniqueAverages.map((item) => (
                    <tr key={`${item.id}-${item.label}`}>
                      <td className="px-4 py-3 text-slate-700">{item.label}</td>
                      <td className="px-4 py-3 font-semibold text-slate-950">{item.average.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{item.totalResponses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
            <h2 className="font-heading text-2xl text-slate-950">Docentes visibles</h2>
            <div className="mt-5 space-y-3">
              {data.teacherAverages.map((item) => (
                <div key={`${item.id}-${item.label}`} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.totalResponses} respuestas agregadas</p>
                  </div>
                  <span className="rounded-full bg-brand-magenta px-3 py-2 font-heading text-xl text-white">{item.average.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}