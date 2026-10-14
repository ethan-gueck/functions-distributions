"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("parent_functions/parent_functions", "solve", "absolute", 1, 0, -2, 3, 4)
    PP.embed("#el", "parent_functions/parent_functions", { kind: "sqrt", a: 2, h: 1, k: -4 })
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.parent_functions_page import MATH_SCRIPTS, build_parent_functions_html


def _build_page(output_path, theme=None):
    return build_parent_functions_html("linear", 2, 1, 1, 0, 0, output_path, theme=theme)


TOPIC = Topic(
    title="Linear, Absolute Value & Square Root",
    description="Three parent functions, y = mx + b, y = |x| and y = √x, shifted and stretched: key point, intercepts, domain, range and a table of points.",
    cards=("F.1", "F.4", "F.5"),  # flashcards: Linear; Absolute Value; Square Root
    modules=(
        JSModule(
            name="parent_functions",
            global_name="ParentMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "evaluate": solver.evaluate,
                "linear": formula.linear,
                "linear_x_intercept": formula.linear_x_intercept,
                "absolute_value": formula.absolute_value,
                "absolute_value_vertex": formula.absolute_value_vertex,
                "absolute_value_x_intercepts": formula.absolute_value_x_intercepts,
                "square_root": formula.square_root,
                "square_root_domain": formula.square_root_domain,
                "square_root_x_intercept": formula.square_root_x_intercept,
            },
        ),
    ),
    pages=(
        Page(
            name="parent_functions",
            title="Linear, Absolute Value & Square Root",
            description="Interactive, Manim-style walkthrough of three parent functions and how a, h, k (or m, b) move them.",
            build=_build_page,
            params=("kind", "m", "b", "a", "h", "k"),
            example={"kind": "absolute", "m": 1, "b": 0, "a": -2, "h": 3, "k": 4},
        ),
    ),
)
