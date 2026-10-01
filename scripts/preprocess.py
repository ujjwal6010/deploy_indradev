"""
Real Data Pipeline Preprocessor
Ingests actual GEFS GRIB files using xarray + cfgrib,
runs event detection, tracking, and scenario analysis,
and outputs processed parquet files for the frontend.

Expected structure:
data/raw/
  gep01.grib
  gep02.grib
  gep03.grib
  gep04.grib
  gep05.grib
"""

import os
import sys
import numpy as np
import pandas as pd
import xarray as xr
import geopandas as gpd
from shapely.geometry import Polygon

# add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.scientific.precipitation import build_rolling_24h
from backend.scientific.event_detection import compute_threshold, detect_events
from backend.scientific.tracking import MemberTracker
from backend.scientific.scale_analysis import run_multiscale_analysis, build_robustness_matrix, ANALYSIS_SCALES_KM

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
MEMBERS = ["gep01", "gep02", "gep03", "gep04", "gep05"]
FORECAST_HOURS = list(range(24, 73, 6))

def _make_bbox(lat, lon, half_deg=0.4):
    return Polygon([
        (lon - half_deg, lat - half_deg),
        (lon + half_deg, lat - half_deg),
        (lon + half_deg, lat + half_deg),
        (lon - half_deg, lat + half_deg),
    ])

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Load GRIB files
    datasets = {}
    print(f"Looking for GRIB files in {os.path.abspath(RAW_DIR)}...")
    for member in MEMBERS:
        grib_path = os.path.join(RAW_DIR, f"{member}.grib")
        if not os.path.exists(grib_path):
            # for now, we just skip. The user said *when* GRIB files are available.
            continue
        print(f"Loading {member}...")
        # engine='cfgrib' requires cfgrib and ecCodes installed
        datasets[member] = xr.open_dataset(grib_path, engine="cfgrib")

    if not datasets:
        print("No GRIB files found in data/raw. Please drop the GEFS grib files there.")
        print("Pipeline exiting.")
        return

    # 2. Compute 24h rolling accumulation
    print("Computing 24h rolling accumulation fields...")
    precip_24h_all = {}
    for member, ds in datasets.items():
        precip_24h_all[member] = build_rolling_24h(ds, member, FORECAST_HOURS)

    # 3. Compute global 95th percentile threshold
    print("Computing 95th percentile threshold across all members...")
    all_arrays = []
    for member_dict in precip_24h_all.values():
        all_arrays.extend(member_dict.values())
    
    threshold = compute_threshold(all_arrays, percentile=95.0)
    print(f"Detected 95th percentile threshold: {threshold:.2f} mm")

    # 4. Detect and Track Events
    print("Detecting and tracking events...")
    trackers = {m: MemberTracker(m) for m in datasets.keys()}
    all_events = []
    
    # Need lats/lons for centroid calculation. Assumes uniform grid across members.
    sample_ds = list(datasets.values())[0]
    lats = sample_ds.latitude.values
    lons = sample_ds.longitude.values

    # member_positions_by_hour for multiscale analysis
    member_positions = {fh: {} for fh in FORECAST_HOURS}

    for fh in FORECAST_HOURS:
        for member in datasets.keys():
            precip = precip_24h_all[member].get(fh)
            if precip is None:
                continue
                
            events = detect_events(
                precip_24h=precip,
                member=member,
                forecast_hour=fh,
                lats=lats,
                lons=lons,
                threshold=threshold,
                min_area_cells=10
            )
            all_events.extend(events)
            trackers[member].update(events)
            
            # Use the largest event for scenario detection proxy (or track matching)
            if events:
                largest = max(events, key=lambda e: e.area)
                member_positions[fh][member] = (largest.latitude_centroid, largest.longitude_centroid)

    # 5. Extract Tracks and save
    print("Saving tracks and events...")
    track_records = []
    for m, tracker in trackers.items():
        track_records.extend(tracker.get_all_records())
        
    df_tracks = pd.DataFrame(track_records)
    df_tracks.to_parquet(os.path.join(OUTPUT_DIR, "tracks.parquet"), index=False)

    # format events for geodataframe
    event_records = []
    for e in all_events:
        event_records.append({
            "event_id": e.event_id,
            "member": e.member,
            "forecast_hour": e.forecast_hour,
            "latitude_centroid": e.latitude_centroid,
            "longitude_centroid": e.longitude_centroid,
            "area": e.area,
            "max_intensity": e.max_intensity,
            "mean_intensity": e.mean_intensity,
            "geometry": _make_bbox(e.latitude_centroid, e.longitude_centroid)
        })
    df_events = gpd.GeoDataFrame(event_records, geometry="geometry", crs="EPSG:4326")
    df_events.to_parquet(os.path.join(OUTPUT_DIR, "events.parquet"), index=False)

    # 6. Run Scenario Detection & Persistence Analysis
    print("Running multi-scale scenario detection...")
    analysis_results = run_multiscale_analysis(member_positions, scales_km=ANALYSIS_SCALES_KM, min_timesteps=2)
    
    df_scenarios = pd.DataFrame(analysis_results["groups"])
    df_scenarios.to_parquet(os.path.join(OUTPUT_DIR, "scenarios.parquet"), index=False)
    
    df_persistence = pd.DataFrame(analysis_results["persistence"])
    df_persistence.to_parquet(os.path.join(OUTPUT_DIR, "scenario_persistence.parquet"), index=False)
    
    # 7. Robustness Matrix
    print("Building robustness matrix...")
    matrix = build_robustness_matrix(analysis_results["persistence"], FORECAST_HOURS, ANALYSIS_SCALES_KM)
    df_matrix = pd.DataFrame(matrix)
    df_matrix.to_parquet(os.path.join(OUTPUT_DIR, "scale_analysis.parquet"), index=False)

    print(f"\nReal data pipeline complete! Output written to {os.path.abspath(OUTPUT_DIR)}")
    print("Detected persistent scenarios from real data:")
    if not df_persistence.empty:
        persistent = df_persistence[df_persistence.get("status") == "Persistent"]
        for _, row in persistent.iterrows():
            print(f"  {row['scenario_id']} | {row['members']} | {row['scale_km']}km | T+{row['first_hour']}->T+{row['last_hour']} ({row['timesteps']} steps)")
    else:
        print("  None detected.")

if __name__ == "__main__":
    main()
