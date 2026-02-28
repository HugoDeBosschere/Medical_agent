import requests
from typing import List
import pandas as pd
from ollama import chat
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric, GEval
from deepeval import evaluate

# Configuration Ollama
OLLAMA_URL = "http://localhost:11434/"
MODEL = "qwen3:0.6b"  # Changez selon votre modèle installé

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
    
    try:
        resp = requests.post(url, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        
        # Ollama retourne {"response": "..."}
        if "response" in data:
            return data["response"]
        else:
            raise RuntimeError(f"Format de réponse Ollama inattendu: {data}")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Erreur lors de l'appel à Ollama: {e}")


# Exemple d'utilisation
if __name__ == "__main__":
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
