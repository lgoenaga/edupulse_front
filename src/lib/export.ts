import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import type {
  CategoryAverage,
  SurveySubmissionRecord,
  TeacherAverage,
  TechniqueAverage,
} from '../types/dashboard'

export async function exportDashboardToPdf(element: HTMLElement, filename: string) {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#f6f2f8',
  })

  const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const image = new Image()

  await new Promise<void>((resolve) => {
    image.onload = () => resolve()
    image.src = dataUrl
  })

  const scale = Math.min(pageWidth / image.width, pageHeight / image.height)
  const scaledWidth = image.width * scale
  const scaledHeight = image.height * scale
  const x = (pageWidth - scaledWidth) / 2
  const y = 24

  pdf.addImage(dataUrl, 'PNG', x, y, scaledWidth, scaledHeight)
  pdf.save(filename)
}

export function exportAggregatesToExcel(
  filename: string,
  categories: CategoryAverage[],
  techniques: TechniqueAverage[],
  teachers: TeacherAverage[],
) {
  const workbook = XLSX.utils.book_new()

  const categorySheet = XLSX.utils.json_to_sheet(categories.map(normalizeAggregate))
  const techniqueSheet = XLSX.utils.json_to_sheet(techniques.map(normalizeAggregate))
  const teacherSheet = XLSX.utils.json_to_sheet(teachers.map(normalizeAggregate))

  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categorias')
  XLSX.utils.book_append_sheet(workbook, techniqueSheet, 'Tecnicas')
  XLSX.utils.book_append_sheet(workbook, teacherSheet, 'Docentes')

  XLSX.writeFile(workbook, filename)
}

export function exportSurveySubmissionsToExcel(filename: string, submissions: SurveySubmissionRecord[]) {
  const workbook = XLSX.utils.book_new()
  const submissionsSheet = XLSX.utils.json_to_sheet(
    submissions.map((submission) => ({
      estudiante: submission.studentName,
      codigo: submission.studentCode,
      correo: submission.studentEmail,
      grupo: submission.groupName,
      nivel: submission.levelName,
      periodo: submission.periodName,
      enviado: formatExportDate(submission.submittedAt),
      respuestas: submission.responseCount,
    })),
  )

  XLSX.utils.book_append_sheet(workbook, submissionsSheet, 'Envios')
  XLSX.writeFile(workbook, filename)
}

function normalizeAggregate(item: CategoryAverage | TechniqueAverage | TeacherAverage) {
  return {
    id: item.id,
    label: item.label,
    average: item.average,
    totalResponses: item.totalResponses,
  }
}

function formatExportDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}