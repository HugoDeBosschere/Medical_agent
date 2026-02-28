import os
import requests
from pathlib import Path

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_DEFAULT_MODEL = "mistral-small-latest"

PATH_API_KEY = Path(__file__).parent / "api_key.txt"

try:
    # Read API key
    with open(PATH_API_KEY, "r") as f:
        api_key = f.read().strip()
    print("\nAPI Key file found.")
    os.environ["MISTRAL_API_KEY"] = api_key
except:
    pass

def get_api_key():
    """Retrieve the Mistral API key from the MISTRAL_API_KEY environment variable."""
    key = os.environ.get("MISTRAL_API_KEY")
    if not key:
        raise RuntimeError(
            "MISTRAL_API_KEY environment variable is not set. "
            "Export it before running: export MISTRAL_API_KEY=your_key"
        )
    return key


def call_mistral_generate(prompt: str, model: str = MISTRAL_DEFAULT_MODEL) -> str:
    """Call the Mistral API to generate text.

    Args:
        prompt: The prompt to send.
        model: The Mistral model to use.

    Returns:
        The generated text.
    """
    api_key = get_api_key()
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
    }

    print(f"[mistral] Sending prompt to model '{model}' ({len(prompt)} chars) ...")
    resp = requests.post(MISTRAL_API_URL, headers=headers, json=payload, timeout=600)
    resp.raise_for_status()
    data = resp.json()

    content = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})
    print(f"[mistral] Response received ({len(content)} chars, "
          f"{usage.get('total_tokens', '?')} tokens).")
    return content


if __name__ == "__main__":
    prompt = "What is artificial intelligence?"
    print(call_mistral_generate(prompt))
