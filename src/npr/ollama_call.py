import requests
import subprocess
import shutil
import time
from typing import List
import pandas as pd
from ollama import chat
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric, GEval
from deepeval import evaluate

# Configuration Ollama
OLLAMA_URL = "http://localhost:11434/"
MODEL = "qwen3:0.6b"  # Changez selon votre modèle installé


def is_ollama_running() -> bool:
    """Check if the Ollama server is responding."""
    try:
        resp = requests.get(OLLAMA_URL, timeout=5)
        return resp.status_code == 200
    except requests.exceptions.ConnectionError:
        return False


def is_ollama_installed() -> bool:
    """Check if the ollama binary is available on PATH."""
    return shutil.which("ollama") is not None


def start_ollama() -> bool:
    """
    Attempt to launch the Ollama server in the background.
    Returns True if the server becomes reachable within ~15 seconds.
    """
    print("[ollama] Starting Ollama server (`ollama serve`) ...")
    subprocess.Popen(
        ["ollama", "serve"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for i in range(15):
        time.sleep(1)
        if is_ollama_running():
            print(f"[ollama] Server is up after {i + 1}s.")
            return True
    print("[ollama] ERROR: Server did not start within 15 seconds.")
    return False


def ensure_ollama_ready() -> None:
    """
    Make sure Ollama is installed and running.
    Raises RuntimeError if it cannot be made available.
    """
    if is_ollama_running():
        print(f"[ollama] Server already running at {OLLAMA_URL}")
        return

    print(f"[ollama] Server not reachable at {OLLAMA_URL}")

    if not is_ollama_installed():
        raise RuntimeError(
            "Ollama is not installed (binary not found on PATH). "
            "Install it from https://ollama.com and try again."
        )

    print("[ollama] Binary found on PATH — attempting auto-launch ...")
    if not start_ollama():
        raise RuntimeError(
            "Ollama is installed but the server failed to start. "
            "Try running `ollama serve` manually."
        )


def call_ollama_generate(prompt: str, model: str = MODEL) -> str:
    """
    Fait un appel à Ollama pour générer du texte et retourne la réponse.
    
    Args:
        prompt: Le prompt à envoyer au modèle
        model: Le nom du modèle Ollama à utiliser
        
    Returns:
        La réponse générée par le modèle
    """
    url = f"{OLLAMA_URL}api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False  # Désactive le streaming pour avoir la réponse complète
    }
    
    print(f"[ollama] Sending prompt to model '{model}' ({len(prompt)} chars) ...")
    try:
        resp = requests.post(url, json=payload, timeout=10000)
        resp.raise_for_status()
        data = resp.json()

        # Ollama retourne {"response": "..."}
        if "response" in data:
            duration = data.get("total_duration", 0) / 1e9  # nanoseconds → seconds
            print(f"[ollama] Response received ({len(data['response'])} chars, {duration:.1f}s).")
            return data["response"]
        else:
            raise RuntimeError(f"Format de réponse Ollama inattendu: {data}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Erreur lors de l'appel à Ollama: {e}")


# Exemple d'utilisation
if __name__ == "__main__":
    ensure_ollama_ready()

    prompt = "Qu'est-ce que l'intelligence artificielle ?"
    reponse = call_ollama_generate(prompt)
    print(f"Prompt: {prompt}")
    print(f"Réponse: {reponse}")

    rar_augment = "\nRephrase and expand the question, and respond."
    promptRar = prompt + rar_augment
    reponse_Rar = call_ollama_generate(promptRar)
    print(f"\n\nPrompt: {promptRar}")
    print(f"Réponse: {reponse_Rar}")

    LLMTestCase(input=prompt, actual_output=reponse)
