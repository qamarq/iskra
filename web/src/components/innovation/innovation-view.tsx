import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { ArrowUpRight, Quote } from "lucide-react"
import Link from "next/link"
import type { FactStatus } from "@/lib/card"
import { CRITERIA_INFO } from "@/lib/criteria"
import {
  AREA_LABEL,
  CHARACTER_LABEL,
  EVENT_LABEL,
  EVIDENCE_LABEL,
  INSTITUTION_TYPE_LABEL,
  PARTNER_KIND_LABEL,
  RECOMMENDATION_LABEL,
  SOURCE_LABEL,
  STAGE_LABEL,
  TARGET_GROUP_SHORT,
  credibilityLabel,
} from "@/lib/labels"
import type { InnovationDetail } from "@/server/queries"
import { CompareToggle } from "../compare"
import { FactBadge } from "../fact-badge"
import { ScoreRing } from "../score-ring"
import { StatusBadge } from "../status-badge"
import { CriterionOverride } from "./criterion-override"
import { StatusControl } from "./status-control"

const NOVELTY_LABEL = { instytucja: "nowość dla instytucji", polska: "nowość w Polsce", swiat: "nowość światowa" } as const

export function InnovationView({ data }: { data: InnovationDetail }) {
  const card = data.card
  const rec = data.recommendation
  const v = card.verification
  const novelty = [card.novelty.value.scope ? NOVELTY_LABEL[card.novelty.value.scope] : null, card.novelty.value.description].filter(Boolean).join(": ") || null

  return (
    <article className="space-y-8">
      <header className="grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div className="min-w-0 space-y-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{data.institution?.name ?? card.institution.name}</span>
            {data.institution ? " · " + INSTITUTION_TYPE_LABEL[data.institution.type] : null}
            {card.institution.location ? " · " + card.institution.location : null}
          </p>
          <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight md:text-4xl">{data.title}</h1>
          <p className="max-w-3xl text-base text-muted-foreground">{data.summary}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Pill strong>{AREA_LABEL[data.area]}</Pill>
            <Pill>{CHARACTER_LABEL[data.character]}</Pill>
            <Pill>{STAGE_LABEL[data.level]}</Pill>
            {data.trl ? <Pill>TRL {data.trl}</Pill> : null}
            <Pill>{card.domain}</Pill>
            <StatusBadge status={data.status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <StatusControl innovationId={data.id} status={data.status} />
            <CompareToggle slug={data.slug} />
          </div>
        </div>
        <div className="flex gap-4 md:flex-col">
          <Gauge label="Potencjał" score={data.potential} hint="poziom wdrożenia, TRL, innowacyjność, zastosowanie" />
          <Gauge label="Wiarygodność" score={data.credibility} hint={credibilityLabel(data.credibility)} />
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <Section
            title="Karta innowacji"
            description="„Potwierdzone” = cytat odnaleziony w źródle. „Szacunek” = wniosek modelu bez potwierdzenia w tekście."
          >
            <dl className="divide-y divide-border">
              <Field label="Problem" value={card.problem.value} quote={card.problem.quote} status={v.problem} />
              <Field label="Rozwiązanie" value={card.solution.value} quote={card.solution.quote} status={v.solution} />
              <Field label="Użytkownicy" value={card.users.value} quote={card.users.quote} status={v.users} />
              <Field
                label="Status wdrożenia"
                value={STAGE_LABEL[card.implementation.value.level] + (card.implementation.value.since ? " (" + card.implementation.value.since + ")" : "")}
                quote={card.implementation.quote}
                status={v.implementation}
              />
              {data.area === "technologiczna" ? <Field label="Gotowość (TRL)" value={card.trl.value ? "TRL " + card.trl.value : null} quote={card.trl.quote} status={v.trl} /> : null}
              <Field label="Nowość" value={novelty} quote={card.novelty.quote} status={v.novelty} />
              <Field label="Efekty" value={card.results.value} quote={card.results.quote} status={v.results} />
              <Field label="Własność intelektualna" value={card.ip.value} quote={card.ip.quote} status={v.ip} />
              <Field label="Twórcy" value={card.creators.length ? card.creators.map((c) => (c.name ? c.name + " (" + c.role + ")" : c.role)).join(", ") : null} />
              <Field label="Dla kogo" value={card.targetGroups.map((g) => TARGET_GROUP_SHORT[g]).join(", ") || null} />
            </dl>
            {card.evidence.length ? (
              <div className="mt-5">
                <p className="text-sm font-medium">Dowody i dokumentacja</p>
                <ul className="mt-2 space-y-2">
                  {card.evidence.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <FactBadge status={card.evidenceVerified[i] ? "potwierdzone" : "szacunek"} />
                      <span>
                        <b>{EVIDENCE_LABEL[e.kind]}:</b> {e.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {card.missing.length ? (
              <div className="mt-5 rounded-xl bg-muted/70 p-4">
                <p className="text-sm font-medium">Czego brakuje w źródłach</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {card.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Section>

          <Section
            title="Ocena potencjału"
            description="Poziom wdrożenia i TRL wynikają wprost z karty. Innowacyjność i potencjał zastosowania ocenia model; analityk może je poprawić."
            action={
              <Link href="/kryteria" className="text-sm font-medium text-primary hover:underline">
                Metodologia
              </Link>
            }
          >
            <ul className="space-y-5">
              {CRITERIA_INFO.map((c) => {
                const e = data.evaluations[c.id]
                if (!e && c.id === "dojrzalosc_technologiczna") return null
                return (
                  <li key={c.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium">
                        {c.label}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          waga {Math.round(c.weight * 100)}% · {c.method === "karta" ? "z karty" : "ocena modelu"}
                        </span>
                      </p>
                      <p className="font-heading text-lg font-semibold tabular-nums">{e ? e.score : "–"}/5</p>
                    </div>
                    <div className="mt-1.5 flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={"h-2 flex-1 rounded-full " + (e && n <= e.score ? "bg-primary" : "bg-muted")} />
                      ))}
                    </div>
                    {e ? (
                      <div className="mt-2 space-y-1.5 text-sm">
                        <p className="text-muted-foreground">{e.rationale}</p>
                        {e.evidence ? (
                          <p className="flex gap-1.5 text-xs text-ink-soft italic">
                            <Quote className="size-3.5 shrink-0" />
                            {e.evidence}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>{e.author === "analityk" ? "Ocena analityka" : e.author === "karta" ? "Wynika z karty" : "Ocena modelu"}</span>
                          {c.method === "model" ? <CriterionOverride innovationId={data.id} criterion={c.id} current={e.score} /> : null}
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </Section>

          {data.credibilityDetail ? (
            <Section title="Wiarygodność" description="Liczona z danych, nie przez model: na ile informacje są potwierdzone i skąd pochodzą.">
              <ul className="space-y-3">
                {data.credibilityDetail.parts.map((p) => (
                  <li key={p.id} className="text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">
                        {p.label} <span className="text-xs font-normal text-muted-foreground">waga {Math.round(p.weight * 100)}%</span>
                      </span>
                      <span className="tabular-nums">{Math.round(p.value * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-chart-4" style={{ width: p.value * 100 + "%" }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.detail}</p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section title="Historia">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {data.events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{EVENT_LABEL[ev.kind]}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(ev.at, "d MMMM yyyy, HH:mm", { locale: pl })} · {ev.author}
                    {ev.note ? " · " + ev.note : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <aside className="space-y-8">
          {rec ? (
            <section className="rounded-3xl bg-secondary p-6 text-secondary-foreground">
              <p className="text-xs font-semibold tracking-[0.14em] text-glow uppercase">Rekomendacja</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">{RECOMMENDATION_LABEL[rec.primary]}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-white/80">
                {rec.reasons.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
              <p className="mt-5 text-sm font-medium">Co dalej</p>
              <ol className="mt-2 space-y-2 text-sm text-white/85">
                {rec.nextSteps.map((s, i) => (
                  <li key={s} className="flex gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <Section title="Gdzie można zastosować" description="Szacunek modelu i podmioty z bazy, które mogą skorzystać z rozwiązania.">
            {card.applications.length ? (
              <ul className="space-y-2.5">
                {card.applications.map((a) => (
                  <li key={a.where} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{a.where}</p>
                      <FactBadge status="szacunek" />
                    </div>
                    <p className="text-muted-foreground">{a.why}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {data.matches.length ? (
              <>
                <p className="mt-5 mb-2 text-sm font-medium">Przykładowi odbiorcy</p>
                <ul className="space-y-3">
                  {data.matches.map(({ match, partner }) => (
                    <li key={match.id} className="rounded-2xl border border-border p-3.5 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium leading-snug">{partner.name}</p>
                          <p className="text-xs text-muted-foreground">{PARTNER_KIND_LABEL[partner.kind]}</p>
                        </div>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground tabular-nums">{Math.round(match.score * 100)}%</span>
                      </div>
                      <p className="mt-1.5 text-muted-foreground">{match.reason}</p>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Section>

          <Section title="Podobne rozwiązania i publikacje" description="Sprawdzenie, czy ktoś nie rozwiązał już tego problemu.">
            {data.priorArt.length ? (
              <ul className="space-y-3">
                {data.priorArt.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      {p.url ? (
                        <a href={p.url} target={p.source === "iskra" ? undefined : "_blank"} rel="noreferrer" className="font-medium hover:text-primary">
                          {p.title}
                        </a>
                      ) : (
                        <p className="font-medium">{p.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {p.source === "iskra" ? "Radar ISKRA" : p.source === "openalex" ? "Publikacja (OpenAlex)" : p.source.toUpperCase()}
                        {p.snippet ? " · " + p.snippet : ""}
                      </p>
                    </div>
                    {p.similarity != null ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{Math.round(p.similarity * 100)}%</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nie znaleziono podobnych rozwiązań ani publikacji.</p>
            )}
          </Section>

          <Section title={"Źródła (" + data.documents.length + ")"}>
            <ul className="space-y-3">
              {data.documents.map((d) => (
                <li key={d.id} className="text-sm">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer" className="flex items-start gap-1 font-medium break-all text-primary hover:underline">
                      {d.title ?? d.url}
                      <ArrowUpRight className="size-4 shrink-0" />
                    </a>
                  ) : (
                    <p className="font-medium">{d.title ?? "Dokument"}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {d.sourceKind ? SOURCE_LABEL[d.sourceKind] : "Źródło"} · pobrano {format(d.fetchedAt, "d MMMM yyyy", { locale: pl })}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">Ostatnio sprawdzone: {format(data.checkedAt, "d MMMM yyyy, HH:mm", { locale: pl })}</p>
          </Section>
        </aside>
      </div>
    </article>
  )
}

function Gauge({ label, score, hint }: { label: string; score: number | null; hint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3 md:w-56">
      <ScoreRing score={score} size={64} />
      <div className="text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}

function Section({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, quote, status }: { label: string; value: string | null; quote?: string | null; status?: FactStatus }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="space-y-1.5 text-sm">
        <div className="flex items-start justify-between gap-3">
          {value ? <p>{value}</p> : <span className="text-xs text-muted-foreground">Źródło o tym nie mówi</span>}
          {status ? <FactBadge status={status} /> : null}
        </div>
        {quote && status === "potwierdzone" ? <p className="border-l-2 border-chart-4/50 pl-2 text-xs text-ink-soft italic">„{quote}”</p> : null}
      </dd>
    </div>
  )
}

function Pill({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span className={"rounded-full border px-2.5 py-0.5 text-xs " + (strong ? "border-secondary bg-secondary font-medium text-secondary-foreground" : "border-border text-muted-foreground")}>
      {children}
    </span>
  )
}
