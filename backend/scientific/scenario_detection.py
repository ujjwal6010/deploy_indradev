import numpy as np
import networkx as nx
import dataclasses
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Set


@dataclass
class ScenarioGroup:
    scenario_id: str
    forecast_hour: int
    members: List[str]
    scale_km: float
    centroid_lats: Dict[str, float] = field(default_factory=dict)
    centroid_lons: Dict[str, float] = field(default_factory=dict)

    def to_record(self) -> dict:
        return dataclasses.asdict(self)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))


def detect_scenarios(
    member_positions: Dict[str, Tuple[float, float]],
    forecast_hour: int,
    scale_km: float,
) -> List[ScenarioGroup]:
        members = list(member_positions.keys())
        G = nx.Graph()
        G.add_nodes_from(members)

        for i, m_a in enumerate(members):
            for m_b in members[i + 1:]:
                lat_a, lon_a = member_positions[m_a]
                lat_b, lon_b = member_positions[m_b]
                dist = _haversine_km(lat_a, lon_a, lat_b, lon_b)
                if dist <= scale_km:
                    G.add_edge(m_a, m_b, distance_km=dist)

        groups: List[ScenarioGroup] = []
        scenario_counter = 0
        for component in nx.connected_components(G):
            if len(component) < 2:
                continue  # Single isolated member — not a scenario
            scenario_counter += 1
            member_list = sorted(component)
            scenario_id = f"S_{forecast_hour}_{scenario_counter}"

            groups.append(ScenarioGroup(
                scenario_id=scenario_id,
                forecast_hour=forecast_hour,
                members=member_list,
                scale_km=scale_km,
                centroid_lats={m: member_positions[m][0] for m in member_list},
                centroid_lons={m: member_positions[m][1] for m in member_list},
            ))

        return groups
