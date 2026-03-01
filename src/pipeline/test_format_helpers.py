"""Unit tests for response_parser formatting helpers."""
import pytest
from src.pipeline.response_parser import (
    _format_tnm_stage,
    _format_evolution_field,
)


# ── _format_tnm_stage ──────────────────────────────────────────────────

class TestFormatTnmStage:
    def test_dict_input(self):
        val = {
            "T": "T2. Some justification.",
            "N": "N3. Metastases.",
            "M": "M1b. Distant.",
            "stage_grouping": "Stade IVB.",
            "note": "Computational suggestion.",
        }
        result = _format_tnm_stage(val)
        assert "T : T2." in result
        assert "N : N3." in result
        assert "M : M1b." in result
        assert "Classification : Stade IVB." in result
        assert "Note : Computational" in result

    def test_plain_string_passthrough(self):
        s = "Not enough information to determine robustly"
        assert _format_tnm_stage(s) == s

    def test_empty_returns_na(self):
        assert _format_tnm_stage("") == "N/A"
        assert _format_tnm_stage(None) == "N/A"


# ── _format_evolution_field ────────────────────────────────────────────

class TestFormatEvolutionField:
    def test_dict_with_nested_lesions(self):
        val = {
            "masse_parahilaire_droite": {
                "description": "Masse parahilaire centrale",
                "evolution": "Stabilité sans changement",
                "comparaison": "Non mesurable précisément",
            }
        }
        result = _format_evolution_field(val)
        assert "Masse parahilaire droite" in result
        assert "Masse parahilaire centrale" in result
        assert "Stabilité sans changement" in result
        assert "Non mesurable" in result

    def test_plain_string_passthrough(self):
        s = "Stable pulmonary lesions with no change"
        assert _format_evolution_field(s) == s

    def test_empty_string(self):
        assert _format_evolution_field("") == ""