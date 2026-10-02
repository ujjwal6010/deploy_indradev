"""
Multi-Scale Robustness Analysis Module
Runs scenario grouping at 50, 100, 150, 200 km scales to identify
which structures are stable across scales vs scale-sensitive.
"""

from typing import List, Dict
from .scenario_detection import ScenarioGroup, detect_scenarios
from .persistence import ScenarioPersistence, compute_persistence


ANALYSIS_SCALES_KM = [50.0, 100.0, 150.0, 200.0]


def run_multiscale_analysis(
    member_positions_by_hour: Dict[int, Dict[str, tuple]],
    scales_km: List[float] = None,
    min_timesteps: int = 2,
) -> Dict[str, list]:
    """
    Run scenario detection and persistence analysis across all spatial scales.

    Parameters
    ----------
    member_positions_by_hour : Dict[int, Dict[str, Tuple[float, float]]]
        {forecast_hour: {member: (lat, lon)}} mapping of representative
        event centroids for each member at each forecast hour.
    scales_km : List[float]
        Spatial grouping thresholds in km. Defaults to [50, 100, 150, 200].
    min_timesteps : int
        Minimum timesteps for a structure to be recorded.

    Returns
    -------
    Dict with keys:
        'groups'      : List[dict]  — all detected groups across scales
        'persistence' : List[dict]  — persistence records across scales
    """
    if scales_km is None:
        scales_km = ANALYSIS_SCALES_KM

    all_groups: List[ScenarioGroup] = []

    for scale in scales_km:
        for fh, positions in member_positions_by_hour.items():
            if not positions:
                continue
            groups = detect_scenarios(positions, forecast_hour=fh, scale_km=scale)
            all_groups.extend(groups)

    all_persistence: List[ScenarioPersistence] = []
    for scale in scales_km:
        persistence_at_scale = compute_persistence(all_groups, scale_km=scale, min_timesteps=min_timesteps)
        all_persistence.extend(persistence_at_scale)

    return {
        "groups": [g.to_record() for g in all_groups],
        "persistence": [p.to_record() for p in all_persistence],
    }


def build_robustness_matrix(
    persistence_records: List[dict],
    forecast_hours: List[int],
    scales_km: List[float] = None,
) -> List[dict]:
    """
    Build a matrix suitable for the UI Scale Robustness panel.
    Returns a flat list of {forecast_hour, scale_km, scenario_count, max_timesteps}.
    """
    if scales_km is None:
        scales_km = ANALYSIS_SCALES_KM

    matrix = []
    for fh in forecast_hours:
        for scale in scales_km:
            relevant = [
                p for p in persistence_records
                if p["scale_km"] == scale and p["first_hour"] <= fh <= p["last_hour"]
            ]
            matrix.append({
                "forecast_hour": fh,
                "scale_km": scale,
                "scenario_count": len(relevant),
                "max_timesteps": max((p["timesteps"] for p in relevant), default=0),
                "has_persistent": any(p.get("status") == "Persistent" for p in relevant),
            })
    return matrix
