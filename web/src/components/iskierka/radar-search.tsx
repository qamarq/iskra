"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Iskierka } from "./iskierka"

const PERIOD = 2.6
const SIZE = 400
const C = SIZE / 2

type Node = { x: number; y: number; angle: number; r: number; hit: boolean; size: number }

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const NODES: Node[] = (() => {
  const rnd = seeded(7)
  const out: Node[] = []
  for (let i = 0; i < 30; i++) {
    const angle = rnd() * 360
    const r = 60 + rnd() * 120
    const rad = ((angle - 90) * Math.PI) / 180
    out.push({ x: C + Math.cos(rad) * r, y: C + Math.sin(rad) * r, angle, r, hit: rnd() < 0.22, size: 3.5 + rnd() * 3.5 })
  }
  return out
})()

const EDGES: [number, number][] = (() => {
  const out: [number, number][] = []
  NODES.forEach((a, i) => {
    const near = NODES.map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter((n) => n.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
    near.forEach(({ j, d }) => {
      if (d < 95 && !out.some(([p, q]) => (p === j && q === i) || (p === i && q === j))) out.push([i, j])
    })
  })
  return out
})()

const HIT_EDGES: [number, number][] = (() => {
  const hits = NODES.map((n, i) => ({ n, i })).filter(({ n }) => n.hit)
  return hits.slice(1).map(({ i }, k) => [hits[k].i, i] as [number, number])
})()

const LINES = ["Zamieniam opis na wektor znaczeń…", "Przeszukuję graf innowacji…", "Porównuję podobieństwo…", "Układam najlepsze dopasowania…"]

const delay = (angle: number) => (angle / 360) * PERIOD - PERIOD + "s"

export function RadarSearch({ query, className, compact }: { query?: string; className?: string; compact?: boolean }) {
  const [line, setLine] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % LINES.length), 1300)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={cn("flex flex-col items-center gap-5", className)} role="status" aria-live="polite">
      <div className="relative" style={{ width: compact ? 300 : 380 }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-auto w-full overflow-visible" aria-hidden="true">
          <defs>
            <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#FFF4EC" />
              <stop offset=".7" stopColor="#FFE6D6" />
              <stop offset="1" stopColor="#FFD9C4" />
            </radialGradient>
            <linearGradient id="radar-sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#E4572E" stopOpacity="0" />
              <stop offset="1" stopColor="#E4572E" stopOpacity=".45" />
            </linearGradient>
            <radialGradient id="radar-hit" cx="40%" cy="35%" r="70%">
              <stop offset="0" stopColor="#FFF6D9" />
              <stop offset=".5" stopColor="#FFC56B" />
              <stop offset="1" stopColor="#E4572E" />
            </radialGradient>
          </defs>
          <circle cx={C} cy={C} r={190} fill="url(#radar-bg)" stroke="#F3C9B3" strokeWidth="2" />
          {[60, 110, 160].map((r) => (
            <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="#EDB9A0" strokeWidth="1.2" strokeDasharray="4 6" />
          ))}
          <line x1={C - 190} y1={C} x2={C + 190} y2={C} stroke="#F1CDBB" strokeWidth="1" />
          <line x1={C} y1={C - 190} x2={C} y2={C + 190} stroke="#F1CDBB" strokeWidth="1" />
          <g>
            {EDGES.map(([a, b], i) => (
              <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke="#D9A48C" strokeWidth="1.2" opacity=".55" />
            ))}
          </g>
          <g className="radar-sweep" style={{ animationDuration: PERIOD + "s" }}>
            <path d={`M${C} ${C} L${C} ${C - 190} A190 190 0 0 1 ${C + 190 * Math.sin(Math.PI / 4)} ${C - 190 * Math.cos(Math.PI / 4)} Z`} fill="url(#radar-sweep)" transform={`rotate(-45 ${C} ${C})`} />
            <line x1={C} y1={C} x2={C} y2={C - 190} stroke="#E4572E" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          {HIT_EDGES.map(([a, b], i) => (
            <line
              key={"h" + i}
              x1={NODES[a].x}
              y1={NODES[a].y}
              x2={NODES[b].x}
              y2={NODES[b].y}
              stroke="#E4572E"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={1}
              className="radar-edge"
              style={{ animationDelay: 0.6 + i * 0.35 + "s" }}
            />
          ))}
          {NODES.map((n, i) => (
            <g key={i} transform={`translate(${n.x} ${n.y})`}>
              <circle
                r={n.size}
                className={n.hit ? "radar-node radar-node-hit" : "radar-node"}
                fill={n.hit ? "url(#radar-hit)" : "#C9A99A"}
                style={{ animationDelay: delay(n.angle), animationDuration: PERIOD + "s" }}
              />
              {n.hit ? (
                <circle r={n.size + 6} fill="none" stroke="#E4572E" strokeWidth="2" className="radar-ring" style={{ animationDelay: delay(n.angle), animationDuration: PERIOD + "s" }} />
              ) : null}
            </g>
          ))}
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Iskierka color="ember" pose="lupa" size={compact ? 70 : 88} />
        </div>
      </div>
      <div className="text-center">
        {query ? <p className="font-heading text-lg font-semibold">„{query}”</p> : null}
        <p key={line} className="radar-line mt-1 text-sm font-medium text-muted-foreground">
          {LINES[line]}
        </p>
      </div>
    </div>
  )
}
