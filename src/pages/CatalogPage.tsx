import { useEffect, useState } from 'react'
import { BookOpen, CalendarRange, GraduationCap, Layers3, Pencil, Plus, Rows3, Trash2, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, apiRequest, toQueryString } from '../lib/api'
import type {
  AcademicGroup,
  AcademicGroupPayload,
  AcademicLoad,
  AcademicLoadPayload,
  AcademicLevel,
  AcademicLevelPayload,
  AcademicPeriod,
  AcademicPeriodPayload,
  AcademicSubject,
  AcademicSubjectPayload,
  CatalogMetadata,
  PageResponse,
  Technique,
  TechniquePayload,
} from '../types/dashboard'

type AcademicSectionKey = 'niveles' | 'grupos' | 'tecnicas' | 'carga-academica' | 'materias' | 'periodos'

const academicSections: Array<{
  key: AcademicSectionKey
  title: string
  description: string
  icon: typeof Layers3
}> = [
  {
    key: 'niveles',
    title: 'Niveles',
    description: 'Administra la jerarquia base de niveles academicos y su orden visual.',
    icon: Rows3,
  },
  {
    key: 'grupos',
    title: 'Grupos',
    description: 'Configura los grupos academicos vinculados a nivel y tecnica.',
    icon: Users,
  },
  {
    key: 'tecnicas',
    title: 'Tecnicas',
    description: 'Mantiene el catalogo de tecnicas academicas disponibles para la oferta.',
    icon: Layers3,
  },
  {
    key: 'carga-academica',
    title: 'Carga academica',
    description: 'Relaciona docente, materia, grupo y periodo para dejar lista la operacion institucional.',
    icon: GraduationCap,
  },
  {
    key: 'materias',
    title: 'Materias',
    description: 'Administra el catalogo de materias y su asociacion con los niveles academicos.',
    icon: BookOpen,
  },
  {
    key: 'periodos',
    title: 'Periodos',
    description: 'Configura vigencia, fechas y estado de los periodos academicos activos.',
    icon: CalendarRange,
  },
]

const defaultAcademicSection: AcademicSectionKey = 'niveles'
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

const isAcademicSectionKey = (value: string | undefined): value is AcademicSectionKey =>
  academicSections.some((section) => section.key === value)

const getAcademicSectionSummary = (
  section: AcademicSectionKey,
  values: {
    levels: AcademicLevel[]
    groups: AcademicGroup[]
    techniques: Technique[]
    loadsCount: number
    subjects: AcademicSubject[]
    periods: AcademicPeriod[]
  },
) => {
  switch (section) {
    case 'niveles':
      return { count: values.levels.length, label: 'niveles registrados' }
    case 'grupos':
      return { count: values.groups.length, label: 'grupos registrados' }
    case 'tecnicas':
      return { count: values.techniques.length, label: 'tecnicas registradas' }
    case 'carga-academica':
      return { count: values.loadsCount, label: 'cargas academicas registradas' }
    case 'materias':
      return { count: values.subjects.length, label: 'materias registradas' }
    case 'periodos':
      return { count: values.periods.length, label: 'periodos registrados' }
  }
}

