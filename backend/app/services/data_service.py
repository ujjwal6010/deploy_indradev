"""
Data service layer — reads processed Parquet files and caches them in memory.
"""
import os
import pandas as pd
import json
from typing import Optional
from functools import lru_cache

# Try demo data first, fall back to processed
DEMO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "demo")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "processed")


def _data_path(filename: str) -> str:
    for d in [DEMO_DIR, PROCESSED_DIR]:
        p = os.path.join(d, filename)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"Could not find {filename} in demo or processed directories.")


@lru_cache(maxsize=None)
def load_tracks() -> pd.DataFrame:
    return pd.read_parquet(_data_path("tracks.parquet"))


@lru_cache(maxsize=None)
def load_events() -> pd.DataFrame:
    return pd.read_parquet(_data_path("events.parquet"))


@lru_cache(maxsize=None)
def load_scenarios() -> pd.DataFrame:
    df = pd.read_parquet(_data_path("scenarios.parquet"))
    # Ensure members is always a list
    df["members"] = df["members"].apply(lambda x: list(x) if not isinstance(x, list) else x)
    return df


@lru_cache(maxsize=None)
def load_persistence() -> pd.DataFrame:
    df = pd.read_parquet(_data_path("scenario_persistence.parquet"))
    df["members"] = df["members"].apply(lambda x: list(x) if not isinstance(x, list) else x)
    return df


@lru_cache(maxsize=None)
def load_scale_analysis() -> Optional[pd.DataFrame]:
    try:
        return pd.read_parquet(_data_path("scale_analysis.parquet"))
    except FileNotFoundError:
        return None


