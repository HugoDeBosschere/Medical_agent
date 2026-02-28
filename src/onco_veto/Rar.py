import requests
from typing import List
import pandas as pd
from ollama import chat
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval import evaluate
from deepeval.metrics import AnswerRelevancyMetric, GEval
from deepeval.models import OllamaModel

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

def evaluate_response(test_case: LLMTestCase, threshold: float, judge: str) -> bool:
    """
    Returns True if the summary is good, False if it isn't.
    Acts as a first guardrail against LLM hallucinations.
    """
    extraction_metric = GEval(
        name="Good extraction",
        model=judge, # You must pass your Ollama model string or wrapper here
        threshold=threshold, # Inject your custom threshold
        evaluation_steps=[
            "Check whether the facts in 'actual output' contradicts any facts in 'expected output'",
            "You should also heavily penalize omission of detail",
            "Vague language, or contradicting OPINIONS, are OK"
        ],
        evaluation_params=[test_case.INPUT, test_case.ACTUAL_OUTPUT]
    )

    # 1. Execute the evaluation synchronously
    extraction_metric.measure(test_case)
    
    # 2. Extract the exact programmatic values you asked for
    print(f"Confidence Score: {extraction_metric.score}")
    print(f"Judge Reasoning: {extraction_metric.reason}")
    print(f"Passed Threshold?: {extraction_metric.is_successful()}")

    # 3. Return the boolean for your agentic workflow branch
    return extraction_metric.is_successful()

# Exemple d'utilisation
if __name__ == "__main__":
    prompt = "Qu'est-ce que l'intelligence artificielle ?"
    reponse = call_ollama_generate(prompt)
    #print(f"Prompt: {prompt}")
    #print(f"Réponse: {reponse}")

    '''rar_augment = "\nRephrase and expand the question, and respond."
    promptRar = prompt + rar_augment
    reponse_Rar = call_ollama_generate(promptRar)'''
    #print(f"\n\nPrompt: {promptRar}")
    #print(f"Réponse: {reponse_Rar}")

    test = LLMTestCase(input=prompt, actual_output=reponse)
                       #,retrieval_context=[donnees_patient])
    judge = OllamaModel(model="qwen3:0.6b")
    relevancy_metric = AnswerRelevancyMetric(threshold=0.5, model=judge)
    print(f"\n--- Test ---")

    '''relevancy_metric.measure(test)
    print(f"[AnswerRelevancy] Score : {relevancy_metric.score:.2f}")
    print(f"[AnswerRelevancy] Raison : {relevancy_metric.reason}")
    print("\n", LLMTestCase.ACTUAL_OUTPUT)'''

    focus_pulmonaire = GEval(
        name="Focus Pulmonaire",
        criteria="""
        Évalue si le rapport respecte TOUS ces critères :
        1. Le rapport parle UNIQUEMENT des poumons et du système pulmonaire
        2. Le rapport N'INCLUT PAS d'informations sur d'autres organes (cerveau, coeur, etc.)
        3. Les informations pulmonaires présentes dans les données sources sont bien reportées
        4. Le rapport est cohérent et médicallement structuré
        """,
        evaluation_params=[
            LLMTestCaseParams.INPUT,
            LLMTestCaseParams.ACTUAL_OUTPUT,
        ],
        threshold=0.5,
        model=judge
    )

    focus_pulmonaire.measure(test)
    print(f"Score  : {focus_pulmonaire.score:.2f}")
    print(f"Raison : {focus_pulmonaire.reason}")  # ← toujours accessible même sans include_reason
    
