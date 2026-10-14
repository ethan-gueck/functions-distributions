import json
import re

from parent_functions.html import build_parent_functions_html
from parent_functions.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_parent_functions_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.ParentMath" in document and "window.Manim" in document
    assert 'class="masthead__back"' in document and "theme-toggle" in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    for name in ("linear", "linear-x-intercept", "absolute-value", "absolute-value-vertex", "square-root", "square-root-domain"):
        assert f'id="pp-code-0-{name}"' in dialog
    assert "_clean" not in dialog and "F.2 Quadratic" not in dialog  # only the concept


def test_config_carries_solution_and_roles():
    config = _config(build_parent_functions_html("sqrt", 1, 0, 2, 1, -4, output_path=None))
    assert config["initial"]["kind"] == "sqrt" and config["solution"]["equation"] == "y = 2√(x − 1) − 4"
    assert set(ROLES.values()) <= set(config["theme"]["stage"])
