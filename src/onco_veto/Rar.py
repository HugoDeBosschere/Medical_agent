import requests
from typing import List
import pandas as pd
from ollama import chat
from deepeval import evaluate
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import AnswerRelevancyMetric, GEval
from deepeval import evaluate
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

def evaluate_response(test_case: LLMTestCase, threshold: float, judge: OllamaModel) -> bool:
    """
    Returns True if the summary is good, False if it isn't.
    Acts as a first guardrail against LLM hallucinations.
    """
    extraction_metric = GEval(
        name="Good extraction",
        model=judge, # You must pass your Ollama model string or wrapper here
        threshold=threshold, # Inject your custom threshold
        evaluation_steps=[

            "Check if only informations about the LUNGS are present in the output file",
            "Check if the informations about the LUNGS that are in the output file are also in the input file",
            "Check if there are informations about the LUNGS that are in the input file but are not in the output file ",
            "Language should be precise and technical",
            "The output text should be synthetic",
            "Penalize texts that are too long"
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT]
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
    threshold = 0.5 
    judge = OllamaModel(model="qwen3:0.6b")
    document_no_tumeur = "Absence de comparatif disponible. Absence d'anomalie pleuroparenchymateuse pulmonaire. Absence d'épanchement pleural. Absence de pneumothorax. Silhouette cardiomédiastinale sans particularité. Structures osseuses et parties molles sans particularité."
    document_tumeur = document_no_tumeur = "Absence de comparatif disponible. Absence d'anomalie pleuroparenchymateuse pulmonaire. Absence d'épanchement pleural. Absence de pneumothorax. Tumeur dans le poumon. Silhouette cardiomédiastinale sans particularité. Structures osseuses et parties molles sans particularité."
    prompt = "Summarize the document and keep only the informations concerning the lungs" + document_tumeur
    response: str = call_ollama_generate(prompt)
    print(response)

    test_case = LLMTestCase(
        input = prompt,
        actual_output = response
    )

    print(evaluate_response(test_case, threshold, judge))

    #print(f"Prompt: {prompt}")
    #print(f"Réponse: {reponse}")
    """
    rar_augment = "\nRephrase and expand the question, and respond."
    promptRar = prompt + rar_augment
    reponse_Rar = call_ollama_generate(promptRar)
    #print(f"\n\nPrompt: {promptRar}")
    #print(f"Réponse: {reponse_Rar}")

    test = LLMTestCase(input=prompt, actual_output=reponse)
    
    relevancy_metric = AnswerRelevancyMetric(threshold=0.5, model=judge)
    print(f"\n--- Test ---")

    relevancy_metric.measure(test)
    print(f"[AnswerRelevancy] Score : {relevancy_metric.score:.2f}")
    print(f"[AnswerRelevancy] Raison : {relevancy_metric.reason}")
    """
