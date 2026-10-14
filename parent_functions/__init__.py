"""F.1 Linear, F.4 Absolute Value and F.5 Square Root: three parent functions, shifted and stretched.

    solver.py    the page's calculations, built on core/formula.py (F.1, F.4, F.5)
    html/        interactive page built on solver.py + general.web / general.styles
    style.py     maps this topic's elements onto general theme roles
    api.py       what this topic publishes to the static API (PP.use / PP.embed)
"""

from .solver import solve

__all__ = ["solve"]
