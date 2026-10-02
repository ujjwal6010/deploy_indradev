import numpy as np
import xarray as xr
from typing import Dict, List


def build_rolling_24h(ds, member, forecast_hours, lat_slice=slice(38, 5), lon_slice=slice(65, 100)):
    # each tp field = preceding 6h accumulation, so 24h = sum of 4 consecutive fields
    result = {}
    for fh in forecast_hours:
        window = [fh - 18, fh - 12, fh - 6, fh]
        if any(h < 6 for h in window):
            continue
        accum = None
        for wh in window:
            try:
                field = ds.sel(
                    step=np.timedelta64(wh, "h"),
                    number=int(member.replace("gep", "")),
                    latitude=lat_slice,
                    longitude=lon_slice,
                )["tp"].values
                accum = field if accum is None else accum + field
            except (KeyError, ValueError):
                accum = None
                break
        if accum is not None:
            result[fh] = accum
    return result


def build_rolling_24h_from_arrays(tp_arrays, target_forecast_hours):
    # used when data is already extracted outside xarray
    result = {}
    for fh in target_forecast_hours:
        window = [fh - 18, fh - 12, fh - 6, fh]
        if all(h in tp_arrays for h in window):
            result[fh] = sum(tp_arrays[h] for h in window)
    return result
