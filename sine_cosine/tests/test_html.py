import json
import re

from sine_cosine.html import build_sine_cosine_html
from sine_cosine.style import ROLES


def _config(document: str) -> dict:
    return json.loads(re.search(r'<script id="pp-config" type="application/json">(.*?)</script>', document, re.S).group(1))


def test_page_inlines_its_scripts_and_has_the_code_popup():
    document = build_sine_cosine_html(output_path=None)
    assert "{{" not in document and "<script src=" not in document
    assert "window.WaveMath" in document and "window.Manim" in document
    assert 'class="masthead__back"' in document and "theme-toggle" in document
    dialog = document.split('<dialog class="code-modal"')[1].split("</dialog>")[0]
    for name in ("sine", "cosine", "amplitude", "period", "midline"):
        assert f'id="pp-code-0-{name}"' in dialog
    assert 'id="pp-code-0-linear"' not in dialog and "_clean" not in dialog  # only these concepts


def test_config_carries_solution_and_roles():
    config = _config(build_sine_cosine_html("cosine", 3, 2, -1, -1, output_path=None))
    assert config["initial"]["kind"] == "cosine" and config["solution"]["equation"] == "y = 3 cos(2(x + 1)) − 1"
    assert set(ROLES.values()) <= set(config["theme"]["stage"])
