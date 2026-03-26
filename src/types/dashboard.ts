export type SelectOption = {
  id: number
  label: string
}

export type AggregateAverage = {
  id: number | null
  label: string
  average: number
  totalResponses: number
}

export type CategoryAverage = AggregateAverage

export type TechniqueAverage = AggregateAverage

export type TeacherAverage = AggregateAverage

export type DashboardStatistics = {
  totalResponses: number
  categoryAverages: CategoryAverage[]
  techniqueAverages: TechniqueAverage[]
  teacherAverages: TeacherAverage[]
}

export type CatalogMetadata = {
  levels: SelectOption[]
  groups: SelectOption[]
  periods: SelectOption[]
  techniques: SelectOption[]
  teachers: SelectOption[]
}

export type AcademicLevel = {
  id: number
  name: string
  displayOrder: number
}

export type AcademicLevelPayload = {
  name: string
  displayOrder: number
}

export type AcademicGroup = {
  id: number
  name: string
  levelId: number
  levelName: string
  techniqueId: number
  techniqueName: string
}

export type AcademicGroupPayload = {
  name: string
  levelId: number
  techniqueId: number
}

export type AcademicSubject = {
  id: number
  code: string
  name: string
  levelId: number
  levelName: string
}

export type AcademicSubjectPayload = {
  code: string
  name: string
  levelId: number
}

export type AcademicLoad = {
  id: number
  teacherId: number
  teacherName: string
  subjectId: number
  subjectName: string
  groupId: number
  groupName: string
  periodId: number
  periodName: string
  active: boolean
}

export type AcademicLoadPayload = {
  teacherId: number
  subjectId: number
  groupId: number
  periodId: number
  active: boolean
}

export type Teacher = {
  id: number
  documentNumber: string
  firstName: string
  lastName: string
  email: string
  fullName: string
}

export type TeacherPayload = {
  documentNumber: string
  firstName: string
  lastName: string
  email: string
}

export type Student = {
  id: number
  studentCode: string
  firstName: string
  lastName: string
  email: string
  fullName: string
  groupId: number
  groupName: string
  active: boolean
}

export type StudentPayload = {
  studentCode: string
  firstName: string
  lastName: string
  email: string
  password: string
  groupId: number
  active: boolean
}

export type AcademicPeriod = {
  id: number
  year: number
  termNumber: number
  name: string
  startDate: string
  endDate: string
  active: boolean
}

export type AcademicPeriodPayload = {
  year: number
  termNumber: number
  name: string
  startDate: string
  endDate: string
  active: boolean
}

export type Technique = {
  id: number
  code: string
  name: string
}

export type TechniquePayload = {
  code: string
  name: string
}

export type DashboardFilters = {
  levelId: string
  groupId: string
  periodId: string
  techniqueId: string
  teacherId: string
}

export type StudentQuestion = {
  id: number
  prompt: string
  category: string
  displayOrder: number
}

export type TeacherAssignment = {
  teacherId: number
  teacherName: string
  subjectId: number
  subjectName: string
}

export type StudentContext = {
  activePeriodId: number
  activePeriodName: string
  studentName: string
  groupName: string
  techniqueName: string
  hasSubmitted: boolean
  submittedAt: string | null
  questions: StudentQuestion[]
  teacherAssignments: TeacherAssignment[]
}

export type SurveySubmissionRecord = {
  id: number
  studentId: number
  studentCode: string
  studentName: string
  studentEmail: string
  groupId: number
  groupName: string
  levelId: number
  levelName: string
  periodId: number
  periodName: string
  submittedAt: string
  responseCount: number
}

export type SurveyResponseDetail = {
  questionId: number
  prompt: string
  category: string
  score: number
  teacherName: string | null
  subjectName: string | null
}

export type SurveySubmissionDetail = {
  id: number
  studentId: number
  studentCode: string
  studentName: string
  studentEmail: string
  groupName: string
  levelName: string
  techniqueName: string
  periodName: string
  submittedAt: string
  responses: SurveyResponseDetail[]
}

export type SurveySubmissionFilters = {
  levelId: string
  groupId: string
  periodId: string
  studentId: string
  submittedFromDate: string
  submittedToDate: string
}

export type SurveyAnswerPayload = {
  questionId: number
  score: number
  teacherId?: number
  subjectId?: number
}

export type AuthResponse = {
  token: string
  role: 'ADMIN' | 'ESTUDIANTE'
  fullName: string
}