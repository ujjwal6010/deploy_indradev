"""
Pydantic schemas for all API responses.
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class EventSchema(BaseModel):
    event_id: str
    member: str
    forecast_hour: int
    latitude_centroid: float
    longitude_centroid: float
    area: float
    max_intensity: float
    mean_intensity: float


class TrackPointSchema(BaseModel):
    member: str
    track_id: str
    forecast_hour: int
    latitude: float
    longitude: float
    area: float
    max_intensity: float
    mean_intensity: float


class ScenarioSchema(BaseModel):
    scenario_id: str
    forecast_hour: int
    members: List[str]
    scale_km: float


class ScenarioPersistenceSchema(BaseModel):
    scenario_id: str
    members: List[str]
    scale_km: float
    first_hour: int
    last_hour: int
    timesteps: int
    longest_consecutive: int
    status: Optional[str] = ""


class ScenarioDetailSchema(ScenarioPersistenceSchema):
    trajectory: Optional[List[dict]] = []
    atmosphere: Optional[Dict[str, Any]] = {}


class RobustnessMatrixCell(BaseModel):
    forecast_hour: int
    scale_km: float
    scenario_count: int
    max_timesteps: int
    has_persistent: bool


class ForecastStateSchema(BaseModel):
    forecast_hour: int
    tracks: List[TrackPointSchema]
    scenarios: List[ScenarioSchema]
    events: List[EventSchema]


class CycleSchema(BaseModel):
    cycle_id: str
    init_time: str
    members: List[str]
    forecast_hours: List[int]
    total_events: int
    total_tracks: int
    total_scenarios: int
