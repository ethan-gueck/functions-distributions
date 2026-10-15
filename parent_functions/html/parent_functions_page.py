"""Interactive page: five parent functions (linear, absolute value, square root, reciprocal, cube root), moved and stretched."""

from __future__ import annotations

from pathlib import Path

from general.styles import WIDGET
from general.themes import Theme
from general.web import CodeFile, render_page, write_page

from ..solver import solve
from ..style import ROLES

HTML_DIR = Path(__file__).resolve().parent
STATIC = HTML_DIR / "static"
TEMPLATE = HTML_DIR / "templates" / "parent_functions.html"
DEFAULT_OUTPUT = HTML_DIR.parent / "output" / "parent_functions.html"
FORMULA = HTML_DIR.parent.parent / "core" / "formula.py"  # the track's mathematics, one section per neuron

MATH_SCRIPTS = (STATIC / "parent_functions_math.js",)
BUNDLE = WIDGET.extend(css=[STATIC / "parent_functions.css"], js=[*MATH_SCRIPTS, STATIC / "parent_functions.js"])
# The "View the code" popup shows only the concept: the F.1, F.4, F.5, F.6 and F.19 sections of core/formula.py.
MATH = (
    "linear", "linear_x_intercept",
    "absolute_value", "absolute_value_vertex", "absolute_value_x_intercepts",
    "square_root", "square_root_domain", "square_root_x_intercept",
    "reciprocal", "reciprocal_asymptotes", "reciprocal_x_intercept",
    "cube_root", "cube_root_center", "cube_root_x_intercept",
)
# The animation's toggles, in the gear menu in the corner of the stage.
SHOW = (("grid", "Grid"), ("labels", "Labels"), ("parent", "Parent function"), ("points", "Table points"), ("intercepts", "Intercepts"))
CODE = (CodeFile(FORMULA, "The parent functions in Python: y = mx + b, y = a|x − h| + k, y = a√(x − h) + k, y = a/(x − h) + k and y = a∛(x − h) + k.", only=MATH),)


def build_parent_functions_html(
    kind: str = "linear",
    m: float = 2,
    b: float = 1,
    a: float = 1,
    h: float = 0,
    k: float = 0,
    output_path: str | Path | None = DEFAULT_OUTPUT,
    *,
    theme: str | Theme | None = None,
    title: str = "Parent Functions",
) -> Path | str:
    """Build the page with these values preloaded; ``output_path=None`` returns the HTML."""
    config = {
        "initial": {"kind": kind, "m": m, "b": b, "a": a, "h": h, "k": k},
        "solution": solve(kind, m, b, a, h, k).to_dict(),
        "roles": ROLES,
    }
    document = render_page(TEMPLATE, title=title, config=config, theme=theme, bundle=BUNDLE, code=CODE, show=SHOW)
    return document if output_path is None else write_page(document, output_path)
