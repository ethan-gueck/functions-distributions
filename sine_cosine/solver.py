"""The sine and cosine waves y = a sin(b(x − h)) + k and y = a cos(b(x − h)) + k, built on core/formula.py.

core/formula.py holds the mathematics as written: F.10 Sine (sine, amplitude, period, midline) and
F.11 Cosine (cosine). This module calls those and adds what the page needs around them: input checks,
float tidying, the equation as text, the peak and trough, the five key points of one cycle, each
formula worked with the numbers, and a plot window. The JavaScript mirror
(html/static/sine_cosine_math.js) is kept identical by tests/test_js_parity.py.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

from general.plotting import Viewport, fit_viewport

from core import formula

KINDS = ("sine", "cosine")
CARDS = {"sine": "F.10", "cosine": "F.11"}
NAMES = {"sine": "Sine", "cosine": "Cosine"}
FN = {"sine": "sin", "cosine": "cos"}


def _clean(value: float) -> float:
    """Round away float noise (e.g. 1.9999999999 -> 2.0, -0.0 -> 0.0)."""
    rounded = round(value, 10)
    return 0.0 if rounded == 0 else rounded


def fmt(value: float) -> str:
    """Compact human-readable number with a true minus sign: 2.0 -> '2', -0.3333333 -> '−0.3333'."""
    return f"{_clean(value):.4g}".replace("-", "−")


def _signed(value: float) -> str:
    return f" {'−' if value < 0 else '+'} {fmt(abs(value))}"


def _point(x: float, y: float) -> str:
    return f"({fmt(x)}, {fmt(y)})"


def validate(kind: str, a: float, b: float) -> None:
    if kind not in KINDS:
        raise ValueError(f"Unknown function: {kind}. Pick sine or cosine.")
    if _clean(a) == 0:
        raise ValueError("a cannot be 0: the wave would flatten into the line y = k.")
    if _clean(b) == 0:
        raise ValueError("b cannot be 0: the wave would never repeat (its period 2π / |b| would be infinite).")


def evaluate(kind: str, x: float, a: float = 1, b: float = 1, h: float = 0, k: float = 0) -> float:
    if kind == "sine":
        return _clean(formula.sine(x, a, b, h, k))
    return _clean(formula.cosine(x, a, b, h, k))


def equation(kind: str, a: float = 1, b: float = 1, h: float = 0, k: float = 0) -> str:
    """y = sin x, y = 2 sin(3(x − 1)) + 4 …"""
    shifted = "x" if _clean(h) == 0 else f"(x{_signed(-h)})"
    if _clean(b) == 1:
        inside = shifted
    elif _clean(b) == -1:
        inside = f"−{shifted}"
    else:
        inside = f"{fmt(b)}{shifted}"
    arg = "x" if inside == "x" else f"({inside})" if not inside.startswith("(") else inside
    lead = "" if _clean(a) == 1 else "−" if _clean(a) == -1 else f"{fmt(a)} "
    return f"y = {lead}{FN[kind]} {arg}".replace(f"{FN[kind]} (", f"{FN[kind]}(") + (_signed(k) if _clean(k) else "")


def key_points(kind: str, a: float, b: float, h: float, k: float) -> list[dict]:
    """The five points of one cycle from x = h: every quarter period, a midline crossing, a peak or a trough."""
    quarter = formula.period(b) / 4
    out = []
    for j in range(5):
        x = _clean(h + j * quarter)
        y = evaluate(kind, x, a, b, h, k)
        name = "peak" if _clean(y - k) > 0 else "trough" if _clean(y - k) < 0 else "midline"
        out.append({"x": x, "y": y, "name": name})
    return out


def steps(kind: str, a: float, b: float, h: float, k: float, amp: float, per: float, points: list[dict]) -> list[dict]:
    """Each formula on the card, with these numbers in it."""
    rising = (a > 0) == (b > 0)  # sine leaves its midline going up unless a or b flips it
    start = f"on the midline, going {'up' if rising else 'down'}" if kind == "sine" else f"at a {points[0]['name']}"
    return [
        {"id": "form", "title": f"y = a {FN[kind]}(b(x − h)) + k", "math": f"a = {fmt(a)}, b = {fmt(b)}, h = {fmt(h)}, k = {fmt(k)}:  {equation(kind, a, b, h, k)}"},
        {"id": "amplitude", "title": "Amplitude: |a|", "math": f"|{fmt(a)}| = {fmt(amp)}: the wave reaches {fmt(amp)} above and below its midline" + (", flipped over (a < 0)" if a < 0 else "")},
        {"id": "period", "title": "Period: 2π / |b|", "math": f"2π / |{fmt(b)}| = {fmt(per)}: one full cycle every {fmt(per)} across"},
        {"id": "shift", "title": "Phase shift h and midline y = k", "math": f"the cycle starts at x = {fmt(h)}, {start}; midline y = {fmt(k)}, peaks at y = {fmt(k + amp)}, troughs at y = {fmt(k - amp)}"},
        {"id": "points", "title": "Key points, every quarter period", "math": ",  ".join(f"{_point(p['x'], p['y'])} {p['name']}" for p in points)},
    ]


def plot_window(kind: str, a: float, b: float, h: float, k: float, per: float) -> Viewport:
    """Two full cycles from just before the start, with the peaks, troughs and the x-axis in view."""
    amp = abs(a)
    return fit_viewport([h - per / 4, h + 2 * per, 0.0], lambda x: evaluate(kind, x, a, b, h, k),
                        always_include_y=[k + amp, k - amp, 0.0], padding=0.05)


@dataclass(frozen=True)
class WaveSolution:
    """Everything the page needs, computed once."""

    inputs: dict
    card: str
    name: str
    equation: str
    amplitude: float
    period: float
    phase_shift: float
    midline: float
    maximum: float
    minimum: float
    y_intercept: float
    key_points: list
    steps: list
    window: Viewport

    def to_dict(self) -> dict:
        data = asdict(self)
        data["window"] = self.window.to_dict()
        return data


def solve(kind: str, a: float = 1, b: float = 1, h: float = 0, k: float = 0) -> WaveSolution:
    """The chosen wave: amplitude, period, phase shift, midline, extremes and one cycle's key points."""
    validate(kind, a, b)
    amp = _clean(formula.amplitude(a))
    per = _clean(formula.period(b))
    mid = _clean(formula.midline(k))
    points = key_points(kind, a, b, h, k)
    return WaveSolution(
        inputs={"kind": kind, "a": a, "b": b, "h": h, "k": k},
        card=CARDS[kind],
        name=NAMES[kind],
        equation=equation(kind, a, b, h, k),
        amplitude=amp,
        period=per,
        phase_shift=_clean(h),
        midline=mid,
        maximum=_clean(mid + amp),
        minimum=_clean(mid - amp),
        y_intercept=evaluate(kind, 0.0, a, b, h, k),
        key_points=points,
        steps=steps(kind, a, b, h, k, amp, per, points),
        window=plot_window(kind, a, b, h, k, per),
    )
