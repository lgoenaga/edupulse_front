import { Eye, FileSpreadsheet, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, apiRequest, toQueryString } from '../lib/api'
import { exportSurveySubmissionsToExcel } from '../lib/export'
import type {
  CatalogMetadata,
  Student,
  SurveySubmissionDetail,
  SurveySubmissionFilters,
  SurveySubmissionRecord,
} from '../types/dashboard'

const initialFilters: SurveySubmissionFilters = {
  levelId: 'all',
  groupId: 'all',
  periodId: 'all',
  studentId: 'all',
  submittedFromDate: '',
  submittedToDate: '',
}

const selectBase =
  'rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10'

export function SurveySubmissionsPage() {
  const [filters, setFilters] = useState<SurveySubmissionFilters>(initialFilters)
  const [metadata, setMetadata] = useState<CatalogMetadata>({
    levels: [],
    groups: [],
    periods: [],
    techniques: [],
    teachers: [],
  })
  const [students, setStudents] = useState<Student[]>([])
  const [submissions, setSubmissions] = useState<SurveySubmissionRecord[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadMetadata = async () => {
      try {
        const [metadataResponse, studentsResponse] = await Promise.all([
          apiRequest<CatalogMetadata>('/admin/catalog/metadata'),
          apiRequest<Student[]>('/admin/students'),
        ])
        if (isMounted) {
          setMetadata(metadataResponse)
          setStudents(studentsResponse)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar los filtros de envios')
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

    const loadSubmissions = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await apiRequest<SurveySubmissionRecord[]>(`/admin/survey-submissions${toQueryString(filters)}`)
        if (isMounted) {
          setSubmissions(response)
          setSelectedSubmission((current) =>
            current && response.some((submission) => submission.id === current.id) ? current : null,
          )
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar los envios de encuesta')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSubmissions()

    return () => {
      isMounted = false
    }
  }, [filters])

  const filteredGroupOptions = useMemo(() => {
    if (filters.levelId === 'all') {
      return metadata.groups
    }

    const levelLabel = metadata.levels.find((level) => String(level.id) === filters.levelId)?.label
    if (!levelLabel) {
      return metadata.groups
    }

    return metadata.groups.filter((group) => group.label.startsWith(`${levelLabel} · `) || group.label.endsWith(` · ${levelLabel}`))
  }, [filters.levelId, metadata.groups, metadata.levels])

  const filteredStudentOptions = useMemo(() => {
    const allowedGroupIds = new Set(filteredGroupOptions.map((group) => String(group.id)))

    return students.filter((student) => {
      if (filters.groupId !== 'all') {
        return String(student.groupId) === filters.groupId
      }

      if (filters.levelId !== 'all') {
        return allowedGroupIds.has(String(student.groupId))
      }

      return true
    })
  }, [filteredGroupOptions, filters.groupId, filters.levelId, students])

  const summaryLabel = useMemo(() => {
    const selectedStudent =
      filters.studentId === 'all'
        ? null
        : students.find((student) => String(student.id) === filters.studentId)?.fullName

    if (filters.periodId === 'all') {
      return selectedStudent
        ? `envios visibles para ${selectedStudent} con los filtros activos`
        : 'envios visibles con los filtros activos'
    }

    const periodLabel = metadata.periods.find((period) => String(period.id) === filters.periodId)?.label
    if (!periodLabel) {
      return selectedStudent
        ? `envios visibles para ${selectedStudent} con los filtros activos`
        : 'envios visibles con los filtros activos'
    }

    return selectedStudent ? `envios visibles para ${selectedStudent} en ${periodLabel}` : `envios visibles para ${periodLabel}`
  }, [filters.periodId, filters.studentId, metadata.periods, students])

  const handleFilterChange = (name: keyof SurveySubmissionFilters, value: string) => {
    setFilters((current) => {
      const next = { ...current, [name]: value }
      if (name === 'levelId') {
        next.groupId = 'all'
        next.studentId = 'all'
      }
      if (name === 'groupId') {
        next.studentId = 'all'
      }
      return next
    })
    setDetailError('')
  }

  const handleExport = async () => {
    if (!submissions.length) {
      return
    }

    setIsExporting(true)
    try {
      exportSurveySubmissionsToExcel('edupulse-envios-filtrados.xlsx', submissions)
    } finally {
      setIsExporting(false)
    }
  }

  const handleViewDetail = async (submissionId: number) => {
    setIsLoadingDetail(true)
    setDetailError('')

    try {
      const response = await apiRequest<SurveySubmissionDetail>(`/admin/survey-submissions/${submissionId}`)
      setSelectedSubmission(response)
    } catch (caughtError) {
      setDetailError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar el detalle del envio')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(value))

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-4xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(247,196,220,0.55),rgba(224,210,219,0.5))] p-6 shadow-[0_24px_70px_rgba(104,35,84,0.14)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-magenta">Panel administrativo</p>
          <h1 className="mt-3 font-heading text-4xl text-slate-950 sm:text-5xl">Consulta de envios de encuesta</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Esta vista permite revisar que estudiantes ya respondieron la encuesta del periodo vigente o historico filtrado. Es una consulta de solo lectura para seguimiento administrativo.
          </p>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/85 px-5 py-4 text-right shadow-[0_18px_40px_rgba(102,39,90,0.1)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Resumen actual</p>
          <p className="mt-2 font-heading text-4xl text-slate-950">{submissions.length}</p>
          <p className="mt-1 text-sm text-slate-600">{summaryLabel}</p>
        </div>
      </header>

      <section className="grid gap-3 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_40px_rgba(102,39,90,0.1)] backdrop-blur md:grid-cols-2 xl:grid-cols-3">
        <select
          aria-label="Filtrar por nivel"
          className={selectBase}
          value={filters.levelId}
          onChange={(event) => handleFilterChange('levelId', event.target.value)}
        >
          <option value="all">Todos los niveles</option>
          {metadata.levels.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por grupo"
          className={selectBase}
          value={filters.groupId}
          onChange={(event) => handleFilterChange('groupId', event.target.value)}
        >
          <option value="all">Todos los grupos</option>
          {filteredGroupOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por periodo"
          className={selectBase}
          value={filters.periodId}
          onChange={(event) => handleFilterChange('periodId', event.target.value)}
        >
          <option value="all">Todos los periodos</option>
          {metadata.periods.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por estudiante"
          className={selectBase}
          value={filters.studentId}
          onChange={(event) => handleFilterChange('studentId', event.target.value)}
        >
          <option value="all">Todos los estudiantes</option>
          {filteredStudentOptions.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName} · {student.studentCode}
            </option>
          ))}
        </select>
        <label className={`${selectBase} flex flex-col gap-2 py-2`}>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Desde</span>
          <input
            aria-label="Filtrar desde fecha"
            type="date"
            className="bg-transparent text-sm text-slate-700 outline-none"
            value={filters.submittedFromDate}
            onChange={(event) => handleFilterChange('submittedFromDate', event.target.value)}
          />
        </label>
        <label className={`${selectBase} flex flex-col gap-2 py-2`}>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hasta</span>
          <input
            aria-label="Filtrar hasta fecha"
            type="date"
            className="bg-transparent text-sm text-slate-700 outline-none"
            value={filters.submittedToDate}
            onChange={(event) => handleFilterChange('submittedToDate', event.target.value)}
          />
        </label>
      </section>

      {error ? <p className="rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</p> : null}
      {detailError ? <p className="rounded-3xl bg-amber-50 px-4 py-4 text-sm text-amber-700">{detailError}</p> : null}

      <section className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Solo lectura</p>
            <h2 className="mt-2 font-heading text-3xl text-slate-950">Envios registrados</h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={!submissions.length || isLoading || isExporting}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
            {isLoading ? (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Estudiante</th>
                <th className="px-4 py-3 font-semibold">Grupo</th>
                <th className="px-4 py-3 font-semibold">Periodo</th>
                <th className="px-4 py-3 font-semibold">Enviado</th>
                <th className="px-4 py-3 font-semibold">Respuestas</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {submissions.map((submission) => {
                const isSelected = selectedSubmission?.id === submission.id
                return (
                  <tr key={submission.id} className={isSelected ? 'bg-brand-soft-pink/20' : undefined}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{submission.studentName}</p>
                      <p className="mt-1 text-slate-500">{submission.studentCode} · {submission.studentEmail}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <p>{submission.groupName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{submission.levelName}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{submission.periodName}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(submission.submittedAt)}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {submission.responseCount} respuestas
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(submission.id)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Eye className="h-4 w-4" />
                          {isLoadingDetail && isSelected ? 'Abriendo...' : 'Ver detalle'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!isLoading && !submissions.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No hay envios registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedSubmission ? (
        <section className="rounded-4xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Detalle del envio</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">{selectedSubmission.studentName}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {selectedSubmission.studentCode} · {selectedSubmission.studentEmail}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:text-right">
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contexto</p>
                <p className="mt-2 font-semibold text-slate-950">{selectedSubmission.levelName} · {selectedSubmission.groupName}</p>
                <p className="mt-1">{selectedSubmission.techniqueName}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Periodo y fecha</p>
                <p className="mt-2 font-semibold text-slate-950">{selectedSubmission.periodName}</p>
                <p className="mt-1">{formatDate(selectedSubmission.submittedAt)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {selectedSubmission.responses.map((response) => (
              <article key={`${selectedSubmission.id}-${response.questionId}-${response.teacherName ?? 'none'}-${response.subjectName ?? 'none'}`} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">{response.category}</p>
                    <h3 className="mt-2 text-base font-semibold text-slate-950">{response.prompt}</h3>
                    {response.teacherName || response.subjectName ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {response.teacherName ? response.teacherName : 'Sin docente'}
                        {response.subjectName ? ` · ${response.subjectName}` : ''}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl bg-slate-950 px-4 font-heading text-2xl text-white">
                    {response.score}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
