import sys, wave
import numpy as np

SR = 44100
BPM = 118
BEAT = 60 / BPM
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 60.0
OUT = sys.argv[1]
N = int(DUR * SR)
t_all = np.arange(N) / SR
rng = np.random.default_rng(7)

def note(m): return 440.0 * 2 ** ((m - 69) / 12)

def env(n, a, d, s, r, sus_len):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    e = np.zeros(n)
    i = 0
    seg = min(a_n, n); e[:seg] = np.linspace(0, 1, seg, endpoint=False); i = seg
    seg = min(d_n, n - i); e[i:i + seg] = np.linspace(1, s, seg, endpoint=False); i += seg
    seg = min(int(sus_len * SR), n - i); e[i:i + seg] = s; i += seg
    seg = min(r_n, n - i); e[i:i + seg] = np.linspace(s, 0, seg, endpoint=False)
    return e

def iir1(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    b = 1 - a
    # vectorised one-pole via cumulative trick in blocks
    y = np.empty_like(x)
    prev = 0.0
    block = max(8, min(4096, int(500 / max(1e-9, -np.log(a)))))
    powers = a ** np.arange(block)
    for s in range(0, len(x), block):
        xb = x[s:s + block] * b
        n = len(xb)
        p = powers[:n]
        c = np.cumsum(xb / p) * p
        y[s:s + n] = c + prev * a * p
        prev = y[s + n - 1]
    return y

def saw(f, t, detune=0.0):
    ph = (f * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))

def add(buf, start, sig):
    s = int(start * SR)
    if s >= len(buf): return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[: e - s]

mix = np.zeros(N)
kick_bus = np.zeros(N)
prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62])]
bars = int(DUR / (4 * BEAT)) + 1
intro_bars = 2
outro_start_bar = bars - 2

# kick
kn = int(0.35 * SR); kt = np.arange(kn) / SR
kfreq = 45 + 95 * np.exp(-kt * 28)
kick = np.sin(2 * np.pi * np.cumsum(kfreq) / SR) * np.exp(-kt * 9) * 0.95
kick += (rng.standard_normal(kn) * np.exp(-kt * 300)) * 0.08
# clap
cn = int(0.22 * SR); ct = np.arange(cn) / SR
clapn = rng.standard_normal(cn)
clapn = clapn - iir1(clapn, 900)
clap = clapn * (np.exp(-ct * 22) + 0.6 * np.exp(-((ct - 0.012) ** 2) / 2e-6)) * 0.35
# hat
hn = int(0.06 * SR); ht = np.arange(hn) / SR
hatn = rng.standard_normal(hn); hatn = hatn - iir1(hatn, 7000)
hat = hatn * np.exp(-ht * 70) * 0.22

for bar in range(bars):
    t0 = bar * 4 * BEAT
    root, chord = prog[bar % 4]
    full = intro_bars <= bar < outro_start_bar
    for b in range(4):
        tb = t0 + b * BEAT
        if full or bar >= outro_start_bar:
            add(mix, tb, kick); add(kick_bus, tb, np.exp(-np.arange(int(0.3 * SR)) / SR * 10))
        if full and b in (1, 3): add(mix, tb, clap)
        if full or bar == intro_bars - 1:
            add(mix, tb + BEAT / 2, hat)
            add(mix, tb + BEAT * 0.75, hat * 0.5)
    # bass: offbeat 8ths
    if full:
        for i in range(8):
            if i % 2 == 0 and i not in (0, 4): continue
            ts = t0 + i * BEAT / 2
            ln = int(BEAT / 2 * SR); lt = np.arange(ln) / SR
            f = note(root - 24 + (12 if i in (3, 7) else 0))
            sig = (saw(f, lt) * 0.6 + np.sin(2 * np.pi * f * lt) * 0.6) * env(ln, 0.005, 0.12, 0.45, 0.05, 0.08)
            add(mix, ts, iir1(sig, 520) * 0.55)
    # pad
    pn = int(4 * BEAT * SR); pt = np.arange(pn) / SR
    pad = np.zeros(pn)
    for m in chord:
        for dt in (-0.004, 0.0, 0.005):
            pad += saw(note(m), pt, dt)
    pad = iir1(pad, 1400) * env(pn, 0.25, 0.4, 0.7, 0.4, 4 * BEAT - 1.1) * 0.07
    add(mix, t0, pad)
    # pluck arpeggio 16ths
    arp = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[1] + 24, chord[2] + 12, chord[0] + 24, chord[1] + 12, chord[2] + 24]
    for i in range(16):
        if not full and bar < intro_bars and i % 2: continue
        ts = t0 + i * BEAT / 4
        ln = int(0.25 * SR); lt = np.arange(ln) / SR
        f = note(arp[i % len(arp)])
        sig = (np.sin(2 * np.pi * f * lt) + 0.35 * np.sin(4 * np.pi * f * lt) + 0.15 * saw(f, lt)) * np.exp(-lt * 14)
        add(mix, ts, sig * (0.11 if full else 0.09))

# sidechain
duck = 1 - 0.55 * np.clip(kick_bus, 0, 1)
mix = mix * duck + 0  # pump whole bed
# fades
fi = int(0.6 * SR); fo = int(2.5 * SR)
mix[:fi] *= np.linspace(0, 1, fi)
mix[-fo:] *= np.linspace(1, 0, fo)
mix = np.tanh(mix * 1.3)
mix = mix / np.max(np.abs(mix)) * 0.89
stereo = np.stack([mix, np.concatenate([[0] * 220, mix[:-220]]) * 0.97 + mix * 0.03], axis=1)
data = (stereo * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print("ok", DUR)
