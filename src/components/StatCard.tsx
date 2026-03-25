type StatCardProps = {
  label: string
  value: string
  helper: string
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_50px_rgba(102,39,90,0.1)] backdrop-blur">
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 font-heading text-4xl text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </article>
  )
}