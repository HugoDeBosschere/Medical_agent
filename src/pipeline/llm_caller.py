import sys
from pathlib import Path

# Add NPR directory so we can import mistral_call / ollama_call
_NPR_DIR = str(Path(__file__).resolve().parent.parent / "npr")
if _NPR_DIR not in sys.path:
    sys.path.insert(0, _NPR_DIR)

from mistral_call import call_mistral_generate, MISTRAL_DEFAULT_MODEL  # noqa: E402
from ollama_call import call_ollama_generate, ensure_ollama_ready, MODEL as OLLAMA_MODEL  # noqa: E402


def call_llm(prompt: str) -> str:
    """Call Mistral API for final report generation, with Ollama fallback."""
    try:
        print("[pipeline] Trying Mistral API for final report...")
        return call_mistral_generate(prompt, MISTRAL_DEFAULT_MODEL)
    except Exception as e:
        print(f"[pipeline] Mistral failed ({e}), falling back to Ollama...")

    ensure_ollama_ready()
    return call_ollama_generate(prompt, OLLAMA_MODEL)
