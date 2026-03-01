"""Utility helpers for the npr package."""

import io
from pathlib import Path
from typing import Optional

import msoffcrypto
import openpyxl


def open_encrypted_xlsx(
    path: str | Path,
    password: str,
) -> openpyxl.Workbook:
    """Open a password-protected xlsx file and return an openpyxl Workbook."""
    decrypted = io.BytesIO()
    with open(path, "rb") as f:
        office_file = msoffcrypto.OfficeFile(f)
        office_file.load_key(password=password)
        office_file.decrypt(decrypted)
    decrypted.seek(0)
    return openpyxl.load_workbook(filename=decrypted)


def read_encrypted_xlsx_as_dataframe(
    path: str | Path,
    password: str,
):
    """Open a password-protected xlsx and return a pandas DataFrame."""
    import pandas as pd

    decrypted = io.BytesIO()
    with open(path, "rb") as f:
        office_file = msoffcrypto.OfficeFile(f)
        office_file.load_key(password=password)
        office_file.decrypt(decrypted)
    decrypted.seek(0)
    return pd.read_excel(decrypted, engine="openpyxl")
