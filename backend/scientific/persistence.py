import dataclasses
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Set, Optional
from .scenario_detection import ScenarioGroup

STATUS_PERSISTENT = "Persistent"
STATUS_SCALE_SENSITIVE = "Scale-sensitive"
STATUS_EMERGING = "Emerging"
STATUS_TRANSIENT = "Transient"

@dataclass
class ScenarioPersistence:
    scenario_id: str
    members: List[str]            # canonical sorted member set
    scale_km: float
    first_hour: int
    last_hour: int
    timesteps: int
    longest_consecutive: int
    status: str = ""

    def to_record(self) -> dict:
        return dataclasses.asdict(self)

def _member_key(members: List[str]) -> str:
    return "|".join(sorted(members))

def compute_persistence(all_groups, scale_km, min_timesteps=2):
    # compute persistence stats at a given scale
    # identical member sets recurring = same structure
    scale_groups = [g for g in all_groups if g.scale_km == scale_km]

    # Group by member-key → list of forecast hours
    member_key_hours: Dict[str, List[int]] = {}
    member_key_members: Dict[str, List[str]] = {}

    for g in scale_groups:
        key = _member_key(g.members)
        member_key_hours.setdefault(key, []).append(g.forecast_hour)
        member_key_members[key] = sorted(g.members)

    results: List[ScenarioPersistence] = []
    scenario_counter = 0

    for key, hours in member_key_hours.items():
        hours_sorted = sorted(set(hours))
        if len(hours_sorted) < min_timesteps:
            continue

        # Compute longest consecutive run (assuming 6-hour steps)
        longest = _longest_consecutive(hours_sorted, step=6)

        scenario_counter += 1
        status = _classify_status(len(hours_sorted), longest)

        results.append(ScenarioPersistence(
            scenario_id=f"SC_{scale_km:.0f}km_{scenario_counter:03d}",
            members=member_key_members[key],
            scale_km=scale_km,
            first_hour=hours_sorted[0],
            last_hour=hours_sorted[-1],
            timesteps=len(hours_sorted),
            longest_consecutive=longest,
            status=status,
        ))

    return results


def _longest_consecutive(hours: List[int], step: int = 6) -> int:
    if not hours:
        return 0
    max_run, current_run = 1, 1
    for i in range(1, len(hours)):
        if hours[i] - hours[i - 1] == step:
            current_run += 1
            max_run = max(max_run, current_run)
        else:
            current_run = 1
    return max_run


def _classify_status(timesteps: int, consecutive: int) -> str:
    if consecutive >= 3:
        return STATUS_PERSISTENT
    if consecutive >= 2:
        return STATUS_EMERGING
    if timesteps >= 2:
        return STATUS_SCALE_SENSITIVE
    return STATUS_TRANSIENT
