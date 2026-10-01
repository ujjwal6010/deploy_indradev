# demo dataset builder
# generates mock parquet files so UI works offline
# NOTE: gep02+gep03 scenario emerges naturally from the math, it's not hard-coded
import os
import sys
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Polygon

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from backend.scientific.scenario_detection import detect_scenarios
from backend.scientific.persistence import compute_persistence
from backend.scientific.scale_analysis import build_robustness_matrix, ANALYSIS_SCALES_KM

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "demo")
MEMBERS = ["gep01", "gep02", "gep03", "gep04", "gep05"]
FORECAST_HOURS = list(range(24, 73, 6))
np.random.seed(42)  # Reproducibility


def _make_polygon(lat: float, lon: float, half_deg: float = 0.4) -> Polygon:
    return Polygon([
        (lon - half_deg, lat - half_deg),
        (lon + half_deg, lat - half_deg),
        (lon + half_deg, lat + half_deg),
        (lon - half_deg, lat + half_deg),
    ])


def simulate_trajectories():
    # simulate some fake movement
    # gep02 and 03 will converge around t+54 to test the scenario detection
    # Each member starts at a slightly different location in Central India
    base_positions = {
        "gep01": (19.5, 79.0),
        "gep02": (20.5, 80.5),
        "gep03": (21.0, 81.0),
        "gep04": (18.5, 78.0),
        "gep05": (22.0, 82.5),
    }
    positions = {m: {"lats": [], "lons": []} for m in MEMBERS}

    for fh in FORECAST_HOURS:
        t = (fh - 24) / 6  # time step index

        for member in MEMBERS:
            base_lat, base_lon = base_positions[member]
            # General northeast drift with member-specific noise
            lat = base_lat + t * 0.35 + np.random.uniform(-0.15, 0.15)
            lon = base_lon + t * 0.40 + np.random.uniform(-0.15, 0.15)

            # gep02 and gep03 converge spatially at T+54–T+66
            if fh >= 54 and member in ["gep02", "gep03"]:
                # Pull both toward a common attractor point
                attractor_lat = 25.5 + t * 0.35
                attractor_lon = 88.5 + t * 0.40
                alpha = min((fh - 48) / 12.0, 1.0)  # blend factor 0→1
                lat = (1 - alpha) * lat + alpha * (attractor_lat + np.random.uniform(-0.1, 0.1))
                lon = (1 - alpha) * lon + alpha * (attractor_lon + np.random.uniform(-0.1, 0.1))

            positions[member]["lats"].append(lat)
            positions[member]["lons"].append(lon)

    return positions


def build_tracks(positions: dict) -> pd.DataFrame:
    records = []
    for member in MEMBERS:
        lats = positions[member]["lats"]
        lons = positions[member]["lons"]
        for i, fh in enumerate(FORECAST_HOURS):
            records.append({
                "member": member,
                "track_id": f"trk_{member}",
                "forecast_hour": fh,
                "latitude": lats[i],
                "longitude": lons[i],
                "area": float(np.random.uniform(80, 250)),
                "max_intensity": float(np.random.uniform(45, 160)),
                "mean_intensity": float(np.random.uniform(30, 100)),
            })
    return pd.DataFrame(records)


def build_events(positions: dict) -> gpd.GeoDataFrame:
    records = []
    for member in MEMBERS:
        lats = positions[member]["lats"]
        lons = positions[member]["lons"]
        for i, fh in enumerate(FORECAST_HOURS):
            lat, lon = lats[i], lons[i]
            area = float(np.random.uniform(80, 250))
            max_int = float(np.random.uniform(45, 160))
            records.append({
                "event_id": f"evt_{member}_fh{fh}_01",
                "member": member,
                "forecast_hour": fh,
                "latitude_centroid": lat,
                "longitude_centroid": lon,
                "area": area,
                "max_intensity": max_int,
                "mean_intensity": max_int * 0.65,
                "geometry": _make_polygon(lat, lon),
            })
    return gpd.GeoDataFrame(records, geometry="geometry", crs="EPSG:4326")


def build_scenarios_dynamically(positions):
    # run actual detect_scenarios on fake data
    # shouldn't force membership, let the graph figure it out
    all_groups = []
    scenario_records = []

    for scale in ANALYSIS_SCALES_KM:
        for i, fh in enumerate(FORECAST_HOURS):
            member_positions = {
                m: (positions[m]["lats"][i], positions[m]["lons"][i])
                for m in MEMBERS
            }
            groups = detect_scenarios(member_positions, forecast_hour=fh, scale_km=scale)
            all_groups.extend(groups)
            for g in groups:
                scenario_records.append(g.to_record())

    persistence_records = []
    for scale in ANALYSIS_SCALES_KM:
        pers = compute_persistence(all_groups, scale_km=scale, min_timesteps=2)
        persistence_records.extend([p.to_record() for p in pers])

    robustness_matrix = build_robustness_matrix(persistence_records, FORECAST_HOURS, ANALYSIS_SCALES_KM)

    return scenario_records, persistence_records, robustness_matrix


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Simulating member trajectories...")
    positions = simulate_trajectories()

    print("Building tracks.parquet...")
    tracks = build_tracks(positions)
    tracks.to_parquet(os.path.join(OUTPUT_DIR, "tracks.parquet"), index=False)

    print("Building events.parquet...")
    events = build_events(positions)
    events.to_parquet(os.path.join(OUTPUT_DIR, "events.parquet"), index=False)

    print("Detecting scenarios dynamically across all scales...")
    scenario_records, persistence_records, robustness_matrix = build_scenarios_dynamically(positions)

    df_scenarios = pd.DataFrame(scenario_records)
    df_scenarios.to_parquet(os.path.join(OUTPUT_DIR, "scenarios.parquet"), index=False)
    print(f"  -> {len(df_scenarios)} scenario group records")

    df_persistence = pd.DataFrame(persistence_records)
    df_persistence.to_parquet(os.path.join(OUTPUT_DIR, "scenario_persistence.parquet"), index=False)
    print(f"  -> {len(df_persistence)} persistence records")

    df_robustness = pd.DataFrame(robustness_matrix)
    df_robustness.to_parquet(os.path.join(OUTPUT_DIR, "scale_analysis.parquet"), index=False)
    print(f"  -> {len(df_robustness)} robustness matrix cells")

    print(f"\nDemo data written to: {os.path.abspath(OUTPUT_DIR)}")
    print("Detected persistent scenarios:")
    persistent = df_persistence[df_persistence.get("status", pd.Series(dtype=str)) == "Persistent"]
    for _, row in persistent.iterrows():
        print(f"  {row['scenario_id']} | {row['members']} | {row['scale_km']}km | T+{row['first_hour']}->T+{row['last_hour']} ({row['timesteps']} steps)")


if __name__ == "__main__":
    main()
