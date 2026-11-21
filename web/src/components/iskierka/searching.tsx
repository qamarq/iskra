import { Iskierka } from "./iskierka"

export function IskierkiSearching({ label = "Iskierki przeszukują radar…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-12">
      <div className="isk-march flex items-end gap-6">
        <span className="isk-step"><Iskierka color="mint" pose="lupa" size={70} /></span>
        <span className="isk-step [animation-delay:.15s]"><Iskierka color="ember" pose="lupa" size={86} /></span>
        <span className="isk-step [animation-delay:.3s]"><Iskierka color="lilac" pose="lupa" size={70} /></span>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  )
}
