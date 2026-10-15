import math

import pytest

from core import formula
from sine_cosine.solver import equation, solve

CASES = [
    ("sine", 1, 1, 0, 0), ("cosine", 1, 1, 0, 0), ("sine", 2, 3, 1, 4), ("cosine", -1, 0.5, 0, -1), ("sine", 1, -1, 0, 0),
    ("sine", -2, 1, 0, 0), ("cosine", 3, 2, -1, -1), ("sine", 0.5, 0.25, 2.5, 1.5), ("cosine", 1.5, -2, 0.75, 0),
]


def test_the_formulas():
    assert formula.sine(math.pi / 2) == pytest.approx(1) and formula.sine(0) == 0
    assert formula.cosine(0) == 1 and formula.cosine(math.pi) == pytest.approx(-1)
    assert formula.amplitude(-3) == 3 and formula.period(2) == pytest.approx(math.pi) and formula.midline(4) == 4
    assert formula.sine(1, 2, 3, 1, 4) == 4  # the cycle starts on its midline at x = h


@pytest.mark.parametrize("args", CASES)
def test_a_cycle(args):
    s = solve(*args)
    kind, a, b, h, k = args
    assert s.amplitude == pytest.approx(abs(a)) and s.period == pytest.approx(2 * math.pi / abs(b))
    assert s.maximum == pytest.approx(k + abs(a)) and s.minimum == pytest.approx(k - abs(a))
    first, last = s.key_points[0], s.key_points[-1]
    assert first["y"] == pytest.approx(last["y"])  # one full period apart
    assert {p["name"] for p in s.key_points} == {"peak", "trough", "midline"}
    w = s.window
    assert w.y_min <= s.minimum and s.maximum <= w.y_max


def test_equations_and_steps():
    assert equation("sine") == "y = sin x" and equation("cosine") == "y = cos x"
    assert equation("sine", 2, 3, 1, 4) == "y = 2 sin(3(x − 1)) + 4"
    assert equation("cosine", -1, 0.5, 0, -1) == "y = −cos(0.5x) − 1"
    assert equation("sine", 1, -1) == "y = sin(−x)" and equation("sine", 1, 1, -2) == "y = sin(x + 2)"
    s = solve("sine", 2, 3, 1, 4)
    assert s.steps[1]["math"].startswith("|2| = 2") and s.steps[2]["math"].startswith("2π / |3| = 2.094")
    assert "going up" in s.steps[3]["math"] and "going down" in solve("sine", -1).steps[3]["math"]
    assert solve("cosine").y_intercept == 1 and solve("sine").y_intercept == 0


def test_bad_inputs_are_rejected():
    for args in (("sine", 0, 1), ("cosine", 1, 0), ("tangent", 1, 1)):
        with pytest.raises(ValueError):
            solve(*args)
