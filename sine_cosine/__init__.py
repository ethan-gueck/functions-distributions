"""F.10 Sine and F.11 Cosine: the waves y = a sin(b(x − h)) + k and y = a cos(b(x − h)) + k.

    solver.py    the page's calculations, built on core/formula.py (F.10, F.11)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve

__all__ = ["solve"]