export function CatalogPage() {
  const navigate = useNavigate()
  const { gestion } = useParams<{ gestion?: string }>()
  const [loads, setLoads] = useState<AcademicLoad[]>([])
  const [loadPage, setLoadPage] = useState(0)
  const [loadPageSize, setLoadPageSize] = useState<number>(20)
  const [loadTotalElements, setLoadTotalElements] = useState(0)
  const [loadTotalPages, setLoadTotalPages] = useState(0)
  const [metadata, setMetadata] = useState<CatalogMetadata | null>(null)
  const [groups, setGroups] = useState<AcademicGroup[]>([])
  const [levels, setLevels] = useState<AcademicLevel[]>([])
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [subjects, setSubjects] = useState<AcademicSubject[]>([])
  const [techniques, setTechniques] = useState<Technique[]>([])
  const [isSavingLoad, setIsSavingLoad] = useState(false)
  const [isLoadingLoads, setIsLoadingLoads] = useState(true)
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [isSavingLevel, setIsSavingLevel] = useState(false)
  const [isSavingPeriod, setIsSavingPeriod] = useState(false)
  const [isSavingSubject, setIsSavingSubject] = useState(false)
  const [isSavingTechnique, setIsSavingTechnique] = useState(false)
  const [editingLoadId, setEditingLoadId] = useState<number | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null)
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null)
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)
  const [editingTechniqueId, setEditingTechniqueId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadForm, setLoadForm] = useState<AcademicLoadPayload>({
    teacherId: 0,
    subjectId: 0,
    groupId: 0,
    periodId: 0,
    active: true,
  })
  const [groupForm, setGroupForm] = useState<AcademicGroupPayload>({
    name: '',
    levelId: 0,
    techniqueId: 0,
  })
  const [levelForm, setLevelForm] = useState<AcademicLevelPayload>({
    name: '',
    displayOrder: 1,
  })
  const [periodForm, setPeriodForm] = useState<AcademicPeriodPayload>({
    year: new Date().getFullYear(),
    termNumber: 1,
    name: `Periodo 1 ${new Date().getFullYear()}`,
    startDate: '',
    endDate: '',
    active: false,
  })
  const [subjectForm, setSubjectForm] = useState<AcademicSubjectPayload>({
    code: '',
    name: '',
    levelId: 0,
  })
  const [techniqueForm, setTechniqueForm] = useState<TechniquePayload>({
    code: '',
    name: '',
  })
  const activeSection = isAcademicSectionKey(gestion) ? gestion : defaultAcademicSection
  const activeSectionConfig = academicSections.find((section) => section.key === activeSection) ?? academicSections[0]
  const ActiveSectionIcon = activeSectionConfig.icon
  const activeSectionSummary = getAcademicSectionSummary(activeSection, {
    levels,
    groups,
    techniques,
    loadsCount: loadTotalElements,
    subjects,
    periods,
  })

  useEffect(() => {
    if (gestion === activeSection) {
      return
    }

    navigate(`/app/admin/catalogos/${activeSection}`, { replace: true })
  }, [activeSection, gestion, navigate])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [metadataResponse, groupsResponse, levelsResponse, periodsResponse, subjectsResponse, techniquesResponse] = await Promise.all([
          apiRequest<CatalogMetadata>('/admin/catalog/metadata'),
          apiRequest<AcademicGroup[]>('/admin/groups'),
          apiRequest<AcademicLevel[]>('/admin/levels'),
          apiRequest<AcademicPeriod[]>('/admin/periods'),
          apiRequest<AcademicSubject[]>('/admin/subjects'),
          apiRequest<Technique[]>('/admin/techniques'),
        ])

        if (isMounted) {
          setMetadata(metadataResponse)
          setGroups(groupsResponse)
          setLevels(levelsResponse)
          setPeriods(periodsResponse)
          setSubjects(subjectsResponse)
          setTechniques(techniquesResponse)
          setLoadForm((current) => hydrateLoadForm(current, metadataResponse, subjectsResponse))
          setGroupForm((current) => hydrateGroupForm(current, metadataResponse))
          setSubjectForm((current) => hydrateSubjectForm(current, metadataResponse))
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar los catalogos')
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadPagedLoads = async () => {
      setIsLoadingLoads(true)

      try {
        const response = await apiRequest<PageResponse<AcademicLoad>>(
          `/admin/loads/paged${toQueryString({ page: String(loadPage), size: String(loadPageSize) })}`,
        )

        if (isMounted) {
          setLoads(response.items)
          setLoadPage(response.page)
          setLoadPageSize(response.size)
          setLoadTotalElements(response.totalElements)
          setLoadTotalPages(response.totalPages)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar las cargas academicas')
        }
      } finally {
        if (isMounted) {
          setIsLoadingLoads(false)
        }
      }
    }

    void loadPagedLoads()

    return () => {
      isMounted = false
    }
  }, [loadPage, loadPageSize])

  const hydrateLoadForm = (
    form: AcademicLoadPayload,
    catalogMetadata: CatalogMetadata,
    availableSubjects: AcademicSubject[],
  ) => ({
    ...form,
    teacherId: form.teacherId || catalogMetadata.teachers[0]?.id || 0,
    subjectId: form.subjectId || availableSubjects[0]?.id || 0,
    groupId: form.groupId || catalogMetadata.groups[0]?.id || 0,
    periodId: form.periodId || catalogMetadata.periods[0]?.id || 0,
  })

  const resetLoadForm = () => {
    setEditingLoadId(null)
    setLoadForm(
      metadata
        ? hydrateLoadForm(
            {
              teacherId: 0,
              subjectId: 0,
              groupId: 0,
              periodId: 0,
              active: true,
            },
            metadata,
            subjects,
          )
        : {
            teacherId: 0,
            subjectId: 0,
            groupId: 0,
            periodId: 0,
            active: true,
          },
    )
  }

  const resetLevelForm = () => {
    setEditingLevelId(null)
    setLevelForm({
      name: '',
      displayOrder: 1,
    })
  }

  const hydrateGroupForm = (form: AcademicGroupPayload, catalogMetadata: CatalogMetadata) => ({
    ...form,
    levelId: form.levelId || catalogMetadata.levels[0]?.id || 0,
    techniqueId: form.techniqueId || catalogMetadata.techniques[0]?.id || 0,
  })

  const hydrateSubjectForm = (form: AcademicSubjectPayload, catalogMetadata: CatalogMetadata) => ({
    ...form,
    levelId: form.levelId || catalogMetadata.levels[0]?.id || 0,
  })

  const resetGroupForm = () => {
    setEditingGroupId(null)
    setGroupForm(
      metadata
        ? hydrateGroupForm(
            {
              name: '',
              levelId: 0,
              techniqueId: 0,
            },
            metadata,
          )
        : {
            name: '',
            levelId: 0,
            techniqueId: 0,
          },
    )
  }

  const resetSubjectForm = () => {
    setEditingSubjectId(null)
    setSubjectForm(
      metadata
        ? hydrateSubjectForm(
            {
              code: '',
              name: '',
              levelId: 0,
            },
            metadata,
          )
        : {
            code: '',
            name: '',
            levelId: 0,
          },
    )
  }

  const resetPeriodForm = () => {
    setEditingPeriodId(null)
    setPeriodForm({
      year: new Date().getFullYear(),
      termNumber: 1,
      name: `Periodo 1 ${new Date().getFullYear()}`,
      startDate: '',
      endDate: '',
      active: false,
    })
  }

  const resetTechniqueForm = () => {
    setEditingTechniqueId(null)
    setTechniqueForm({
      code: '',
      name: '',
    })
  }

  const refreshCatalogData = async () => {
    const [metadataResponse, groupsResponse, levelsResponse, periodsResponse, subjectsResponse, techniquesResponse] = await Promise.all([
      apiRequest<CatalogMetadata>('/admin/catalog/metadata'),
      apiRequest<AcademicGroup[]>('/admin/groups'),
      apiRequest<AcademicLevel[]>('/admin/levels'),
      apiRequest<AcademicPeriod[]>('/admin/periods'),
      apiRequest<AcademicSubject[]>('/admin/subjects'),
      apiRequest<Technique[]>('/admin/techniques'),
    ])

    setMetadata(metadataResponse)
    setGroups(groupsResponse)
    setLevels(levelsResponse)
    setPeriods(periodsResponse)
    setSubjects(subjectsResponse)
    setTechniques(techniquesResponse)
    if (editingLoadId === null) {
      setLoadForm((current) => hydrateLoadForm(current, metadataResponse, subjectsResponse))
    }
    if (editingGroupId === null) {
      setGroupForm((current) => hydrateGroupForm(current, metadataResponse))
    }
    if (editingSubjectId === null) {
      setSubjectForm((current) => hydrateSubjectForm(current, metadataResponse))
    }

    await refreshLoads(loadPage, loadPageSize)
  }

  const refreshLoads = async (nextPage = loadPage, nextSize = loadPageSize) => {
    const response = await apiRequest<PageResponse<AcademicLoad>>(
      `/admin/loads/paged${toQueryString({ page: String(nextPage), size: String(nextSize) })}`,
    )
    setLoads(response.items)
    setLoadPage(response.page)
    setLoadPageSize(response.size)
    setLoadTotalElements(response.totalElements)
    setLoadTotalPages(response.totalPages)
  }

  const handleLoadInputChange = <K extends keyof AcademicLoadPayload>(key: K, value: AcademicLoadPayload[K]) => {
    setLoadForm((current) => ({ ...current, [key]: value }))
  }

  const handleGroupInputChange = <K extends keyof AcademicGroupPayload>(key: K, value: AcademicGroupPayload[K]) => {
    setGroupForm((current) => ({ ...current, [key]: value }))
  }

  const handleLevelInputChange = <K extends keyof AcademicLevelPayload>(key: K, value: AcademicLevelPayload[K]) => {
    setLevelForm((current) => ({ ...current, [key]: value }))
  }

  const handlePeriodInputChange = <K extends keyof AcademicPeriodPayload>(key: K, value: AcademicPeriodPayload[K]) => {
    setPeriodForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubjectInputChange = <K extends keyof AcademicSubjectPayload>(key: K, value: AcademicSubjectPayload[K]) => {
    setSubjectForm((current) => ({ ...current, [key]: value }))
  }

  const handleTechniqueInputChange = <K extends keyof TechniquePayload>(key: K, value: TechniquePayload[K]) => {
    setTechniqueForm((current) => ({ ...current, [key]: value }))
  }

  const handleLoadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingLoad(true)

    try {
      if (editingLoadId === null) {
        await apiRequest<AcademicLoad>('/admin/loads', {
          method: 'POST',
          body: loadForm,
        })
        setSuccess('Carga academica creada correctamente.')
      } else {
        await apiRequest<AcademicLoad>(`/admin/loads/${editingLoadId}`, {
          method: 'PUT',
          body: loadForm,
        })
        setSuccess('Carga academica actualizada correctamente.')
      }

      await refreshCatalogData()
      resetLoadForm()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible guardar la carga academica')
    } finally {
      setIsSavingLoad(false)
    }
  }

  const handleGroupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingGroup(true)

    try {
      if (editingGroupId === null) {
        await apiRequest<AcademicGroup>('/admin/groups', {
          method: 'POST',
          body: groupForm,
        })
        setSuccess('Grupo creado correctamente.')
      } else {
        await apiRequest<AcademicGroup>(`/admin/groups/${editingGroupId}`, {
          method: 'PUT',
          body: groupForm,
        })
        setSuccess('Grupo actualizado correctamente.')
      }

      await refreshCatalogData()
      resetGroupForm()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible guardar el grupo')
    } finally {
      setIsSavingGroup(false)
    }
  }

  const handleLevelSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingLevel(true)

    try {
      if (editingLevelId === null) {
        await apiRequest<AcademicLevel>('/admin/levels', {
          method: 'POST',
          body: levelForm,
        })
        setSuccess('Nivel creado correctamente.')
      } else {
        await apiRequest<AcademicLevel>(`/admin/levels/${editingLevelId}`, {
          method: 'PUT',
          body: levelForm,
        })
        setSuccess('Nivel actualizado correctamente.')
      }

      await refreshCatalogData()
      resetLevelForm()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible guardar el nivel')
    } finally {
      setIsSavingLevel(false)
    }
  }

  const handlePeriodSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingPeriod(true)

    try {
      if (editingPeriodId === null) {
        await apiRequest<AcademicPeriod>('/admin/periods', {
          method: 'POST',
          body: periodForm,
        })
        setSuccess('Periodo creado correctamente.')
      } else {
        await apiRequest<AcademicPeriod>(`/admin/periods/${editingPeriodId}`, {
          method: 'PUT',
          body: periodForm,
        })
        setSuccess('Periodo actualizado correctamente.')
      }

      await refreshCatalogData()
      resetPeriodForm()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible guardar el periodo')
    } finally {
      setIsSavingPeriod(false)
    }
  }

  const handleTechniqueSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingTechnique(true)

    try {
      if (editingTechniqueId === null) {
        await apiRequest<Technique>('/admin/techniques', {
          method: 'POST',
          body: techniqueForm,
        })
        setSuccess('Tecnica creada correctamente.')
      } else {
        await apiRequest<Technique>(`/admin/techniques/${editingTechniqueId}`, {
          method: 'PUT',
          body: techniqueForm,
        })
        setSuccess('Tecnica actualizada correctamente.')
      }

      await refreshCatalogData()
      resetTechniqueForm()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible guardar la tecnica')
    } finally {
      setIsSavingTechnique(false)
    }
  }

  const handleSubjectSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingSubject(true)

    try {
      if (editingSubjectId === null) {
        await apiRequest<AcademicSubject>('/admin/subjects', {
          method: 'POST',
          body: subjectForm,
        })
        setSuccess('Materia creada correctamente.')
      } else {
        await apiRequest<AcademicSubject>(`/admin/subjects/${editingSubjectId}`, {
          method: 'PUT',
          body: subjectForm,
        })
        setSuccess('Materia actualizada correctamente.')
      }

      await refreshCatalogData()
      resetSubjectForm()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible guardar la materia')
    } finally {
      setIsSavingSubject(false)
    }
  }

  const handleEdit = (period: AcademicPeriod) => {
    setEditingPeriodId(period.id)
    setSuccess('')
    setError('')
    setPeriodForm({
      year: period.year,
      termNumber: period.termNumber,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      active: period.active,
    })
  }

  const handleGroupEdit = (group: AcademicGroup) => {
    setEditingGroupId(group.id)
    setSuccess('')
    setError('')
    setGroupForm({
      name: group.name,
      levelId: group.levelId,
      techniqueId: group.techniqueId,
    })
  }

  const handleGroupDelete = async (group: AcademicGroup) => {
    if (!window.confirm(`Eliminar el grupo "${group.name}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiRequest(`/admin/groups/${group.id}`, { method: 'DELETE' })
      await refreshCatalogData()
      if (editingGroupId === group.id) {
        resetGroupForm()
      }
      setSuccess('Grupo eliminado correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible eliminar el grupo')
    }
  }

  const handleLoadEdit = (load: AcademicLoad) => {
    setEditingLoadId(load.id)
    setSuccess('')
    setError('')
    setLoadForm({
      teacherId: load.teacherId,
      subjectId: load.subjectId,
      groupId: load.groupId,
      periodId: load.periodId,
      active: load.active,
    })
  }

  const handleLoadDelete = async (load: AcademicLoad) => {
    if (!window.confirm(`Eliminar la carga academica de ${load.teacherName} para ${load.subjectName}?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiRequest(`/admin/loads/${load.id}`, { method: 'DELETE' })
      const nextPage = loads.length === 1 && loadPage > 0 ? loadPage - 1 : loadPage
      setLoadPage(nextPage)
      await refreshCatalogData()
      if (editingLoadId === load.id) {
        resetLoadForm()
      }
      setSuccess('Carga academica eliminada correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible eliminar la carga academica')
    }
  }

  const handleLevelEdit = (level: AcademicLevel) => {
    setEditingLevelId(level.id)
    setSuccess('')
    setError('')
    setLevelForm({
      name: level.name,
      displayOrder: level.displayOrder,
    })
  }

  const handleLevelDelete = async (level: AcademicLevel) => {
    if (!window.confirm(`Eliminar el nivel "${level.name}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiRequest(`/admin/levels/${level.id}`, { method: 'DELETE' })
      await refreshCatalogData()
      if (editingLevelId === level.id) {
        resetLevelForm()
      }
      setSuccess('Nivel eliminado correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible eliminar el nivel')
    }
  }

  const handleDelete = async (period: AcademicPeriod) => {
    if (!window.confirm(`Eliminar el periodo "${period.name}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiRequest(`/admin/periods/${period.id}`, { method: 'DELETE' })
      await refreshCatalogData()
      if (editingPeriodId === period.id) {
        resetPeriodForm()
      }
      setSuccess('Periodo eliminado correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible eliminar el periodo')
    }
  }

  const handleTechniqueEdit = (technique: Technique) => {
    setEditingTechniqueId(technique.id)
    setSuccess('')
    setError('')
    setTechniqueForm({
      code: technique.code,
      name: technique.name,
    })
  }

  const handleSubjectEdit = (subject: AcademicSubject) => {
    setEditingSubjectId(subject.id)
    setSuccess('')
    setError('')
    setSubjectForm({
      code: subject.code,
      name: subject.name,
      levelId: subject.levelId,
    })
  }

  const handleSubjectDelete = async (subject: AcademicSubject) => {
    if (!window.confirm(`Eliminar la materia "${subject.name}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiRequest(`/admin/subjects/${subject.id}`, { method: 'DELETE' })
      await refreshCatalogData()
      if (editingSubjectId === subject.id) {
        resetSubjectForm()
      }
      setSuccess('Materia eliminada correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible eliminar la materia')
    }
  }

  const handleTechniqueDelete = async (technique: Technique) => {
    if (!window.confirm(`Eliminar la tecnica "${technique.name}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiRequest(`/admin/techniques/${technique.id}`, { method: 'DELETE' })
      await refreshCatalogData()
      if (editingTechniqueId === technique.id) {
        resetTechniqueForm()
      }
      setSuccess('Tecnica eliminada correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible eliminar la tecnica')
    }
  }

  const handleSectionChange = (section: AcademicSectionKey) => {
    if (section === activeSection) {
      return
    }

    navigate(`/app/admin/catalogos/${section}`)
  }

  const renderLoadPagination = () => (
    <div className="mt-4 flex flex-col gap-3 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
      <p>
        Mostrando <span className="font-semibold text-slate-900">{loads.length}</span> de{' '}
        <span className="font-semibold text-slate-900">{loadTotalElements}</span> cargas academicas.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span>Filas por pagina</span>
          <select
            aria-label="Cantidad de filas por pagina para cargas academicas"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
            value={loadPageSize}
            onChange={(event) => {
              setLoadPage(0)
              setLoadPageSize(Number(event.target.value))
            }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLoadPage((current) => Math.max(0, current - 1))}
            disabled={isLoadingLoads || loadPage === 0}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="min-w-28 text-center font-semibold text-slate-900">
            Pagina {loadTotalPages ? loadPage + 1 : 0} de {Math.max(loadTotalPages, 1)}
          </span>
          <button
            type="button"
            onClick={() => setLoadPage((current) => (loadTotalPages ? Math.min(loadTotalPages - 1, current + 1) : current))}
            disabled={isLoadingLoads || loadTotalPages === 0 || loadPage >= loadTotalPages - 1}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <header className="rounded-4xl border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-magenta">Modulo administrativo</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-950">Gestion academica</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Esta vista ahora funciona por gestiones: selecciona una accion y administra solo ese bloque sin recorrer toda la pagina.
        </p>
        <div className="mt-6 inline-flex rounded-[20px] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          {activeSectionSummary.count} {activeSectionSummary.label}
        </div>
      </header>

      {error ? <p className="rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-3xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700">{success}</p> : null}

      <section className="rounded-4xl border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(104,35,84,0.1)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Seleccion de gestion</p>
            <h2 className="mt-2 font-heading text-3xl text-slate-950">{activeSectionConfig.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{activeSectionConfig.description}</p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-950/95 px-4 py-3 text-brand-soft-pink">
            <ActiveSectionIcon className="h-5 w-5" />
            <span className="text-sm font-semibold text-white">Gestion activa: {activeSectionConfig.title}</span>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Gestiones academicas">
          {academicSections.map(({ key, title, icon: Icon }) => {
            const isActive = key === activeSection

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSectionChange(key)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'border-slate-950 bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]'
                    : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-brand-magenta hover:text-slate-950'
                }`}
              >
                <Icon className="h-4 w-4" />
                {title}
              </button>
            )
          })}
        </nav>
      </section>

      {activeSection === 'niveles' ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Catalogo base</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">Niveles academicos</h2>
            </div>
            {editingLevelId !== null ? (
              <button type="button" onClick={resetLevelForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleLevelSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Nombre</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={levelForm.name}
                onChange={(event) => handleLevelInputChange('name', event.target.value)}
                placeholder="Nivel 1"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Orden visual</span>
              <input
                type="number"
                min={1}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={levelForm.displayOrder}
                onChange={(event) => handleLevelInputChange('displayOrder', Number(event.target.value))}
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSavingLevel}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSavingLevel ? 'Guardando...' : editingLevelId === null ? 'Crear nivel' : 'Actualizar nivel'}
            </button>
          </form>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center gap-3">
            <Rows3 className="h-5 w-5 text-brand-magenta" />
            <h2 className="font-heading text-3xl text-slate-950">Niveles registrados</h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Orden</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {levels.map((level) => (
                  <tr key={level.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{level.displayOrder}</td>
                    <td className="px-4 py-4 text-slate-600">{level.name}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleLevelEdit(level)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLevelDelete(level)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!levels.length ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No hay niveles registrados todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
        </section>
      ) : null}

      {activeSection === 'carga-academica' ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Relacion operativa</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">Carga academica</h2>
            </div>
            {editingLoadId !== null ? (
              <button type="button" onClick={resetLoadForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleLoadSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Docente</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={loadForm.teacherId || ''}
                  onChange={(event) => handleLoadInputChange('teacherId', Number(event.target.value))}
                  required
                >
                  {!metadata?.teachers.length ? <option value="">Sin docentes disponibles</option> : null}
                  {metadata?.teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Materia</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={loadForm.subjectId || ''}
                  onChange={(event) => handleLoadInputChange('subjectId', Number(event.target.value))}
                  required
                >
                  {!subjects.length ? <option value="">Sin materias disponibles</option> : null}
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} · {subject.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Grupo</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={loadForm.groupId || ''}
                  onChange={(event) => handleLoadInputChange('groupId', Number(event.target.value))}
                  required
                >
                  {!metadata?.groups.length ? <option value="">Sin grupos disponibles</option> : null}
                  {metadata?.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Periodo</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={loadForm.periodId || ''}
                  onChange={(event) => handleLoadInputChange('periodId', Number(event.target.value))}
                  required
                >
                  {!metadata?.periods.length ? <option value="">Sin periodos disponibles</option> : null}
                  {metadata?.periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-magenta focus:ring-brand-magenta"
                checked={loadForm.active}
                onChange={(event) => handleLoadInputChange('active', event.target.checked)}
              />
              Mantener esta carga como activa
            </label>

            <button
              type="submit"
              disabled={
                isSavingLoad ||
                !metadata?.teachers.length ||
                !metadata.groups.length ||
                !metadata.periods.length ||
                !subjects.length
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSavingLoad ? 'Guardando...' : editingLoadId === null ? 'Crear carga' : 'Actualizar carga'}
            </button>
          </form>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-brand-magenta" />
            <h2 className="font-heading text-3xl text-slate-950">Cargas registradas</h2>
          </div>

          {renderLoadPagination()}

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Docente y materia</th>
                  <th className="px-4 py-3 font-semibold">Grupo</th>
                  <th className="px-4 py-3 font-semibold">Periodo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loads.map((load) => (
                  <tr key={load.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{load.teacherName}</p>
                      <p className="mt-1 text-slate-500">{load.subjectName}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{load.groupName}</td>
                    <td className="px-4 py-4 text-slate-600">{load.periodName}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${load.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {load.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadEdit(load)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDelete(load)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loads.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No hay cargas academicas registradas todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
        </section>
      ) : null}

      {activeSection === 'materias' ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Catalogo dependiente</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">Materias</h2>
            </div>
            {editingSubjectId !== null ? (
              <button type="button" onClick={resetSubjectForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubjectSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Codigo</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={subjectForm.code}
                onChange={(event) => handleSubjectInputChange('code', event.target.value.toUpperCase())}
                placeholder="MAT-101"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Nombre</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={subjectForm.name}
                onChange={(event) => handleSubjectInputChange('name', event.target.value)}
                placeholder="Fundamentos de Programacion"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Nivel</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={subjectForm.levelId || ''}
                onChange={(event) => handleSubjectInputChange('levelId', Number(event.target.value))}
                required
              >
                {!metadata?.levels.length ? <option value="">Sin niveles disponibles</option> : null}
                {metadata?.levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={isSavingSubject || !metadata?.levels.length}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSavingSubject ? 'Guardando...' : editingSubjectId === null ? 'Crear materia' : 'Actualizar materia'}
            </button>
          </form>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-brand-magenta" />
            <h2 className="font-heading text-3xl text-slate-950">Materias registradas</h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Codigo</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Nivel</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{subject.code}</td>
                    <td className="px-4 py-4 text-slate-600">{subject.name}</td>
                    <td className="px-4 py-4 text-slate-600">{subject.levelName}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSubjectEdit(subject)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubjectDelete(subject)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!subjects.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No hay materias registradas todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
        </section>
      ) : null}

      {activeSection === 'periodos' ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">CRUD activo</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">Periodos academicos</h2>
            </div>
            {editingPeriodId !== null ? (
              <button type="button" onClick={resetPeriodForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handlePeriodSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Anio</span>
                <input
                  type="number"
                  min={2024}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={periodForm.year}
                  onChange={(event) => handlePeriodInputChange('year', Number(event.target.value))}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Termino</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={periodForm.termNumber}
                  onChange={(event) => handlePeriodInputChange('termNumber', Number(event.target.value))}
                >
                  <option value={1}>Periodo 1</option>
                  <option value={2}>Periodo 2</option>
                </select>
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Nombre</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={periodForm.name}
                onChange={(event) => handlePeriodInputChange('name', event.target.value)}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Fecha inicio</span>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={periodForm.startDate}
                  onChange={(event) => handlePeriodInputChange('startDate', event.target.value)}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Fecha fin</span>
                <input
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={periodForm.endDate}
                  onChange={(event) => handlePeriodInputChange('endDate', event.target.value)}
                  required
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-magenta focus:ring-brand-magenta"
                checked={periodForm.active}
                onChange={(event) => handlePeriodInputChange('active', event.target.checked)}
              />
              Marcar como periodo activo
            </label>

            <button
              type="submit"
              disabled={isSavingPeriod}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSavingPeriod ? 'Guardando...' : editingPeriodId === null ? 'Crear periodo' : 'Actualizar periodo'}
            </button>
          </form>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center gap-3">
            <CalendarRange className="h-5 w-5 text-brand-magenta" />
            <h2 className="font-heading text-3xl text-slate-950">Periodos registrados</h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Periodo</th>
                  <th className="px-4 py-3 font-semibold">Fechas</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {periods.map((period) => (
                  <tr key={period.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{period.name}</p>
                      <p className="mt-1 text-slate-500">{period.year} · Termino {period.termNumber}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {period.startDate} al {period.endDate}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${period.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {period.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(period)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(period)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!periods.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No hay periodos registrados todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
        </section>
      ) : null}

      {activeSection === 'grupos' ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Catalogo dependiente</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">Grupos academicos</h2>
            </div>
            {editingGroupId !== null ? (
              <button type="button" onClick={resetGroupForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleGroupSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Nombre</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={groupForm.name}
                onChange={(event) => handleGroupInputChange('name', event.target.value)}
                placeholder="Grupo A"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Nivel</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={groupForm.levelId || ''}
                  onChange={(event) => handleGroupInputChange('levelId', Number(event.target.value))}
                  required
                >
                  {!metadata?.levels.length ? <option value="">Sin niveles disponibles</option> : null}
                  {metadata?.levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Tecnica</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={groupForm.techniqueId || ''}
                  onChange={(event) => handleGroupInputChange('techniqueId', Number(event.target.value))}
                  required
                >
                  {!metadata?.techniques.length ? <option value="">Sin tecnicas disponibles</option> : null}
                  {metadata?.techniques.map((technique) => (
                    <option key={technique.id} value={technique.id}>
                      {technique.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSavingGroup || !metadata?.levels.length || !metadata.techniques.length}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSavingGroup ? 'Guardando...' : editingGroupId === null ? 'Crear grupo' : 'Actualizar grupo'}
            </button>
          </form>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-brand-magenta" />
            <h2 className="font-heading text-3xl text-slate-950">Grupos registrados</h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Grupo</th>
                  <th className="px-4 py-3 font-semibold">Nivel</th>
                  <th className="px-4 py-3 font-semibold">Tecnica</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{group.name}</td>
                    <td className="px-4 py-4 text-slate-600">{group.levelName}</td>
                    <td className="px-4 py-4 text-slate-600">{group.techniqueName}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleGroupEdit(group)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGroupDelete(group)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!groups.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No hay grupos registrados todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
        </section>
      ) : null}

      {activeSection === 'tecnicas' ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Catalogo base</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">Tecnicas academicas</h2>
            </div>
            {editingTechniqueId !== null ? (
              <button type="button" onClick={resetTechniqueForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleTechniqueSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Codigo</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={techniqueForm.code}
                onChange={(event) => handleTechniqueInputChange('code', event.target.value.toUpperCase())}
                placeholder="TEC-DES"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Nombre</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={techniqueForm.name}
                onChange={(event) => handleTechniqueInputChange('name', event.target.value)}
                placeholder="Tecnica en Desarrollo de Software"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSavingTechnique}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSavingTechnique ? 'Guardando...' : editingTechniqueId === null ? 'Crear tecnica' : 'Actualizar tecnica'}
            </button>
          </form>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center gap-3">
            <Layers3 className="h-5 w-5 text-brand-magenta" />
            <h2 className="font-heading text-3xl text-slate-950">Tecnicas registradas</h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Codigo</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {techniques.map((technique) => (
                  <tr key={technique.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{technique.code}</td>
                    <td className="px-4 py-4 text-slate-600">{technique.name}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleTechniqueEdit(technique)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTechniqueDelete(technique)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!techniques.length ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No hay tecnicas registradas todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
        </section>
      ) : null}
    </div>
  )
}