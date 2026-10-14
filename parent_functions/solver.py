"""Three parent functions and their shifted, stretched forms, built on core/formula.py.

core/formula.py holds the mathematics as written: F.1 Linear (linear, linear_x_intercept),
F.4 Absolute Value (absolute_value, absolute_value_vertex, absolute_value_x_intercepts) and
F.5 Square Root (square_root, square_root_domain, square_root_x_intercept). This module calls
those and adds what the page needs around them: input checks, float tidying, the equation,
domain, range and shape as text, a table of points and a plot window. The JavaScript mirror
(html/static/parent_functions_math.js) is kept identical by tests/test_js_parity.py.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

from general.plotting import Viewport, fit_viewport

from core import formula

KINDS = ("linear", "absolute", "sqrt")
CARDS = {"linear": "F.1", "absolute": "F.4", "sqrt": "F.5"}
NAMES = {"linear": "Linear", "absolute": "Absolute value", "sqrt": "Square root"}


def _clean(value: float) -> float:
    """Round away float noise (e.g. 1.9999999999 -> 2.0, -0.0 -> 0.0)."""
    rounded = round(value, 10)
    return 0.0 if rounded == 0 else rounded


def fmt(value: float) -> str:
    """Compact human-readable number with a true minus sign: 2.0 -> '2', -0.3333333 -> '−0.3333'."""
    return f"{_clean(value):.4g}".replace("-", "−")


def _coef(value: float) -> str:
    """A coefficient in front of a symbol: 1 -> '', -1 -> '-', 2 -> '2'."""
    v = _clean(value)
    return "" if v == 1 else "−" if v == -1 else fmt(v)


def _signed(value: float) -> str:
    """' + 3' or ' − 3': a term added on the end of an expression."""
    return f" {'−' if value < 0 else '+'} {fmt(abs(value))}"


def _shift(h: float) -> str:
    """'x', 'x − 3' or 'x + 3': the inside of |x − h| or √(x − h)."""
    return "x" if _clean(h) == 0 else f"x{_signed(-h)}"


def _point(x: float, y: float) -> str:
    return f"({fmt(x)}, {fmt(y)})"


def _validate(kind: str, a: float) -> None:
    if kind not in KINDS:
        raise ValueError(f"Unknown function: {kind}. Pick linear, absolute or sqrt.")
    if kind != "linear" and _clean(a) == 0:
        raise ValueError("a cannot be 0: the graph would flatten into the line y = k.")


def evaluate(kind: str, x: float, m: float = 1, b: float = 0, a: float = 1, h: float = 0, k: float = 0) -> float | None:
    """y at x for the chosen function, or None where it is undefined (√ of a negative)."""
    if kind == "linear":
        return _clean(formula.linear(x, m, b))
    if kind == "absolute":
        return _clean(formula.absolute_value(x, a, h, k))
    if x < formula.square_root_domain(h):
        return None
    return _clean(formula.square_root(x, a, h, k))


def equation(kind: str, m: float = 1, b: float = 0, a: float = 1, h: float = 0, k: float = 0) -> str:
    """The function as it is written: y = 2x + 1, y = −|x − 3| + 4, y = √x …"""
    if kind == "linear":
        if _clean(m) == 0:
            return f"y = {fmt(b)}"
        return f"y = {_coef(m)}x" + (_signed(b) if _clean(b) else "")
    inner = f"|{_shift(h)}|" if kind == "absolute" else (f"√({_shift(h)})" if _clean(h) else "√x")
    return f"y = {_coef(a)}{inner}" + (_signed(k) if _clean(k) else "")


def key_point(kind: str, m: float = 1, b: float = 0, a: float = 1, h: float = 0, k: float = 0) -> dict:
    """The point that pins the graph: the y-intercept of a line, the vertex of the V, the start of √."""
    if kind == "linear":
        return {"x": 0.0, "y": _clean(b), "name": "y-intercept"}
    vh, vk = formula.absolute_value_vertex(h, k) if kind == "absolute" else (formula.square_root_domain(h), k)
    return {"x": _clean(vh), "y": _clean(vk), "name": "vertex" if kind == "absolute" else "starting point"}


def x_intercepts(kind: str, m: float = 1, b: float = 0, a: float = 1, h: float = 0, k: float = 0) -> list[float] | None:
    """Where the graph meets the x-axis. None means every x (the line y = 0)."""
    if kind == "linear":
        if _clean(m) == 0:
            return None if _clean(b) == 0 else []
        return [_clean(formula.linear_x_intercept(m, b))]
    if kind == "absolute":
        return [_clean(x) for x in formula.absolute_value_x_intercepts(a, h, k)]
    x = formula.square_root_x_intercept(a, h, k)
    return [] if x is None else [_clean(x)]


def domain(kind: str, h: float = 0) -> str:
    if kind == "sqrt":
        return f"x ≥ {fmt(formula.square_root_domain(h))}"
    return "all real numbers"


def value_range(kind: str, m: float = 1, b: float = 0, a: float = 1, k: float = 0) -> str:
    if kind == "linear":
        return f"only y = {fmt(b)}" if _clean(m) == 0 else "all real numbers"
    return f"y ≥ {fmt(k)}" if a > 0 else f"y ≤ {fmt(k)}"


def shape(kind: str, m: float = 1, a: float = 1, h: float = 0) -> str:
    """Which way the graph goes, in words."""
    if kind == "linear":
        if _clean(m) == 0:
            return "flat: a horizontal line"
        return f"{'rises' if m > 0 else 'falls'} {fmt(abs(m))} for every 1 across"
    if kind == "absolute":
        opens = "opens up" if a > 0 else "opens down"
        return f"{opens}; each arm has slope ±{fmt(abs(a))}, turning at x = {fmt(h)}"
    return f"{'rises' if a > 0 else 'falls'} from x = {fmt(h)}, ever more slowly"


def table_xs(kind: str, h: float = 0) -> list[float]:
    """x-values worth plotting: around the key point, and h + 0, 1, 4, 9 for √ (perfect squares)."""
    if kind == "linear":
        return [-2.0, -1.0, 0.0, 1.0, 2.0]
    if kind == "absolute":
        return [_clean(h + d) for d in (-2, -1, 0, 1, 2)]
    return [_clean(h + d) for d in (0, 1, 4, 9)]


def steps(kind: str, m: float, b: float, a: float, h: float, k: float, table: list[dict], xs: list[float] | None) -> list[dict]:
    """Each formula on the card, worked with these numbers."""
    eq = equation(kind, m, b, a, h, k)
    if xs is None:
        crossing = "every x: the line is the x-axis"
    elif not xs:
        crossing = "none: the graph never reaches y = 0"
    else:
        crossing = ", ".join(f"x = {fmt(x)}" for x in xs)
    rows = ",  ".join(_point(r["x"], r["y"]) for r in table if r["y"] is not None)
    if kind == "linear":
        return [
            {"id": "form", "title": "Slope-intercept form: y = mx + b", "math": f"m = {fmt(m)}, b = {fmt(b)}:  {eq}"},
            {"id": "key", "title": "y-intercept: set x = 0", "math": f"y = {fmt(m)}·0{_signed(b)} = {fmt(b)}, the point {_point(0, b)}"},
            {"id": "shape", "title": "Slope: rise over run", "math": f"m = {fmt(m)}: {shape(kind, m=m)}"},
            {"id": "cross", "title": "x-intercept: set y = 0", "math": (f"x = −b / m = {fmt(-b)} / {fmt(m)}: {crossing}" if _clean(m) else f"m = 0, so {crossing}")},
            {"id": "table", "title": "Plot points", "math": rows},
        ]
    if kind == "absolute":
        return [
            {"id": "form", "title": "y = a|x − h| + k", "math": f"a = {fmt(a)}, h = {fmt(h)}, k = {fmt(k)}:  {eq}"},
            {"id": "key", "title": "Vertex (h, k)", "math": f"the V turns at {_point(h, k)}; for y = |x| it is (0, 0)"},
            {"id": "shape", "title": "The arms", "math": shape(kind, a=a, h=h)},
            {"id": "cross", "title": "x-intercepts: |x − h| = −k / a", "math": crossing},
            {"id": "table", "title": "Plot points", "math": rows},
        ]
    return [
        {"id": "form", "title": "y = a√(x − h) + k", "math": f"a = {fmt(a)}, h = {fmt(h)}, k = {fmt(k)}:  {eq}"},
        {"id": "key", "title": "Domain: x − h ≥ 0", "math": f"x ≥ {fmt(h)}; the graph starts at {_point(h, k)}"},
        {"id": "shape", "title": "Shape", "math": shape(kind, a=a, h=h)},
        {"id": "cross", "title": "x-intercept: √(x − h) = −k / a", "math": crossing},
        {"id": "table", "title": "Plot points (x − h = 0, 1, 4, 9: perfect squares)", "math": rows},
    ]


def plot_window(kind: str, m: float, b: float, a: float, h: float, k: float, table: list[dict], xs: list[float] | None) -> Viewport:
    """Frame the table's points, the key point and any x-intercepts."""
    pts = [r for r in table if r["y"] is not None]
    near = [x for x in (xs or []) if abs(x) <= 50]
    f = lambda x: evaluate(kind, x, m, b, a, h, k) if kind != "sqrt" or x >= h else k  # noqa: E731
    return fit_viewport([r["x"] for r in pts] + near + [0.0], f, always_include_y=[r["y"] for r in pts] + [0.0], padding=0.2)


