# API routes for the IndraDev platform
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import pandas as pd

from ..services.data_service import (
    load_tracks, load_events, load_scenarios, load_persistence, load_scale_analysis
)
from ..schemas.models import (
    EventSchema, TrackPointSchema, ScenarioSchema, ScenarioPersistenceSchema,
    ScenarioDetailSchema, RobustnessMatrixCell, ForecastStateSchema, CycleSchema
)

router = APIRouter(prefix="/api", tags=["core"])

MEMBERS = ["gep01", "gep02", "gep03", "gep04", "gep05"]
FORECAST_HOURS = list(range(24, 73, 6))
SCALES_KM = [50.0, 100.0, 150.0, 200.0]


# cycles

@router.get("/cycles", response_model=List[CycleSchema])
def get_cycles():
    tracks = load_tracks()
    events = load_events()
    scenarios = load_scenarios()
    return [CycleSchema(
        cycle_id="2026-09-28-00Z",
        init_time="2026-09-28T00:00:00Z",
        members=MEMBERS,
        forecast_hours=FORECAST_HOURS,
        total_events=len(events),
        total_tracks=len(tracks["track_id"].unique()),
        total_scenarios=len(scenarios),
    )]


@router.get("/cycles/{cycle_id}", response_model=CycleSchema)
def get_cycle(cycle_id: str):
    cycle = next((c for c in get_cycles() if c.cycle_id == cycle_id), None)
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return cycle


# events

@router.get("/events", response_model=List[EventSchema])
def get_events(
    forecast_hour: Optional[int] = Query(None),
    member: Optional[str] = Query(None),
):
    df = load_events()
    # ponytail: FastAPI response_model automatically strips extra fields like 'geometry'
    if forecast_hour is not None:
        df = df[df["forecast_hour"] == forecast_hour]
    if member is not None:
        df = df[df["member"] == member]
    return df.to_dict(orient="records")


@router.get("/events/{event_id}", response_model=EventSchema)
def get_event(event_id: str):
    df = load_events()
    row = df[df["event_id"] == event_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Event not found")
    return row.iloc[0].to_dict()


# tracks

@router.get("/tracks", response_model=List[TrackPointSchema])
def get_tracks(
    member: Optional[str] = Query(None),
    forecast_hour: Optional[int] = Query(None),
):
    df = load_tracks()
    if member is not None:
        df = df[df["member"] == member]
    if forecast_hour is not None:
        df = df[df["forecast_hour"] == forecast_hour]
    return df.to_dict(orient="records")


@router.get("/tracks/{track_id}", response_model=List[TrackPointSchema])
def get_track(track_id: str):
    df = load_tracks()
    rows = df[df["track_id"] == track_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Track not found")
    return rows.to_dict(orient="records")


# scenarios

@router.get("/scenarios", response_model=List[ScenarioPersistenceSchema])
def get_scenarios(
    scale_km: Optional[float] = Query(None),
    min_timesteps: Optional[int] = Query(None),
):
    df = load_persistence()
    if scale_km is not None:
        df = df[df["scale_km"] == scale_km]
    if min_timesteps is not None:
        df = df[df["timesteps"] >= min_timesteps]
    return df.to_dict(orient="records")


@router.get("/scenarios/{scenario_id}", response_model=ScenarioDetailSchema)
def get_scenario_detail(scenario_id: str):
    df = load_persistence()
    row = df[df["scenario_id"] == scenario_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Scenario not found")
    rec = row.iloc[0].to_dict()
    rec["members"] = list(rec["members"])
    rec["trajectory"] = []
    rec["atmosphere"] = {}
    return rec


@router.get("/scenarios/{scenario_id}/trajectory")
def get_scenario_trajectory(scenario_id: str):
    persistence = load_persistence()
    row = persistence[persistence["scenario_id"] == scenario_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Scenario not found")

    members = list(row.iloc[0]["members"])
    first_h, last_h = int(row.iloc[0]["first_hour"]), int(row.iloc[0]["last_hour"])

    tracks = load_tracks()
    mask = (
        tracks["member"].isin(members) &
        (tracks["forecast_hour"] >= first_h) &
        (tracks["forecast_hour"] <= last_h)
    )
    return tracks[mask].to_dict(orient="records")


@router.get("/scenarios/{scenario_id}/atmosphere")
def get_scenario_atmosphere(scenario_id: str):
    """
    Returns mock 850 hPa atmospheric state for the scenario.
    NOTE: This is an associated diagnostic — not a causal attribution.
    """
    persistence = load_persistence()
    row = persistence[persistence["scenario_id"] == scenario_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Scenario not found")

    members = list(row.iloc[0]["members"])
    # Return mock values — real values come from atmospheric.parquet when available
    return {
        "disclaimer": "Associated atmospheric state — not a causal attribution.",
        "level": "850 hPa",
        "members": {m: {
            "temperature_c": round(17.0 + (ord(m[-1]) % 3) * 0.6, 1),
            "u_wind": round(4.2 + (ord(m[-1]) % 2) * 0.8, 2),
            "v_wind": round(-2.1 + (ord(m[-1]) % 2) * 0.4, 2),
            "wind_speed": round(4.8 + (ord(m[-1]) % 2) * 0.5, 2),
            "geopotential_height_500": int(5800 + (ord(m[-1]) % 4) * 15),
            "cape_surface": int(1200 + (ord(m[-1]) % 5) * 250),
        } for m in members}
    }


# scale analysis

@router.get("/scale-analysis", response_model=List[RobustnessMatrixCell])
def get_scale_analysis(scale_km: Optional[float] = Query(None)):
    """Returns pre-computed multi-scale robustness matrix for the UI."""
    persistence = load_persistence()
    records = persistence.to_dict(orient="records")

    matrix = []
    for fh in FORECAST_HOURS:
        for scale in SCALES_KM:
            if scale_km is not None and scale != scale_km:
                continue
            relevant = [
                p for p in records
                if p["scale_km"] == scale and p["first_hour"] <= fh <= p["last_hour"]
            ]
            matrix.append(RobustnessMatrixCell(
                forecast_hour=fh,
                scale_km=scale,
                scenario_count=len(relevant),
                max_timesteps=max((p["timesteps"] for p in relevant), default=0),
                has_persistent=any(p.get("status") == "Persistent" for p in relevant),
            ))
    return matrix


# forecast state (for timeline/replay)

@router.get("/forecast/{hour}", response_model=ForecastStateSchema)
def get_forecast_state(hour: int, scale_km: float = Query(50.0)):
    if hour not in FORECAST_HOURS:
        raise HTTPException(status_code=400, detail=f"Invalid forecast hour: {hour}. Must be one of {FORECAST_HOURS}")

    tracks = load_tracks()
    events = load_events()
    scenarios = load_scenarios()

    track_records = tracks[tracks["forecast_hour"] == hour].to_dict(orient="records")
    event_records = events[events["forecast_hour"] == hour].to_dict(orient="records")

    scenario_filt = scenarios[
        (scenarios["forecast_hour"] == hour) & (scenarios["scale_km"] == scale_km)
    ]
    scenario_records = scenario_filt.to_dict(orient="records")

    return ForecastStateSchema(
        forecast_hour=hour,
        tracks=track_records,
        scenarios=scenario_records,
        events=event_records,
    )
