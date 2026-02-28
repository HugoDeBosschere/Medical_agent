import os
import pandas as pd

def df_path():
    #print(os.getcwd())  # affiche où Jupyter pense être
    ROOT = os.path.join(os.getcwd(), "Archive")  # adapter selon le résultat
    #ROOT = os.path.join(os.getcwd())  # adapter selon le résultat
    #ROOT = os.path.dirname(os.path.abspath("merging.ipynb"))
    #print(ROOT)

    KEYWORDS = ["lung", "pulmn", "torax"]  # comparaison insensible à la casse

    def matches_keywords(name: str) -> bool:
        lower = name.lower()
        return any(kw in lower for kw in KEYWORDS)

    rows = []

    # Niveau 1 : StudyID (ex. "0301B7D6 0301B7D6")
    for lvl1 in os.scandir(ROOT):
        if not lvl1.is_dir():
            continue
        study_id = lvl1.name.split()[0]

        # Niveau 2 : dossier patient (ex. "11092835 TC TRAX TC ABDOMEN TC PELVIS")
        for lvl2 in os.scandir(lvl1.path):
            if not lvl2.is_dir():
                continue
            accession_number = lvl2.name.split()[0]

            # Niveau 3 : sous-dossiers — on garde uniquement ceux qui matchent
            for lvl3 in os.scandir(lvl2.path):
                if not lvl3.is_dir():
                    continue
                if matches_keywords(lvl3.name):
                    rows.append({
                        "PatientID": study_id,
                        "AccessionNumber": accession_number,
                        "folder": lvl3.name,
                        "relative_path": (lvl1.name + "/" + lvl2.name + "/" + lvl3.name)
                    })

    df = pd.DataFrame(rows)
    '''for p in df["relative_path"]:
        print(p)'''
    return df

df = df_path()

df_csv = pd.read_excel("Liste examen UNBOXED finaliseģe v2 (avec mesures).xlsx")

# Pivot df pour avoir une colonne relative_path par valeur de folder
df_pivot = df.pivot_table(
    index=["PatientID", "AccessionNumber"],
    columns="folder",
    values="relative_path",
    aggfunc="first"
).reset_index()

# Renommer les colonnes : relative_path_[folder]
df_pivot.columns.name = None
df_pivot = df_pivot.rename(columns={col: f"relative_path_{col}" for col in df_pivot.columns if col not in ["PatientID", "AccessionNumber"]})


# Convertir les clés de merge au même type (string)
df_pivot["PatientID"] = df_pivot["PatientID"].astype(str)
df_pivot["AccessionNumber"] = df_pivot["AccessionNumber"].astype(str)

df_csv["PatientID"] = df_csv["PatientID"].astype(str)
df_csv["AccessionNumber"] = df_csv["AccessionNumber"].astype(str)

# Merge
df_merged = pd.merge(
    df_pivot, df_csv,
    left_on=["PatientID", "AccessionNumber"],
    right_on=["PatientID", "AccessionNumber"],
    how="right"
)

df_merged.to_csv("merged_output.csv", sep=";", index=False)