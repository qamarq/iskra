import { Search } from "lucide-react"

export function SearchBox({ defaultValue, hidden, large }: { defaultValue?: string; hidden?: Record<string, string | undefined>; large?: boolean }) {
  return (
    <form action="/innowacje" className="flex gap-2">
      <div className="relative flex-1">
        <Search className={"pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground " + (large ? "size-5" : "size-4")} />
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder="Opisz, czego szukasz, np. „jak skrócić kolejki w urzędzie” albo „czujniki jakości powietrza dla szkół”"
          className={
            "w-full rounded-2xl border border-input bg-card pr-4 outline-none focus:border-ring " + (large ? "h-14 pl-12 text-base shadow-sm" : "h-11 pl-10 text-sm")
          }
        />
      </div>
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <button className={"rounded-2xl bg-secondary px-5 font-medium text-secondary-foreground " + (large ? "h-14" : "h-11 text-sm")}>Szukaj</button>
    </form>
  )
}
