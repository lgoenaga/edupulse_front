import type { CategoryAverage, SelectOption, TeacherAverage, TechniqueAverage } from '../types/dashboard'

export const levels: SelectOption[] = [
  { id: 1, label: 'Nivel 1' },
  { id: 2, label: 'Nivel 2' },
  { id: 3, label: 'Nivel 3' },
]

export const groups: SelectOption[] = [
  { id: 1, label: 'Grupo A' },
  { id: 2, label: 'Grupo B' },
]

export const periods: SelectOption[] = [
  { id: 1, label: 'Periodo 1 2026' },
  { id: 2, label: 'Periodo 2 2026' },
]

export const techniques: SelectOption[] = [
  { id: 1, label: 'Tecnica en Desarrollo de Software' },
  { id: 2, label: 'Tecnica en Analitica de Datos' },
]

export const teachers: SelectOption[] = [
  { id: 1, label: 'Luisa Restrepo' },
  { id: 2, label: 'Carlos Mejia' },
  { id: 3, label: 'Paola Quintero' },
]

export const categoryAverages: CategoryAverage[] = [
  { id: null, label: 'INSTITUCION', average: 4.6, totalResponses: 132 },
  { id: null, label: 'TECNICA', average: 4.4, totalResponses: 132 },
  { id: null, label: 'DOCENTE', average: 4.7, totalResponses: 396 },
]

export const techniqueAverages: TechniqueAverage[] = [
  { id: 1, label: 'Tecnica en Desarrollo de Software', average: 4.55, totalResponses: 220 },
  { id: 2, label: 'Tecnica en Analitica de Datos', average: 4.2, totalResponses: 176 },
]

export const teacherAverages: TeacherAverage[] = [
  { id: 1, label: 'Luisa Restrepo', average: 4.8, totalResponses: 132 },
  { id: 2, label: 'Carlos Mejia', average: 4.5, totalResponses: 132 },
  { id: 3, label: 'Paola Quintero', average: 4.7, totalResponses: 132 },
]

export const studentContext = {
  periodLabel: 'Periodo 1 2026',
  studentName: 'Laura Gomez',
  groupName: 'Grupo A',
  techniqueName: 'Tecnica en Desarrollo de Software',
  questions: [
    { id: 1, prompt: 'La infraestructura institucional favorece el aprendizaje', category: 'INSTITUCION' },
    { id: 2, prompt: 'Los recursos tecnologicos de la institucion son pertinentes', category: 'INSTITUCION' },
    { id: 3, prompt: 'La tecnica responde a las necesidades del mercado laboral', category: 'TECNICA' },
    { id: 4, prompt: 'Los contenidos de la tecnica son claros y actualizados', category: 'TECNICA' },
    { id: 5, prompt: 'El docente comunica con claridad los temas de la materia', category: 'DOCENTE' },
    { id: 6, prompt: 'El docente promueve un ambiente respetuoso y participativo', category: 'DOCENTE' },
  ],
  assignments: [
    { teacherId: 1, teacherName: 'Luisa Restrepo', subjectId: 1, subjectName: 'Fundamentos de Programacion' },
    { teacherId: 2, teacherName: 'Carlos Mejia', subjectId: 2, subjectName: 'Bases de Datos I' },
    { teacherId: 3, teacherName: 'Paola Quintero', subjectId: 3, subjectName: 'Arquitectura de Software' },
  ],
}

export function filterDashboard() {
  return {
    filteredCategories: categoryAverages,
    filteredTechniques: techniqueAverages,
    filteredTeachers: teacherAverages,
    responseCount: categoryAverages.reduce((accumulator, item) => accumulator + item.totalResponses, 0),
    overallAverage: categoryAverages.length
      ? Number((categoryAverages.reduce((accumulator, item) => accumulator + item.average, 0) / categoryAverages.length).toFixed(2))
      : 0,
  }
}