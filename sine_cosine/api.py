"""What this topic publishes to the static API (see general/api).

Frontend usage once deployed:
    PP.call("sine_cosine/sine_cosine", "solve", "sine", 2, 3, 1, 4)
    PP.embed("#el", "sine_cosine/sine_cosine", { kind: "cosine", a: 2, b: 0.5 })
"""

from core import formula
from general.api import JSModule, Page, Topic

from . import solver
from .html.sine_cosine_page import MATH_SCRIPTS, build_sine_cosine_html


def _build_page(output_path, theme=None):
    return build_sine_cosine_html("sine", 2, 1, 0, 0, output_path, theme=theme)


TOPIC = Topic(
    title="Sine & Cosine",
    description="The waves y = a sin(b(x − h)) + k and y = a cos(b(x − h)) + k: amplitude, period, phase shift, midline, peaks and troughs, and one cycle's key points.",
    cards=("F.10", "F.11"),  # flashcards: Sine; Cosine
    modules=(
        JSModule(
            name="sine_cosine",
            global_name="WaveMath",
            scripts=MATH_SCRIPTS,
            functions={
                "solve": solver.solve,
                "evaluate": solver.evaluate,
                "sine": formula.sine,
                "cosine": formula.cosine,
                "amplitude": formula.amplitude,
                "period": formula.period,
                "midline": formula.midline,
            },
        ),
    ),
    pages=(
        Page(
            name="sine_cosine",
            title="Sine & Cosine",
            description="Interactive, Manim-style walkthrough of the sine and cosine waves and how a, b, h and k shape them.",
            build=_build_page,
            params=("kind", "a", "b", "h", "k"),
            example={"kind": "sine", "a": 2, "b": 3, "h": 1, "k": 4},
        ),
    ),
)
