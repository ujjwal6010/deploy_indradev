"""
Atmospheric Diagnostics Module (Optional)
Samples 850 hPa temperature, U-wind, V-wind at scenario reference locations.
Labeled as: "Associated atmospheric state" — NOT a causal explanation.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
import xarray as xr


def compute_wind_speed(u: np.ndarray, v: np.ndarray) -> np.ndarray:
    """Derive wind speed from U and V components."""
    return np.sqrt(u ** 2 + v ** 2)


def sample_atmospheric_state(
    ds_atmos: xr.Dataset,
    lat: float,
    lon: float,
    forecast_hour: int,
    member_number: Optional[int] = None,
) -> Dict[str, float]:
    """
    Sample 850 hPa atmospheric state at a given location and forecast time.

    Parameters
    ----------
    ds_atmos : xr.Dataset
        Dataset containing 't', 'u', 'v' at 850 hPa. Resolution 0.5°.
    lat, lon : float
        Reference location (scenario centroid).
    forecast_hour : int
        Forecast lead time in hours.
    member_number : int, optional
        Ensemble member number for multi-member datasets.

    Returns
    -------
    Dict with keys: temperature_c, u_wind, v_wind, wind_speed
    """
    sel_kwargs = dict(
        latitude=lat,
        longitude=lon,
        method="nearest",
        step=np.timedelta64(forecast_hour, "h"),
    )
    if member_number is not None:
        sel_kwargs["number"] = member_number

    try:
        point = ds_atmos.sel(**sel_kwargs)
        t_k = float(point["t"].values)
        u = float(point["u"].values)
        v = float(point["v"].values)
        return {
            "temperature_c": round(t_k - 273.15, 2),
            "u_wind": round(u, 2),
            "v_wind": round(v, 2),
            "wind_speed": round(float(np.sqrt(u ** 2 + v ** 2)), 2),
        }
    except Exception:
        return {"temperature_c": None, "u_wind": None, "v_wind": None, "wind_speed": None}


def sample_scenario_diagnostics(
    ds_atmos: xr.Dataset,
    scenario_centroids: Dict[str, Tuple[float, float]],
    forecast_hour: int,
) -> Dict[str, dict]:
    """
    Sample atmospheric state for all members in a scenario group.

    Returns
    -------
    Dict keyed by member name, values are atmospheric state dicts.
    """
    results = {}
    for member, (lat, lon) in scenario_centroids.items():
        try:
            member_num = int(member.replace("gep", ""))
        except ValueError:
            member_num = None
        results[member] = sample_atmospheric_state(ds_atmos, lat, lon, forecast_hour, member_num)
    return results
