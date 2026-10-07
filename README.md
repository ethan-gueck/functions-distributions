# Functions & Distributions

The Functions & Distributions domain of [Ethan's NN](https://ethan-gueck.github.io/#nn): formulas built out as interactive pages, published at **https://ethan-gueck.github.io/functions-distributions/**.

Flashcard decks in this track: Probability Distributions. A neuron on the portfolio fills in once a topic here lists its card id in `cards`, and its **See how it works** button opens the topic's page.

## Repo health

`░░░░░░░░░░░░░░░░░░░░` **<0.01% of 1 GB** (39 KB, GitHub's reported repo size on 2026-10-07)

GitHub Pages publishes at most 1 GB per site and GitHub recommends keeping a repository under 1 GB, so this should stay well below 100%.

## Topics

None yet: every neuron in this track shows its flashcard with **Coming soon**.

## Layout

```
functions-distributions/
├── <topic>/                  one folder per topic
├── core/formula.py           every neuron's mathematics, in flashcard order (empty sections until built)
├── tests/test_site.py        the site builds; topic cards are flashcard ids
├── pyproject.toml            [tool.portfolio-site]: site title and URL
└── .github/workflows/pages.yml   test, build and deploy on every push to main
```

Themes, styles, the page builder and the static API come from the shared [portfolio-projects](https://github.com/ethan-gueck/portfolio-projects) library (`general/`), installed from git.

```bash
uv sync                                   # install into .venv
uv run pytest                             # tests
uv run python -m general serve --port 8001   # build _site/ and preview it at http://localhost:8001
uv lock --upgrade-package portfolio-projects # pick up changes to general/
```
