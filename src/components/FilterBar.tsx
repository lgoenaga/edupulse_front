import type { DashboardFilters, SelectOption } from '../types/dashboard'

type FilterBarProps = {
  filters: DashboardFilters
  levels: SelectOption[]
  groups: SelectOption[]
  periods: SelectOption[]
  techniques: SelectOption[]
  teachers: SelectOption[]
  onChange: (name: keyof DashboardFilters, value: string) => void
}

const selectBase =
  'rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-magenta focus:ring-4 focus:ring-brand-magenta/10'

export function FilterBar({ filters, levels, groups, periods, techniques, teachers, onChange }: FilterBarProps) {
  return (
    <section className="grid gap-3 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_40px_rgba(102,39,90,0.1)] backdrop-blur md:grid-cols-5">
      <select aria-label="Filtrar por nivel" title="Filtrar por nivel" className={selectBase} value={filters.levelId} onChange={(event) => onChange('levelId', event.target.value)}>
        <option value="all">Todos los niveles</option>
        {levels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <select aria-label="Filtrar por grupo" title="Filtrar por grupo" className={selectBase} value={filters.groupId} onChange={(event) => onChange('groupId', event.target.value)}>
        <option value="all">Todos los grupos</option>
        {groups.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <select aria-label="Filtrar por periodo" title="Filtrar por periodo" className={selectBase} value={filters.periodId} onChange={(event) => onChange('periodId', event.target.value)}>
        <option value="all">Todos los periodos</option>
        {periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <select aria-label="Filtrar por tecnica" title="Filtrar por tecnica" className={selectBase} value={filters.techniqueId} onChange={(event) => onChange('techniqueId', event.target.value)}>
        <option value="all">Todas las tecnicas</option>
        {techniques.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <select aria-label="Filtrar por docente" title="Filtrar por docente" className={selectBase} value={filters.teacherId} onChange={(event) => onChange('teacherId', event.target.value)}>
        <option value="all">Todos los docentes</option>
        {teachers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </section>
  )
}