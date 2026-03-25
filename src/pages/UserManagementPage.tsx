import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, apiRequest } from '../lib/api'
import type { CatalogMetadata, Student, StudentPayload, Teacher, TeacherPayload } from '../types/dashboard'

type UserSectionKey = 'estudiantes' | 'docentes'

const userSections: Array<{
  key: UserSectionKey
  title: string
  description: string
}> = [
  {
    key: 'estudiantes',
    title: 'Estudiantes',
    description: 'Administra estudiantes, acceso a plataforma y asignacion a grupos academicos.',
  },
  {
    key: 'docentes',
    title: 'Docentes',
    description: 'Gestiona el equipo docente responsable de la carga academica y las encuestas.',
  },
]

const defaultUserSection: UserSectionKey = 'estudiantes'

const isUserSectionKey = (value: string | undefined): value is UserSectionKey => userSections.some((section) => section.key === value)

const getUserSectionSummary = (section: UserSectionKey, values: { students: Student[]; teachers: Teacher[] }) => {
  switch (section) {
    case 'estudiantes':
      return { count: values.students.length, label: 'estudiantes registrados' }
    case 'docentes':
      return { count: values.teachers.length, label: 'docentes registrados' }
  }
}

export function UserManagementPage() {
  const navigate = useNavigate()
  const { gestion } = useParams<{ gestion?: string }>()
  const [metadata, setMetadata] = useState<CatalogMetadata | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  const [isSavingTeacher, setIsSavingTeacher] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null)
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [studentForm, setStudentForm] = useState<StudentPayload>({
    studentCode: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    groupId: 0,
    active: true,
  })
  const [teacherForm, setTeacherForm] = useState<TeacherPayload>({
    documentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
  })
  const activeSection = isUserSectionKey(gestion) ? gestion : defaultUserSection
  const activeSectionConfig = userSections.find((section) => section.key === activeSection) ?? userSections[0]
  const activeSectionSummary = getUserSectionSummary(activeSection, { students, teachers })

  useEffect(() => {
    if (gestion === activeSection) {
      return
    }

    navigate(`/app/admin/usuarios/${activeSection}`, { replace: true })
  }, [activeSection, gestion, navigate])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [metadataResponse, studentsResponse, teachersResponse] = await Promise.all([
          apiRequest<CatalogMetadata>('/admin/catalog/metadata'),
          apiRequest<Student[]>('/admin/students'),
          apiRequest<Teacher[]>('/admin/teachers'),
        ])

        if (isMounted) {
          setMetadata(metadataResponse)
          setStudents(studentsResponse)
          setTeachers(teachersResponse)
          setStudentForm((current) => hydrateStudentForm(current, metadataResponse))
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar la gestion de usuarios')
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const hydrateStudentForm = (form: StudentPayload, catalogMetadata: CatalogMetadata) => ({
    ...form,
    groupId: form.groupId || catalogMetadata.groups[0]?.id || 0,
  })

  const resetStudentForm = () => {
    setEditingStudentId(null)
    setStudentForm(
      metadata
        ? hydrateStudentForm(
            {
              studentCode: '',
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              groupId: 0,
              active: true,
            },
            metadata,
          )
        : {
            studentCode: '',
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            groupId: 0,
            active: true,
          },
    )
  }

  const resetTeacherForm = () => {
    setEditingTeacherId(null)
    setTeacherForm({
      documentNumber: '',
      firstName: '',
      lastName: '',
      email: '',
    })
  }

  const refreshUserData = async () => {
    const [metadataResponse, studentsResponse, teachersResponse] = await Promise.all([
      apiRequest<CatalogMetadata>('/admin/catalog/metadata'),
      apiRequest<Student[]>('/admin/students'),
      apiRequest<Teacher[]>('/admin/teachers'),
    ])

    setMetadata(metadataResponse)
    setStudents(studentsResponse)
    setTeachers(teachersResponse)
    if (editingStudentId === null) {
      setStudentForm((current) => hydrateStudentForm(current, metadataResponse))
    }
  }

  const handleStudentInputChange = <K extends keyof StudentPayload>(key: K, value: StudentPayload[K]) => {
    setStudentForm((current) => ({ ...current, [key]: value }))
  }

  const handleTeacherInputChange = <K extends keyof TeacherPayload>(key: K, value: TeacherPayload[K]) => {
    setTeacherForm((current) => ({ ...current, [key]: value }))
  }

  const handleStudentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingStudent(true)

    try {
      if (editingStudentId === null) {
        await apiRequest<Student>('/admin/students', {
          method: 'POST',
          body: studentForm,
        })
        setSuccess('Estudiante creado correctamente.')
      } else {
        await apiRequest<Student>(`/admin/students/${editingStudentId}`, {
          method: 'PUT',
          body: studentForm,
        })
        setSuccess('Estudiante actualizado correctamente.')
      }

      await refreshUserData()
      resetStudentForm()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible guardar el estudiante')
    } finally {
      setIsSavingStudent(false)
    }
  }

  const handleTeacherSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSavingTeacher(true)

    try {
      if (editingTeacherId === null) {
        await apiRequest<Teacher>('/admin/teachers', {
          method: 'POST',
          body: teacherForm,
        })
        setSuccess('Docente creado correctamente.')
      } else {
        await apiRequest<Teacher>(`/admin/teachers/${editingTeacherId}`, {
          method: 'PUT',
          body: teacherForm,
        })
        setSuccess('Docente actualizado correctamente.')
      }

      await refreshUserData()
      resetTeacherForm()
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible guardar el docente')
    } finally {
      setIsSavingTeacher(false)
    }
  }

  const handleStudentEdit = (student: Student) => {
    setEditingStudentId(student.id)
    setSuccess('')
    setError('')
    setStudentForm({
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      password: '',
      groupId: student.groupId,
      active: student.active,
    })
  }

  const handleTeacherEdit = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id)
    setSuccess('')
    setError('')
    setTeacherForm({
      documentNumber: teacher.documentNumber,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
    })
  }

  const handleStudentDelete = async (student: Student) => {
    if (!window.confirm(`Eliminar el estudiante "${student.fullName}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiRequest(`/admin/students/${student.id}`, { method: 'DELETE' })
      await refreshUserData()
      if (editingStudentId === student.id) {
        resetStudentForm()
      }
      setSuccess('Estudiante eliminado correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible eliminar el estudiante')
    }
  }

  const handleTeacherDelete = async (teacher: Teacher) => {
    if (!window.confirm(`Eliminar el docente "${teacher.fullName}"?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await apiRequest(`/admin/teachers/${teacher.id}`, { method: 'DELETE' })
      await refreshUserData()
      if (editingTeacherId === teacher.id) {
        resetTeacherForm()
      }
      setSuccess('Docente eliminado correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible eliminar el docente')
    }
  }

  const handleSectionChange = (section: UserSectionKey) => {
    if (section === activeSection) {
      return
    }

    navigate(`/app/admin/usuarios/${section}`)
  }

  return (
    <div className="space-y-6">
      <header className="rounded-4xl border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-magenta">Modulo administrativo</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-950">Gestion de usuarios</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Esta vista concentra la administracion de personas con acceso o participacion en la plataforma, separando estudiantes y docentes del flujo academico.
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
            <Users className="h-5 w-5" />
            <span className="text-sm font-semibold text-white">Gestion activa: {activeSectionConfig.title}</span>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Gestiones de usuarios">
          {userSections.map(({ key, title }) => {
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
                <Users className="h-4 w-4" />
                {title}
              </button>
            )
          })}
        </nav>
      </section>

      {activeSection === 'estudiantes' ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Comunidad academica</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">Estudiantes</h2>
            </div>
            {editingStudentId !== null ? (
              <button type="button" onClick={resetStudentForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleStudentSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Codigo</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={studentForm.studentCode}
                onChange={(event) => handleStudentInputChange('studentCode', event.target.value.toUpperCase())}
                placeholder="EST-002"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Nombres</span>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={studentForm.firstName}
                  onChange={(event) => handleStudentInputChange('firstName', event.target.value)}
                  placeholder="Laura"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Apellidos</span>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={studentForm.lastName}
                  onChange={(event) => handleStudentInputChange('lastName', event.target.value)}
                  placeholder="Gomez"
                  required
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Correo</span>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={studentForm.email}
                onChange={(event) => handleStudentInputChange('email', event.target.value)}
                placeholder="laura.gomez@cesde.edu.co"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Contrasena temporal</span>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={studentForm.password}
                  onChange={(event) => handleStudentInputChange('password', event.target.value)}
                  placeholder={editingStudentId === null ? 'Minimo requerido para acceso inicial' : 'Dejar vacio para conservar'}
                  required={editingStudentId === null}
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Grupo</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={studentForm.groupId || ''}
                  onChange={(event) => handleStudentInputChange('groupId', Number(event.target.value))}
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
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-magenta focus:ring-brand-magenta"
                checked={studentForm.active}
                onChange={(event) => handleStudentInputChange('active', event.target.checked)}
              />
              Habilitar acceso del estudiante
            </label>

            <button
              type="submit"
              disabled={isSavingStudent || !metadata?.groups.length}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSavingStudent ? 'Guardando...' : editingStudentId === null ? 'Crear estudiante' : 'Actualizar estudiante'}
            </button>
          </form>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-brand-magenta" />
            <h2 className="font-heading text-3xl text-slate-950">Estudiantes registrados</h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Estudiante</th>
                  <th className="px-4 py-3 font-semibold">Codigo</th>
                  <th className="px-4 py-3 font-semibold">Grupo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{student.fullName}</p>
                      <p className="mt-1 text-slate-500">{student.email}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{student.studentCode}</td>
                    <td className="px-4 py-4 text-slate-600">{student.groupName}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {student.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleStudentEdit(student)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStudentDelete(student)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!students.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No hay estudiantes registrados todavia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
        </section>
      ) : null}

      {activeSection === 'docentes' ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">Talento humano</p>
              <h2 className="mt-2 font-heading text-3xl text-slate-950">Docentes</h2>
            </div>
            {editingTeacherId !== null ? (
              <button type="button" onClick={resetTeacherForm} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleTeacherSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Documento</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={teacherForm.documentNumber}
                onChange={(event) => handleTeacherInputChange('documentNumber', event.target.value)}
                placeholder="9001004"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Nombres</span>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={teacherForm.firstName}
                  onChange={(event) => handleTeacherInputChange('firstName', event.target.value)}
                  placeholder="Andrea"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Apellidos</span>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                  value={teacherForm.lastName}
                  onChange={(event) => handleTeacherInputChange('lastName', event.target.value)}
                  placeholder="Ramirez"
                  required
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Correo</span>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10"
                value={teacherForm.email}
                onChange={(event) => handleTeacherInputChange('email', event.target.value)}
                placeholder="andrea.ramirez@cesde.edu.co"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSavingTeacher}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              {isSavingTeacher ? 'Guardando...' : editingTeacherId === null ? 'Crear docente' : 'Actualizar docente'}
            </button>
          </form>
        </article>

        <article className="rounded-4xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-brand-magenta" />
            <h2 className="font-heading text-3xl text-slate-950">Docentes registrados</h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Docente</th>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                  <th className="px-4 py-3 font-semibold">Correo</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="px-4 py-4 font-semibold text-slate-900">{teacher.fullName}</td>
                    <td className="px-4 py-4 text-slate-600">{teacher.documentNumber}</td>
                    <td className="px-4 py-4 text-slate-600">{teacher.email}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleTeacherEdit(teacher)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTeacherDelete(teacher)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!teachers.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No hay docentes registrados todavia.
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