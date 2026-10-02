import numpy as np
from dataclasses import dataclass
from typing import List
from .event_detection import ExtremeEvent

@dataclass
class CrossMemberLink:
    forecast_hour: int
    member_a: str
    event_id_a: str
    member_b: str
    event_id_b: str
    centroid_dist_km: float
    iou: float
    intensity_similarity: float
    area_similarity: float
    combined_score: float  # higher is better

def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))

def _iou(mask_a, mask_b):
    if mask_a is None or mask_b is None or mask_a.shape != mask_b.shape:
        return 0.0
    intersection = np.logical_and(mask_a, mask_b).sum()
    union = np.logical_or(mask_a, mask_b).sum()
    return float(intersection / union) if union > 0 else 0.0

def associate_cross_member(events_by_member, forecast_hour, max_dist_km=300.0, min_score=0.2):
    # finds pairs of events from different members that are likely the same storm/event
    links = []
    members = list(events_by_member.keys())

    for i, mem_a in enumerate(members):
        for mem_b in members[i + 1:]:
            for evt_a in events_by_member.get(mem_a, []):
                for evt_b in events_by_member.get(mem_b, []):
                    dist = _haversine_km(
                        evt_a.latitude_centroid, evt_a.longitude_centroid,
                        evt_b.latitude_centroid, evt_b.longitude_centroid,
                    )
                    if dist > max_dist_km:
                        continue

                    iou_score = _iou(evt_a.mask, evt_b.mask)
                    dist_sim = 1.0 - (dist / max_dist_km)
                    int_sim = 1.0 - abs(evt_a.max_intensity - evt_b.max_intensity) / max(
                        evt_a.max_intensity, evt_b.max_intensity, 1.0
                    )
                    area_sim = 1.0 - abs(evt_a.area - evt_b.area) / max(
                        evt_a.area, evt_b.area, 1
                    )

                    combined = 0.4 * dist_sim + 0.3 * iou_score + 0.2 * int_sim + 0.1 * area_sim

                    if combined >= min_score:
                        links.append(CrossMemberLink(
                            forecast_hour=forecast_hour,
                            member_a=mem_a,
                            event_id_a=evt_a.event_id,
                            member_b=mem_b,
                            event_id_b=evt_b.event_id,
                            centroid_dist_km=dist,
                            iou=iou_score,
                            intensity_similarity=int_sim,
                            area_similarity=area_sim,
                            combined_score=combined,
                        ))
    return links