@dataclass(frozen=True)
class FunctionSolution:
    """Everything the page needs, computed once."""

    inputs: dict
    card: str
    name: str
    equation: str
    key_point: dict
    x_intercepts: list | None
    y_intercept: float | None
    domain: str
    range: str
    shape: str
    table: list
    steps: list
    window: Viewport

    def to_dict(self) -> dict:
        data = asdict(self)
        data["window"] = self.window.to_dict()
        return data


def solve(kind: str, m: float = 1, b: float = 0, a: float = 1, h: float = 0, k: float = 0) -> FunctionSolution:
    """The chosen parent function with these parameters: its key point, intercepts, domain, range and a table."""
    _validate(kind, a)
    table = [{"x": x, "y": evaluate(kind, x, m, b, a, h, k)} for x in table_xs(kind, h)]
    xs = x_intercepts(kind, m, b, a, h, k)
    return FunctionSolution(
        inputs={"kind": kind, "m": m, "b": b, "a": a, "h": h, "k": k},
        card=CARDS[kind],
        name=NAMES[kind],
        equation=equation(kind, m, b, a, h, k),
        key_point=key_point(kind, m, b, a, h, k),
        x_intercepts=xs,
        y_intercept=evaluate(kind, 0.0, m, b, a, h, k),
        domain=domain(kind, h),
        range=value_range(kind, m, b, a, k),
        shape=shape(kind, m, a, h),
        table=table,
        steps=steps(kind, m, b, a, h, k, table, xs),
        window=plot_window(kind, m, b, a, h, k, table, xs),
    )
