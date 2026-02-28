Goal: From the reports x Scans database, generate a report with the following sections:
Patient ID
Date de génération du rapport
Indication globale (contexte général)
Examens analysés (dates+ type de scanner)
Synthèse des lésions (date+ lésion)
Évolution
Points d’attention/ discordance ?
Synthèse finale
Supposition de stage TNP

We need to:
- Concile two streams: Report and CT DB -> 2 streams (Cleaned historical reports (npr.py)=outputs an updated excel & extracted features from CT scans (segmentation))=outputs a txt file -> Combine all cleaned reports for the given PID in the beginning as well as all segmentation extracted info (the segmentation txt file) and combine them in a prompt to generate the desired final report using mistral API key (or ollama as fallback).
- we will give the option for the practictioner to generate in whatever like it wishes based on an option from the frontend: if asked in french, we will add at the end "Generate the full report in French"
- Must integrate seemlessly with the Front end to ensure a smooth experience (the practitioner gives the PID and the language -> The pipeline is exectued, generates the report as a pdf (/!\ must be a visually pleasing report ! not simply putting the pdf in a blank PDF, must follow the demo pdf))
