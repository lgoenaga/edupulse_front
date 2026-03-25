import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Send, Sparkles } from 'lucide-react'
import { ApiError, apiRequest } from '../lib/api'
import type { StudentContext, SurveyAnswerPayload } from '../types/dashboard'

type Answers = Record<string, number>

export function StudentSurveyPage() {
  const [answers, setAnswers] = useState<Answers>({})
  const [context, setContext] = useState<StudentContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadContext = async () => {
      setIsLoading(true)

      try {
        const response = await apiRequest<StudentContext>('/student/context')
        if (isMounted) {
          setContext(response)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible cargar la encuesta')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadContext()

    return () => {
      isMounted = false
    }
  }, [])

  const institutionAndTechniqueQuestions = useMemo(
    () => context?.questions.filter((question) => question.category !== 'DOCENTE') ?? [],
    [context],
  )

  const teacherQuestions = useMemo(
    () => context?.questions.filter((question) => question.category === 'DOCENTE') ?? [],
    [context],
  )

  const updateAnswer = (key: string, score: number) => {
    setAnswers((current) => ({ ...current, [key]: score }))
  }

  const buildSubmissionPayload = (): SurveyAnswerPayload[] => {
    if (!context) {
      return []
    }

    const generalResponses = institutionAndTechniqueQuestions.map((question) => ({
      questionId: question.id,
      score: answers[`question-${question.id}`],
    }))

    const teacherResponses = teacherQuestions.flatMap((question) =>
      context.teacherAssignments.map((assignment) => ({
        questionId: question.id,
        score: answers[`question-${question.id}-teacher-${assignment.teacherId}-subject-${assignment.subjectId}`],
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
      })),
    )

    return [...generalResponses, ...teacherResponses].filter(
      (response): response is SurveyAnswerPayload => Number.isInteger(response.score),
    )
  }

  const expectedResponseCount = institutionAndTechniqueQuestions.length + (teacherQuestions.length * (context?.teacherAssignments.length ?? 0))

  const handleSubmit = async () => {
    const responses = buildSubmissionPayload()
    setError('')
    setSuccess('')

    if (responses.length !== expectedResponseCount) {
      setError('Debes responder todas las preguntas antes de enviar la encuesta.')
      return
    }

    setIsSubmitting(true)

    try {
      await apiRequest('/student/surveys', {
        method: 'POST',
        body: { responses },
      })
      setSuccess('La encuesta fue enviada correctamente.')
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No fue posible enviar la encuesta')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <p className="rounded-3xl bg-white/85 px-4 py-4 text-sm text-slate-600">Cargando contexto de la encuesta vigente...</p>
  }

  if (!context) {
    return <p className="rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{error || 'No existe contexto disponible para la encuesta.'}</p>
  }

  return (
    <div className="space-y-6">
      <header className="rounded-4xl border border-white/70 bg-[linear-gradient(140deg,rgba(255,255,255,0.88),rgba(248,208,224,0.48),rgba(235,229,235,0.58))] p-6 shadow-[0_20px_60px_rgba(104,35,84,0.1)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-magenta">Rol estudiante</p>
        <h1 className="mt-3 font-heading text-4xl text-slate-950">Encuesta vigente del periodo activo</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          El estudiante solo responde la encuesta actual. No se expone historico en esta fase. La estructura refleja categorias institucionales, tecnicas y docentes con el contexto de carga academica.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Estudiante</p>
            <p className="mt-2 font-heading text-2xl text-slate-950">{context.studentName}</p>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Grupo</p>
            <p className="mt-2 font-heading text-2xl text-slate-950">{context.groupName}</p>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Periodo</p>
            <p className="mt-2 font-heading text-2xl text-slate-950">{context.activePeriodName}</p>
          </div>
        </div>
      </header>

      <section className="rounded-4xl border border-white/70 bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
        <div className="flex items-center gap-3 text-brand-soft-pink">
          <Sparkles className="h-5 w-5" />
          <h2 className="font-heading text-2xl">Carga academica visible</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {context.teacherAssignments.map((assignment) => (
            <div key={`${assignment.teacherId}-${assignment.subjectId}`} className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="font-semibold text-white">{assignment.teacherName}</p>
              <p className="mt-2 text-sm text-white/70">{assignment.subjectName}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {institutionAndTechniqueQuestions.map((question) => {
          const questionKey = `question-${question.id}`
          return (
            <article key={question.id} className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(104,35,84,0.1)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">{question.category}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{question.prompt}</h3>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => updateAnswer(questionKey, score)}
                      className={`h-11 w-11 rounded-2xl border text-sm font-bold transition ${
                        answers[questionKey] === score
                          ? 'border-brand-magenta bg-brand-magenta text-white shadow-[0_16px_30px_rgba(190,24,93,0.28)]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-magenta hover:text-brand-magenta'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {teacherQuestions.length ? (
        <section className="space-y-4">
          {context.teacherAssignments.map((assignment) => (
            <article key={`${assignment.teacherId}-${assignment.subjectId}`} className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(104,35,84,0.1)]">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-magenta">DOCENTE</p>
                <h2 className="mt-2 font-heading text-2xl text-slate-950">{assignment.teacherName}</h2>
                <p className="mt-1 text-sm text-slate-600">{assignment.subjectName}</p>
              </div>
              <div className="space-y-4">
                {teacherQuestions.map((question) => {
                  const key = `question-${question.id}-teacher-${assignment.teacherId}-subject-${assignment.subjectId}`
                  return (
                    <div key={key} className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-sm font-semibold text-slate-900">{question.prompt}</p>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => updateAnswer(key, score)}
                              className={`h-11 w-11 rounded-2xl border text-sm font-bold transition ${
                                answers[key] === score
                                  ? 'border-brand-magenta bg-brand-magenta text-white shadow-[0_16px_30px_rgba(190,24,93,0.28)]'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-magenta hover:text-brand-magenta'
                              }`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {error ? <p className="rounded-3xl bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-3xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700">{success}</p> : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSubmitting ? 'Enviando encuesta...' : 'Enviar encuesta'}
        </button>
      </div>
    </div>
  )
}