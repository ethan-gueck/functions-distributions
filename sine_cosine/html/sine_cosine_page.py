"""Interactive page: the sine and cosine waves, with amplitude, period, phase shift and midline."""

from __future__ import annotations

from pathlib import Path

from general.styles import WIDGET
from general.themes import Theme
from general.web import CodeFile, render_page, write_page

from ..solver import solve
from ..style import ROLES

HTML_DIR = Path(__file__).resolve().parent
STATIC = HTML_DIR / "static"
TEMPLATE = HTML_DIR / "templates" / "sine_cosine.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "sine_cosine.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the track's mathematics, one section per neuron

MATH_SCRIPTS = (STATIC / "sine_cosine_math.js",)
BUNDLE = WIDGET.extend(css=[STATIC / "sine_cosine.css"], js=[*MATH_SCRIPTS, STATIC / "sine_cosine.js"])
# The "View the code" popup shows only the concept: the F.10 and F.11 sections of core/formula.py.
MATH = ("sine", "amplitude", "period", "midline", "cosine")
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("grid", "Grid"), ("labels", "Labels"), ("parent", "Parent wave"), ("midline", "Midline"), ("measures", "Amplitude and period"), ("points", "Key points"))
CODE = (CodeFile(FORMULA, "Sine and cosine in Python: y = a sin(b(x − h)) + k, amplitude |a|, period 2π / |b|, midline y = k.", only=MATH),)


def build_sine_cosine_html(
    kind: str = "sine",
    a: float = 2,
    b: float = 1,
    h: float = 0,
    k: float = 0,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    *,
    theme: str | Theme | None = None,
    title: str = "Sine & Cosine",
) -> Path | str:
    """Build the page with these values preloaded; ``output_path=None`` returns the HTML."""
    config = {
        "initial": {"kind": kind, "a": a, "b": b, "h": h, "k": k},
        "solution": solve(kind, a, b, h, k).to_dict(),
        "roles": ROLES,
    }
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
