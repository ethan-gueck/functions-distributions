/*
 * sine_cosine.js — page controller for the sine and cosine waves.
 *
 * Reads the Python-built config, wires the sine/cosine picker and the a, b, h, k sliders, and turns
 * a solution into a Manim-style Timeline: the axes, the parent wave y = sin x or y = cos x faintly,
 * the midline y = k, the amplitude (midline to peak) and one period marked off, the wave traced left
 * to right, then the five key points of one cycle. The URL hash (#kind=cosine&a=2&b=0.5&h=0&k=1)
 * presets values and is watched, so links and PP.embed(...).set() update the page live.
 */
(function () {
  "use strict";
  const { ManimCanvas, Timeline, rate, view } = window.Manim;
  const { solve, evaluate, fmt } = window.WaveMath;

  const config = JSON.parse(document.getElementById("pp-config").textContent);
  const C = Object.fromEntries(Object.entries(config.roles).map(([el, role]) => [el, config.theme.stage[role]]));
  const NUMS = ["a", "b", "h", "k"];
  const KINDS = ["sine", "cosine"];

  const $ = (id) => document.getElementById(id);
  const el = {
    play: $("play"), finish: $("finish"), scrub: $("scrub"), speed: $("speed"), narration: $("narration"),
    results: $("results"), steps: $("steps"), error: $("error"), run: $("run"), glossary: $("glossary"), presets: $("presets"),
  };
  const IDLE = "Press run to animate.";

  const PRESETS = {
    sine: [["y = sin x", { a: 1, b: 1, h: 0, k: 0 }], ["y = 2 sin x", { a: 2, b: 1, h: 0, k: 0 }], ["y = sin(2x)", { a: 1, b: 2, h: 0, k: 0 }], ["y = 2 sin(3(x − 1)) + 4", { a: 2, b: 3, h: 1, k: 4 }]],
    cosine: [["y = cos x", { a: 1, b: 1, h: 0, k: 0 }], ["y = −cos x", { a: -1, b: 1, h: 0, k: 0 }], ["y = cos(0.5x) + 1", { a: 1, b: 0.5, h: 0, k: 1 }], ["y = 3 cos(2(x + 1)) − 1", { a: 3, b: 2, h: -1, k: -1 }]],
  };
  const TERMS = {
    "Equation": "The wave with these numbers in it.",
    "Amplitude": "|a|: half the height of the wave, from its midline up to a peak (or down to a trough).",
    "Period": "2π / |b|: how far x travels in one full cycle. For y = sin x and y = cos x it is 2π ≈ 6.283.",
    "Phase shift": "h: how far right the cycle starts. sin starts on its midline, cos at a peak.",
    "Midline": "y = k: the line the wave swings around, halfway between its peaks and troughs.",
    "Peak, trough": "The highest value k + |a| and the lowest k − |a|.",
    "y-intercept": "The wave's value at x = 0. For y = sin x it is sin 0 = 0; for y = cos x, cos 0 = 1.",
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

  function renderResults(sol) {
    el.results.innerHTML = rows([
      ["form", "Function", `${sol.card} ${sol.name}`],
      ["form", "Equation", `<span class="nowrap">${sol.equation}</span>`],
      ["amplitude", "Amplitude", `${swatch(C.amplitude)}${fmt(sol.amplitude)}`],
      ["period", "Period", `${swatch(C.period)}${fmt(sol.period)}`],
      ["shift", "Phase shift", `h = ${fmt(sol.phase_shift)}`],
      ["shift", "Midline", `${swatch(C.midline)}y = ${fmt(sol.midline)}`],
      ["shift", "Peak, trough", `y = ${fmt(sol.maximum)}, y = ${fmt(sol.minimum)}`],
      ["form", "y-intercept", point(0, sol.y_intercept)],
    ]);
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

  // ---- Timeline -------------------------------------------------------------
  function buildTimeline(sol) {
    const show = state.show;
    const { kind, a, b, h, k } = sol.inputs;
    const v = scene.view;
    const tl = new Timeline(scene, {
      onFrame: (t, total) => { el.scrub.value = total ? Math.round((t / total) * 1000) : 1000; },
      onStep: highlight,
      onDone: () => setPlaying(false),
    });
    tl.speed = Number(el.speed.value);

    if (show.grid) tl.add({ id: "form", caption: "Set up the axes", duration: 0.8, draw: (p) => scene.grid(p) });
    tl.add({ id: "form", caption: "Set up the axes", duration: 1.0, parallel: show.grid, draw: (p) => scene.axes(p) });
    if (show.parent) {
      const parent = kind === "sine" ? Math.sin : Math.cos;
      tl.add({ id: "form", caption: `The parent wave y = ${kind === "sine" ? "sin" : "cos"} x`, duration: 1.0,
        draw: (p) => scene.curve(parent, p, C.parent, { width: 2 }) });
    }
    if (show.midline) {
      tl.add({ id: "shift", caption: `Midline y = ${fmt(k)}`, duration: 0.8,
        draw: (p) => {
          scene.line(v.x_min - 50, k, v.x_max + 50, k, p, C.midline, { width: 1.5, dash: [6, 6] });
          if (show.labels) scene.label(`y = ${fmt(k)}`, v.x_max, k, p, C.midline, { dx: -8, dy: -10, align: "right", size: 13 });
        } });
    }
    tl.add({ id: "form", caption: `${sol.equation}`, duration: 1.8, draw: (p) => scene.curve((x) => evaluate(kind, x, a, b, h, k), p, C.curve) });

    if (show.measures) {
      // Amplitude: from the midline up to the first peak of the cycle.
      const peak = sol.key_points.find((pt) => pt.name === "peak") || sol.key_points[1];
      tl.add({ id: "amplitude", caption: `Amplitude |a| = ${fmt(sol.amplitude)}: midline to peak`, duration: 0.9,
        draw: (p) => {
          scene.line(peak.x, k, peak.x, k + (peak.y - k) * p, 1, C.amplitude, { width: 3.5 });
          if (show.labels && p > 0.6) scene.label(`|a| = ${fmt(sol.amplitude)}`, peak.x, (k + peak.y) / 2, (p - 0.6) / 0.4, C.amplitude, { dx: 10, dy: 0 });
        } });
      // Period: one full cycle, from the start of the cycle along the midline.
      const y0 = sol.minimum - (sol.maximum - sol.minimum) * 0.12;
      tl.add({ id: "period", caption: `Period 2π / |b| = ${fmt(sol.period)}: one full cycle`, duration: 1.1,
        draw: (p) => {
          scene.line(h, y0, h + sol.period * p, y0, 1, C.period, { width: 3.5 });
          scene.line(h, y0 - 0.12, h, y0 + 0.12, 1, C.period, { width: 2 });
          if (p >= 1) scene.line(h + sol.period, y0 - 0.12, h + sol.period, y0 + 0.12, 1, C.period, { width: 2 });
          if (show.labels && p > 0.6) scene.label(`period ${fmt(sol.period)}`, h + sol.period / 2, y0, (p - 0.6) / 0.4, C.period, { dx: 0, dy: 18, align: "center" });
        } });
    }
    if (show.points) {
      const pts = sol.key_points;
      tl.add({ id: "points", caption: `Key points: ${pts.map((pt) => `${point(pt.x, pt.y)} ${pt.name}`).join(", ")}`, duration: 1.2,
        draw: (p) => pts.forEach((pt, i) => {
          if (p <= i / pts.length) return;
          scene.dot(pt.x, pt.y, 1, C.points);
          if (show.labels && pt.name !== "midline") scene.label(pt.name, pt.x, pt.y, 1, C.points, { dx: 0, dy: pt.name === "peak" ? -14 : 22, align: "center", size: 12 });
        }) });
    }
    return tl;
  }

  // ---- Controls -------------------------------------------------------------
  function setPlaying(playing) { el.play.textContent = playing ? "❚❚ Pause" : "▶ Play"; }

  function syncInputs() {
    document.querySelectorAll('input[name="kind"]').forEach((r) => { r.checked = r.value === state.kind; });
    for (const key of NUMS) {
      $(`${key}-range`).value = state[key];
      $(`${key}-num`).value = state[key];
    }
    renderPresets();
  }

  function frame(sol, { refit = false } = {}) {
    const pts = sol.key_points.map((pt) => [pt.x, pt.y]);
    const target = refit ? view.roomy(sol.window) : view.follow(scene.targetView, sol.window, pts);
    if (!target) return;
    scene.moveTo(target, { onFrame: () => { if (timeline && !timeline.playing) timeline.render(); } });
  }

  function update({ fromConfig = false, refit = false } = {}) {
    if (timeline) timeline.stop();
    setPlaying(false);
    let sol;
    try {
      if (NUMS.some((key) => !Number.isFinite(state[key]))) throw new Error("Enter a number for a, b, h and k.");
      sol = fromConfig ? config.solution : solve(state.kind, state.a, state.b, state.h, state.k);
    } catch (err) {
      el.error.textContent = err.message;
      el.error.hidden = false;
      return;
    }
    el.error.hidden = true;
    renderResults(sol);
    renderSteps(sol);
    if (refit) scene.setView(view.roomy(sol.window));
    timeline = buildTimeline(sol);
    timeline.finish();
    frame(sol, { refit });
    PPParams.write({ kind: state.kind, ...Object.fromEntries(NUMS.map((key) => [key, state[key]])) });
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
