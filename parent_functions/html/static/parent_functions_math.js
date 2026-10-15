/*
 * parent_functions_math.js — browser mirror of parent_functions/solver.py, the F.1, F.4, F.5, F.6
 * and F.19 sections of core/formula.py, and general/plotting/viewport.py.
 *
 * The page recalculates as the sliders move, so the math is ported here. Python stays the source
 * of truth: tests/test_js_parity.py runs this file and compares solve() with the Python output.
 * Exposes window.ParentMath (browser) or module.exports (Node).
 */
(function (global) {
  "use strict";

  // ---- core/formula.py: F.1 Linear, F.4 Absolute Value, F.5 Square Root, F.6 Reciprocal, F.19 Cube Root
  const linear = (x, m, b) => m * x + b;
  const linearXIntercept = (m, b) => -b / m;
  const absoluteValue = (x, a = 1, h = 0, k = 0) => a * Math.abs(x - h) + k;
  const absoluteValueVertex = (h = 0, k = 0) => [h, k];
  function absoluteValueXIntercepts(a, h, k) {
    const d = -k / a;
    if (d < 0) return [];
    if (d === 0) return [h];
    return [h - d, h + d];
  }
  const squareRoot = (x, a = 1, h = 0, k = 0) => a * Math.sqrt(x - h) + k;
  const squareRootDomain = (h = 0) => h;
  const squareRootXIntercept = (a, h, k) => (-k / a < 0 ? null : h + (k / a) ** 2);
  const reciprocal = (x, a = 1, h = 0, k = 0) => a / (x - h) + k;
  const reciprocalAsymptotes = (h = 0, k = 0) => [h, k];
  const reciprocalXIntercept = (a, h, k) => (k === 0 ? null : h - a / k);
  const cubeRoot = (x, a = 1, h = 0, k = 0) => a * Math.cbrt(x - h) + k;
  const cubeRootCenter = (h = 0, k = 0) => [h, k];
  const cubeRootXIntercept = (a, h, k) => h + (-k / a) ** 3;

  // ---- parent_functions/solver.py -------------------------------------------
  const KINDS = ["linear", "absolute", "sqrt", "reciprocal", "cbrt"];
  const CARDS = { linear: "F.1", absolute: "F.4", sqrt: "F.5", reciprocal: "F.6", cbrt: "F.19" };
  const NAMES = { linear: "Linear", absolute: "Absolute value", sqrt: "Square root", reciprocal: "Reciprocal", cbrt: "Cube root" };

  const clean = (v) => { const r = Number(v.toFixed(10)); return r === 0 ? 0 : r; };
  const fmt = (v) => String(Number(clean(v).toPrecision(4))).replace(/-/g, "−");
  const coef = (v) => { const c = clean(v); return c === 1 ? "" : c === -1 ? "−" : fmt(c); };
  const signed = (v) => ` ${v < 0 ? "−" : "+"} ${fmt(Math.abs(v))}`;
  const shift = (h) => (clean(h) === 0 ? "x" : `x${signed(-h)}`);
  const point = (x, y) => `(${fmt(x)}, ${fmt(y)})`;

  function validate(kind, a) {
    if (!KINDS.includes(kind)) throw new Error(`Unknown function: ${kind}. Pick linear, absolute, sqrt, reciprocal or cbrt.`);
    if (kind !== "linear" && clean(a) === 0) throw new Error("a cannot be 0: the graph would flatten into the line y = k.");
  }

  function evaluate(kind, x, m = 1, b = 0, a = 1, h = 0, k = 0) {
    if (kind === "linear") return clean(linear(x, m, b));
    if (kind === "absolute") return clean(absoluteValue(x, a, h, k));
    if (kind === "reciprocal") return x === h ? null : clean(reciprocal(x, a, h, k));
    if (kind === "cbrt") return clean(cubeRoot(x, a, h, k));
    if (x < squareRootDomain(h)) return null;
    return clean(squareRoot(x, a, h, k));
  }

  function equation(kind, m = 1, b = 0, a = 1, h = 0, k = 0) {
    if (kind === "linear") {
      if (clean(m) === 0) return `y = ${fmt(b)}`;
      return `y = ${coef(m)}x` + (clean(b) ? signed(b) : "");
    }
    if (kind === "reciprocal") {
      const frac = clean(h) === 0 ? `${fmt(a)}/x` : `${fmt(a)}/(${shift(h)})`;
      return `y = ${frac}` + (clean(k) ? signed(k) : "");
    }
    const root = kind === "cbrt" ? "∛" : "√";
    const inner = kind === "absolute" ? `|${shift(h)}|` : (clean(h) ? `${root}(${shift(h)})` : `${root}x`);
    return `y = ${coef(a)}${inner}` + (clean(k) ? signed(k) : "");
  }

  function keyPoint(kind, m = 1, b = 0, a = 1, h = 0, k = 0) {
    if (kind === "linear") return { x: 0, y: clean(b), name: "y-intercept" };
    if (kind === "reciprocal") { const [rh, rk] = reciprocalAsymptotes(h, k); return { x: clean(rh), y: clean(rk), name: "center" }; }
    if (kind === "cbrt") { const [ch, ck] = cubeRootCenter(h, k); return { x: clean(ch), y: clean(ck), name: "center" }; }
    const [vh, vk] = kind === "absolute" ? absoluteValueVertex(h, k) : [squareRootDomain(h), k];
    return { x: clean(vh), y: clean(vk), name: kind === "absolute" ? "vertex" : "starting point" };
  }

  function xIntercepts(kind, m = 1, b = 0, a = 1, h = 0, k = 0) {
    if (kind === "linear") {
      if (clean(m) === 0) return clean(b) === 0 ? null : [];
      return [clean(linearXIntercept(m, b))];
    }
    if (kind === "absolute") return absoluteValueXIntercepts(a, h, k).map(clean);
    if (kind === "cbrt") return [clean(cubeRootXIntercept(a, h, k))];
    const x = kind === "reciprocal" ? reciprocalXIntercept(a, h, k) : squareRootXIntercept(a, h, k);
    return x === null ? [] : [clean(x)];
  }

  function domain(kind, h = 0) {
    if (kind === "sqrt") return `x ≥ ${fmt(squareRootDomain(h))}`;
    if (kind === "reciprocal") return `x ≠ ${fmt(h)}`;
    return "all real numbers";
  }

  function valueRange(kind, m = 1, b = 0, a = 1, k = 0) {
    if (kind === "linear") return clean(m) === 0 ? `only y = ${fmt(b)}` : "all real numbers";
    if (kind === "reciprocal") return `y ≠ ${fmt(k)}`;
    if (kind === "cbrt") return "all real numbers";
    return a > 0 ? `y ≥ ${fmt(k)}` : `y ≤ ${fmt(k)}`;
  }

  function shape(kind, m = 1, a = 1, h = 0) {
    if (kind === "linear") {
      if (clean(m) === 0) return "flat: a horizontal line";
      return `${m > 0 ? "rises" : "falls"} ${fmt(Math.abs(m))} for every 1 across`;
    }
    if (kind === "absolute") {
      const opens = a > 0 ? "opens up" : "opens down";
      return `${opens}; each arm has slope ±${fmt(Math.abs(a))}, turning at x = ${fmt(h)}`;
    }
    if (kind === "reciprocal") {
      const sides = a > 0 ? "upper right and lower left" : "upper left and lower right";
      return `two branches, in the ${sides} corners made by the asymptotes; each ${a > 0 ? "falls" : "rises"} as x grows`;
    }
    if (kind === "cbrt") return `${a > 0 ? "rises" : "falls"} everywhere, an S on its side; vertical for an instant at x = ${fmt(h)}`;
    return `${a > 0 ? "rises" : "falls"} from x = ${fmt(h)}, ever more slowly`;
  }

  function tableXs(kind, h = 0) {
    if (kind === "linear") return [-2, -1, 0, 1, 2];
    if (kind === "absolute") return [-2, -1, 0, 1, 2].map((d) => clean(h + d));
    if (kind === "reciprocal") return [-2, -1, -0.5, 0.5, 1, 2].map((d) => clean(h + d));
    if (kind === "cbrt") return [-8, -1, 0, 1, 8].map((d) => clean(h + d));
    return [0, 1, 4, 9].map((d) => clean(h + d));
  }

  function steps(kind, m, b, a, h, k, table, xs) {
    const eq = equation(kind, m, b, a, h, k);
    let crossing;
    if (xs === null) crossing = "every x: the line is the x-axis";
    else if (!xs.length) crossing = "none: the graph never reaches y = 0";
    else crossing = xs.map((x) => `x = ${fmt(x)}`).join(", ");
    const rows = table.filter((r) => r.y !== null).map((r) => point(r.x, r.y)).join(",  ");
    if (kind === "linear") {
      return [
        { id: "form", title: "Slope-intercept form: y = mx + b", math: `m = ${fmt(m)}, b = ${fmt(b)}:  ${eq}` },
        { id: "key", title: "y-intercept: set x = 0", math: `y = ${fmt(m)}·0${signed(b)} = ${fmt(b)}, the point ${point(0, b)}` },
        { id: "shape", title: "Slope: rise over run", math: `m = ${fmt(m)}: ${shape(kind, m)}` },
        { id: "cross", title: "x-intercept: set y = 0", math: clean(m) ? `x = −b / m = ${fmt(-b)} / ${fmt(m)}: ${crossing}` : `m = 0, so ${crossing}` },
        { id: "table", title: "Plot points", math: rows },
      ];
    }
    if (kind === "absolute") {
      return [
        { id: "form", title: "y = a|x − h| + k", math: `a = ${fmt(a)}, h = ${fmt(h)}, k = ${fmt(k)}:  ${eq}` },
        { id: "key", title: "Vertex (h, k)", math: `the V turns at ${point(h, k)}; for y = |x| it is (0, 0)` },
        { id: "shape", title: "The arms", math: shape(kind, 1, a, h) },
        { id: "cross", title: "x-intercepts: |x − h| = −k / a", math: crossing },
        { id: "table", title: "Plot points", math: rows },
      ];
    }
    if (kind === "reciprocal") {
      return [
        { id: "form", title: "y = a / (x − h) + k", math: `a = ${fmt(a)}, h = ${fmt(h)}, k = ${fmt(k)}:  ${eq}` },
        { id: "key", title: "Asymptotes x = h and y = k", math: `x = ${fmt(h)} (where x − h = 0 and the fraction is undefined) and y = ${fmt(k)} (where a / (x − h) shrinks to 0)` },
        { id: "shape", title: "The branches", math: shape(kind, 1, a, h) },
        { id: "cross", title: "x-intercept: a / (x − h) = −k", math: xs.length ? crossing : "none: k = 0, so the x-axis is the asymptote" },
        { id: "table", title: "Plot points (x − h = ±0.5, ±1, ±2)", math: rows },
      ];
    }
    if (kind === "cbrt") {
      return [
        { id: "form", title: "y = a∛(x − h) + k", math: `a = ${fmt(a)}, h = ${fmt(h)}, k = ${fmt(k)}:  ${eq}` },
        { id: "key", title: "Center (h, k)", math: `the S turns at ${point(h, k)}; for y = ∛x it is (0, 0). Every x is allowed: ∛(−8) = −2` },
        { id: "shape", title: "Shape", math: shape(kind, 1, a, h) },
        { id: "cross", title: "x-intercept: x = h + (−k / a)³", math: crossing },
        { id: "table", title: "Plot points (x − h = −8, −1, 0, 1, 8: perfect cubes)", math: rows },
      ];
    }
    return [
      { id: "form", title: "y = a√(x − h) + k", math: `a = ${fmt(a)}, h = ${fmt(h)}, k = ${fmt(k)}:  ${eq}` },
      { id: "key", title: "Domain: x − h ≥ 0", math: `x ≥ ${fmt(h)}; the graph starts at ${point(h, k)}` },
      { id: "shape", title: "Shape", math: shape(kind, 1, a, h) },
      { id: "cross", title: "x-intercept: √(x − h) = −k / a", math: crossing },
      { id: "table", title: "Plot points (x − h = 0, 1, 4, 9: perfect squares)", math: rows },
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

  function plotWindow(kind, m, b, a, h, k, table, xs) {
    const pts = table.filter((r) => r.y !== null);
    const near = (xs || []).filter((x) => Math.abs(x) <= 50);
    const f = (x) => ((kind === "sqrt" && x < h) || (kind === "reciprocal" && Math.abs(x - h) < 0.5) ? k : evaluate(kind, x, m, b, a, h, k));
    return fitViewport([...pts.map((r) => r.x), ...near, 0], f, { alwaysIncludeY: [...pts.map((r) => r.y), 0], padding: 0.2 });
  }

  /** Same shape as FunctionSolution.to_dict() in Python. */
  function solve(kind, m = 1, b = 0, a = 1, h = 0, k = 0) {
    validate(kind, a);
    const table = tableXs(kind, h).map((x) => ({ x, y: evaluate(kind, x, m, b, a, h, k) }));
    const xs = xIntercepts(kind, m, b, a, h, k);
    return {
      inputs: { kind, m, b, a, h, k },
      card: CARDS[kind],
      name: NAMES[kind],
      equation: equation(kind, m, b, a, h, k),
      key_point: keyPoint(kind, m, b, a, h, k),
      x_intercepts: xs,
      y_intercept: evaluate(kind, 0, m, b, a, h, k),
      domain: domain(kind, h),
      range: valueRange(kind, m, b, a, k),
      shape: shape(kind, m, a, h),
      table,
      steps: steps(kind, m, b, a, h, k, table, xs),
      window: plotWindow(kind, m, b, a, h, k, table, xs),
    };
  }

  const api = {
    solve, evaluate, fmt, fitViewport,
    linear, linear_x_intercept: linearXIntercept,
    absolute_value: absoluteValue, absolute_value_vertex: absoluteValueVertex, absolute_value_x_intercepts: absoluteValueXIntercepts,
    square_root: squareRoot, square_root_domain: squareRootDomain, square_root_x_intercept: squareRootXIntercept,
    reciprocal, reciprocal_asymptotes: reciprocalAsymptotes, reciprocal_x_intercept: reciprocalXIntercept,
    cube_root: cubeRoot, cube_root_center: cubeRootCenter, cube_root_x_intercept: cubeRootXIntercept,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.ParentMath = api;
})(typeof window !== "undefined" ? window : globalThis);
