import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from scipy.optimize import linear_sum_assignment

from .event_detection import ExtremeEvent


@dataclass
class Track:
    member: str
    track_id: str
    events: List[ExtremeEvent] = field(default_factory=list)

    @property
    def forecast_hours(self) -> List[int]:
        return [e.forecast_hour for e in self.events]

    @property
    def latest_event(self) -> Optional[ExtremeEvent]:
        return self.events[-1] if self.events else None

    def to_records(self) -> List[dict]:
        return [
            {
                "member": self.member,
                "track_id": self.track_id,
                "forecast_hour": e.forecast_hour,
                "latitude": e.latitude_centroid,
                "longitude": e.longitude_centroid,
                "area": e.area,
                "max_intensity": e.max_intensity,
                "mean_intensity": e.mean_intensity,
            }
            for e in self.events
        ]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))


def _iou(mask_a: Optional[np.ndarray], mask_b: Optional[np.ndarray]) -> float:
    if mask_a is None or mask_b is None:
        return 0.0
    if mask_a.shape != mask_b.shape:
        return 0.0
    intersection = np.logical_and(mask_a, mask_b).sum()
    union = np.logical_or(mask_a, mask_b).sum()
    return float(intersection / union) if union > 0 else 0.0


def _matching_cost(prev_event, curr_event, max_dist_km=500.0, w_dist=0.4, w_iou=0.3, w_intensity=0.2, w_area=0.1):
    # compute matching cost between two events. lower is better match.
    dist = _haversine_km(
        prev_event.latitude_centroid, prev_event.longitude_centroid,
        curr_event.latitude_centroid, curr_event.longitude_centroid,
    )
    if dist > max_dist_km:
        return 1e9

    dist_score = min(dist / max_dist_km, 1.0)
    iou_score = 1.0 - _iou(prev_event.mask, curr_event.mask)

    int_ratio = (
        abs(prev_event.max_intensity - curr_event.max_intensity)
        / max(prev_event.max_intensity, curr_event.max_intensity, 1.0)
    )
    area_ratio = (
        abs(prev_event.area - curr_event.area)
        / max(prev_event.area, curr_event.area, 1)
    )

    return w_dist * dist_score + w_iou * iou_score + w_intensity * int_ratio + w_area * area_ratio


class MemberTracker:
    # tracks extreme precip events within a single member using hungarian assignment
    def __init__(self, member, max_dist_km=500.0, cost_threshold=0.7):
        self.member = member
        self.max_dist_km = max_dist_km
        self.cost_threshold = cost_threshold
        self.tracks = []
        self._active_tracks = []
        self._track_counter = 0

    def _new_track_id(self):
        self._track_counter += 1
        return f"trk_{self.member}_{self._track_counter:03d}"

    def update(self, events):
        # update tracker with next hour's events
        if not self._active_tracks:
            for evt in events:
                trk = Track(member=self.member, track_id=self._new_track_id(), events=[evt])
                self.tracks.append(trk)
                self._active_tracks.append(trk)
            return

        prev_events = [t.latest_event for t in self._active_tracks]
        n_prev, n_curr = len(prev_events), len(events)

        cost_matrix = np.full((n_prev, n_curr), 1e9)
        for i, pe in enumerate(prev_events):
            for j, ce in enumerate(events):
                cost_matrix[i, j] = _matching_cost(pe, ce, max_dist_km=self.max_dist_km)

        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        matched_curr = set()
        new_active = []
        for ri, ci in zip(row_ind, col_ind):
            if cost_matrix[ri, ci] < self.cost_threshold:
                self._active_tracks[ri].events.append(events[ci])
                new_active.append(self._active_tracks[ri])
                matched_curr.add(ci)

        for j, evt in enumerate(events):
            if j not in matched_curr:
                trk = Track(member=self.member, track_id=self._new_track_id(), events=[evt])
                self.tracks.append(trk)
                new_active.append(trk)

        self._active_tracks = new_active

    def get_all_records(self) -> List[dict]:
        records = []
        for t in self.tracks:
            records.extend(t.to_records())
        return records
