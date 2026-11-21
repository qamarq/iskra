"use client"

import { useEffect, useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export type IskierkaColor = "ember" | "glow" | "mint" | "lilac" | "sky" | "pink"
export type IskierkaPose = "idle" | "wave" | "lupa" | "ok" | "confused" | "cheer" | "think"

const PALETTE: Record<IskierkaColor, [string, string, string]> = {
  ember: ["#FFD7C2", "#FF8A5C", "#C8401A"],
  glow: ["#FFF1C9", "#FFC56B", "#D98510"],
  mint: ["#D2FFF0", "#5FD3A3", "#1E8F6C"],
  lilac: ["#F0E9FF", "#B79CFF", "#6D4FD8"],
  sky: ["#E2F4FF", "#7CC8FA", "#2B7FC0"],
  pink: ["#FFE3EE", "#FF8FB6", "#D9457A"],
}

export function sparkPath(cx: number, cy: number, r: number) {
  const k = r * 0.28
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`
}

function Arm({ x, y, rot, fill, wave }: { x: number; y: number; rot: number; fill: string; wave?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <g className={wave ? "isk-wave" : undefined}>
        <rect x={-11} y={0} width={22} height={46} rx={11} fill={fill} />
        <circle cx={0} cy={48} r={13} fill={fill} />
      </g>
    </g>
  )
}

export function Iskierka({
  color = "ember",
  pose = "idle",
  size = 120,
  follow = false,
  className,
  onClick,
  label = "Iskierka",
}: {
  color?: IskierkaColor
  pose?: IskierkaPose
  size?: number
  follow?: boolean
  className?: string
  onClick?: () => void
  label?: string
}) {
  const raw = useId().replace(/:/g, "")
  const id = "isk" + raw
  const [hi, c, lo] = PALETTE[color]
  const ref = useRef<HTMLDivElement>(null)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const [burst, setBurst] = useState(0)
  const [jiggle, setJiggle] = useState(0)

  useEffect(() => {
    if (!follow) return
    let frame = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height * 0.4)
        const d = Math.hypot(dx, dy) || 1
        const m = Math.min(5, d / 60)
        setLook({ x: (dx / d) * m, y: (dy / d) * m * 0.8 })
      })
    }
    window.addEventListener("mousemove", onMove)
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(frame)
    }
  }, [follow])

  const fill = `url(#${id}g)`
  const eyeFill = `url(#${id}e)`
  const coreFill = `url(#${id}k)`
  const holding = pose === "lupa" || pose === "ok" || pose === "think"
  const waving = pose === "wave" || pose === "cheer"

  return (
    <div
      ref={ref}
      role={onClick ? "button" : "img"}
      aria-label={label}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => {
        setBurst((b) => b + 1)
        setJiggle((j) => j + 1)
        onClick?.()
      }}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          setBurst((b) => b + 1)
          setJiggle((j) => j + 1)
          onClick()
        }
      }}
      className={cn("isk relative inline-block select-none", onClick && "cursor-pointer", className)}
      style={{ width: size }}
    >
      <svg viewBox="0 0 220 240" className="isk-float block h-auto w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}g`} cx="35%" cy="28%" r="80%">
            <stop offset="0" stopColor={hi} />
            <stop offset=".45" stopColor={c} />
            <stop offset="1" stopColor={lo} />
          </radialGradient>
          <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A3054" />
            <stop offset="1" stopColor="#16121F" />
          </linearGradient>
          <radialGradient id={`${id}e`} cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#E8FFF7" />
            <stop offset=".5" stopColor="#7FF5CF" />
            <stop offset="1" stopColor="#2FBF8F" />
          </radialGradient>
          <radialGradient id={`${id}k`} cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#FFF6D9" />
            <stop offset=".5" stopColor="#FFC56B" />
            <stop offset="1" stopColor="#E4572E" />
          </radialGradient>
        </defs>
        <ellipse className="isk-shadow" cx="110" cy="232" rx="64" ry="9" fill="rgba(0,0,0,.16)" />
        <g key={jiggle} className={cn("isk-body", jiggle > 0 && "isk-jiggle")}>
          <line x1="110" y1="44" x2="110" y2="22" stroke={lo} strokeWidth="6" strokeLinecap="round" />
          <g className="isk-twinkle">
            <path d={sparkPath(110, 16, 18)} fill={coreFill} />
            <circle cx="105" cy="11" r="3.5" fill="#fff" opacity=".9" />
          </g>
          <Arm x={44} y={pose === "cheer" ? 150 : 152} rot={pose === "cheer" ? 150 : 25} fill={fill} />
          <Arm x={156} y={150} rot={waving ? -150 : holding ? -60 : -25} fill={fill} wave={waving} />
          <rect x="68" y="140" width="84" height="64" rx="30" fill={fill} />
          <circle cx="110" cy="172" r="12" fill={coreFill} className="isk-core" />
          <ellipse cx="106" cy="167" rx="4" ry="3" fill="#fff" opacity=".8" />
          <ellipse cx="88" cy="214" rx="16" ry="11" fill={fill} />
          <ellipse cx="132" cy="214" rx="16" ry="11" fill={fill} />
          <rect x="34" y="42" width="152" height="108" rx="50" fill={fill} />
          <ellipse cx="78" cy="58" rx="30" ry="10" fill="#fff" opacity=".55" transform="rotate(-12 78 58)" />
          <rect x="54" y="62" width="112" height="66" rx="30" fill={`url(#${id}s)`} />
          <g style={{ transform: `translate(${look.x}px, ${look.y}px)`, transition: "transform .15s ease-out" }}>
            <g className="isk-blink">
              {pose === "confused" ? (
                <>
                  <ellipse cx="82" cy="90" rx="9" ry="12" fill={eyeFill} />
                  <path d="M110 92 q8 -10 16 0" stroke={eyeFill} strokeWidth="7" fill="none" strokeLinecap="round" />
                </>
              ) : pose === "cheer" ? (
                <>
                  <path d="M73 93 q9 -12 18 0" stroke={eyeFill} strokeWidth="7" fill="none" strokeLinecap="round" />
                  <path d="M109 93 q9 -12 18 0" stroke={eyeFill} strokeWidth="7" fill="none" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <ellipse cx="82" cy="90" rx="9" ry="12" fill={eyeFill} />
                  <ellipse cx="118" cy="90" rx="9" ry="12" fill={eyeFill} />
                  <circle cx="85" cy="85" r="3" fill="#fff" />
                  <circle cx="121" cy="85" r="3" fill="#fff" />
                </>
              )}
            </g>
          </g>
          {pose === "confused" ? (
            <path d="M88 110 q6 -5 12 0 q6 5 12 0" stroke="#7FF5CF" strokeWidth="4" fill="none" strokeLinecap="round" />
          ) : pose === "think" ? (
            <circle cx="110" cy="110" r="5" fill="#7FF5CF" />
          ) : (
            <path d="M88 106 q12 12 24 0" stroke="#7FF5CF" strokeWidth="5" fill="none" strokeLinecap="round" />
          )}
          <ellipse cx="62" cy="116" rx="9" ry="6" fill="#FF8FB6" opacity=".75" />
          <ellipse cx="158" cy="116" rx="9" ry="6" fill="#FF8FB6" opacity=".75" />
          {pose === "lupa" ? (
            <g transform="translate(176 150) rotate(-20)">
              <g className="isk-work">
                <circle r="20" fill="rgba(200,240,255,.55)" stroke="#2B2140" strokeWidth="7" />
                <ellipse cx="-6" cy="-7" rx="7" ry="4" fill="#fff" opacity=".9" />
                <rect x="-4" y="20" width="8" height="26" rx="4" fill="#2B2140" />
              </g>
            </g>
          ) : null}
          {pose === "ok" ? (
            <g transform="translate(172 136)">
              <circle r="22" fill="#5FD3A3" stroke="#fff" strokeWidth="4" />
              <path d="M-10 0 L-3 8 L11 -8" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ) : null}
          {pose === "think" ? (
            <g className="isk-dots">
              <circle cx="186" cy="40" r="6" fill="#fff" />
              <circle cx="202" cy="22" r="8" fill="#fff" />
              <circle cx="222" cy="0" r="11" fill="#fff" />
            </g>
          ) : null}
        </g>
      </svg>
      {burst > 0 ? (
        <span key={burst} className="pointer-events-none absolute inset-0" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <svg
              key={i}
              viewBox="0 0 20 20"
              className="isk-burst absolute top-[20%] left-1/2 size-4"
              style={{ ["--a" as string]: i * 60 + "deg" }}
            >
              <path d={sparkPath(10, 10, 9)} fill={i % 2 ? "#FFC56B" : "#FF8A5C"} />
            </svg>
          ))}
        </span>
      ) : null}
    </div>
  )
}
