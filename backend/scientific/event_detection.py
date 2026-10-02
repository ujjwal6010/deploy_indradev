import numpy as np
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
from scipy import ndimage


@dataclass
class ExtremeEvent:
    event_id: str
    member: str
    forecast_hour: int
    latitude_centroid: float
    longitude_centroid: float
    area: int
    max_intensity: float
    mean_intensity: float
    mask: np.ndarray = field(default=None, repr=False)
    bbox: Optional[Tuple[int, int, int, int]] = None


def compute_threshold(precip_arrays, percentile=95.0):
    all_vals = np.concatenate([arr[arr > 0].ravel() for arr in precip_arrays if arr is not None])
    if len(all_vals) == 0:
        return 0.0
    return float(np.percentile(all_vals, percentile))


def detect_events(precip_24h, member, forecast_hour, lats, lons, threshold, min_area_cells=10):
    extreme_mask = precip_24h >= threshold
    labeled, n = ndimage.label(extreme_mask)

    events = []
    for lid in range(1, n + 1):
        comp = labeled == lid
        area = int(comp.sum())
        if area < min_area_cells:
            continue

        rows, cols = np.where(comp)
        evt = ExtremeEvent(
            event_id=f"evt_{member}_fh{forecast_hour}_{lid:02d}",
            member=member,
            forecast_hour=forecast_hour,
            latitude_centroid=float(np.mean(lats[rows])),
            longitude_centroid=float(np.mean(lons[cols])),
            area=area,
            max_intensity=float(precip_24h[comp].max()),
            mean_intensity=float(precip_24h[comp].mean()),
            mask=comp,
            bbox=(int(rows.min()), int(cols.min()), int(rows.max()), int(cols.max())),
        )
        events.append(evt)

    return events
