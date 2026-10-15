/*
 * sine_cosine_math.js — browser mirror of sine_cosine/solver.py, the F.10 and F.11 sections of
 * core/formula.py, and general/plotting/viewport.py.
 *
 * The page recalculates as the sliders move, so the math is ported here. Python stays the source
 * of truth: tests/test_js_parity.py runs this file and compares solve() with the Python output.
 * Exposes window.WaveMath (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";

  // ---- core/formula.py: F.10 Sine, F.11 Cosine ------------------------------
  const sine = (x, a = 1, b = 1, h = 0, k = 0) => a * Math.sin(b * (x - h)) + k;
  const amplitude = (a) => Math.abs(a);
  const period = (b) => 2 * Math.PI / Math.abs(b);
  const midline = (k) => k;
  const cosine = (x, a = 1, b = 1, h = 0, k = 0) => a * Math.cos(b * (x - h)) + k;

  // ---- sine_cosine/solver.py ------------------------------------------------
  const KINDS = ["sine", "cosine"];
  const CARDS = { sine: "F.10", cosine: "F.11" };
  const NAMES = { sine: "Sine", cosine: "Cosine" };
  const FN = { sine: "sin", cosine: "cos" };

  const clean = (v) => { const r = Number(v.toFixed(10)); return r === 0 ? 0 : r; };
  const fmt = (v) => String(Number(clean(v).toPrecision(4))).replace(/-/g, "−");
  const signed = (v) => ` ${v < 0 ? "−" : "+"} ${fmt(Math.abs(v))}`;
  const point = (x, y) => `(${fmt(x)}, ${fmt(y)})`;

  function validate(kind, a, b) {
    if (!KINDS.includes(kind)) throw new Error(`Unknown function: ${kind}. Pick sine or cosine.`);
    if (clean(a) === 0) throw new Error("a cannot be 0: the wave would flatten into the line y = k.");
    if (clean(b) === 0) throw new Error("b cannot be 0: the wave would never repeat (its period 2π / |b| would be infinite).");
  }

  const evaluate = (kind, x, a = 1, b = 1, h = 0, k = 0) => clean(kind === "sine" ? sine(x, a, b, h, k) : cosine(x, a, b, h, k));

  function equation(kind, a = 1, b = 1, h = 0, k = 0) {
    const shifted = clean(h) === 0 ? "x" : `(x${signed(-h)})`;
    let inside;
    if (clean(b) === 1) inside = shifted;
    else if (clean(b) === -1) inside = `−${shifted}`;
    else inside = `${fmt(b)}${shifted}`;
    const arg = inside === "x" ? "x" : (!inside.startsWith("(") ? `(${inside})` : inside);
    const lead = clean(a) === 1 ? "" : clean(a) === -1 ? "−" : `${fmt(a)} `;
    return `y = ${lead}${FN[kind]} ${arg}`.replace(`${FN[kind]} (`, `${FN[kind]}(`) + (clean(k) ? signed(k) : "");
  }

  function keyPoints(kind, a, b, h, k) {
    const quarter = period(b) / 4;
    const out = [];
    for (let j = 0; j < 5; j++) {
      const x = clean(h + j * quarter);
      const y = evaluate(kind, x, a, b, h, k);
      const d = clean(y - k);
      out.push({ x, y, name: d > 0 ? "peak" : d < 0 ? "trough" : "midline" });
    }
    return out;
  }

  function steps(kind, a, b, h, k, amp, per, points) {
    const rising = (a > 0) === (b > 0);
    const start = kind === "sine" ? `on the midline, going ${rising ? "up" : "down"}` : `at a ${points[0].name}`;
    return [
      { id: "form", title: `y = a ${FN[kind]}(b(x − h)) + k`, math: `a = ${fmt(a)}, b = ${fmt(b)}, h = ${fmt(h)}, k = ${fmt(k)}:  ${equation(kind, a, b, h, k)}` },
      { id: "amplitude", title: "Amplitude: |a|", math: `|${fmt(a)}| = ${fmt(amp)}: the wave reaches ${fmt(amp)} above and below its midline` + (a < 0 ? ", flipped over (a < 0)" : "") },
      { id: "period", title: "Period: 2π / |b|", math: `2π / |${fmt(b)}| = ${fmt(per)}: one full cycle every ${fmt(per)} across` },
      { id: "shift", title: "Phase shift h and midline y = k", math: `the cycle starts at x = ${fmt(h)}, ${start}; midline y = ${fmt(k)}, peaks at y = ${fmt(k + amp)}, troughs at y = ${fmt(k - amp)}` },
      { id: "points", title: "Key points, every quarter period", math: points.map((p) => `${point(p.x, p.y)} ${p.name}`).join(",  ") },
    ];
  }

  // ---- viewport.py ----------------------------------------------------------
  function niceStep(span, targetTicks = 8) {
    if (span <= 0) return 1;
    const raw = span / targetTicks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const mult of [1, 2, 5, 10]) if (raw <= mult * magnitude) return mult * magnitude;
    return 10 * magnitude;
  }
  const snapOutward = (lo, hi, step) => [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];

  function fitViewport(xs, f, { alwaysIncludeY = [], padding = 0.25, minSpan = 4, samples = 101 } = {}) {
    const lo = Math.min(...xs), hi = Math.max(...xs);
    const span = Math.max(hi - lo, minSpan);
    const mid = (lo + hi) / 2;
    let xLo = mid - span * (0.5 + padding), xHi = mid + span * (0.5 + padding);
    const xStep = niceStep(xHi - xLo);
    [xLo, xHi] = snapOutward(xLo, xHi, xStep);
    const ys = [];
    for (let i = 0; i < samples; i++) ys.push(f(xLo + (xHi - xLo) * i / (samples - 1)));
    ys.push(...alwaysIncludeY);
    let yLo = Math.min(...ys), yHi = Math.max(...ys);
    if (yHi - yLo < minSpan) {
      const centre = (yLo + yHi) / 2;
      [yLo, yHi] = [centre - minSpan / 2, centre + minSpan / 2];
    }
    const yPad = (yHi - yLo) * 0.08;
    const yStep = niceStep(yHi - yLo + 2 * yPad);
    [yLo, yHi] = snapOutward(yLo - yPad, yHi + yPad, yStep);
    return { x_min: xLo, x_max: xHi, y_min: yLo, y_max: yHi, x_step: xStep, y_step: yStep };
  }

  function plotWindow(kind, a, b, h, k, per) {
    const amp = Math.abs(a);
    return fitViewport([h - per / 4, h + 2 * per, 0], (x) => evaluate(kind, x, a, b, h, k),
      { alwaysIncludeY: [k + amp, k - amp, 0], padding: 0.05 });
  }

  /** Same shape as WaveSolution.to_dict() in Python. */
  function solve(kind, a = 1, b = 1, h = 0, k = 0) {
    validate(kind, a, b);
    const amp = clean(amplitude(a));
    const per = clean(period(b));
    const mid = clean(midline(k));
    const points = keyPoints(kind, a, b, h, k);
    return {
      inputs: { kind, a, b, h, k },
      card: CARDS[kind],
      name: NAMES[kind],
      equation: equation(kind, a, b, h, k),
      amplitude: amp,
      period: per,
      phase_shift: clean(h),
      midline: mid,
      maximum: clean(mid + amp),
      minimum: clean(mid - amp),
      y_intercept: evaluate(kind, 0, a, b, h, k),
      key_points: points,
      steps: steps(kind, a, b, h, k, amp, per, points),
      window: plotWindow(kind, a, b, h, k, per),
    };
  }

  const api = { solve, evaluate, fmt, fitViewport, sine, cosine, amplitude, period, midline };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.WaveMath = api;
})(typeof window !== "undefined" ? window : globalThis);
