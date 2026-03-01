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


def evaluate_prompt(prompt, reponse, threshold):
    """
    A function to evaluate through LLM as judge the quality of a response. 
    Returns (Bool, str) where bool represents if the response is good enough and reason why it was judged the way it was 
    """
    
    test = LLMTestCase(input=prompt, actual_output=reponse)

    judge = OllamaModel(model=MODEL)
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

        evaluation_steps=[
        "Vérifier que seules les informations concernant les POUMONS sont présentes dans la sortie",
        "Vérifier que les informations concernant les POUMONS présentes dans la sortie figurent explicitement dans le document source",
        "Vérifier qu'aucune information concernant les POUMONS présente dans le document source n'a été omise dans la sortie",
        "Le vocabulaire employé doit être précis et technique",
        "Le texte généré doit être concis et synthétique",
        "Pénaliser les sorties excessivement longues"
        ],
        evaluation_params=[
            LLMTestCaseParams.INPUT,
            LLMTestCaseParams.ACTUAL_OUTPUT,
        ],
        threshold=threshold,
        model=judge
    )

    focus_pulmonaire.measure(test)
    print(f"Score  : {focus_pulmonaire.score:.2f}")
    print(f"Raison : {focus_pulmonaire.reason}")  # ← toujours accessible même sans include_reason

    return focus_pulmonaire.is_successful(), focus_pulmonaire.reason


# Exemple d'utilisation
if __name__ == "__main__":
    threshold = 0.5 
    judge = OllamaModel(model="qwen3:0.6b")
    document_no_tumeur = "Absence de comparatif disponible. Absence d'anomalie pleuroparenchymateuse pulmonaire. Absence d'épanchement pleural. Absence de pneumothorax. Silhouette cardiomédiastinale sans particularité. Structures osseuses et parties molles sans particularité."
    document_tumeur = document_no_tumeur = "Absence de comparatif disponible. Absence d'anomalie pleuroparenchymateuse pulmonaire. Absence d'épanchement pleural. Absence de pneumothorax. Tumeur dans le poumon. Silhouette cardiomédiastinale sans particularité. Structures osseuses et parties molles sans particularité."
    prompt = "KEEP ONLY THE INFORMATIONS ON THE LUNGS" + document_tumeur
    response: str = call_ollama_generate(prompt)
    true_response = "Tumeur dans le poumon. Absence d'anomalie pleuroparenchymateuse pulmonaire. Absence d'épanchement pleural. Absence de pneumothorax."
    print(f" Here is the respons ; \n {response}")

    test_case = LLMTestCase(
        input = prompt,
        actual_output = true_response
    )

    print(evaluate_response(test_case, threshold, judge))

    #print(f"Prompt: {prompt}")
    #print(f"Réponse: {reponse}")

    '''rar_augment = "\nRephrase and expand the question, and respond."
    promptRar = prompt + rar_augment
    reponse_Rar = call_ollama_generate(promptRar)'''
    #print(f"\n\nPrompt: {promptRar}")
    #print(f"Réponse: {reponse_Rar}")

    print(evaluate_prompt(prompt, response, threshold))

def evaluate_generation_with_judge(source_data: str, generated_report: str) -> str:
    """
    Evaluates the quality of the generated report using the LLM-as-a-Judge framework.
    Uses the strict medical report auditor prompt.
    """
    from ..pipeline.llm_caller import call_llm

    prompt = f"""You are a strict medical report auditor (LLM-as-a-Judge). You receive (1) cleaned clinical source data and (2) a generated structured report. Evaluate whether the report is accurate, complete, temporally coherent, and strictly supported by the source data. For each section (Global Indication, Exams Analyzed, Lesion Summary, Evolution, Attention/Discordance, Final Summary and TNM), verify that all statements are explicitly supported, that dates and modalities are correct and chronologically ordered, that lesion descriptions include exact locations, measurements, and associated dates, that nodal and metastatic findings are reported only when present, and that evolution claims (increase, decrease, stability, appearance, disappearance) are justified by measurements and timing. Ensure TNM is consistent with tumor size, nodal involvement, metastasis data, and exam chronology, and not assigned if data are insufficient. Penalize hallucinations, incorrect dates, altered measurements, missing critical oncologic information, logical or temporal inconsistencies, and unsupported TNM reasoning. Do not rewrite the report or add external knowledge. Output: section-by-section evaluation (Correct / Incomplete / Incorrect), list of errors, TNM validity (Valid / Not valid / Insufficient data), global score (0–100), and final verdict (PASS / FAIL). Be strict and evidence-based.

--- SOURCE DATA ---
{source_data}

--- GENERATED REPORT ---
{generated_report}
"""
    try:
        response = call_llm(prompt)
        return response
    except Exception as e:
        return f"Judge evaluation failed: {e}"
