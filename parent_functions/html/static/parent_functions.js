/*
 * parent_functions.js — page controller for five parent functions: linear, absolute value, square root,
 * reciprocal and cube root.
 *
 * Reads the Python-built config, wires the function picker and the m, b (linear) or a, h, k
 * (absolute value, square root) sliders, and turns a solution into a Manim-style Timeline: the
 * axes, the parent function y = x, |x| or √x faintly, the key point (y-intercept, vertex or
 * starting point), the graph traced left to right, then the table's points and the intercepts.
 * The URL hash (#kind=sqrt&a=2&h=1&k=-4) presets values and is watched, so links and
 * PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate, view } = window.Manim;
  const { solve, evaluate, fmt } = window.ParentMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));
  const NUMS = ["m", "b", "a", "h", "k"];
  const KINDS = ["linear", "absolute", "sqrt", "reciprocal", "cbrt"];

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    results: $("results"), steps: $("steps"), error: $("error"), run: $("run"), glossary: $("glossary"), presets: $("presets"),
  };
  const IDLE = "Press run to animate.";

  const PARENT = { linear: "y = x", absolute: "y = |x|", sqrt: "y = √x", reciprocal: "y = 1/x", cbrt: "y = ∛x" };
  const PRESETS = {
    linear: [["y = x", { m: 1, b: 0 }], ["y = 2x + 1", { m: 2, b: 1 }], ["y = −0.5x + 3", { m: -0.5, b: 3 }], ["y = 4", { m: 0, b: 4 }]],
    absolute: [["y = |x|", { a: 1, h: 0, k: 0 }], ["y = |x − 3| − 2", { a: 1, h: 3, k: -2 }], ["y = −2|x − 3| + 4", { a: -2, h: 3, k: 4 }], ["y = 0.5|x + 2|", { a: 0.5, h: -2, k: 0 }]],
    sqrt: [["y = √x", { a: 1, h: 0, k: 0 }], ["y = √(x + 4)", { a: 1, h: -4, k: 0 }], ["y = 2√(x − 1) − 4", { a: 2, h: 1, k: -4 }], ["y = −√x + 3", { a: -1, h: 0, k: 3 }]],
    reciprocal: [["y = 1/x", { a: 1, h: 0, k: 0 }], ["y = 2/(x − 3) + 1", { a: 2, h: 3, k: 1 }], ["y = −1/x", { a: -1, h: 0, k: 0 }], ["y = 4/(x + 2) − 2", { a: 4, h: -2, k: -2 }]],
    cbrt: [["y = ∛x", { a: 1, h: 0, k: 0 }], ["y = 2∛(x − 1) + 2", { a: 2, h: 1, k: 2 }], ["y = −∛x", { a: -1, h: 0, k: 0 }], ["y = ∛(x + 8) − 1", { a: 1, h: -8, k: -1 }]],
  };
  const TERMS = {
    "Function": "Which parent function, and its flashcard.",
    "Equation": "The function with these numbers in it.",
    "y-intercept": "Where the graph crosses the y-axis: the value at x = 0. For y = mx + b it is b.",
    "Vertex": "The point of the V, (h, k), where an absolute-value graph turns. For y = |x| it is (0, 0).",
    "Starting point": "Where a square-root graph begins, (h, k). Left of it, x − h is negative and has no real square root.",
    "Center": "The point (h, k) the graph is built around: for y = a/(x − h) + k, where its two asymptotes cross; for y = a∛(x − h) + k, the middle of the S.",
    "Asymptotes": "Lines a graph approaches but never reaches. y = a/(x − h) + k has x = h (the fraction is undefined there) and y = k.",
    "x-intercepts": "Where the graph crosses the x-axis, y = 0.",
    "Domain": "Every x the function accepts.",
    "Range": "Every y the function can give back.",
    "Shape": "Which way the graph goes. a (or m) sets steepness; a negative value flips it.",
  };

  const state = { ...config.initial, show: {} };
  document.querySelectorAll("[data-show]").forEach((box) => { state.show[box.dataset.show] = box.checked; });

  const scene = new ManimCanvas($("scene"), { theme: config.theme, view: config.solution.window });
  let timeline = null;

  const point = (x, y) => `(${fmt(x)}, ${fmt(y)})`;
  const swatch = (color) => `<span class="swatch" style="background:${color}"></span>`;

  function renderGlossary() {
    el.glossary.innerHTML = Object.entries(TERMS).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  const rows = (items) => items.map(([id, k, v]) =>
    `<dt data-step="${id}" title="${TERMS[k] || ""}">${k}</dt><dd data-step="${id}">${v}</dd>`).join("");

  function crossings(sol) {
    if (sol.x_intercepts === null) return "every x (the line is the x-axis)";
    if (!sol.x_intercepts.length) return "none";
    return sol.x_intercepts.map((x) => point(x, 0)).join(", ");
  }

  function renderResults(sol) {
    const kp = sol.key_point;
    const keyName = { "y-intercept": "y-intercept", vertex: "Vertex", "starting point": "Starting point" }[kp.name] || "Center";
    const items = [
      ["form", "Function", `${sol.card} ${sol.name}`],
      ["form", "Equation", `<span class="nowrap">${sol.equation}</span>`],
      ["key", keyName, `${swatch(C.key)}${point(kp.x, kp.y)}`],
      ["cross", "x-intercepts", `${swatch(C.x_intercepts)}${crossings(sol)}`],
    ];
    if (kp.name !== "y-intercept") {
      items.push(["cross", "y-intercept", sol.y_intercept === null ? "none (x = 0 is outside the domain)" : `${swatch(C.y_intercept)}${point(0, sol.y_intercept)}`]);
    }
    if (sol.inputs.kind === "reciprocal") items.push(["key", "Asymptotes", `x = ${fmt(kp.x)}, y = ${fmt(kp.y)}`]);
    items.push(["key", "Domain", sol.domain], ["shape", "Range", sol.range], ["shape", "Shape", sol.shape]);
    el.results.innerHTML = rows(items);
  }

  function renderSteps(sol) {
    el.steps.innerHTML = sol.steps.map(({ id, title, math }) =>
      `<li class="steps__item" data-step="${id}"><p class="steps__title">${title}</p><p class="steps__math">${math}</p></li>`).join("");
  }

  function renderPresets() {
    el.presets.innerHTML = PRESETS[state.kind].map(([label], i) =>
      `<button class="btn" type="button" data-preset="${i}">${label}</button>`).join("");
  }

  function highlight(step) {
    el.narration.textContent = step ? step.caption : IDLE;
    document.querySelectorAll("[data-step]").forEach((node) => {
      node.classList.toggle("is-active", !!step && node.dataset.step === step.id);
    });
  }

  /** The graph as a function the canvas can trace; NaN where it is undefined (the canvas skips those). */
  function graph(sol, side = 0) {
    const { kind, m, b, a, h, k } = sol.inputs;
    return (x) => {
      if (side && Math.sign(x - h) !== side) return NaN;   // one branch of a reciprocal at a time
      const y = evaluate(kind, x, m, b, a, h, k);
      return y === null ? NaN : y;
    };
  }

  /** Trace the graph; a reciprocal is two branches, so neither path jumps across its asymptote. */
  function trace(sol, p, color, fn = graph, options) {
    if (sol.inputs.kind !== "reciprocal") { scene.curve(fn(sol), p, color, options); return; }
    scene.curve(fn(sol, -1), p, color, options);
    scene.curve(fn(sol, 1), p, color, options);
  }

  function parentGraph(kind) {
    if (kind === "linear") return (x) => x;
    if (kind === "absolute") return (x) => Math.abs(x);
    if (kind === "cbrt") return (x) => Math.cbrt(x);
    return (x) => (x < 0 ? NaN : Math.sqrt(x));
  }

  // ---- Timeline -------------------------------------------------------------
  function buildTimeline(sol) {
    const show = state.show;
    const { kind } = sol.inputs;
    const kp = sol.key_point;
    const tl = new Timeline(scene, {
      onFrame: (t, total) => { el.scrub.value = total ? Math.round((t / total) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);

    if (show.grid) tl.add({ id: "form", caption: "Set up the axes", duration: 0.8, draw: (p) => scene.grid(p) });
    tl.add({ id: "form", caption: "Set up the axes", duration: 1.0, parallel: show.grid, draw: (p) => scene.axes(p) });
    if (show.parent) {
      tl.add({
        id: "form", caption: `The parent function ${PARENT[kind]}`, duration: 1.0,
        draw: (p) => {
          if (kind !== "reciprocal") { scene.curve(parentGraph(kind), p, C.parent, { width: 2 }); return; }
          scene.curve((x) => (x < 0 ? 1 / x : NaN), p, C.parent, { width: 2 });
          scene.curve((x) => (x > 0 ? 1 / x : NaN), p, C.parent, { width: 2 });
        },
      });
    }
    if (kind === "reciprocal") {
      const v = scene.view;
      tl.add({
        id: "key", caption: `Asymptotes x = ${fmt(kp.x)} and y = ${fmt(kp.y)}`, duration: 0.9,
        draw: (p) => {
          scene.line(kp.x, v.y_min - 50, kp.x, v.y_max + 50, p, C.key, { width: 1.5, dash: [6, 6] });
          scene.line(v.x_min - 50, kp.y, v.x_max + 50, kp.y, p, C.key, { width: 1.5, dash: [6, 6] });
        },
      });
    }
    tl.add({
      id: "key", caption: `${kp.name[0].toUpperCase()}${kp.name.slice(1)}: ${point(kp.x, kp.y)}`, duration: 0.7,
      draw: (p) => {
        scene.dot(kp.x, kp.y, p, C.key);
        if (show.labels) scene.label(`${kp.name} ${point(kp.x, kp.y)}`, kp.x, kp.y, p, C.key, { dx: 10, dy: kind === "absolute" && sol.inputs.a < 0 ? -16 : 22 });
      },
    });
    tl.add({ id: "key", duration: 0.6, parallel: true, rate: rate.linear, draw: (p) => scene.flash(kp.x, kp.y, p, C.key) });
    tl.add({
      id: "shape", caption: `${sol.equation}: ${sol.shape}`, duration: 1.8,
      draw: (p) => trace(sol, p, C.curve),
    });
    if (show.points) {
      const pts = sol.table.filter((r) => r.y !== null);
      tl.add({
        id: "table", caption: `Table: ${pts.map((r) => point(r.x, r.y)).join(", ")}`, duration: 1.0,
        draw: (p) => pts.forEach((r, i) => { if (p > i / pts.length) scene.dot(r.x, r.y, 1, C.points); }),
      });
    }
    if (show.intercepts && sol.x_intercepts && sol.x_intercepts.length) {
      tl.add({
        id: "cross", caption: `x-intercepts: ${crossings(sol)}`, duration: 0.7,
        draw: (p) => sol.x_intercepts.forEach((x) => {
          scene.dot(x, 0, p, C.x_intercepts);
          if (show.labels) scene.label(fmt(x), x, 0, p, C.x_intercepts, { dx: 0, dy: 20, align: "center" });
        }),
      });
    }
    if (show.intercepts && kp.name !== "y-intercept" && sol.y_intercept !== null && !(kp.x === 0 && kp.y === sol.y_intercept)) {
      tl.add({ id: "cross", caption: `y-intercept: ${point(0, sol.y_intercept)}`, duration: 0.5, draw: (p) => scene.dot(0, sol.y_intercept, p, C.y_intercept) });
    }
    return tl;
  }

  // ---- Controls -------------------------------------------------------------
  function setPlaying(playing) { el.play.textContent = playing ? "❚❚ Pause" : "▶ Play"; }

  function syncInputs() {
    document.querySelectorAll('input[name="kind"]').forEach((r) => { r.checked = r.value === state.kind; });
    document.querySelectorAll(".params").forEach((box) => { box.hidden = !box.dataset.for.split(" ").includes(state.kind); });
    for (const key of NUMS) {
      $(`${key}-range`).value = state[key];
      $(`${key}-num`).value = state[key];
    }
    renderPresets();
  }

  function frame(sol, { refit = false } = {}) {
    const pts = sol.table.filter((r) => r.y !== null).map((r) => [r.x, r.y]);
    const target = refit ? view.roomy(sol.window) : view.follow(scene.targetView, sol.window, pts);
    if (!target) return;
    scene.moveTo(target, { onFrame: () => { if (timeline && !timeline.playing) timeline.render(); } });
  }

  function update({ fromConfig = false, refit = false } = {}) {
    if (timeline) timeline.stop();
    setPlaying(false);
    let sol;
    try {
      if (NUMS.some((k) => !Number.isFinite(state[k]))) throw new Error("Enter a number for every value.");
      sol = fromConfig ? config.solution : solve(state.kind, state.m, state.b, state.a, state.h, state.k);
    } catch (err) {
      el.error.textContent = err.message;
      el.error.hidden = false;
      return;
    }
    el.error.hidden = true;
    renderResults(sol);
    renderSteps(sol);
    timeline = buildTimeline(sol);
    timeline.finish();
    frame(sol, { refit });
    PPParams.write({ kind: state.kind, ...Object.fromEntries(NUMS.map((k) => [k, state[k]])) });
  }

  function readHash() {
    const values = PPParams.read(NUMS);
    const kind = new URLSearchParams(location.hash.slice(1)).get("kind");
    if (KINDS.includes(kind)) values.kind = kind;
    Object.assign(state, values);
    return Object.keys(values).length > 0;
  }

  function play() {
    if (!timeline) return;
    el.run.hidden = true;
    timeline.play();
    setPlaying(true);
  }

  document.querySelectorAll('input[name="kind"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      state.kind = radio.value;
      syncInputs();
      update({ refit: true });
    });
  });

  for (const key of NUMS) {
    for (const suffix of ["range", "num"]) {
      $(`${key}-${suffix}`).addEventListener("input", (event) => {
        state[key] = event.target.value === "" ? NaN : Number(event.target.value);
        $(`${key}-${suffix === "range" ? "num" : "range"}`).value = event.target.value;
        update();
      });
    }
  }

  el.presets.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    Object.assign(state, PRESETS[state.kind][Number(button.dataset.preset)][1]);
    syncInputs();
    update({ refit: true });
    play();
  });

  document.querySelectorAll("[data-show]").forEach((box) => {
    box.addEventListener("change", () => { state.show[box.dataset.show] = box.checked; update(); });
  });

  el.play.addEventListener("click", () => {
    if (!timeline) return;
    if (timeline.playing) { timeline.stop(); setPlaying(false); return; }
    el.run.hidden = true;
    timeline.play({ from: timeline.time });
    setPlaying(true);
  });
  el.run.addEventListener("click", play);
  el.finish.addEventListener("click", () => { if (timeline) { timeline.finish(); setPlaying(false); } });
  el.scrub.addEventListener("input", () => { if (timeline) { timeline.seek(el.scrub.value / 1000); setPlaying(false); } });
  el.speed.addEventListener("change", () => { if (timeline) timeline.speed = Number(el.speed.value); });
  scene.onResize = () => { if (timeline) timeline.render(); };

  window.addEventListener("hashchange", () => { if (readHash()) { syncInputs(); update(); } });

  renderGlossary();
  const fromHash = readHash();
  syncInputs();
  update({ fromConfig: !fromHash, refit: true });
})();
