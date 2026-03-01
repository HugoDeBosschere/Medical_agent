import sys
import asyncio
from src.pipeline.orchestrator import generate_report

async def main():
    print("Generating report for patient 063F6BB9...")
    try:
        report = await generate_report("063F6BB9", "fr")
        print("\n--- Judge Evaluation ---")
        if report.generation_evaluation:
            print(report.generation_evaluation)
        else:
            print("NO EVALUATION GENERATED!")
            
        if report.warnings:
            print("\nWarnings:", report.warnings)
            
        print("\nFinal Synthesis:", report.final_synthesis[:100], "...")
    except Exception as e:
        print(f"Failed to generate report: {e}")

if __name__ == "__main__":
    asyncio.run(main())
