"""Functions & Distributions: the mathematics behind every neuron in this track, in flashcard order."""

import math

# ============= Functions =============

# _____________ F.1 Linear _____________

def linear(x, m, b):
    """y = mx + b: a straight line with slope m and y-intercept b."""
    return m * x + b

def linear_x_intercept(m, b):
    """x = −b / m: where the line crosses the x-axis. A flat line (m = 0) never does, unless b = 0."""
    return -b / m

# _____________ F.2 Quadratic _____________

# _____________ F.3 Cubic _____________

# _____________ F.4 Absolute Value _____________

def absolute_value(x, a=1, h=0, k=0):
    """y = a|x − h| + k: the V of y = |x|, stretched by a and moved so its vertex sits at (h, k)."""
    return a * abs(x - h) + k

def absolute_value_vertex(h=0, k=0):
    """(h, k): the point of the V, where the graph turns. For y = |x| it is (0, 0)."""
    return h, k

def absolute_value_x_intercepts(a, h, k):
    """x = h ± (−k / a): where the V crosses the x-axis. It only reaches the axis when −k / a ≥ 0."""
    d = -k / a
    if d < 0:
        return ()
    if d == 0:
        return (h,)
    return (h - d, h + d)

# _____________ F.5 Square Root _____________

def square_root(x, a=1, h=0, k=0):
    """y = a√(x − h) + k: half of a sideways parabola, starting at (h, k). For y = √x it starts at (0, 0)."""
    return a * math.sqrt(x - h) + k

def square_root_domain(h=0):
    """x ≥ h: the square root of a negative number is not a real number, so the graph starts at x = h."""
    return h

def square_root_x_intercept(a, h, k):
    """x = h + (k / a)²: where the curve crosses the x-axis. It only reaches the axis when −k / a ≥ 0."""
    if -k / a < 0:
        return None
    return h + (k / a) ** 2

# _____________ F.6 Reciprocal _____________

def reciprocal(x, a=1, h=0, k=0):
    """y = a / (x − h) + k: the hyperbola y = 1/x, stretched by a and moved so its asymptotes are x = h and y = k."""
    return a / (x - h) + k

def reciprocal_asymptotes(h=0, k=0):
    """x = h and y = k: the lines the graph approaches but never touches. For y = 1/x they are the axes, x = 0 and y = 0."""
    return h, k

def reciprocal_x_intercept(a, h, k):
    """x = h − a / k: where the curve crosses the x-axis. With k = 0 the x-axis is the asymptote, so it never does."""
    if k == 0:
        return None
    return h - a / k

# _____________ F.7 Exponential Growth _____________

# _____________ F.8 Exponential Decay _____________

# _____________ F.9 Natural Logarithm _____________

# _____________ F.10 Sine _____________

def sine(x, a=1, b=1, h=0, k=0):
    """y = a sin(b(x − h)) + k: the sine wave, with amplitude |a|, period 2π / |b|, moved right by h and up by k. sin 0 = 0."""
    return a * math.sin(b * (x - h)) + k

def amplitude(a):
    """|a|: half the height of the wave, from its midline to a peak."""
    return abs(a)

def period(b):
    """2π / |b|: how far x travels in one full cycle. For y = sin x and y = cos x it is 2π."""
    return 2 * math.pi / abs(b)

def midline(k):
    """y = k: the line the wave oscillates around, halfway between its peaks and troughs."""
    return k

# _____________ F.11 Cosine _____________

def cosine(x, a=1, b=1, h=0, k=0):
    """y = a cos(b(x − h)) + k: the same wave as sine, a quarter period earlier, cos x = sin(x + π/2). cos 0 = 1."""
    return a * math.cos(b * (x - h)) + k

# _____________ F.12 Tangent _____________

# _____________ F.13 Arctangent _____________

# _____________ F.14 Logistic Sigmoid _____________

# _____________ F.15 Hyperbolic Tangent _____________

# _____________ F.16 ReLU _____________

# _____________ F.17 Gaussian (Bell Curve) _____________

# _____________ F.18 Floor (Step) Function _____________

# _____________ F.19 Cube Root _____________

def cube_root(x, a=1, h=0, k=0):
    """y = a∛(x − h) + k: unlike √, the cube root accepts every real number, so ∛(−8) = −2. For y = ∛x = x^(1/3)."""
    return a * math.cbrt(x - h) + k

def cube_root_center(h=0, k=0):
    """(h, k): the middle of the S, where the curve is vertical for an instant. For y = ∛x it is (0, 0)."""
    return h, k

def cube_root_x_intercept(a, h, k):
    """x = h + (−k / a)³: where the curve crosses the x-axis. An odd root always crosses, exactly once."""
    return h + (-k / a) ** 3

# _____________ F.20 Even vs. Odd Powers _____________

# _____________ F.21 Exponential Family _____________

# _____________ F.22 Logarithm Bases _____________

# _____________ F.23 Sinusoid with Phase Shift _____________

# _____________ F.24 Secant _____________

# _____________ F.25 Hyperbolic Sine & Cosine _____________

# _____________ F.26 Softplus _____________

# _____________ F.27 Heaviside Step _____________

# _____________ F.28 Sign Function _____________

# _____________ F.29 Sawtooth (Fractional Part) _____________

# _____________ F.30 Logistic Growth _____________

# _____________ F.31 Power Law _____________

# _____________ F.32 Piecewise Function _____________

# _____________ F.33 Circle _____________

# _____________ F.34 Ellipse _____________

# _____________ F.35 Hyperbola _____________

# _____________ F.36 Polar Rose _____________

# ============= Probability Distributions =============

# _____________ D.1 Bernoulli _____________

# _____________ D.2 Binomial _____________

# _____________ D.3 Geometric _____________

# _____________ D.4 Poisson _____________

# _____________ D.5 Uniform (Continuous) _____________

# _____________ D.6 Normal _____________

# _____________ D.7 Student’s t (vs. normal) _____________

# _____________ D.8 Exponential _____________

# _____________ D.9 Gamma _____________

# _____________ D.10 Beta _____________

# _____________ D.11 Chi-Square _____________

# _____________ D.12 Log-Normal _____________

# _____________ D.13 Pareto (Power Law) _____________

# _____________ D.14 Negative Binomial _____________

# _____________ D.15 Hypergeometric _____________

# _____________ D.16 Discrete Uniform _____________

# _____________ D.17 Weibull _____________

# _____________ D.18 Laplace (vs. normal) _____________

# _____________ D.19 Cauchy (vs. normal) _____________

# _____________ D.20 F-Distribution _____________

# _____________ D.21 Beta Shapes _____________
