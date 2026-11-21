import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { ArrowUpRight, CircleAlert, Quote } from "lucide-react"
import Link from "next/link"
import { CRITERIA_INFO } from "@/lib/criteria"
import {
  INSTITUTION_TYPE_LABEL,
  MATCH_STATUS_LABEL,
  PARTNER_KIND_LABEL,
  PATHWAY_LABEL,
  STAGE_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  confidenceLabel,
  percent,
} from "@/lib/labels"
import type { InnovationDetail } from "@/server/queries"
import { ScoreRing } from "../score-ring"
import { StatusBadge } from "../status-badge"
import { CriterionOverride } from "./criterion-override"
import { MatchActions } from "./match-actions"
import { StatusControl } from "./status-control"

export function InnovationView({ data }: { data: InnovationDetail }) {
  const card = data.card
  const pathway = data.pathway
  return (
    <article className="space-y-8">
      <header className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 md:flex-row md:items-start md:p-8">
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{data.institution?.name ?? card.institution.name}</span>
            {data.institution ? " · " + INSTITUTION_TYPE_LABEL[data.institution.type] : null}
            {card.institution.location ? " · " + card.institution.location : null}
          </p>
          <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight md:text-4xl">{data.title}</h1>
          <p className="max-w-3xl text-base text-muted-foreground">{data.summary}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge status={data.status} />
            <Pill>{TYPE_LABEL[data.type]}</Pill>
            <Pill>{STAGE_LABEL[card.maturity.value.stage]}</Pill>
            {card.maturity.value.trl ? <Pill>TRL {card.maturity.value.trl}</Pill> : null}
            <Pill>{card.domain}</Pill>
          </div>
          <div className="pt-2">
            <StatusControl innovationId={data.id} status={data.status} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-muted/60 p-4 md:flex-col md:items-center">
          <ScoreRing score={data.score} size={96} />
          <div className="text-sm md:text-center">
            <p className="font-medium">Potencjał</p>
            <p className="text-muted-foreground">
              pewność {confidenceLabel(data.confidence)} ({percent(data.confidence)})
            </p>
          </div>
        </div>
      </header>

      {data.duplicateOf ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#E9B949] bg-[#FFF6DF] p-4 text-sm text-[#5E4003]">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            To rozwiązanie jest bardzo podobne do{" "}
            <Link href={"/innowacje/" + data.duplicateOf.slug} className="font-semibold underline">
              {data.duplicateOf.title}
            </Link>
            . Sprawdź, czy to ta sama innowacja, zanim ktoś zacznie pracę od nowa.
          </p>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <Section title="Karta innowacji" description="Każde pole ma cytat ze źródła. Pole bez cytatu oznacza, że źródło o tym nie mówi.">
            <dl className="divide-y divide-border">
              <Field label="Problem" value={card.problem.value} quote={card.problem.quote} />
              <Field label="Rozwiązanie" value={card.solution.value} quote={card.solution.quote} />
              <Field label="Odbiorcy" value={card.beneficiaries.value} quote={card.beneficiaries.quote} />
              <Field
                label="Dojrzałość"
                value={STAGE_LABEL[card.maturity.value.stage] + (card.maturity.value.trl ? ", TRL " + card.maturity.value.trl : "")}
                quote={card.maturity.quote}
              />
              <Field label="Efekty" value={card.results.value} quote={card.results.quote} />
              <Field label="Koszty i zasoby" value={card.costs.value} quote={card.costs.quote} />
              <Field
                label="Twórcy"
                value={card.creators.length ? card.creators.map((c) => (c.name ? c.name + " (" + c.role + ")" : c.role)).join(", ") : null}
              />
              <Field label="Słowa kluczowe" value={card.keywords.join(", ") || null} />
            </dl>
            {card.missing.length ? (
              <div className="mt-4 rounded-xl bg-muted/70 p-4">
                <p className="text-sm font-medium">Czego brakuje do pełnej oceny</p>
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
            description="Sześć jawnych kryteriów w skali 0–5. Model proponuje ocenę, opiekun może ją poprawić; wynik i ścieżka przeliczają się od razu."
            action={
              <Link href="/kryteria" className="text-sm font-medium text-primary hover:underline">
                Jak oceniamy?
              </Link>
            }
          >
            <ul className="space-y-5">
              {CRITERIA_INFO.map((c) => {
                const e = data.evaluations[c.id]
                return (
                  <li key={c.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium">
                        {c.label} <span className="text-xs font-normal text-muted-foreground">waga {Math.round(c.weight * 100)}%</span>
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
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {e.author === "ai" ? "Ocena modelu" : "Ocena: " + e.author} · pewność {percent(e.confidence)}
                          </span>
                          <CriterionOverride innovationId={data.id} criterion={c.id} current={e.score} />
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </Section>

          <Section title="Historia" description="Każda zmiana etapu jest zapisywana, z tego liczymy mierniki.">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {data.events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{STATUS_LABEL[ev.toStatus]}</p>
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
          {pathway ? (
            <section className="rounded-3xl bg-secondary p-6 text-secondary-foreground">
              <p className="text-xs font-semibold tracking-[0.14em] text-glow uppercase">Rekomendowana ścieżka</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold">{PATHWAY_LABEL[pathway.primary]}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-white/80">
                {pathway.reasons.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
              <p className="mt-5 text-sm font-medium">Następne kroki</p>
              <ol className="mt-2 space-y-2 text-sm text-white/85">
                {pathway.nextSteps.map((s, i) => (
                  <li key={s} className="flex gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              {pathway.secondary.length ? (
                <p className="mt-5 text-xs text-white/60">Także: {pathway.secondary.map((p) => PATHWAY_LABEL[p]).join(" · ")}</p>
              ) : null}
            </section>
          ) : null}

          <Section title="Partnerzy" description="Dobrani po profilu, typie partnera pasującym do ścieżki i wspólnych tematach.">
            {data.matches.length ? (
              <ul className="space-y-4">
                {data.matches.map(({ match, partner }) => (
                  <li key={match.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium leading-snug">{partner.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {PARTNER_KIND_LABEL[partner.kind]} · {MATCH_STATUS_LABEL[match.status]}
                        </p>
                      </div>
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground tabular-nums">
                        {Math.round(match.score * 100)}%
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{match.reason}</p>
                    {match.message ? (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer text-xs font-medium text-primary">Szkic wiadomości</summary>
                        <p className="mt-2 rounded-xl bg-muted/70 p-3 whitespace-pre-line">{match.message}</p>
                      </details>
                    ) : null}
                    <div className="mt-3">
                      <MatchActions matchId={match.id} status={match.status} message={match.message} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Brak dopasowanych partnerów.</p>
            )}
          </Section>

          <Section title="Podobne rozwiązania" description="Te same problemy rozwiązane gdzie indziej: szansa na współpracę albo ryzyko dublowania prac.">
            {data.priorArt.length ? (
              <ul className="space-y-3">
                {data.priorArt.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      {p.url ? (
                        <Link href={p.url} className="font-medium hover:text-primary">
                          {p.title}
                        </Link>
                      ) : (
                        <p className="font-medium">{p.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {p.source === "iskra" ? "Baza ISKRA" : p.source.toUpperCase()}
                        {p.snippet ? " · " + p.snippet : ""}
                      </p>
                    </div>
                    {p.similarity != null ? <span className="text-xs text-muted-foreground tabular-nums">{percent(p.similarity)}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nie znaleziono podobnych rozwiązań w bazie.</p>
            )}
          </Section>

          {data.document?.url ? (
            <Section title="Źródło">
              <a href={data.document.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium break-all text-primary hover:underline">
                {data.document.title ?? data.document.url}
                <ArrowUpRight className="size-4 shrink-0" />
              </a>
              {data.document.fetchedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">Pobrano {format(data.document.fetchedAt, "d MMMM yyyy", { locale: pl })}</p>
              ) : null}
            </Section>
          ) : null}
        </aside>
      </div>
    </article>
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

function Field({ label, value, quote }: { label: string; value: string | null; quote?: string | null }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="space-y-1.5 text-sm">
        {value ? <p>{value}</p> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">brak danych</span>}
        {quote ? (
          <p className="flex gap-1.5 border-l-2 border-primary/40 pl-2 text-xs text-ink-soft italic">„{quote}”</p>
        ) : null}
      </dd>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{children}</span>
}
