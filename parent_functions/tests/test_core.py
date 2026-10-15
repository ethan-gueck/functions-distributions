import math

import pytest

from core import formula
from parent_functions.solver import equation, solve

CASES = [
    ("linear", 2, 1, 1, 0, 0), ("linear", -0.5, 3, 1, 0, 0), ("linear", 0, 4, 1, 0, 0), ("linear", 0, 0, 1, 0, 0), ("linear", 1, 0, 1, 0, 0),
    ("absolute", 1, 0, 1, 0, 0), ("absolute", 1, 0, -2, 3, 4), ("absolute", 1, 0, 1, 3, -2), ("absolute", 1, 0, 0.5, -2, 0), ("absolute", 1, 0, 1, 0, 2),
    ("sqrt", 1, 0, 1, 0, 0), ("sqrt", 1, 0, 2, 1, -4), ("sqrt", 1, 0, -1, 0, 3), ("sqrt", 1, 0, 1, -4, 0), ("sqrt", 1, 0, 1, 2, 1), ("sqrt", 1, 0, 1.5, 2.5, -1.25),
    ("reciprocal", 1, 0, 1, 0, 0), ("reciprocal", 1, 0, 2, 3, 1), ("reciprocal", 1, 0, -1, 0, 0), ("reciprocal", 1, 0, 4, -2, -2), ("reciprocal", 1, 0, 0.5, 1.5, 0.25),
    ("cbrt", 1, 0, 1, 0, 0), ("cbrt", 1, 0, 2, 1, 2), ("cbrt", 1, 0, -1, 0, 0), ("cbrt", 1, 0, 1, -8, -1), ("cbrt", 1, 0, 1.5, 2.5, -1.25),
]


def test_the_formulas():
    assert formula.linear(3, 2, 1) == 7 and formula.linear_x_intercept(2, -4) == 2
    assert formula.absolute_value(-3) == 3 and formula.absolute_value(1, 2, 3, -4) == 0
    assert formula.absolute_value_vertex(3, -2) == (3, -2)
    assert formula.absolute_value_x_intercepts(2, 3, -4) == (1, 5) and formula.absolute_value_x_intercepts(1, 0, 0) == (0,)
    assert formula.absolute_value_x_intercepts(1, 0, 2) == ()
    assert formula.square_root(9) == 3 and formula.square_root(5, 2, 1, -4) == 0
    assert formula.square_root_domain(-4) == -4
    assert formula.square_root_x_intercept(2, 1, -4) == 5 and formula.square_root_x_intercept(1, 0, 2) is None
    assert formula.reciprocal(2) == 0.5 and formula.reciprocal(4, 2, 3, 1) == 3 and formula.reciprocal_asymptotes(3, 1) == (3, 1)
    assert formula.reciprocal_x_intercept(2, 3, 1) == 1 and formula.reciprocal_x_intercept(1, 0, 0) is None
    assert formula.cube_root(-8) == -2 and formula.cube_root(9, 2, 1, 1) == 5 and formula.cube_root_center(1, 2) == (1, 2)
    assert formula.cube_root_x_intercept(2, 1, 2) == 0


@pytest.mark.parametrize("args", CASES)
def test_intercepts_lie_on_the_graph(args):
    s = solve(*args)
    kind, m, b, a, h, k = args
    f = {"linear": lambda x: formula.linear(x, m, b), "absolute": lambda x: formula.absolute_value(x, a, h, k),
         "sqrt": lambda x: formula.square_root(x, a, h, k), "reciprocal": lambda x: formula.reciprocal(x, a, h, k),
         "cbrt": lambda x: formula.cube_root(x, a, h, k)}[kind]
    for x in s.x_intercepts or []:
        assert f(x) == pytest.approx(0, abs=1e-9)
    for row in s.table:
        if row["y"] is not None:
            assert f(row["x"]) == pytest.approx(row["y"])
    w = s.window
    for row in s.table:
        if row["y"] is not None:
            assert w.x_min <= row["x"] <= w.x_max and w.y_min <= row["y"] <= w.y_max


def test_equations():
    assert equation("linear", 2, 1) == "y = 2x + 1"
    assert equation("linear", -1, -3) == "y = −x − 3"
    assert equation("linear", 0, 4) == "y = 4"
    assert equation("absolute") == "y = |x|"
    assert equation("absolute", a=-2, h=3, k=4) == "y = −2|x − 3| + 4"
    assert equation("sqrt") == "y = √x"
    assert equation("sqrt", a=2, h=-1, k=-4) == "y = 2√(x + 1) − 4"


def test_key_points_domain_and_range():
    s = solve("absolute", a=-2, h=3, k=4)
    assert (s.key_point["x"], s.key_point["y"], s.key_point["name"]) == (3, 4, "vertex")
    assert s.range == "y ≤ 4" and s.domain == "all real numbers" and s.x_intercepts == [1, 5]
    s = solve("sqrt", a=2, h=1, k=-4)
    assert s.key_point["name"] == "starting point" and s.domain == "x ≥ 1" and s.range == "y ≥ −4"
    assert s.y_intercept is None and s.x_intercepts == [5]
    assert [r["x"] for r in s.table] == [1, 2, 5, 10] and [r["y"] for r in s.table] == [-4, -2, 0, 2]
    assert solve("linear", 0, 0).x_intercepts is None and solve("linear", 0, 3).x_intercepts == []


def test_bad_inputs_are_rejected():
    with pytest.raises(ValueError):
        solve("absolute", a=0)
    with pytest.raises(ValueError):
        solve("cubic")
    assert math.isfinite(solve("linear", 0, 5).window.y_max)


def test_reciprocal_and_cube_root():
    s = solve("reciprocal", a=2, h=3, k=1)
    assert s.equation == "y = 2/(x − 3) + 1" and s.domain == "x ≠ 3" and s.range == "y ≠ 1" and s.x_intercepts == [1]
    assert solve("reciprocal").x_intercepts == [] and solve("reciprocal").y_intercept is None
    c = solve("cbrt", a=2, h=1, k=2)
    assert c.equation == "y = 2∛(x − 1) + 2" and c.domain == c.range == "all real numbers"
    assert [r["y"] for r in c.table] == [-2, 0, 2, 4, 6]
